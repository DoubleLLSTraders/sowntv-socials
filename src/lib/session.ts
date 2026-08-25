export const SESSION_COOKIE = "sowntv_session";

export type SessionPayload = {
  sub: string;
  role: "admin" | "user";
  exp: number;
};

function secret() {
  const value = process.env.AUTH_SECRET || "";
  if (process.env.NODE_ENV === "production") {
    if (value.length < 32 || value === "dev-only-change-me" || value === "change-me-to-a-long-random-string") {
      throw new Error("AUTH_SECRET must be a long random value in production.");
    }
    return value;
  }
  return value || "dev-only-change-me";
}

function toBase64Url(bytes: ArrayBuffer | Uint8Array) {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let bin = "";
  arr.forEach((b) => {
    bin += String.fromCharCode(b);
  });
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(value: string) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((value.length + 3) % 4);
  const bin = atob(padded);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

async function sign(payload: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return toBase64Url(sig);
}

export function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i += 1) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

export async function createSessionToken(userId: string, role: "admin" | "user") {
  const json = JSON.stringify({
    sub: userId,
    role,
    exp: Date.now() + 1000 * 60 * 60 * 24 * 14,
  } satisfies SessionPayload);
  const payload = toBase64Url(new TextEncoder().encode(json));
  return `${payload}.${await sign(payload)}`;
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = await sign(payload);
  if (!safeEqual(sig, expected)) return null;
  try {
    const json = new TextDecoder().decode(fromBase64Url(payload));
    const data = JSON.parse(json) as SessionPayload;
    if (data.exp < Date.now()) return null;
    return data;
  } catch {
    return null;
  }
}
