import {
  teachers,
  classes,
  students,
  gameSessions,
  gameAnswers,
  type Teacher,
  type InsertTeacher,
  type Class,
  type InsertClass,
  type Student,
  type InsertStudent,
  type GameSession,
  type InsertGameSession,
  type GameAnswer,
  type InsertGameAnswer,
  type User,
  type InsertUser,
  users,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc, count, avg, max, sum } from "drizzle-orm";
import bcrypt from "bcrypt";

export interface IStorage {
  // Legacy user methods (compatibility)
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Teacher methods
  createTeacher(teacher: InsertTeacher): Promise<Teacher>;
  getTeacherByEmail(email: string): Promise<Teacher | undefined>;
  getTeacherById(id: string): Promise<Teacher | undefined>;
  validateTeacherPassword(email: string, password: string): Promise<Teacher | null>;
  
  // Class methods
  createClass(classData: InsertClass & { teacherId: string }): Promise<Class>;
  getClassesByTeacher(teacherId: string): Promise<Class[]>;
  getClassById(id: string): Promise<Class | undefined>;
  updateClass(id: string, classData: Partial<InsertClass>): Promise<Class | undefined>;
  deleteClass(id: string): Promise<void>;
  
  // Student methods
  createStudent(student: InsertStudent & { classId: string }): Promise<Student>;
  getStudentsByClass(classId: string): Promise<Student[]>;
  getStudentById(id: string): Promise<Student | undefined>;
  getStudentByUsername(username: string): Promise<Student | undefined>;
  validateStudentPassword(username: string, password: string): Promise<Student | null>;
  updateStudent(id: string, student: Partial<InsertStudent>): Promise<Student | undefined>;
  deleteStudent(id: string): Promise<void>;
  
  // Game session methods
  createGameSession(session: InsertGameSession): Promise<GameSession>;
  updateGameSession(id: string, session: Partial<InsertGameSession>): Promise<GameSession | undefined>;
  getGameSessionsByStudent(studentId: string): Promise<GameSession[]>;
  getActiveGameSession(studentId: string): Promise<GameSession | undefined>;
  
  // Game answer methods
  createGameAnswer(answer: InsertGameAnswer): Promise<GameAnswer>;
  getGameAnswersBySession(sessionId: string): Promise<GameAnswer[]>;
  
  // Statistics methods
  getStudentStats(studentId: string): Promise<{
    totalSessions: number;
    totalScore: number;
    averageScore: number;
    bestScore: number;
    totalQuestionsAnswered: number;
    totalCorrectAnswers: number;
    accuracyPercentage: number;
    bestStreak: number;
    totalTimePlayed: number;
  }>;
  
  getClassStats(classId: string): Promise<{
    totalStudents: number;
    activeStudents: number;
    totalSessions: number;
    averageScore: number;
    bestScore: number;
    totalQuestionsAnswered: number;
    overallAccuracy: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // Legacy user methods (compatibility)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    const [user] = await db
      .insert(users)
      .values({ ...insertUser, password: hashedPassword })
      .returning();
    return user;
  }

  // Teacher methods
  async createTeacher(teacherData: InsertTeacher): Promise<Teacher> {
    const hashedPassword = await bcrypt.hash(teacherData.password, 10);
    const [teacher] = await db
      .insert(teachers)
      .values({ ...teacherData, password: hashedPassword })
      .returning();
    return teacher;
  }

  async getTeacherByEmail(email: string): Promise<Teacher | undefined> {
    const [teacher] = await db.select().from(teachers).where(eq(teachers.email, email));
    return teacher;
  }

  async getTeacherById(id: string): Promise<Teacher | undefined> {
    const [teacher] = await db.select().from(teachers).where(eq(teachers.id, id));
    return teacher;
  }

  async validateTeacherPassword(email: string, password: string): Promise<Teacher | null> {
    const teacher = await this.getTeacherByEmail(email);
    if (!teacher) return null;
    
    const isValid = await bcrypt.compare(password, teacher.password);
    return isValid ? teacher : null;
  }

