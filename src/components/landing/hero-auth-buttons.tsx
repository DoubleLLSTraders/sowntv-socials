"use client";

import { ArrowRight } from "lucide-react";
import { useAuthModal } from "@/components/auth-modal";

export function HeroAuthButtons() {
  const { openAuth } = useAuthModal();
  return (
    <div className="hero-copy hero-copy-3 mt-8 flex w-full flex-col justify-center gap-3 min-[400px]:flex-row min-[400px]:flex-wrap">
      <button type="button" className="gold-btn w-full px-5 py-3 min-[400px]:w-auto" onClick={() => openAuth("register")}>
        Create account <ArrowRight size={16} />
      </button>
      <button type="button" className="ghost-btn w-full px-5 py-3 min-[400px]:w-auto" onClick={() => openAuth("login")}>
        Sign in
      </button>
    </div>
  );
}
