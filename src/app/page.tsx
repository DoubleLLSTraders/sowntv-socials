import type { Metadata } from "next";
import { LandingNav } from "@/components/landing/nav";
import { LandingFooter } from "@/components/landing/footer";
import { LandingShell } from "@/components/landing/shell";
import { HeroPanel } from "@/components/landing/hero-panel";
import { HeroAuthButtons } from "@/components/landing/hero-auth-buttons";

export const metadata: Metadata = {
  title: "SownTV Socials",
  description: "Professional social growth panel for YouTube, Instagram, TikTok and more.",
};

export default function HomePage() {
  return (
    <LandingShell>
      <div className="overflow-x-hidden bg-black text-white">
        <LandingNav />
        <main>
          <section className="overflow-hidden bg-black">
            <div className="mx-auto max-w-3xl px-4 pt-12 text-center sm:px-6 sm:pt-20">
              <h1 className="hero-copy text-[1.7rem] font-semibold leading-[1.15] tracking-tight text-balance sm:text-4xl sm:leading-tight lg:text-[3.4rem] lg:leading-[1.08]">
                Order YouTube, Instagram and TikTok growth from one panel.
              </h1>
              <p className="hero-copy hero-copy-2 mx-auto mt-5 max-w-xl text-base leading-7 text-zinc-400">
                You drop the link. We run the order ourselves, start to finish.
              </p>
              <HeroAuthButtons />
            </div>
            <div className="mt-12 pb-16 sm:mt-16">
              <HeroPanel />
            </div>
          </section>
        </main>
        <LandingFooter />
      </div>
    </LandingShell>
  );
}
