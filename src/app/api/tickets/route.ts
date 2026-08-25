import { NextRequest } from "next/server";
import { randomUUID } from "crypto";
import { jsonError, requireUser } from "@/lib/auth";
import { readOnly, withStore } from "@/lib/db";

export async function GET() {
  try {
    const user = await requireUser();
    const tickets = await readOnly((store) =>
      user.role === "admin" ? store.tickets : store.tickets.filter((t) => t.userId === user.id),
    );
    return Response.json({ tickets });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = (await req.json()) as {
      subject?: string;
      message?: string;
      ticketId?: string;
      close?: boolean;
    };

    if (body.ticketId) {
      const ticket = await withStore((store) => {
        const row = store.tickets.find((t) => t.id === body.ticketId);
        if (!row) throw Object.assign(new Error("Ticket not found"), { status: 404 });
        if (user.role !== "admin" && row.userId !== user.id) {
          throw Object.assign(new Error("Forbidden"), { status: 403 });
        }
        if (body.message) {
          row.messages.push({
            from: user.role === "admin" ? "admin" : "user",
            body: body.message,
            at: new Date().toISOString(),
          });
        }
        if (body.close) row.status = "closed";
        return row;
      });
      return Response.json({ ticket });
    }

    if (!body.subject || !body.message) {
      return Response.json({ error: "Subject and message are required." }, { status: 400 });
    }

    const ticket = await withStore((store) => {
      const row = {
        id: randomUUID(),
        userId: user.id,
        subject: body.subject!,
        messages: [{ from: "user" as const, body: body.message!, at: new Date().toISOString() }],
        status: "open" as const,
        createdAt: new Date().toISOString(),
      };
      store.tickets.unshift(row);
      return row;
    });
    return Response.json({ ticket });
  } catch (error) {
    return jsonError(error);
  }
}
