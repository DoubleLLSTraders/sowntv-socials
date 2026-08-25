"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Brand } from "@/components/brand";
import { useAuthModal } from "@/components/auth-modal";

export function LandingFooter() {
  const { openAuth } = useAuthModal();

  return (
    <footer className="px-4 pb-6">
      <div className="panel-card mx-auto max-w-6xl overflow-hidden">
        <div className="h-px bg-gradient-to-r from-transparent via-red-500/70 to-transparent" />
        <div className="grid gap-6 px-4 py-6 sm:gap-8 sm:px-6 sm:py-8 lg:grid-cols-[1.2fr_auto] lg:items-center lg:px-8">
          <div className="min-w-0">
            <Brand size="sm" />
            <p className="mt-3 max-w-md text-sm leading-6 text-zinc-400">
              YouTube, Instagram, TikTok and more — from one panel. We run the orders ourselves.
            </p>
          </div>
          <div className="flex w-full flex-col gap-3 min-[420px]:flex-row min-[420px]:flex-wrap min-[420px]:items-center lg:w-auto">
            <button type="button" className="ghost-btn w-full px-4 py-2.5 min-[420px]:w-auto" onClick={() => openAuth("login")}>
              Sign in
            </button>
            <button type="button" className="gold-btn w-full px-4 py-2.5 min-[420px]:w-auto" onClick={() => openAuth("register")}>
              Create account <ArrowRight size={16} />
            </button>
          </div>
        </div>

        <div className="border-t border-white/10 px-4 py-6 sm:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="founder-ring shrink-0">
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
              <blockquote className="mt-1 max-w-lg text-sm leading-6 text-zinc-400">
                “You drop the link. We run the order ourselves, start to finish.”
              </blockquote>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-white/10 px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] text-sm text-zinc-500 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>© {new Date().getFullYear()} SownTV Socials</p>
          <Link href="/terms" className="hover:text-white">
            Terms
          </Link>
        </div>
      </div>
    </footer>
  );
}
