type LookupResponse = {
  error?: { message?: string };
  users?: Array<{
    localId?: string;
    email?: string;
    displayName?: string;
  }>;
};

export type FirebaseAccount = {
  uid: string;
  email: string;
  name: string;
};

export async function verifyFirebaseIdToken(idToken: string): Promise<FirebaseAccount> {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!apiKey) {
    const err = new Error("Firebase is not configured on the server.");
    (err as Error & { status: number }).status = 500;
    throw err;
  }
  if (!idToken.trim()) {
    const err = new Error("Missing Firebase token.");
    (err as Error & { status: number }).status = 401;
    throw err;
  }

  const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });
  const data = (await res.json()) as LookupResponse;
  const account = data.users?.[0];
  if (!res.ok || !account?.localId || !account.email) {
    const err = new Error("Firebase session expired. Sign in again.");
    (err as Error & { status: number }).status = 401;
    throw err;
  }

  return {
    uid: account.localId,
    email: account.email.trim().toLowerCase(),
    name: (account.displayName || "").trim(),
  };
}
