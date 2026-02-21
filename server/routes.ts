import type { Express, Request, Response } from "express";
import { createServer, type Server } from "node:http";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { pool } from "./db";
import { registerSchema, loginSchema } from "@shared/schema";
import {
  createUser,
  getUserByEmail,
  getUserById,
  updateUser,
  verifyPassword,
  createPost,
  getPosts,
  createJob,
  getJobs,
  getAllUsers,
} from "./storage";

const PgSession = connectPgSimple(session);

function requireAuth(req: Request, res: Response, next: Function) {
  if (!req.session?.userId) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  app.use(
    session({
      store: new PgSession({
        pool: pool as any,
        createTableIfMissing: true,
      }),
      secret: process.env.SESSION_SECRET || "workhub-secret-key-dev",
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 30 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: "none",
        secure: true,
      },
    })
  );

  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const parsed = registerSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid input. Email and password (min 6 chars) required." });
      }

      const existing = await getUserByEmail(parsed.data.email);
      if (existing) {
        return res.status(409).json({ message: "An account with this email already exists." });
      }

      const user = await createUser(parsed.data.email, parsed.data.password, parsed.data.fullName);
      (req.session as any).userId = user.id;
      res.json({ ...user, password: undefined });
    } catch (error: any) {
      console.error("Register error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Email and password required." });
      }

      const user = await getUserByEmail(parsed.data.email);
      if (!user || !verifyPassword(parsed.data.password, user.password)) {
        return res.status(401).json({ message: "Invalid email or password." });
      }

      (req.session as any).userId = user.id;
      res.json({ ...user, password: undefined });
    } catch (error: any) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.get("/api/auth/me", async (req: Request, res: Response) => {
    const userId = (req.session as any)?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const user = await getUserById(userId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    res.json({ ...user, password: undefined });
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out" });
    });
  });

  app.put("/api/profile", requireAuth as any, async (req: Request, res: Response) => {
    const userId = (req.session as any).userId;
    const user = await updateUser(userId, req.body);
    res.json({ ...user, password: undefined });
  });

  app.get("/api/profile/:id", async (req: Request, res: Response) => {
    const user = await getUserById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ ...user, password: undefined });
  });

  app.get("/api/posts", async (_req: Request, res: Response) => {
    const allPosts = await getPosts();
    res.json(allPosts);
  });

  app.post("/api/posts", requireAuth as any, async (req: Request, res: Response) => {
    const userId = (req.session as any).userId;
    const { content, type } = req.body;
    if (!content) return res.status(400).json({ message: "Content required" });
    const post = await createPost(userId, content, type || "general");
    res.json(post);
  });

  app.get("/api/jobs", async (req: Request, res: Response) => {
    const isShortWork = req.query.shortWork === "true" ? true : req.query.shortWork === "false" ? false : undefined;
    const allJobs = await getJobs(isShortWork);
    res.json(allJobs);
  });

  app.post("/api/jobs", requireAuth as any, async (req: Request, res: Response) => {
    const userId = (req.session as any).userId;
    const { title, company, location, description, type, salary, isShortWork } = req.body;
    if (!title || !company || !description) {
      return res.status(400).json({ message: "Title, company, and description required" });
    }
    const job = await createJob(userId, { title, company, location, description, type, salary, isShortWork });
    res.json(job);
  });

  app.get("/api/users", async (_req: Request, res: Response) => {
    const allUsers = await getAllUsers();
    res.json(allUsers);
  });

  const httpServer = createServer(app);
  return httpServer;
}
