import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "fs";
import path from "path";
import { randomBytes, randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import type { Store, User } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "sowntv.json");

let queue: Promise<unknown> = Promise.resolve();

function defaultStore(): Store {
  return {
    users: [],
    orders: [],
    deposits: [],
    tickets: [],
    settings: {
      markup: Number(process.env.MARKUP_MULTIPLIER || 1),
      depositNumber: process.env.NEXT_PUBLIC_DEPOSIT_NUMBER || "",
      depositInstructions:
        "Send M-Pesa to the number above, then submit the amount and the M-Pesa code. An admin will credit your wallet.",
    },
    disabledServices: [],
    serviceCache: null,
  };
}

function readStore(): Store {
  if (!existsSync(DATA_FILE)) return defaultStore();
  try {
    const raw = readFileSync(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw) as Store;
    return {
      ...defaultStore(),
      ...parsed,
      settings: { ...defaultStore().settings, ...parsed.settings },
    };
  } catch {
    return defaultStore();
  }
}

function writeStore(store: Store) {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  const tmp = `${DATA_FILE}.${process.pid}.tmp`;
  writeFileSync(tmp, JSON.stringify(store, null, 2), "utf8");
  renameSync(tmp, DATA_FILE);
}

async function seedIfNeeded(store: Store): Promise<Store> {
  if (store.users.length > 0) return store;
  const email = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "";
  if (!email || password.length < 12) return store;
  const admin: User = {
    id: randomUUID(),
    email,
    name: "SownTV Admin",
    passwordHash: await bcrypt.hash(password, 10),
    role: "admin",
    balance: 0,
    apiKey: randomBytes(16).toString("hex"),
    createdAt: new Date().toISOString(),
  };
  store.users.push(admin);
  writeStore(store);
  return store;
}

export function withStore<T>(fn: (store: Store) => T | Promise<T>): Promise<T> {
  const run = queue.then(async () => {
    const store = await seedIfNeeded(readStore());
    const result = await fn(store);
    writeStore(store);
    return result;
  });
  queue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

export function readOnly<T>(fn: (store: Store) => T | Promise<T>): Promise<T> {
  const run = queue.then(async () => {
    const store = await seedIfNeeded(readStore());
    return fn(store);
  });
  queue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

