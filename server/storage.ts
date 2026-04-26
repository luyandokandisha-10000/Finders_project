import { eq, and, desc, sql } from "drizzle-orm";
import { db } from "./db";
import { users, posts, jobs, postLikes, postReplies, replyLikes, conversations, conversationParticipants, messages, notifications } from "@shared/schema";
import type { User, Post, Job, PostReply, Message, Conversation, Notification } from "@shared/schema";
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

function safeUser(user: User) {
  return { ...user, password: "" };
}

export async function createUser(email: string, password: string, fullName?: string, role?: string): Promise<User> {
  const { hash } = hashWithSalt(password);
  const [user] = await db.insert(users).values({
    email,
    password: hash,
    fullName: fullName || "",
    role: role || "",
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

export async function createPost(userId: string, content: string, type: string, imageUrl?: string): Promise<Post> {
  const [post] = await db.insert(posts).values({ userId, content, type, imageUrl: imageUrl || "" }).returning();
  return post;
}

export async function getPosts(currentUserId?: string, filterUserId?: string): Promise<(Post & { user?: User; likedByMe?: boolean; replyCount?: number })[]> {
  const allPosts = filterUserId
    ? await db.select().from(posts).where(eq(posts.userId, filterUserId)).orderBy(desc(posts.createdAt))
    : await db.select().from(posts).orderBy(desc(posts.createdAt));
  const result = [];
  for (const post of allPosts) {
    const user = await getUserById(post.userId);
    let likedByMe = false;
    if (currentUserId) {
      const [like] = await db.select().from(postLikes).where(
        and(eq(postLikes.postId, post.id), eq(postLikes.userId, currentUserId))
      );
      likedByMe = !!like;
    }
    const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(postReplies).where(eq(postReplies.postId, post.id));
    result.push({ ...post, user: user ? safeUser(user) : undefined, likedByMe, replyCount: Number(count) });
  }
  return result;
}

export async function likePost(postId: string, userId: string): Promise<{ liked: boolean; likes: number }> {
  const [existing] = await db.select().from(postLikes).where(
    and(eq(postLikes.postId, postId), eq(postLikes.userId, userId))
  );
  if (existing) {
    await db.delete(postLikes).where(eq(postLikes.id, existing.id));
    const [updated] = await db.update(posts).set({ likes: sql`GREATEST(likes - 1, 0)` }).where(eq(posts.id, postId)).returning();
    return { liked: false, likes: updated?.likes ?? 0 };
  } else {
    await db.insert(postLikes).values({ postId, userId });
    const [updated] = await db.update(posts).set({ likes: sql`likes + 1` }).where(eq(posts.id, postId)).returning();
    return { liked: true, likes: updated?.likes ?? 0 };
  }
}

export async function getReplies(postId: string, currentUserId?: string): Promise<any[]> {
  const allReplies = await db.select().from(postReplies).where(eq(postReplies.postId, postId)).orderBy(postReplies.createdAt);
  const result = [];
  for (const reply of allReplies) {
    const user = await getUserById(reply.userId);
    let likedByMe = false;
    if (currentUserId) {
      const [existing] = await db.select().from(replyLikes).where(
        and(eq(replyLikes.replyId, reply.id), eq(replyLikes.userId, currentUserId))
      );
      likedByMe = !!existing;
    }
    result.push({ ...reply, user: user ? safeUser(user) : undefined, likedByMe });
  }
  return result;
}

export async function createReply(postId: string, userId: string, content: string, parentReplyId?: string): Promise<PostReply> {
  const [reply] = await db.insert(postReplies).values({ postId, userId, content, parentReplyId: parentReplyId || null }).returning();
  return reply;
}

export async function likeReply(replyId: string, userId: string): Promise<{ liked: boolean; likes: number }> {
  const [existing] = await db.select().from(replyLikes).where(
    and(eq(replyLikes.replyId, replyId), eq(replyLikes.userId, userId))
  );
  if (existing) {
    await db.delete(replyLikes).where(eq(replyLikes.id, existing.id));
    const [updated] = await db.update(postReplies).set({ likes: sql`GREATEST(likes - 1, 0)` }).where(eq(postReplies.id, replyId)).returning();
    return { liked: false, likes: updated?.likes ?? 0 };
  } else {
    await db.insert(replyLikes).values({ replyId, userId });
    const [updated] = await db.update(postReplies).set({ likes: sql`likes + 1` }).where(eq(postReplies.id, replyId)).returning();
    return { liked: true, likes: updated?.likes ?? 0 };
  }
}

export async function getReplyById(replyId: string): Promise<PostReply | undefined> {
  const [reply] = await db.select().from(postReplies).where(eq(postReplies.id, replyId));
  return reply;
}

export async function createJob(userId: string, data: any): Promise<Job> {
  const [job] = await db.insert(jobs).values({ ...data, userId }).returning();
  return job;
}

export async function getJobs(isShortWork?: boolean): Promise<(Job & { user?: User })[]> {
  let allJobs;
  if (isShortWork !== undefined) {
    allJobs = await db.select().from(jobs).where(eq(jobs.isShortWork, isShortWork)).orderBy(desc(jobs.createdAt));
  } else {
    allJobs = await db.select().from(jobs).orderBy(desc(jobs.createdAt));
  }
  const result = [];
  for (const job of allJobs) {
    const user = await getUserById(job.userId);
    result.push({ ...job, user: user ? safeUser(user) : undefined });
  }
  return result;
}

export async function getAllUsers(): Promise<User[]> {
  const allUsers = await db.select().from(users);
  return allUsers.map(safeUser);
}

export async function getOrCreateConversation(userA: string, userB: string): Promise<Conversation> {
  const participantsA = await db.select().from(conversationParticipants).where(eq(conversationParticipants.userId, userA));
  for (const pa of participantsA) {
    const [pb] = await db.select().from(conversationParticipants).where(
      and(eq(conversationParticipants.conversationId, pa.conversationId), eq(conversationParticipants.userId, userB))
    );
    if (pb) {
      const [conv] = await db.select().from(conversations).where(eq(conversations.id, pa.conversationId));
      return conv;
    }
  }
  const [conv] = await db.insert(conversations).values({}).returning();
  await db.insert(conversationParticipants).values([
    { conversationId: conv.id, userId: userA },
    { conversationId: conv.id, userId: userB },
  ]);
  return conv;
}

export async function getUserConversations(userId: string): Promise<(Conversation & { otherUser?: User; lastMessage?: Message })[]> {
  const userConvs = await db.select().from(conversationParticipants).where(eq(conversationParticipants.userId, userId));
  const result = [];
  for (const cp of userConvs) {
    const [conv] = await db.select().from(conversations).where(eq(conversations.id, cp.conversationId));
    if (!conv) continue;
    const otherParticipant = await db.select().from(conversationParticipants).where(
      and(eq(conversationParticipants.conversationId, conv.id), sql`${conversationParticipants.userId} != ${userId}`)
    );
    const otherUser = otherParticipant[0] ? await getUserById(otherParticipant[0].userId) : undefined;
    const [lastMessage] = await db.select().from(messages).where(eq(messages.conversationId, conv.id)).orderBy(desc(messages.createdAt)).limit(1);
    result.push({ ...conv, otherUser: otherUser ? safeUser(otherUser) : undefined, lastMessage });
  }
  return result.sort((a, b) => {
    const aTime = a.lastMessage?.createdAt ?? a.createdAt;
    const bTime = b.lastMessage?.createdAt ?? b.createdAt;
    return new Date(bTime!).getTime() - new Date(aTime!).getTime();
  });
}

export async function getMessages(conversationId: string): Promise<(Message & { sender?: User })[]> {
  const msgs = await db.select().from(messages).where(eq(messages.conversationId, conversationId)).orderBy(messages.createdAt);
  const result = [];
  for (const msg of msgs) {
    const sender = await getUserById(msg.senderId);
    result.push({ ...msg, sender: sender ? safeUser(sender) : undefined });
  }
  return result;
}

export async function sendMessage(conversationId: string, senderId: string, content: string): Promise<Message> {
  const [msg] = await db.insert(messages).values({ conversationId, senderId, content }).returning();
  return msg;
}

export async function getNotifications(userId: string): Promise<(Notification & { actor?: User })[]> {
  const notifs = await db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt)).limit(50);
  const result = [];
  for (const notif of notifs) {
    const actor = notif.actorId ? await getUserById(notif.actorId) : undefined;
    result.push({ ...notif, actor: actor ? safeUser(actor) : undefined });
  }
  return result;
}

export async function createNotification(userId: string, type: string, actorId?: string, postId?: string, message?: string): Promise<void> {
  if (userId === actorId) return;
  await db.insert(notifications).values({ userId, type, actorId: actorId || null, postId: postId || null, message: message || "" });
}

export async function markNotificationsRead(userId: string): Promise<void> {
  await db.update(notifications).set({ read: true }).where(eq(notifications.userId, userId));
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(notifications).where(
    and(eq(notifications.userId, userId), eq(notifications.read, false))
  );
  return Number(count);
}
