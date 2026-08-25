"use client";

import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { Brand } from "@/components/brand";
import { useAuthModal } from "@/components/auth-modal";

export function LandingNav() {
  const [open, setOpen] = useState(false);
  const { openAuth } = useAuthModal();

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-50 px-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-4 sm:pt-4">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 rounded-xl border border-white/15 bg-white/[0.08] px-2.5 py-2 shadow-[0_1px_0_rgba(255,255,255,0.18)_inset,0_12px_40px_rgba(0,0,0,0.35)] backdrop-blur-2xl sm:gap-3 sm:px-3">
        <Brand size="sm" invert />
        <div className="hidden items-center gap-2 lg:flex">
          <button type="button" className="ghost-btn px-4 py-2 text-sm" onClick={() => openAuth("login")}>
            Sign in
          </button>
          <button type="button" className="gold-btn px-4 py-2" onClick={() => openAuth("register")}>
            Get started
          </button>
        </div>
        <button
          type="button"
          className="glass-icon-btn lg:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>
      {open && (
        <div className="mx-auto mt-2 max-w-6xl rounded-xl border border-white/15 bg-white/[0.08] p-5 shadow-[0_1px_0_rgba(255,255,255,0.18)_inset] backdrop-blur-2xl lg:hidden">
        <div className="grid grid-cols-1 gap-2 min-[380px]:grid-cols-2">
            <button
              type="button"
              className="ghost-btn px-4 py-2.5"
              onClick={() => {
                setOpen(false);
                openAuth("login");
              }}
            >
              Sign in
            </button>
            <button
              type="button"
              className="gold-btn px-4 py-2.5"
              onClick={() => {
                setOpen(false);
                openAuth("register");
              }}
            >
              Get started
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
