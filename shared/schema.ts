import { sql } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Teachers table
export const teachers = pgTable("teachers", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email", { length: 255 }).unique().notNull(),
  password: varchar("password", { length: 255 }).notNull(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  profileImageUrl: varchar("profile_image_url", { length: 500 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Classes table (turmas)
export const classes = pgTable("classes", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  teacherId: uuid("teacher_id").references(() => teachers.id).notNull(),
  maxStudents: integer("max_students").default(30).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Students table
export const students = pgTable("students", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }),
  username: varchar("username", { length: 50 }).unique().notNull(),
  password: varchar("password", { length: 255 }).notNull(),
  classId: uuid("class_id").references(() => classes.id).notNull(),
  profileImageUrl: varchar("profile_image_url", { length: 500 }),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Game sessions table (sessões de jogo)
export const gameSessions = pgTable("game_sessions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: uuid("student_id").references(() => students.id).notNull(),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  endedAt: timestamp("ended_at"),
  totalScore: integer("total_score").default(0).notNull(),
  totalQuestions: integer("total_questions").default(0).notNull(),
  correctAnswers: integer("correct_answers").default(0).notNull(),
  wrongAnswers: integer("wrong_answers").default(0).notNull(),
  maxStreak: integer("max_streak").default(0).notNull(),
  finalLevel: integer("final_level").default(1).notNull(),
  timePlayedSeconds: integer("time_played_seconds").default(0).notNull(),
  completed: boolean("completed").default(false).notNull(),
});

// Game answers table (respostas detalhadas)
export const gameAnswers = pgTable("game_answers", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: uuid("session_id").references(() => gameSessions.id).notNull(),
  letter: varchar("letter", { length: 1 }).notNull(),
  selectedAnswer: varchar("selected_answer", { length: 1 }).notNull(),
  isCorrect: boolean("is_correct").notNull(),
  responseTimeMs: integer("response_time_ms").notNull(),
  currentStreak: integer("current_streak").default(0).notNull(),
  currentLevel: integer("current_level").default(1).notNull(),
  answeredAt: timestamp("answered_at").defaultNow().notNull(),
});

// Session storage table for authentication
export const authSessions = pgTable(
  "auth_sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Relations
export const teachersRelations = relations(teachers, ({ many }) => ({
  classes: many(classes),
}));

export const classesRelations = relations(classes, ({ one, many }) => ({
  teacher: one(teachers, {
    fields: [classes.teacherId],
    references: [teachers.id],
  }),
  students: many(students),
}));

export const studentsRelations = relations(students, ({ one, many }) => ({
  class: one(classes, {
    fields: [students.classId],
    references: [classes.id],
  }),
  gameSessions: many(gameSessions),
}));

export const gameSessionsRelations = relations(gameSessions, ({ one, many }) => ({
  student: one(students, {
    fields: [gameSessions.studentId],
    references: [students.id],
  }),
  answers: many(gameAnswers),
}));

export const gameAnswersRelations = relations(gameAnswers, ({ one }) => ({
  session: one(gameSessions, {
    fields: [gameAnswers.sessionId],
    references: [gameSessions.id],
  }),
}));

// Zod schemas for validation
export const insertTeacherSchema = createInsertSchema(teachers).pick({
  email: true,
  password: true,
  firstName: true,
  lastName: true,
});

export const insertClassSchema = createInsertSchema(classes).pick({
  name: true,
  description: true,
  maxStudents: true,
});

export const insertStudentSchema = createInsertSchema(students).pick({
  firstName: true,
  lastName: true,
  username: true,
  password: true,
});

export const insertGameSessionSchema = createInsertSchema(gameSessions).pick({
  studentId: true,
  totalScore: true,
  totalQuestions: true,
  correctAnswers: true,
  wrongAnswers: true,
  maxStreak: true,
  finalLevel: true,
  timePlayedSeconds: true,
  completed: true,
}).extend({
  endedAt: z.date().optional(),
});

export const insertGameAnswerSchema = createInsertSchema(gameAnswers).pick({
  sessionId: true,
  letter: true,
  selectedAnswer: true,
  isCorrect: true,
  responseTimeMs: true,
  currentStreak: true,
  currentLevel: true,
});

// Export types
export type Teacher = typeof teachers.$inferSelect;
export type InsertTeacher = z.infer<typeof insertTeacherSchema>;

export type Class = typeof classes.$inferSelect;
export type InsertClass = z.infer<typeof insertClassSchema>;

export type Student = typeof students.$inferSelect;
export type InsertStudent = z.infer<typeof insertStudentSchema>;

export type GameSession = typeof gameSessions.$inferSelect;
export type InsertGameSession = z.infer<typeof insertGameSessionSchema>;

export type GameAnswer = typeof gameAnswers.$inferSelect;
export type InsertGameAnswer = z.infer<typeof insertGameAnswerSchema>;

// Legacy user type for compatibility (deprecated)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;