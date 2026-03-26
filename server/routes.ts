import type { Express, Request, Response } from "express";
import { createServer, type Server } from "node:http";
import { randomBytes } from "crypto";
import { registerSchema, loginSchema } from "@shared/schema";
import {
  createUser,
  getUserByEmail,
  getUserById,
  updateUser,
  verifyPassword,
  createPost,
  getPosts,
  likePost,
  getReplies,
  createReply,
  createJob,
  getJobs,
  getAllUsers,
  getOrCreateConversation,
  getUserConversations,
  getMessages,
  sendMessage,
  getNotifications,
  createNotification,
  markNotificationsRead,
  getUnreadNotificationCount,
} from "./storage";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { pgTable, text, varchar, timestamp } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

const tokens = pgTable("auth_tokens", {
  token: varchar("token").primaryKey(),
  userId: varchar("user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

async function ensureTokenTable() {
  try {
    await db.execute(sql`CREATE TABLE IF NOT EXISTS auth_tokens (
      token VARCHAR PRIMARY KEY,
      user_id VARCHAR NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )`);
  } catch (e) {
    console.error("Token table creation error:", e);
  }
}

function generateToken(): string {
  return randomBytes(32).toString("hex");
}

async function saveToken(token: string, userId: string) {
  await db.insert(tokens).values({ token, userId });
}

async function getUserIdFromToken(token: string): Promise<string | null> {
  const [row] = await db.select().from(tokens).where(eq(tokens.token, token));
  return row?.userId || null;
}

async function deleteToken(token: string) {
  await db.delete(tokens).where(eq(tokens.token, token));
}

function extractToken(req: Request): string | null {
  const auth = req.headers.authorization;
  if (auth?.startsWith("Bearer ")) {
    return auth.slice(7);
  }
  return null;
}

async function requireAuth(req: Request, res: Response, next: Function) {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  const userId = await getUserIdFromToken(token);
  if (!userId) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
  (req as any).userId = userId;
  next();
}

async function optionalAuth(req: Request, res: Response, next: Function) {
  const token = extractToken(req);
  if (token) {
    const userId = await getUserIdFromToken(token);
    if (userId) (req as any).userId = userId;
  }
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  await ensureTokenTable();

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
      const role = (req.body.role as string) || "";
      const user = await createUser(parsed.data.email, parsed.data.password, parsed.data.fullName, role);
      const token = generateToken();
      await saveToken(token, user.id);
      res.json({ user: { ...user, password: undefined }, token });
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
      const token = generateToken();
      await saveToken(token, user.id);
      res.json({ user: { ...user, password: undefined }, token });
    } catch (error: any) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.get("/api/auth/me", async (req: Request, res: Response) => {
    const token = extractToken(req);
    if (!token) return res.status(401).json({ message: "Not authenticated" });
    const userId = await getUserIdFromToken(token);
    if (!userId) return res.status(401).json({ message: "Invalid or expired token" });
    const user = await getUserById(userId);
    if (!user) return res.status(401).json({ message: "User not found" });
    res.json({ ...user, password: undefined });
  });

  app.post("/api/auth/logout", async (req: Request, res: Response) => {
    const token = extractToken(req);
    if (token) await deleteToken(token);
    res.json({ message: "Logged out" });
  });

  app.put("/api/profile", requireAuth as any, async (req: Request, res: Response) => {
    const userId = (req as any).userId;
    const user = await updateUser(userId, req.body);
    res.json({ ...user, password: undefined });
  });

  app.get("/api/profile/:id", async (req: Request, res: Response) => {
    const user = await getUserById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ ...user, password: undefined });
  });

  app.get("/api/posts", optionalAuth as any, async (req: Request, res: Response) => {
    const currentUserId = (req as any).userId;
    const filterUserId = req.query.userId as string | undefined;
    const allPosts = await getPosts(currentUserId, filterUserId);
    res.json(allPosts);
  });

  app.post("/api/users/:id/hire", requireAuth as any, async (req: Request, res: Response) => {
    const actorId = (req as any).userId;
    const targetId = req.params.id;
    const actor = await getUserById(actorId);
    await createNotification(targetId, "hire", actorId, undefined, `${actor?.fullName || "Someone"} wants to hire you!`);
    res.json({ message: "Hire request sent" });
  });

  app.post("/api/posts", requireAuth as any, async (req: Request, res: Response) => {
    const userId = (req as any).userId;
    const { content, type, imageUrl } = req.body;
    if (!content) return res.status(400).json({ message: "Content required" });
    const post = await createPost(userId, content, type || "general", imageUrl);
    res.json(post);
  });

  app.post("/api/posts/:id/like", requireAuth as any, async (req: Request, res: Response) => {
    const userId = (req as any).userId;
    const { id } = req.params;
    const result = await likePost(id, userId);
    if (result.liked) {
      const post = await db.query?.posts?.findFirst?.({ where: (p: any, { eq }: any) => eq(p.id, id) });
      if (post?.userId && post.userId !== userId) {
        const actor = await getUserById(userId);
        await createNotification(post.userId, "like", userId, id, `${actor?.fullName || "Someone"} liked your post`);
      }
    }
    res.json(result);
  });

  app.get("/api/posts/:id/replies", async (req: Request, res: Response) => {
    const replies = await getReplies(req.params.id);
    res.json(replies);
  });

  app.post("/api/posts/:id/replies", requireAuth as any, async (req: Request, res: Response) => {
    const userId = (req as any).userId;
    const { id } = req.params;
    const { content } = req.body;
    if (!content) return res.status(400).json({ message: "Content required" });
    const reply = await createReply(id, userId, content);
    const allPosts = await getPosts();
    const post = allPosts.find(p => p.id === id);
    if (post?.userId && post.userId !== userId) {
      const actor = await getUserById(userId);
      await createNotification(post.userId, "reply", userId, id, `${actor?.fullName || "Someone"} replied to your post`);
    }
    res.json(reply);
  });

  app.get("/api/jobs", async (req: Request, res: Response) => {
    const isShortWork = req.query.shortWork === "true" ? true : req.query.shortWork === "false" ? false : undefined;
    const allJobs = await getJobs(isShortWork);
    res.json(allJobs);
  });

  app.post("/api/jobs", requireAuth as any, async (req: Request, res: Response) => {
    const userId = (req as any).userId;
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

  app.get("/api/conversations", requireAuth as any, async (req: Request, res: Response) => {
    const userId = (req as any).userId;
    const convs = await getUserConversations(userId);
    res.json(convs);
  });

  app.post("/api/conversations", requireAuth as any, async (req: Request, res: Response) => {
    const userId = (req as any).userId;
    const { targetUserId } = req.body;
    if (!targetUserId) return res.status(400).json({ message: "targetUserId required" });
    const conv = await getOrCreateConversation(userId, targetUserId);
    res.json(conv);
  });

  app.get("/api/conversations/:id", requireAuth as any, async (req: Request, res: Response) => {
    const userId = (req as any).userId;
    const convs = await getUserConversations(userId);
    const conv = convs.find(c => c.id === req.params.id);
    if (!conv) return res.status(404).json({ message: "Conversation not found" });
    res.json(conv);
  });

  app.get("/api/conversations/:id/messages", requireAuth as any, async (req: Request, res: Response) => {
    const msgs = await getMessages(req.params.id);
    res.json(msgs);
  });

  app.post("/api/conversations/:id/messages", requireAuth as any, async (req: Request, res: Response) => {
    const userId = (req as any).userId;
    const { content } = req.body;
    if (!content) return res.status(400).json({ message: "Content required" });
    const msg = await sendMessage(req.params.id, userId, content);
    const convMessages = await getMessages(req.params.id);
    const otherParticipants = convMessages
      .filter(m => m.senderId !== userId)
      .map(m => m.senderId);
    const uniqueOthers = [...new Set(otherParticipants.map(id => id))];
    for (const otherUserId of uniqueOthers) {
      const actor = await getUserById(userId);
      await createNotification(otherUserId, "message", userId, undefined, `${actor?.fullName || "Someone"} sent you a message`);
    }
    res.json(msg);
  });

  app.get("/api/notifications", requireAuth as any, async (req: Request, res: Response) => {
    const userId = (req as any).userId;
    const notifs = await getNotifications(userId);
    res.json(notifs);
  });

  app.post("/api/notifications/read", requireAuth as any, async (req: Request, res: Response) => {
    const userId = (req as any).userId;
    await markNotificationsRead(userId);
    res.json({ success: true });
  });

  app.get("/api/notifications/count", requireAuth as any, async (req: Request, res: Response) => {
    const userId = (req as any).userId;
    const count = await getUnreadNotificationCount(userId);
    res.json({ count });
  });

  const httpServer = createServer(app);
  return httpServer;
}