  // Class methods
  async createClass(classData: InsertClass & { teacherId: string }): Promise<Class> {
    const [newClass] = await db
      .insert(classes)
      .values(classData)
      .returning();
    return newClass;
  }

  async getClassesByTeacher(teacherId: string): Promise<Class[]> {
    return await db
      .select()
      .from(classes)
      .where(eq(classes.teacherId, teacherId))
      .orderBy(asc(classes.createdAt));
  }

  async getClassById(id: string): Promise<Class | undefined> {
    const [classRecord] = await db.select().from(classes).where(eq(classes.id, id));
    return classRecord;
  }

  async updateClass(id: string, classData: Partial<InsertClass>): Promise<Class | undefined> {
    const [updated] = await db
      .update(classes)
      .set({ ...classData, updatedAt: new Date() })
      .where(eq(classes.id, id))
      .returning();
    return updated;
  }

  async deleteClass(id: string): Promise<void> {
    await db.delete(classes).where(eq(classes.id, id));
  }

  // Student methods
  async createStudent(studentData: InsertStudent & { classId: string }): Promise<Student> {
    const hashedPassword = await bcrypt.hash(studentData.password, 10);
    const [student] = await db
      .insert(students)
      .values({ ...studentData, password: hashedPassword })
      .returning();
    return student;
  }

  async getStudentsByClass(classId: string): Promise<Student[]> {
    return await db
      .select()
      .from(students)
      .where(eq(students.classId, classId))
      .orderBy(asc(students.firstName), asc(students.lastName));
  }

  async getStudentById(id: string): Promise<Student | undefined> {
    const [student] = await db.select().from(students).where(eq(students.id, id));
    return student;
  }

  async getStudentByUsername(username: string): Promise<Student | undefined> {
    const [student] = await db.select().from(students).where(eq(students.username, username));
    return student;
  }

  async validateStudentPassword(username: string, password: string): Promise<Student | null> {
    const student = await this.getStudentByUsername(username);
    if (!student) return null;
    
    const isValid = await bcrypt.compare(password, student.password);
    return isValid ? student : null;
  }

  async updateStudent(id: string, studentData: Partial<InsertStudent>): Promise<Student | undefined> {
    const updateData: any = { ...studentData, updatedAt: new Date() };
    if (studentData.password) {
      updateData.password = await bcrypt.hash(studentData.password, 10);
    }
    
    const [updated] = await db
      .update(students)
      .set(updateData)
      .where(eq(students.id, id))
      .returning();
    return updated;
  }

  async deleteStudent(id: string): Promise<void> {
    await db.delete(students).where(eq(students.id, id));
  }

  // Game session methods
  async createGameSession(sessionData: InsertGameSession): Promise<GameSession> {
    const [session] = await db
      .insert(gameSessions)
      .values(sessionData)
      .returning();
    return session;
  }

  async updateGameSession(id: string, sessionData: Partial<InsertGameSession>): Promise<GameSession | undefined> {
    const [updated] = await db
      .update(gameSessions)
      .set(sessionData)
      .where(eq(gameSessions.id, id))
      .returning();
    return updated;
  }

  async getGameSessionsByStudent(studentId: string): Promise<GameSession[]> {
    return await db
      .select()
      .from(gameSessions)
      .where(eq(gameSessions.studentId, studentId))
      .orderBy(desc(gameSessions.startedAt));
  }

  async getActiveGameSession(studentId: string): Promise<GameSession | undefined> {
    const [session] = await db
      .select()
      .from(gameSessions)
      .where(and(
        eq(gameSessions.studentId, studentId),
        eq(gameSessions.completed, false)
      ))
      .orderBy(desc(gameSessions.startedAt))
      .limit(1);
    return session;
  }

  // Game answer methods
  async createGameAnswer(answerData: InsertGameAnswer): Promise<GameAnswer> {
    const [answer] = await db
      .insert(gameAnswers)
      .values(answerData)
      .returning();
    return answer;
  }

