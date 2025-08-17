import session from "express-session";
import connectPg from "connect-pg-simple";
import { type Express, type RequestHandler } from "express";

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    ttl: sessionTtl,
    tableName: "auth_sessions",
  });
  
  return session({
    secret: process.env.SESSION_SECRET || "phoneme-game-secret-key-12345",
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // Set to true in production with HTTPS
      maxAge: sessionTtl,
    },
  });
}

export const requireTeacherAuth: RequestHandler = (req, res, next) => {
  if (req.session && (req.session as any).teacherId) {
    return next();
  }
  return res.status(401).json({ error: "Authentication required" });
};

export const requireStudentAuth: RequestHandler = (req, res, next) => {
  if (req.session && (req.session as any).studentId) {
    return next();
  }
  return res.status(401).json({ error: "Authentication required" });
};

export const requireAnyAuth: RequestHandler = (req, res, next) => {
  if (req.session && ((req.session as any).teacherId || (req.session as any).studentId)) {
    return next();
  }
  return res.status(401).json({ error: "Authentication required" });
};