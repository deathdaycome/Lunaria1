import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import { getZodiacSign } from "../client/src/lib/zodiac";
import pg from "pg";
const { Pool } = pg; // Updated import for pg.Pool
import { pool as slonikPool } from "./db"; // slonikPool is imported but not used; consider removing if unnecessary

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

const PgSessionStore = connectPgSimple(session);

// Create a pg.Pool instance for session store
const sessionPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false, // Example for Render/Heroku
});

const sessionSettings: session.SessionOptions = {
  secret: process.env.SESSION_SECRET || "космический-путь-секрет",
  resave: false,
  saveUninitialized: false,
  store: new PgSessionStore({
    pool: sessionPool, // Updated to use the new pg.Pool
    tableName: "user_sessions",
    createTableIfMissing: true,
  }),
  cookie: {
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
    domain: process.env.COOKIE_DOMAIN || undefined,
  },
};
// End of sessionSettings definition

export function setupAuth(app: Express) {
  console.log("🔧 === SETTING UP AUTH ROUTES ===");
  
  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        console.log("🔑 Passport Local Strategy called for username:", username);
        const user = await storage.getUserByUsername(username);
        if (!user || !(await comparePasswords(password, user.password))) {
          console.log("🔑 Authentication failed for username:", username);
          return done(null, false, { message: "Неверное имя пользователя или пароль" });
        } else {
          console.log("🔑 Authentication successful for username:", username);
          return done(null, user);
        }
      } catch (error) {
        console.error("🔑 Passport authentication error:", error);
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => {
    console.log("🔑 Serializing user:", user.id);
    done(null, user.id);
  });
  
  passport.deserializeUser(async (id: number, done) => {
    try {
      console.log("🔑 Deserializing user ID:", id);
      const user = await storage.getUser(id);
      console.log("🔑 User deserialized:", user ? user.username : 'not found');
      done(null, user);
    } catch (error) {
      console.error("🔑 Deserialization error:", error);
      done(error);
    }
  });

  console.log("🔧 REGISTERING /api/register ROUTE...");
  app.post("/api/register", async (req, res, next) => {
    console.log("🔥🔥🔥 REGISTER ROUTE HIT! 🔥🔥🔥");
    console.log("🔥 Request body:", JSON.stringify(req.body, null, 2));
    console.log("🔥 Request headers:", JSON.stringify(req.headers, null, 2));
    console.log("🔥 Request method:", req.method);
    console.log("🔥 Request URL:", req.url);
    console.log("🔥 Request path:", req.path);
    
    try {
      console.log("Начало обработки запроса /api/register", { body: req.body });
      const { birthDate, ...userData } = req.body;
      
      // Check if user with username already exists
      console.log("🔍 Checking if user exists:", req.body.username);
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        console.log("❌ Пользователь с именем уже существует:", req.body.username);
        return res.status(400).json({ message: "Пользователь с таким именем уже существует" });
      }

      // Convert string date to Date object if needed
      const birthDateObj = typeof birthDate === 'string' ? new Date(birthDate) : birthDate;
      
      // Determine zodiac sign
      const zodiacSignData = getZodiacSign(new Date(birthDateObj));
      console.log("✨ Определен знак зодиака:", zodiacSignData.name);
      
      // Create the user
      const userData2Save = {
        username: userData.username,
        name: userData.name,
        email: userData.email || `temp_${Date.now()}@lunaria.app`,
        gender: userData.gender,
        birthPlace: userData.birthPlace,
        birthTime: userData.birthTime || '12:00:00',
        birthDate: birthDateObj.toISOString().split('T')[0],
        password: await hashPassword(req.body.password),
        zodiacSign: zodiacSignData.name,
        subscriptionType: 'free',
        role: 'user'
      };
      
      console.log("👤 Создаем пользователя с данными:", { 
        ...userData2Save, 
        password: "СКРЫТ" 
      });
      
      const user = await storage.createUser(userData2Save);
      console.log("✅ Пользователь создан в БД:", { id: user.id, name: user.name });

      // Более надежная обработка логина
      req.login(user, (err) => {
        if (err) {
          console.error("❌ Ошибка при входе после регистрации:", err);
          return next(err);
        }
        
        // Проверяем, создалась ли сессия
        console.log("🔐 Статус сессии после req.login:", { 
          authenticated: req.isAuthenticated(), 
          sessionID: req.sessionID,
          user: req.user ? `ID: ${req.user.id}` : 'не найден'
        });
        
        // Устанавливаем заголовки, чтобы браузер сохранил куки сессии
        res.setHeader('Connection', 'keep-alive');
        
        console.log("✅ Регистрация успешно завершена, отправляем ответ");
        // Возвращаем созданного пользователя
        res.status(201).json(user);
      });
    } catch (error) {
      console.error("❌ Ошибка при регистрации:", error);
      console.error("❌ Stack trace:", error instanceof Error ? error.stack : 'No stack');
      res.status(500).json({ message: "Ошибка сервера при регистрации" });
    }
  });

  console.log("🔧 REGISTERING /api/login ROUTE...");
  app.post("/api/login", (req, res, next) => {
    console.log("🔥 LOGIN ROUTE HIT!");
    console.log("🔥 Login request body:", JSON.stringify(req.body, null, 2));
    
    passport.authenticate(
      "local",
      (
        err: any,
        user: Express.User | false | null,
        info: { message?: string } | undefined
      ) => {
        if (err) {
          console.error("❌ Login authentication error:", err);
          return next(err);
        }
        if (!user) {
          console.log("❌ Login failed:", info?.message || "Неверное имя пользователя или пароль");
          return res.status(401).json({ message: info?.message || "Неверное имя пользователя или пароль" });
        }
        
        console.log("✅ User authenticated, logging in:", user.username);
        req.login(user, (err: any) => {
          if (err) {
            console.error("❌ req.login error:", err);
            return next(err);
          }
          console.log("✅ Login successful for user:", user.username);
          return res.status(200).json(user);
        });
      }
    )(req, res, next);
  });

  console.log("🔧 REGISTERING /api/logout ROUTE...");
  app.post("/api/logout", (req, res, next) => {
    console.log("🔥 LOGOUT ROUTE HIT!");
    console.log("🔥 User before logout:", req.user ? req.user.username : 'not authenticated');
    
    req.logout((err) => {
      if (err) {
        console.error("❌ Logout error:", err);
        return next(err);
      }
      console.log("✅ Logout successful");
      res.sendStatus(200);
    });
  });

  console.log("🔧 REGISTERING /api/user ROUTE...");
  app.get("/api/user", (req, res) => {
    console.log("🔥 USER ROUTE HIT!");
    console.log("🔥 Is authenticated:", req.isAuthenticated());
    console.log("🔥 Session ID:", req.sessionID);
    console.log("🔥 User:", req.user ? `${req.user.username} (ID: ${req.user.id})` : 'not authenticated');
    
    if (!req.isAuthenticated()) {
      console.log("❌ User not authenticated, returning 401");
      // Возвращаем JSON с сообщением об ошибке
      return res.status(401).json({ message: "Пользователь не авторизован" }); 
    }
    console.log("✅ User authenticated, returning user data");
    // Если авторизован, возвращаем JSON с данными пользователя
    res.json(req.user); 
  });
  
  console.log("✅ === AUTH SETUP COMPLETE ===");
}
