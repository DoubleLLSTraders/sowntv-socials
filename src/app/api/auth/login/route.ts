import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { jsonError, setSessionCookie, toPublic } from "@/lib/auth";
import { readOnly } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { email?: string; password?: string };
    const email = (body.email || "").trim().toLowerCase();
    const password = body.password || "";
    if (!email || !password) {
      return Response.json({ error: "Email and password are required." }, { status: 400 });
    }

    const user = await readOnly((store) => store.users.find((u) => u.email === email) || null);
    if (!user?.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) {
      return Response.json({ error: "Invalid email or password." }, { status: 401 });
    }

    await setSessionCookie(user.id, user.role);
    return Response.json({ user: toPublic(user) });
  } catch (error) {
    return jsonError(error);
  }
}