  async getGameAnswersBySession(sessionId: string): Promise<GameAnswer[]> {
    return await db
      .select()
      .from(gameAnswers)
      .where(eq(gameAnswers.sessionId, sessionId))
      .orderBy(asc(gameAnswers.answeredAt));
  }

  // Statistics methods
  async getStudentStats(studentId: string) {
    const sessions = await db
      .select()
      .from(gameSessions)
      .where(eq(gameSessions.studentId, studentId));

    if (sessions.length === 0) {
      return {
        totalSessions: 0,
        totalScore: 0,
        averageScore: 0,
        bestScore: 0,
        totalQuestionsAnswered: 0,
        totalCorrectAnswers: 0,
        accuracyPercentage: 0,
        bestStreak: 0,
        totalTimePlayed: 0,
      };
    }

    const totalSessions = sessions.length;
    const totalScore = sessions.reduce((sum, s) => sum + s.totalScore, 0);
    const averageScore = Math.round(totalScore / totalSessions);
    const bestScore = Math.max(...sessions.map(s => s.totalScore));
    const totalQuestionsAnswered = sessions.reduce((sum, s) => sum + s.totalQuestions, 0);
    const totalCorrectAnswers = sessions.reduce((sum, s) => sum + s.correctAnswers, 0);
    const accuracyPercentage = totalQuestionsAnswered > 0 
      ? Math.round((totalCorrectAnswers / totalQuestionsAnswered) * 100) 
      : 0;
    const bestStreak = Math.max(...sessions.map(s => s.maxStreak));
    const totalTimePlayed = sessions.reduce((sum, s) => sum + s.timePlayedSeconds, 0);

    return {
      totalSessions,
      totalScore,
      averageScore,
      bestScore,
      totalQuestionsAnswered,
      totalCorrectAnswers,
      accuracyPercentage,
      bestStreak,
      totalTimePlayed,
    };
  }

  async getClassStats(classId: string) {
    const studentsInClass = await this.getStudentsByClass(classId);
    const totalStudents = studentsInClass.length;
    
    if (totalStudents === 0) {
      return {
        totalStudents: 0,
        activeStudents: 0,
        totalSessions: 0,
        averageScore: 0,
        bestScore: 0,
        totalQuestionsAnswered: 0,
        overallAccuracy: 0,
      };
    }

    const studentIds = studentsInClass.map(s => s.id);
    const allSessions = await db
      .select()
      .from(gameSessions)
      .where(eq(gameSessions.studentId, studentIds[0])); // This will need to be updated to handle multiple students

    // For now, let's get stats for all students in the class
    const classStats = {
      totalStudents,
      activeStudents: studentsInClass.filter(s => s.isActive).length,
      totalSessions: 0,
      averageScore: 0,
      bestScore: 0,
      totalQuestionsAnswered: 0,
      overallAccuracy: 0,
    };

    // Calculate aggregated stats for all students
    let totalScore = 0;
    let totalQuestions = 0;
    let totalCorrect = 0;
    let sessionCount = 0;
    let maxScore = 0;

    for (const student of studentsInClass) {
      const studentSessions = await db
        .select()
        .from(gameSessions)
        .where(eq(gameSessions.studentId, student.id));
      
      sessionCount += studentSessions.length;
      totalScore += studentSessions.reduce((sum, s) => sum + s.totalScore, 0);
      totalQuestions += studentSessions.reduce((sum, s) => sum + s.totalQuestions, 0);
      totalCorrect += studentSessions.reduce((sum, s) => sum + s.correctAnswers, 0);
      
      const studentMax = Math.max(...studentSessions.map(s => s.totalScore), 0);
      maxScore = Math.max(maxScore, studentMax);
    }

    classStats.totalSessions = sessionCount;
    classStats.averageScore = sessionCount > 0 ? Math.round(totalScore / sessionCount) : 0;
    classStats.bestScore = maxScore;
    classStats.totalQuestionsAnswered = totalQuestions;
    classStats.overallAccuracy = totalQuestions > 0 
      ? Math.round((totalCorrect / totalQuestions) * 100) 
      : 0;

    return classStats;
  }
}

export const storage = new DatabaseStorage();