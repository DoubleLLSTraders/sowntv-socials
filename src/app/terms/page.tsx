import type { Metadata } from "next";
import Link from "next/link";
import { Brand } from "@/components/brand";

export const metadata: Metadata = {
  title: "Terms",
};

export default function TermsPage() {
  return (
    <div className="min-h-dvh bg-black text-white">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="flex items-center justify-between gap-4">
          <Brand />
          <Link href="/" className="text-sm text-zinc-400 hover:text-white">
            Home
          </Link>
        </div>
        <h1 className="mt-10 text-3xl font-semibold tracking-tight">Terms of use</h1>
        <p className="mt-2 text-sm text-zinc-500">Last updated 25 August 2026. SownTV Socials, Kenya.</p>

        <div className="mt-8 space-y-8 text-sm leading-7 text-zinc-400">
          <section>
            <h2 className="text-base font-semibold text-white">1. The service</h2>
            <p className="mt-2">
              SownTV Socials is a growth panel. You place orders for public social accounts and content. We
              fulfil those orders through a wholesale provider. You are buying panel services, not a
              guaranteed result on any social platform.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white">2. Accounts</h2>
            <p className="mt-2">
              You must give a working email and keep your password private. You are responsible for every
              order and payment made from your account. We may suspend an account that is abused, unpaid, or
              used to harm other people.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white">3. Public links only</h2>
            <p className="mt-2">
              Send only public links: a video, profile, page, channel, or track. Never send passwords, backup
              codes, or private account access. We will never ask for them.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white">4. Orders and delivery</h2>
            <p className="mt-2">
              Speed, start time, drop rate, and refill follow the service you pick. Platforms can remove
              views, likes, or followers. A refill runs only if that service lists one. Partial and canceled
              jobs are refunded according to the provider result, back to your SownTV wallet.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white">5. Wallet and payments</h2>
            <p className="mt-2">
              Prices and wallet balance are in Kenyan Shillings (KES). Deposits use M-Pesa checkout. Funds in
              the wallet pay for orders. Wallet credit is not a bank deposit and is not interest-bearing.
              Unused balance may be held in your account until you spend it or we close the account for a
              terms breach.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white">6. Your responsibility</h2>
            <p className="mt-2">
              You must have the right to promote the link you submit. You must follow the rules of YouTube,
              Instagram, TikTok, and any other network you target. We are not liable if a platform limits,
              bans, or removes an account after an order.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white">7. Acceptable use</h2>
            <p className="mt-2">
              Do not use the panel for fraud, hate, child sexual content, malware, or anything illegal in
              Kenya. Do not attack our panel, scrape it, or share another customer’s data.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white">8. Liability</h2>
            <p className="mt-2">
              The panel is provided as available. To the fullest extent allowed by law, SownTV Socials is not
              liable for lost profits, lost accounts, or platform penalties. If we owe you anything, it is
              limited to the unused wallet balance or the charge for the affected order.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white">9. Changes</h2>
            <p className="mt-2">
              Service rates can change when the provider updates them. We may update these terms. Continued
              use after an update means you accept the new terms.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white">10. Contact</h2>
            <p className="mt-2">
              Questions about an order, a deposit, or these terms go through Support in the panel after you
              sign in.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
