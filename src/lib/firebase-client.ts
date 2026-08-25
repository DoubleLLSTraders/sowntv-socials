"use client";

import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import type { PublicUser } from "@/lib/types";

function firebaseConfig() {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!apiKey || !authDomain || !projectId) {
    throw new Error("Firebase is not configured. Restart the dev server after adding the env vars.");
  }
  return {
    apiKey,
    authDomain,
    projectId,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  };
}

export function getFirebaseApp(): FirebaseApp {
  return getApps().length ? getApp() : initializeApp(firebaseConfig());
}

export function getFirebaseAuth(): Auth {
  return getAuth(getFirebaseApp());
}

export function firebaseErrorMessage(error: unknown) {
  const code =
    typeof error === "object" && error && "code" in error ? String((error as { code: string }).code) : "";
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
    case "auth/invalid-email":
      return "Invalid email or password.";
    case "auth/email-already-in-use":
      return "That email already has an account. Sign in instead.";
    case "auth/weak-password":
      return "Use a password with at least 10 characters.";
    case "auth/operation-not-allowed":
      return "Email and Google sign-in are not enabled yet. Contact support.";
    case "auth/popup-blocked":
      return "Allow popups for this site, then try Google sign-in again.";
    case "auth/unauthorized-domain":
      return "This site is not authorized for sign-in. Contact support.";
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return "Google sign-in was cancelled.";
    case "auth/account-exists-with-different-credential":
      return "This email is already registered with a different sign-in method.";
    default: {
      const msg = error instanceof Error ? error.message : "Could not sign in.";
      if (/firebase/i.test(msg)) return "Could not sign in. Try again or contact support.";
      return msg;
    }
  }
}

export async function startPanelSession(idToken: string, name?: string) {
  const res = await fetch("/api/auth/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken, name }),
  });
  const data = (await res.json()) as { error?: string; user?: PublicUser };
  if (!res.ok) {
    throw new Error(data.error || "Could not start a panel session.");
  }
  return data.user;
}
