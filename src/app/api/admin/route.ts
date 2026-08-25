import { NextRequest } from "next/server";
import { jsonError, requireAdmin } from "@/lib/auth";
import { readOnly, withStore } from "@/lib/db";
import { getBalance, JeskieError } from "@/lib/jeskie";
import type { User } from "@/lib/types";

function toAdminUser(user: User) {
  const { passwordHash: _secret, apiKey: _key, firebaseUid: _uid, ...safe } = user;
  return {
    ...safe,
    orderCount: 0,
    spent: 0,
    depositTotal: 0,
  };
}

export async function GET() {
  try {
    const admin = await requireAdmin();
    let provider = { balance: "unavailable", currency: process.env.NEXT_PUBLIC_CURRENCY || "KES" };
    try {
      provider = await getBalance();
    } catch (error) {
      provider = {
        balance: error instanceof JeskieError ? error.message : "unavailable",
        currency: process.env.NEXT_PUBLIC_CURRENCY || "KES",
      };
    }

    const snapshot = await readOnly((store) => {
      const users = store.users.map((user) => {
        const orders = store.orders.filter((order) => order.userId === user.id);
        const deposits = store.deposits.filter((deposit) => deposit.userId === user.id);
        return {
          ...toAdminUser(user),
          orderCount: orders.length,
          spent: Number(orders.reduce((sum, order) => sum + order.charge, 0).toFixed(4)),
          depositTotal: Number(
            deposits
              .filter((deposit) => deposit.status === "approved")
              .reduce((sum, deposit) => sum + deposit.amount, 0)
              .toFixed(4),
          ),
        };
      });
      return {
        users,
        deposits: store.deposits,
        orders: store.orders,
        tickets: store.tickets,
        settings: store.settings,
        serviceCount: store.serviceCache?.services.length || 0,
      };
    });

    const walletTotal = Number(snapshot.users.reduce((sum, user) => sum + (user.balance || 0), 0).toFixed(4));
    const deposited = Number(
      snapshot.deposits
        .filter((d) => d.status === "approved")
        .reduce((sum, d) => sum + d.amount, 0)
        .toFixed(4),
    );
    const spent = Number(snapshot.orders.reduce((sum, o) => sum + o.charge, 0).toFixed(4));
        const cost = Number(snapshot.orders.reduce((sum, o) => sum + (o.cost || 0), 0).toFixed(4));
    const revenue = Number((spent - cost).toFixed(2));

    const orderStatus: Record<string, number> = {};
    for (const order of snapshot.orders) {
      const key = order.status || "Pending";
      orderStatus[key] = (orderStatus[key] || 0) + 1;
    }

    return Response.json({
      me: { ...toAdminUser(admin), apiKey: admin.apiKey },
      provider,
      stats: {
        users: snapshot.users.length,
        orders: snapshot.orders.length,
        pendingDeposits: snapshot.deposits.filter((d) => d.status === "pending").length,
        openTickets: snapshot.tickets.filter((t) => t.status === "open").length,
        revenue,
        walletTotal,
        deposited,
        spent,
        cost,
        serviceCount: snapshot.serviceCount,
      },
      orderStatus,
      ...snapshot,
    });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const body = (await req.json()) as {
      action?: string;
      userId?: string;
      amount?: number;
      depositId?: string;
      markup?: number;
      depositNumber?: string;
      depositInstructions?: string;
    };

    if (body.action === "credit" && body.userId && body.amount) {
      await withStore((store) => {
        const user = store.users.find((u) => u.id === body.userId);
        if (!user) throw Object.assign(new Error("User not found"), { status: 404 });
        user.balance = Number((user.balance + Number(body.amount)).toFixed(4));
      });
      return Response.json({ ok: true });
    }

    if (body.action === "deposit" && body.depositId && body.amount !== undefined) {
      await withStore((store) => {
        const deposit = store.deposits.find((d) => d.id === body.depositId);
        if (!deposit) throw Object.assign(new Error("Deposit not found"), { status: 404 });
        const approve = Number(body.amount) > 0;
        deposit.status = approve ? "approved" : "rejected";
        deposit.resolvedAt = new Date().toISOString();
        if (approve) {
          const user = store.users.find((u) => u.id === deposit.userId);
          if (user) user.balance = Number((user.balance + Number(body.amount)).toFixed(4));
        }
      });
      return Response.json({ ok: true });
    }

    if (body.action === "settings") {
      await withStore((store) => {
        if (body.markup && body.markup >= 1) {
          store.settings.markup = Number(body.markup);
          store.serviceCache = null;
        }
        if (typeof body.depositNumber === "string") store.settings.depositNumber = body.depositNumber;
        if (typeof body.depositInstructions === "string") {
          store.settings.depositInstructions = body.depositInstructions;
        }
      });
      return Response.json({ ok: true });
    }

    return Response.json({ error: "Unknown admin action" }, { status: 400 });
  } catch (error) {
    return jsonError(error);
  }
}
