"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";
import { Brand } from "@/components/brand";
import { PlatformLogo, PLATFORM_ORDER } from "@/components/platform-logo";
import { firebaseErrorMessage, getFirebaseAuth, startPanelSession } from "@/lib/firebase-client";
import { syncFirebaseAccount } from "@/lib/firebase-store";
import { PLATFORM_META } from "@/lib/platforms";

type Mode = "login" | "register";

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3.1l5.7-5.7C34.2 6.1 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.5-.4-3.5Z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7 12.9 19.6C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 8 3.1l5.7-5.7C34.2 6.1 29.4 4 24 4 16.3 4 9.7 8.3 6.3 14.7Z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.3C29.2 35.1 26.7 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.6 39.6 16.3 44 24 44Z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-1.1 3.2-4.1 5.6-7.6 6.5l6.3 5.3C37.3 41.3 44 36 44 24c0-1.3-.1-2.5-.4-3.5Z"
      />
    </svg>
  );
}

export function AuthScreen({ mode }: { mode: Mode }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<"email" | "google" | "">("");
  const isRegister = mode === "register";

  async function finish(idToken: string, name?: string) {
    const user = await startPanelSession(idToken, name);
    await syncFirebaseAccount({ user });
    router.push("/dashboard");
    router.refresh();
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy("email");
    setError("");
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") || "").trim();
    const password = String(form.get("password") || "");
    const name = String(form.get("name") || "").trim();

    try {
      const auth = getFirebaseAuth();
      if (isRegister) {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        if (name) await updateProfile(cred.user, { displayName: name });
        await finish(await cred.user.getIdToken(), name);
      } else {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        await finish(await cred.user.getIdToken());
      }
    } catch (err) {
      setError(firebaseErrorMessage(err));
      setBusy("");
    }
  }

  async function onGoogle() {
    setBusy("google");
    setError("");
    try {
      const cred = await signInWithPopup(getFirebaseAuth(), new GoogleAuthProvider());
      await finish(await cred.user.getIdToken(), cred.user.displayName || undefined);
    } catch (err) {
      setError(firebaseErrorMessage(err));
      setBusy("");
    }
  }

  return (
    <div className="relative min-h-dvh overflow-x-clip bg-black text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(ellipse_at_top,rgba(239,68,68,0.2),transparent_60%)]"
      />
      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6 sm:py-5">
        <Brand />
        <Link href="/terms" className="shrink-0 text-sm text-zinc-400 hover:text-white">
          Terms
        </Link>
      </header>

      <main className="relative z-10 mx-auto grid max-w-6xl items-center gap-8 px-4 pb-12 pt-2 sm:px-6 sm:pb-16 sm:pt-4 lg:grid-cols-[1fr_440px] lg:gap-16 lg:pt-10">
        <section className="max-w-xl min-w-0">
          <h1 className="text-[1.7rem] font-semibold leading-[1.15] tracking-tight text-balance sm:text-4xl sm:leading-tight lg:text-5xl">
            {isRegister ? "Open your panel and start ordering." : "Sign in to your growth panel."}
          </h1>
          <p className="mt-4 max-w-md text-base leading-7 text-zinc-400">
            {isRegister
              ? "Create an account, add funds, and order YouTube, Instagram, TikTok and more from one place."
              : "Manage orders, wallet, and delivery for YouTube, Instagram, TikTok and the rest of the catalogue."}
          </p>
          <div className="chip-row mt-8">
            {PLATFORM_ORDER.slice(0, 6).map((id) => (
              <span
                key={id}
                className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-sm text-zinc-300"
              >
                <PlatformLogo id={id} size={18} />
                {PLATFORM_META[id].label}
              </span>
            ))}
          </div>
          <ul className="mt-8 space-y-3 text-sm leading-6 text-zinc-400">
            <li>Drop a public link. We run the order start to finish.</li>
            <li>Wallet in KES. M-Pesa checkout stays in the panel.</li>
            <li>Live catalogue with wholesale cost shown before you buy.</li>
          </ul>
        </section>

        <section className="glass-card order-first overflow-visible p-4 sm:p-7 lg:order-none">
          <h2 className="text-2xl font-semibold tracking-tight">
            {isRegister ? "Create account" : "Sign in"}
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            {isRegister ? "Email and password, or continue with Google." : "Use your SownTV Socials account."}
          </p>
          {!process.env.NEXT_PUBLIC_FIREBASE_API_KEY && (
            <p className="mt-4 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
              Sign-in is not configured on this server. Ask the operator to finish setup.
            </p>
          )}
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            {isRegister && (
              <div>
                <label htmlFor="name">Full name</label>
                <input id="name" name="name" required autoComplete="name" />
              </div>
            )}
            <div>
              <label htmlFor="email">Email</label>
              <input id="email" name="email" type="email" required autoComplete="email" />
            </div>
            <div>
              <label htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                minLength={isRegister ? 10 : undefined}
                required
                autoComplete={isRegister ? "new-password" : "current-password"}
              />
            </div>
            {error && <p className="text-sm text-rose-400">{error}</p>}
            <button disabled={Boolean(busy)} className="gold-btn w-full py-2.5">
              {busy === "email"
                ? isRegister
                  ? "Creating..."
                  : "Signing in..."
                : isRegister
                  ? "Create account"
                  : "Sign in"}
            </button>
          </form>
          <div className="mt-4 flex items-center gap-3 text-xs text-zinc-600">
            <span className="h-px flex-1 bg-white/10" />
            or
            <span className="h-px flex-1 bg-white/10" />
          </div>
          <button
            type="button"
            disabled={Boolean(busy)}
            onClick={onGoogle}
            className="ghost-btn mt-4 w-full py-2.5"
          >
            <GoogleMark />
            {busy === "google" ? "Connecting..." : "Continue with Google"}
          </button>
          <p className="mt-5 text-sm text-zinc-500">
            {isRegister ? (
              <>
                Already registered?{" "}
                <Link href="/login" className="font-medium text-red-400">
                  Sign in
                </Link>
              </>
            ) : (
              <>
                No account?{" "}
                <Link href="/register" className="font-medium text-red-400">
                  Create one
                </Link>
              </>
            )}
          </p>
          <p className="mt-4 text-xs leading-5 text-zinc-600">
            By continuing you agree to the{" "}
            <Link href="/terms" className="text-zinc-400 underline decoration-white/20 hover:text-white">
              Terms
            </Link>
            .
          </p>
        </section>
      </main>

      <footer className="relative z-10 mx-auto flex max-w-6xl flex-col gap-4 px-4 pb-[max(2.5rem,env(safe-area-inset-bottom))] sm:flex-row sm:items-center sm:px-6">
        <div className="founder-ring shrink-0 scale-90">
          <img
            src="/joseph-nyarandi.png"
            alt="Joseph Nyarandi"
            width={72}
            height={72}
            className="h-[72px] w-[72px] rounded-full object-cover object-[center_20%]"
          />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-white">Made by Joseph Nyarandi</p>
          <p className="mt-1 text-sm text-zinc-500">“You drop the link. We run the order ourselves, start to finish.”</p>
        </div>
      </footer>
    </div>
  );
}
