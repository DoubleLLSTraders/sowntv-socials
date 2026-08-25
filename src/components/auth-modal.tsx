"use client";

import {
  createContext,
  Suspense,
  useCallback,
  useContext,
  useEffect,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";
import { SownMark } from "@/components/sown-mark";
import { firebaseErrorMessage, getFirebaseAuth, startPanelSession } from "@/lib/firebase-client";
import { syncFirebaseAccount } from "@/lib/firebase-store";

export type AuthMode = "login" | "register";

const AuthModalContext = createContext<{
  openAuth: (mode: AuthMode) => void;
} | null>(null);

export function useAuthModal() {
  const ctx = useContext(AuthModalContext);
  if (!ctx) throw new Error("useAuthModal must be used inside AuthModalProvider");
  return ctx;
}

export function AuthModalProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<AuthMode | null>(null);

  const openAuth = useCallback((next: AuthMode) => setMode(next), []);
  const close = useCallback(() => setMode(null), []);

  useEffect(() => {
    if (!mode) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [mode, close]);

  return (
    <AuthModalContext.Provider value={{ openAuth }}>
      {children}
      <Suspense fallback={null}>
        <AuthQueryOpener onOpen={openAuth} />
      </Suspense>
      {mode && <AuthModal mode={mode} onModeChange={setMode} onClose={close} />}
    </AuthModalContext.Provider>
  );
}

function AuthQueryOpener({ onOpen }: { onOpen: (mode: AuthMode) => void }) {
  const searchParams = useSearchParams();
  useEffect(() => {
    const auth = searchParams.get("auth");
    if (auth === "login" || auth === "register") onOpen(auth);
  }, [searchParams, onOpen]);
  return null;
}

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l5.7-5.7C34.2 6.1 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 16 19 13.2 24 13.2c3.1 0 5.8 1.1 8 3l5.7-5.7C34.2 6.1 29.4 4 24 4 16.3 4 9.6 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.3C29.3 35.3 26.8 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-1.1 3.1-3.5 5.5-6.4 6.5l6.3 5.3C38.2 37.3 44 31.5 44 24c0-1.2-.1-2.3-.4-3.5z"
      />
    </svg>
  );
}

function AuthModal({
  mode,
  onModeChange,
  onClose,
}: {
  mode: AuthMode;
  onModeChange: (mode: AuthMode) => void;
  onClose: () => void;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<"email" | "google" | "">("");
  const isRegister = mode === "register";

  async function finish(idToken: string, name?: string) {
    const user = await startPanelSession(idToken, name);
    await syncFirebaseAccount({ user });
    onClose();
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
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      const cred = await signInWithPopup(getFirebaseAuth(), provider);
      await finish(await cred.user.getIdToken(), cred.user.displayName || undefined);
    } catch (err) {
      setError(firebaseErrorMessage(err));
      setBusy("");
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-title"
        className="panel-card relative z-[81] max-h-[100dvh] w-full overflow-y-auto rounded-t-2xl p-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-[0_24px_80px_rgba(0,0,0,0.55)] sm:max-w-md sm:rounded-xl sm:p-6"
      >
        <button type="button" className="glass-icon-btn absolute top-4 right-4" onClick={onClose} aria-label="Close">
          <X size={16} />
        </button>
        <div className="flex items-center gap-2.5">
          <SownMark size={28} />
          <p className="text-sm font-semibold">SownTV Socials</p>
        </div>
        <h2 id="auth-title" className="mt-4 text-2xl font-semibold tracking-tight">
          {isRegister ? "Create account" : "Sign in"}
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          {isRegister ? "Open the panel and start placing orders." : "Welcome back. Continue to your panel."}
        </p>

        <button
          type="button"
          disabled={Boolean(busy)}
          onClick={onGoogle}
          className="ghost-btn mt-6 w-full py-2.5"
        >
          <GoogleMark />
          {busy === "google" ? "Connecting..." : "Continue with Google"}
        </button>

        <div className="mt-4 flex items-center gap-3 text-xs text-zinc-600">
          <span className="h-px flex-1 bg-white/10" />
          or email
          <span className="h-px flex-1 bg-white/10" />
        </div>

        <form onSubmit={onSubmit} className="mt-4 space-y-3">
          {isRegister && (
            <div>
              <label htmlFor="auth-name">Full name</label>
              <input id="auth-name" name="name" required autoComplete="name" />
            </div>
          )}
          <div>
            <label htmlFor="auth-email">Email</label>
            <input id="auth-email" name="email" type="email" required autoComplete="email" />
          </div>
          <div>
            <label htmlFor="auth-password">Password</label>
            <input
              id="auth-password"
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

        <p className="mt-5 text-sm text-zinc-500">
          {isRegister ? (
            <>
              Already have an account?{" "}
              <button type="button" className="font-medium text-red-400" onClick={() => onModeChange("login")}>
                Sign in
              </button>
            </>
          ) : (
            <>
              No account?{" "}
              <button type="button" className="font-medium text-red-400" onClick={() => onModeChange("register")}>
                Create one
              </button>
            </>
          )}
        </p>
        <p className="mt-3 text-xs leading-5 text-zinc-600">
          By continuing you agree to the{" "}
          <a href="/terms" className="text-zinc-400 underline decoration-white/20 hover:text-white">
            Terms
          </a>
          .
        </p>
      </div>
    </div>
  );
}
