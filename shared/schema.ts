import { pgTable, text, serial, integer, boolean, timestamp, jsonb, date, time } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Пользователи
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email"),
  gender: text("gender").notNull(),
  birthDate: date("birth_date").notNull(),
  birthTime: time("birth_time"),
  birthPlace: text("birth_place"),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  zodiacSign: text("zodiac_sign").notNull(),
  role: text("role").default("user").notNull(),
  subscriptionType: text("subscription_type").default("free").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  friends: many(friends),
  apiUsage: many(apiUsage),
}));

// Друзья пользователей
export const friends = pgTable("friends", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  email: text("email"),
  gender: text("gender").notNull(),
  birthDate: date("birth_date").notNull(),
  birthTime: time("birth_time"),
  birthPlace: text("birth_place"),
  zodiacSign: text("zodiac_sign").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const friendsRelations = relations(friends, ({ one }) => ({
  user: one(users, {
    fields: [friends.userId],
    references: [users.id],
  }),
}));

// Использование API
export const apiUsage = pgTable("api_usage", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  requestSource: text("request_source").notNull(),
  requestText: text("request_text"),
  responseText: text("response_text"),
  tokensIn: integer("tokens_in").default(0),
  tokensOut: integer("tokens_out").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const apiUsageRelations = relations(apiUsage, ({ one }) => ({
  user: one(users, {
    fields: [apiUsage.userId],
    references: [users.id],
  }),
}));

// Гороскопы
export const horoscopes = pgTable("horoscopes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  period: text("period").notNull(), // "daily", "weekly", "monthly"
  category: text("category").notNull(), // "general", "love", "career", "health", "finance"
  content: text("content").notNull(),
  luckyNumbers: jsonb("lucky_numbers").notNull(),
  compatibleSigns: jsonb("compatible_signs").notNull(),
  isActual: boolean("is_actual").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Знаки зодиака
export const zodiacSigns = pgTable("zodiac_signs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  startDate: text("start_date").notNull(), // формат MM-DD
  endDate: text("end_date").notNull(), // формат MM-DD
});

// Схемы для вставки
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertFriendSchema = createInsertSchema(friends).omit({
  id: true,
  createdAt: true,
});

export const insertApiUsageSchema = createInsertSchema(apiUsage).omit({
  id: true,
  createdAt: true,
});

export const insertHoroscopeSchema = createInsertSchema(horoscopes).omit({
  id: true,
  createdAt: true,
});

export const loginSchema = z.object({
  username: z.string().min(1, "Введите имя пользователя"),
  password: z.string().min(1, "Введите пароль"),
});

// Типы для использования в приложении
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginUser = z.infer<typeof loginSchema>;

export type Friend = typeof friends.$inferSelect;
export type InsertFriend = z.infer<typeof insertFriendSchema>;

export type ApiUsage = typeof apiUsage.$inferSelect;
export type InsertApiUsage = z.infer<typeof insertApiUsageSchema>;

export type Horoscope = typeof horoscopes.$inferSelect;
export type InsertHoroscope = z.infer<typeof insertHoroscopeSchema>;

export type ZodiacSign = typeof zodiacSigns.$inferSelect;
