import { NextRequest } from "next/server";
import { randomUUID } from "crypto";
import { jsonError, requireUser, toPublic } from "@/lib/auth";
import { readOnly, withStore } from "@/lib/db";
import { settlePendingDeposits } from "@/lib/deposits";
import { lipwaCheckoutUrl, lipwaExternalRef, lipwaReturnUrls, normalizeKenyaPhone } from "@/lib/payhero";

export async function GET() {
  try {
    const user = await requireUser();
    const { credited, error } = await settlePendingDeposits(user.id);
    const data = await readOnly((store) => ({
      user: store.users.find((item) => item.id === user.id) || user,
      deposits: store.deposits.filter((d) => d.userId === user.id),
    }));
    return Response.json({
      user: toPublic(data.user),
      deposits: data.deposits,
      credited,
      syncError: error || null,
    });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = (await req.json()) as { amount?: number; phone?: string };
    const amount = Math.round(Number(body.amount));
    const phone = normalizeKenyaPhone(body.phone || "");
    if (!amount || amount < 10) {
      return Response.json({ error: "Enter at least KES 10." }, { status: 400 });
    }
    if (!phone) {
      return Response.json({ error: "Enter a valid Kenyan M-Pesa number." }, { status: 400 });
    }

    const deposit = await withStore((store) => {
      const row = {
        id: randomUUID(),
        userId: user.id,
        amount,
        method: "PayHero Lipwa",
        reference: "",
        note: "",
        phone,
        externalRef: lipwaExternalRef(),
        status: "pending" as const,
        createdAt: new Date().toISOString(),
      };
      store.deposits.unshift(row);
      return row;
    });

    const origin = req.nextUrl.origin;
    const returns = lipwaReturnUrls(origin, deposit.externalRef || deposit.id);
    const lipwaUrl = lipwaCheckoutUrl({
      amount,
      phone,
      name: user.name,
      reference: deposit.externalRef || deposit.id,
      successUrl: returns.successUrl,
      failedUrl: returns.failedUrl,
    });

    return Response.json({
      deposit,
      lipwaUrl,
      message: "Opening Lipwa checkout.",
    });
  } catch (error) {
    return jsonError(error);
  }
}
