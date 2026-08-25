import { NextRequest } from "next/server";
import { jsonError, setSessionCookie, toPublic, upsertFirebaseUser } from "@/lib/auth";
import { verifyFirebaseIdToken } from "@/lib/firebase";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { idToken?: string; name?: string };
    const account = await verifyFirebaseIdToken(body.idToken || "");
    const user = await upsertFirebaseUser(account, body.name);
    await setSessionCookie(user.id, user.role);
    return Response.json({ user: toPublic(user) });
  } catch (error) {
    return jsonError(error);
  }
}
