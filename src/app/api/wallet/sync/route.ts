import { NextRequest } from "next/server";
import { jsonError, requireUser, toPublic } from "@/lib/auth";
import { readOnly } from "@/lib/db";
import { settleDepositFromPayhero } from "@/lib/deposits";

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = (await req.json()) as { id?: string; receipt?: string; reference?: string };
    const deposit = await readOnly(
      (store) => store.deposits.find((item) => item.id === body.id && item.userId === user.id) || null,
    );
    if (!deposit) return Response.json({ error: "Deposit not found." }, { status: 404 });
    if (deposit.status === "pending") {
      const updated = await settleDepositFromPayhero(deposit, {
        receipt: body.receipt,
        reference: body.reference,
      });
      const fresh = await readOnly((store) => store.users.find((item) => item.id === user.id) || user);
      return Response.json({ deposit: updated, user: toPublic(fresh) });
    }
    const fresh = await readOnly((store) => store.users.find((item) => item.id === user.id) || user);
    return Response.json({ deposit, user: toPublic(fresh) });
  } catch (error) {
    return jsonError(error);
  }
}
