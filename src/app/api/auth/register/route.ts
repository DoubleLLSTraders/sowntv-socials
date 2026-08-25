import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { randomBytes, randomUUID } from "crypto";
import { jsonError, setSessionCookie, toPublic } from "@/lib/auth";
import { withStore } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { email?: string; password?: string; name?: string };
    const email = (body.email || "").trim().toLowerCase();
    const name = (body.name || "").trim();
    const password = body.password || "";

    if (!email || !name || password.length < 10) {
      return Response.json(
        { error: "Name, email, and a password of at least 10 characters are required." },
        { status: 400 },
      );
    }

    const user = await withStore(async (store) => {
      if (store.users.some((u) => u.email === email)) {
        const err = new Error("An account with that email already exists.");
        (err as Error & { status: number }).status = 400;
        throw err;
      }
      const created = {
        id: randomUUID(),
        email,
        name,
        passwordHash: await bcrypt.hash(password, 10),
        role: "user" as const,
        balance: 0,
        apiKey: randomBytes(16).toString("hex"),
        createdAt: new Date().toISOString(),
      };
      store.users.push(created);
      return created;
    });

    await setSessionCookie(user.id, user.role);
    return Response.json({ user: toPublic(user) });
  } catch (error) {
    return jsonError(error);
  }
}
