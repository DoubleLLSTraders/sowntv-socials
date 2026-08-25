import { cookies } from "next/headers";
import { randomBytes, randomUUID } from "crypto";
import { isAdminEmail } from "./admins";
import { readOnly, withStore } from "./db";
import type { FirebaseAccount } from "./firebase";
import { publicUser } from "./public";
import { createSessionToken, SESSION_COOKIE, verifySessionToken } from "./session";
import type { PublicUser, User } from "./types";

export async function setSessionCookie(userId: string, role: "admin" | "user") {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, await createSessionToken(userId, role), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

export async function getSessionUser(): Promise<User | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await verifySessionToken(token);
  if (!session) return null;
  return readOnly((store) => store.users.find((u) => u.id === session.sub) || null);
}

export async function requireUser(): Promise<User> {
  const user = await getSessionUser();
  if (!user) {
    const err = new Error("Unauthorized");
    (err as Error & { status: number }).status = 401;
    throw err;
  }
  return user;
}

export async function requireAdmin(): Promise<User> {
  const user = await requireUser();
  if (user.role !== "admin") {
    const err = new Error("Forbidden");
    (err as Error & { status: number }).status = 403;
    throw err;
  }
  return user;
}

export function toPublic(user: User): PublicUser {
  return publicUser(user);
}

export async function upsertFirebaseUser(account: FirebaseAccount, fallbackName?: string) {
  const name =
    account.name || fallbackName?.trim() || account.email.split("@")[0] || "Operator";

  return withStore((store) => {
    const existing =
      store.users.find((user) => user.firebaseUid === account.uid) ||
      store.users.find((user) => user.email === account.email);
    const admin = isAdminEmail(account.email);

    if (existing) {
      existing.firebaseUid = account.uid;
      existing.email = account.email;
      if (account.name) existing.name = account.name;
      else if (fallbackName?.trim() && !existing.name) existing.name = fallbackName.trim();
      if (admin) existing.role = "admin";
      return existing;
    }

    const created: User = {
      id: randomUUID(),
      email: account.email,
      name,
      passwordHash: "",
      firebaseUid: account.uid,
      role: admin ? "admin" : "user",
      balance: 0,
      apiKey: randomBytes(16).toString("hex"),
      createdAt: new Date().toISOString(),
    };
    store.users.push(created);
    return created;
  });
}

export function jsonError(error: unknown, fallback = 500) {
  const status = (error as { status?: number }).status || fallback;
  const code = (error as { code?: string }).code;
  const raw = error instanceof Error ? error.message : "Something went wrong";
  const message =
    status >= 500 && process.env.NODE_ENV === "production" ? "Something went wrong" : raw;
  return Response.json({ error: message, code }, { status });
}
