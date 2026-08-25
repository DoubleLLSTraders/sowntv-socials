"use client";

import { doc, getFirestore, serverTimestamp, setDoc } from "firebase/firestore";
import { getFirebaseApp, getFirebaseAuth } from "@/lib/firebase-client";
import type { Deposit, OrderRecord, PublicUser, Ticket } from "@/lib/types";

function db() {
  return getFirestore(getFirebaseApp());
}

function uid() {
  return getFirebaseAuth().currentUser?.uid || "";
}

async function write(path: string, data: Record<string, unknown>) {
  if (!uid()) return;
  await setDoc(doc(db(), path), { ...data, firestoreUpdatedAt: serverTimestamp() }, { merge: true });
}

export async function saveUserProfile(user: PublicUser) {
  const id = uid();
  const authUser = getFirebaseAuth().currentUser;
  if (!id || !authUser) return;
  const provider = authUser.providerData[0];
  await write(`users/${id}`, {
    uid: id,
    panelUserId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    balance: user.balance,
    currency: process.env.NEXT_PUBLIC_CURRENCY || "KES",
    createdAt: user.createdAt,
    lastLoginAt: new Date().toISOString(),
    emailVerified: authUser.emailVerified,
    photoURL: authUser.photoURL || "",
    authProvider: provider?.providerId || "password",
    phone: authUser.phoneNumber || "",
  });
}

export async function saveOrder(order: OrderRecord) {
  const id = uid();
  if (!id) return;
  await write(`users/${id}/orders/${order.id}`, {
    id: order.id,
    ownerUid: id,
    panelUserId: order.userId,
    providerOrderId: order.providerOrderId,
    serviceId: order.serviceId,
    serviceName: order.serviceName,
    category: order.category,
    type: order.type,
    link: order.link,
    quantity: order.quantity,
    charge: order.charge,
    currency: order.currency,
    status: order.status,
    startCount: order.startCount,
    remains: order.remains,
    refillId: order.refillId,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  });
}

export async function saveOrders(orders: OrderRecord[]) {
  await Promise.all(orders.map((order) => saveOrder(order)));
}

export async function saveTransaction(deposit: Deposit) {
  const id = uid();
  if (!id) return;
  await write(`users/${id}/transactions/${deposit.id}`, {
    id: deposit.id,
    ownerUid: id,
    panelUserId: deposit.userId,
    type: "wallet_deposit",
    amount: deposit.amount,
    method: deposit.method,
    reference: deposit.reference,
    note: deposit.note,
    phone: deposit.phone || "",
    providerRef: deposit.providerRef || "",
    checkoutRequestId: deposit.checkoutRequestId || "",
    externalRef: deposit.externalRef || "",
    status: deposit.status,
    createdAt: deposit.createdAt,
    resolvedAt: deposit.resolvedAt || "",
  });
}

export async function saveTransactions(deposits: Deposit[]) {
  await Promise.all(deposits.map((deposit) => saveTransaction(deposit)));
}

export async function saveTicket(ticket: Ticket) {
  const id = uid();
  if (!id) return;
  await write(`users/${id}/tickets/${ticket.id}`, {
    id: ticket.id,
    ownerUid: id,
    panelUserId: ticket.userId,
    subject: ticket.subject,
    status: ticket.status,
    createdAt: ticket.createdAt,
    messageCount: ticket.messages.length,
    lastMessage: ticket.messages.at(-1)?.body || "",
    lastMessageAt: ticket.messages.at(-1)?.at || ticket.createdAt,
    messages: ticket.messages,
  });
}

export async function saveTickets(tickets: Ticket[]) {
  await Promise.all(tickets.map((ticket) => saveTicket(ticket)));
}

export async function syncFirebaseAccount(input: {
  user?: PublicUser | null;
  orders?: OrderRecord[];
  deposits?: Deposit[];
  tickets?: Ticket[];
}) {
  try {
    if (input.user) await saveUserProfile(input.user);
    if (input.orders?.length) await saveOrders(input.orders);
    if (input.deposits?.length) await saveTransactions(input.deposits);
    if (input.tickets?.length) await saveTickets(input.tickets);
  } catch {
    // Firestore must be created in the Firebase console; ignore until then.
  }
}
