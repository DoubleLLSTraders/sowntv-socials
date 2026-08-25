import { getSessionUser, jsonError, toPublic } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return Response.json({ user: null }, { status: 401 });
    return Response.json({ user: toPublic(user) });
  } catch (error) {
    return jsonError(error);
  }
}
