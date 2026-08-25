import { randomBytes } from "crypto";
import { jsonError, requireAdmin } from "@/lib/auth";
import { withStore } from "@/lib/db";

export async function POST() {
  try {
    const user = await requireAdmin();
    const apiKey = await withStore((store) => {
      const row = store.users.find((u) => u.id === user.id);
      if (!row) throw Object.assign(new Error("User not found"), { status: 404 });
      row.apiKey = randomBytes(16).toString("hex");
      return row.apiKey;
    });
    return Response.json({ apiKey });
  } catch (error) {
    return jsonError(error);
  }
}
