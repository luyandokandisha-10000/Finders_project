import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").default(""),
  role: text("role").default(""),
  bio: text("bio").default(""),
  location: text("location").default(""),
  skills: text("skills").default(""),
  avatarUrl: text("avatar_url").default(""),
  createdAt: timestamp("created_at").defaultNow(),
});

export const posts = pgTable("posts", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  type: text("type").notNull().default("general"),
  likes: integer("likes").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const jobs = pgTable("jobs", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  company: text("company").notNull(),
  location: text("location").default(""),
  description: text("description").notNull(),
  type: text("type").notNull().default("full-time"),
  salary: text("salary").default(""),
  isShortWork: boolean("is_short_work").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  password: true,
});

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  fullName: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const insertPostSchema = createInsertSchema(posts).pick({
  content: true,
  type: true,
});

export const insertJobSchema = createInsertSchema(jobs).pick({
  title: true,
  company: true,
  location: true,
  description: true,
  type: true,
  salary: true,
  isShortWork: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Post = typeof posts.$inferSelect;
export type Job = typeof jobs.$inferSelect;
