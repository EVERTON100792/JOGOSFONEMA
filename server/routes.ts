import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { getSession, requireTeacherAuth, requireStudentAuth, requireAnyAuth } from "./auth";
import { 
  insertTeacherSchema, 
  insertClassSchema, 
  insertStudentSchema,
  insertGameSessionSchema,
  insertGameAnswerSchema
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup session middleware
  app.use(getSession());

  // Authentication routes

  // Teacher registration
  app.post("/api/auth/teacher/register", async (req, res) => {
    try {
      const teacherData = insertTeacherSchema.parse(req.body);
      
      // Check if teacher already exists
      const existingTeacher = await storage.getTeacherByEmail(teacherData.email);
      if (existingTeacher) {
        return res.status(400).json({ error: "E-mail já cadastrado" });
      }

      const teacher = await storage.createTeacher(teacherData);
      (req.session as any).teacherId = teacher.id;
      
      res.json({ 
        id: teacher.id, 
        email: teacher.email, 
        firstName: teacher.firstName, 
        lastName: teacher.lastName 
      });
    } catch (error) {
      console.error("Teacher registration error:", error);
      res.status(400).json({ error: "Dados inválidos" });
    }
  });

  // Teacher login
  app.post("/api/auth/teacher/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: "E-mail e senha são obrigatórios" });
      }

      const teacher = await storage.validateTeacherPassword(email, password);
      if (!teacher) {
        return res.status(401).json({ error: "E-mail ou senha incorretos" });
      }

      (req.session as any).teacherId = teacher.id;
      
      res.json({ 
        id: teacher.id, 
        email: teacher.email, 
        firstName: teacher.firstName, 
        lastName: teacher.lastName 
      });
    } catch (error) {
      console.error("Teacher login error:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // Student login
  app.post("/api/auth/student/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ error: "Nome de usuário e senha são obrigatórios" });
      }

      const student = await storage.validateStudentPassword(username, password);
      if (!student) {
        return res.status(401).json({ error: "Nome de usuário ou senha incorretos" });
      }

      (req.session as any).studentId = student.id;
      
      res.json({ 
        id: student.id, 
        username: student.username, 
        firstName: student.firstName, 
        lastName: student.lastName,
        classId: student.classId
      });
    } catch (error) {
      console.error("Student login error:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // Logout
  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ error: "Erro ao fazer logout" });
      }
      res.json({ message: "Logout realizado com sucesso" });
    });
  });

  // Get current user info
  app.get("/api/auth/user", (req, res) => {
    const session = req.session as any;
    if (session.teacherId) {
      storage.getTeacherById(session.teacherId).then(teacher => {
        if (teacher) {
          res.json({ 
            type: 'teacher',
            id: teacher.id, 
            email: teacher.email, 
            firstName: teacher.firstName, 
            lastName: teacher.lastName 
          });
        } else {
          res.status(401).json({ error: "Usuário não encontrado" });
        }
      });
    } else if (session.studentId) {
      storage.getStudentById(session.studentId).then(student => {
        if (student) {
          res.json({ 
            type: 'student',
            id: student.id, 
            username: student.username, 
            firstName: student.firstName, 
            lastName: student.lastName,
            classId: student.classId
          });
        } else {
          res.status(401).json({ error: "Usuário não encontrado" });
        }
      });
    } else {
      res.status(401).json({ error: "Não autenticado" });
    }
  });

  // Class management routes (Teacher only)

  // Get teacher's classes
  app.get("/api/classes", requireTeacherAuth, async (req, res) => {
    try {
      const teacherId = (req.session as any).teacherId;
      const classes = await storage.getClassesByTeacher(teacherId);
      res.json(classes);
    } catch (error) {
      console.error("Get classes error:", error);
      res.status(500).json({ error: "Erro ao buscar turmas" });
    }
  });

  // Create new class
  app.post("/api/classes", requireTeacherAuth, async (req, res) => {
    try {
      const teacherId = (req.session as any).teacherId;
      const classData = insertClassSchema.parse(req.body);
      
      const newClass = await storage.createClass({ ...classData, teacherId });
      res.json(newClass);
    } catch (error) {
      console.error("Create class error:", error);
      res.status(400).json({ error: "Dados inválidos para criar turma" });
    }
  });

  // Get specific class with students
  app.get("/api/classes/:id", requireTeacherAuth, async (req, res) => {
    try {
      const classId = req.params.id;
      const teacherId = (req.session as any).teacherId;
      
      const classRecord = await storage.getClassById(classId);
      if (!classRecord || classRecord.teacherId !== teacherId) {
        return res.status(404).json({ error: "Turma não encontrada" });
      }

      const students = await storage.getStudentsByClass(classId);
      
      res.json({ ...classRecord, students });
    } catch (error) {
      console.error("Get class error:", error);
      res.status(500).json({ error: "Erro ao buscar turma" });
    }
  });

  // Update class
  app.put("/api/classes/:id", requireTeacherAuth, async (req, res) => {
    try {
      const classId = req.params.id;
      const teacherId = (req.session as any).teacherId;
      const updateData = insertClassSchema.partial().parse(req.body);
      
      // Verify ownership
      const existingClass = await storage.getClassById(classId);
      if (!existingClass || existingClass.teacherId !== teacherId) {
        return res.status(404).json({ error: "Turma não encontrada" });
      }

      const updatedClass = await storage.updateClass(classId, updateData);
      res.json(updatedClass);
    } catch (error) {
      console.error("Update class error:", error);
      res.status(400).json({ error: "Dados inválidos" });
    }
  });

  // Delete class
  app.delete("/api/classes/:id", requireTeacherAuth, async (req, res) => {
    try {
      const classId = req.params.id;
      const teacherId = (req.session as any).teacherId;
      
      // Verify ownership
      const existingClass = await storage.getClassById(classId);
      if (!existingClass || existingClass.teacherId !== teacherId) {
        return res.status(404).json({ error: "Turma não encontrada" });
      }

      await storage.deleteClass(classId);
      res.json({ message: "Turma excluída com sucesso" });
    } catch (error) {
      console.error("Delete class error:", error);
      res.status(500).json({ error: "Erro ao excluir turma" });
    }
  });

  // Student management routes (Teacher only)

  // Create student in class
  app.post("/api/classes/:id/students", requireTeacherAuth, async (req, res) => {
    try {
      const classId = req.params.id;
      const teacherId = (req.session as any).teacherId;
      const studentData = insertStudentSchema.parse(req.body);
      
      // Verify class ownership
      const classRecord = await storage.getClassById(classId);
      if (!classRecord || classRecord.teacherId !== teacherId) {
        return res.status(404).json({ error: "Turma não encontrada" });
      }

      // Check if username already exists
      const existingStudent = await storage.getStudentByUsername(studentData.username);
      if (existingStudent) {
        return res.status(400).json({ error: "Nome de usuário já existe" });
      }

      // Check class capacity
      const studentsInClass = await storage.getStudentsByClass(classId);
      if (studentsInClass.length >= classRecord.maxStudents) {
        return res.status(400).json({ error: "Turma está cheia" });
      }

      const student = await storage.createStudent({ ...studentData, classId });
      res.json({
        id: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
        username: student.username,
        classId: student.classId,
        isActive: student.isActive
      });
    } catch (error) {
      console.error("Create student error:", error);
      res.status(400).json({ error: "Dados inválidos para criar aluno" });
    }
  });

  // Get students in class with their stats
  app.get("/api/classes/:id/students/stats", requireTeacherAuth, async (req, res) => {
    try {
      const classId = req.params.id;
      const teacherId = (req.session as any).teacherId;
      
      // Verify class ownership
      const classRecord = await storage.getClassById(classId);
      if (!classRecord || classRecord.teacherId !== teacherId) {
        return res.status(404).json({ error: "Turma não encontrada" });
      }

      const students = await storage.getStudentsByClass(classId);
      const studentsWithStats = await Promise.all(
        students.map(async (student) => {
          const stats = await storage.getStudentStats(student.id);
          return {
            id: student.id,
            firstName: student.firstName,
            lastName: student.lastName,
            username: student.username,
            isActive: student.isActive,
            stats
          };
        })
      );

      res.json(studentsWithStats);
    } catch (error) {
      console.error("Get student stats error:", error);
      res.status(500).json({ error: "Erro ao buscar estatísticas dos alunos" });
    }
  });

  // Update student
  app.put("/api/students/:id", requireTeacherAuth, async (req, res) => {
    try {
      const studentId = req.params.id;
      const teacherId = (req.session as any).teacherId;
      const updateData = insertStudentSchema.partial().parse(req.body);
      
      // Verify student belongs to teacher's class
      const student = await storage.getStudentById(studentId);
      if (!student) {
        return res.status(404).json({ error: "Aluno não encontrado" });
      }

      const classRecord = await storage.getClassById(student.classId);
      if (!classRecord || classRecord.teacherId !== teacherId) {
        return res.status(403).json({ error: "Sem permissão para editar este aluno" });
      }

      const updatedStudent = await storage.updateStudent(studentId, updateData);
      res.json(updatedStudent);
    } catch (error) {
      console.error("Update student error:", error);
      res.status(400).json({ error: "Dados inválidos" });
    }
  });

  // Delete student
  app.delete("/api/students/:id", requireTeacherAuth, async (req, res) => {
    try {
      const studentId = req.params.id;
      const teacherId = (req.session as any).teacherId;
      
      // Verify student belongs to teacher's class
      const student = await storage.getStudentById(studentId);
      if (!student) {
        return res.status(404).json({ error: "Aluno não encontrado" });
      }

      const classRecord = await storage.getClassById(student.classId);
      if (!classRecord || classRecord.teacherId !== teacherId) {
        return res.status(403).json({ error: "Sem permissão para excluir este aluno" });
      }

      await storage.deleteStudent(studentId);
      res.json({ message: "Aluno excluído com sucesso" });
    } catch (error) {
      console.error("Delete student error:", error);
      res.status(500).json({ error: "Erro ao excluir aluno" });
    }
  });

  // Game session routes

  // Start new game session (Student only)
  app.post("/api/game/start", requireStudentAuth, async (req, res) => {
    try {
      const studentId = (req.session as any).studentId;
      
      // Check if there's already an active session
      const activeSession = await storage.getActiveGameSession(studentId);
      if (activeSession) {
        return res.json(activeSession);
      }

      // Create new session
      const session = await storage.createGameSession({
        studentId,
        totalScore: 0,
        totalQuestions: 0,
        correctAnswers: 0,
        wrongAnswers: 0,
        maxStreak: 0,
        finalLevel: 1,
        timePlayedSeconds: 0,
        completed: false
      });

      res.json(session);
    } catch (error) {
      console.error("Start game error:", error);
      res.status(500).json({ error: "Erro ao iniciar jogo" });
    }
  });

  // Record game answer
  app.post("/api/game/answer", requireStudentAuth, async (req, res) => {
    try {
      const studentId = (req.session as any).studentId;
      const answerData = insertGameAnswerSchema.parse(req.body);
      
      // Verify session belongs to student
      const session = await storage.getActiveGameSession(studentId);
      if (!session) {
        return res.status(400).json({ error: "Nenhuma sessão ativa encontrada" });
      }

      if (session.id !== answerData.sessionId) {
        return res.status(403).json({ error: "Sessão inválida" });
      }

      const answer = await storage.createGameAnswer(answerData);
      res.json(answer);
    } catch (error) {
      console.error("Record answer error:", error);
      res.status(400).json({ error: "Dados inválidos para registrar resposta" });
    }
  });

  // End game session
  app.put("/api/game/end/:sessionId", requireStudentAuth, async (req, res) => {
    try {
      const sessionId = req.params.sessionId;
      const studentId = (req.session as any).studentId;
      const sessionData = insertGameSessionSchema.partial().parse(req.body);
      
      // Verify session belongs to student
      const session = await storage.getActiveGameSession(studentId);
      if (!session || session.id !== sessionId) {
        return res.status(404).json({ error: "Sessão não encontrada" });
      }

      const updatedSession = await storage.updateGameSession(sessionId, {
        ...sessionData,
        completed: true
      });

      res.json(updatedSession);
    } catch (error) {
      console.error("End game error:", error);
      res.status(400).json({ error: "Erro ao finalizar jogo" });
    }
  });

  // Get student's game history
  app.get("/api/game/history", requireStudentAuth, async (req, res) => {
    try {
      const studentId = (req.session as any).studentId;
      const sessions = await storage.getGameSessionsByStudent(studentId);
      res.json(sessions);
    } catch (error) {
      console.error("Get game history error:", error);
      res.status(500).json({ error: "Erro ao buscar histórico de jogos" });
    }
  });

  // Statistics routes

  // Get class statistics (Teacher only)
  app.get("/api/stats/class/:id", requireTeacherAuth, async (req, res) => {
    try {
      const classId = req.params.id;
      const teacherId = (req.session as any).teacherId;
      
      // Verify class ownership
      const classRecord = await storage.getClassById(classId);
      if (!classRecord || classRecord.teacherId !== teacherId) {
        return res.status(404).json({ error: "Turma não encontrada" });
      }

      const stats = await storage.getClassStats(classId);
      res.json(stats);
    } catch (error) {
      console.error("Get class stats error:", error);
      res.status(500).json({ error: "Erro ao buscar estatísticas da turma" });
    }
  });

  // Get individual student stats (Teacher or Student)
  app.get("/api/stats/student/:id", requireAnyAuth, async (req, res) => {
    try {
      const studentId = req.params.id;
      const session = req.session as any;
      
      // If student is requesting their own stats
      if (session.studentId === studentId) {
        const stats = await storage.getStudentStats(studentId);
        return res.json(stats);
      }
      
      // If teacher is requesting student stats, verify ownership
      if (session.teacherId) {
        const student = await storage.getStudentById(studentId);
        if (!student) {
          return res.status(404).json({ error: "Aluno não encontrado" });
        }

        const classRecord = await storage.getClassById(student.classId);
        if (!classRecord || classRecord.teacherId !== session.teacherId) {
          return res.status(403).json({ error: "Sem permissão para ver estas estatísticas" });
        }

        const stats = await storage.getStudentStats(studentId);
        return res.json(stats);
      }

      res.status(403).json({ error: "Sem permissão" });
    } catch (error) {
      console.error("Get student stats error:", error);
      res.status(500).json({ error: "Erro ao buscar estatísticas do aluno" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}