import { eq } from "drizzle-orm";
import { db } from "./db";
import { users, posts, jobs } from "@shared/schema";
import type { User, Post, Job } from "@shared/schema";
import { createHash, randomBytes } from "crypto";

function hashPassword(password: string, salt: string): string {
  return createHash("sha256").update(password + salt).digest("hex");
}

export function generateSalt(): string {
  return randomBytes(16).toString("hex");
}

export function hashWithSalt(password: string): { hash: string; salt: string } {
  const salt = generateSalt();
  const hash = hashPassword(password, salt);
  return { hash: salt + ":" + hash, salt };
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  const computed = hashPassword(password, salt);
  return computed === hash;
}

export async function createUser(email: string, password: string, fullName?: string): Promise<User> {
  const { hash } = hashWithSalt(password);
  const [user] = await db.insert(users).values({
    email,
    password: hash,
    fullName: fullName || "",
  }).returning();
  return user;
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
  const [user] = await db.select().from(users).where(eq(users.email, email));
  return user;
}

export async function getUserById(id: string): Promise<User | undefined> {
  const [user] = await db.select().from(users).where(eq(users.id, id));
  return user;
}

export async function updateUser(id: string, data: Partial<User>): Promise<User | undefined> {
  const { password, id: _, createdAt, ...safeData } = data as any;
  const [user] = await db.update(users).set(safeData).where(eq(users.id, id)).returning();
  return user;
}

export async function createPost(userId: string, content: string, type: string): Promise<Post> {
  const [post] = await db.insert(posts).values({ userId, content, type }).returning();
  return post;
}

export async function getPosts(): Promise<(Post & { user?: User })[]> {
  const allPosts = await db.select().from(posts).orderBy(posts.createdAt);
  const result = [];
  for (const post of allPosts.reverse()) {
    const user = await getUserById(post.userId);
    result.push({ ...post, user: user ? { ...user, password: "" } : undefined });
  }
  return result;
}

export async function createJob(userId: string, data: any): Promise<Job> {
  const [job] = await db.insert(jobs).values({ ...data, userId }).returning();
  return job;
}

export async function getJobs(isShortWork?: boolean): Promise<(Job & { user?: User })[]> {
  let allJobs;
  if (isShortWork !== undefined) {
    allJobs = await db.select().from(jobs).where(eq(jobs.isShortWork, isShortWork)).orderBy(jobs.createdAt);
  } else {
    allJobs = await db.select().from(jobs).orderBy(jobs.createdAt);
  }
  const result = [];
  for (const job of allJobs.reverse()) {
    const user = await getUserById(job.userId);
    result.push({ ...job, user: user ? { ...user, password: "" } : undefined });
  }
  return result;
}

export async function getAllUsers(): Promise<User[]> {
  const allUsers = await db.select().from(users);
  return allUsers.map(u => ({ ...u, password: "" }));
}
