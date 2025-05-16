import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import { getZodiacSign } from "../client/src/lib/zodiac";

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

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "космический-путь-секрет",
    resave: true, // Изменено на true для гарантированного сохранения сессии
    saveUninitialized: true, // Изменено на true для создания сессии сразу
    store: storage.sessionStore,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      secure: process.env.NODE_ENV === 'production', // Безопасные куки в продакшене
      httpOnly: true, // Защита от XSS
      sameSite: 'lax' // Защита от CSRF, но позволяет переходы с других сайтов
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false, { message: "Неверное имя пользователя или пароль" });
        } else {
          return done(null, user);
        }
      } catch (error) {
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      console.log("Начало обработки запроса /api/register", { body: req.body });
      const { birthDate, ...userData } = req.body;
      
      // Check if user with username already exists
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        console.log("Пользователь с именем уже существует:", req.body.username);
        return res.status(400).send("Пользователь с таким именем уже существует");
      }

      // Convert string date to Date object if needed
      const birthDateObj = typeof birthDate === 'string' ? new Date(birthDate) : birthDate;
      
      // Determine zodiac sign
      const zodiacSignData = getZodiacSign(new Date(birthDateObj));
      console.log("Определен знак зодиака:", zodiacSignData.name);
      
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
      
      console.log("Создаем пользователя с данными:", { 
        ...userData2Save, 
        password: "СКРЫТ" 
      });
      
      const user = await storage.createUser(userData2Save);
      console.log("Пользователь создан в БД:", { id: user.id, name: user.name });

      // Более надежная обработка логина
      req.login(user, (err) => {
        if (err) {
          console.error("Ошибка при входе после регистрации:", err);
          return next(err);
        }
        
        // Проверяем, создалась ли сессия
        console.log("Статус сессии после req.login:", { 
          authenticated: req.isAuthenticated(), 
          sessionID: req.sessionID,
          user: req.user ? `ID: ${req.user.id}` : 'не найден'
        });
        
        // Устанавливаем заголовки, чтобы браузер сохранил куки сессии
        res.setHeader('Connection', 'keep-alive');
        
        // Возвращаем созданного пользователя
        res.status(201).json(user);
      });
    } catch (error) {
      console.error("Ошибка при регистрации:", error);
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) return next(err);
      if (!user) return res.status(401).send(info?.message || "Неверное имя пользователя или пароль");
      
      req.login(user, (err) => {
        if (err) return next(err);
        return res.status(200).json(user);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });
}
