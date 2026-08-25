import { PLATFORM_META } from "@/lib/platforms";
import { PlatformLogo, PLATFORM_ORDER } from "@/components/platform-logo";

export function PlatformMarquee() {
  const items = [...PLATFORM_ORDER, ...PLATFORM_ORDER];

  return (
    <section className="border-y border-white/10 bg-black py-8">
      <div className="marquee">
        <div className="marquee-track px-6">
          {items.map((id, index) => (
            <span
              key={`${id}-${index}`}
              className="inline-flex shrink-0 items-center gap-2.5 rounded-lg border border-white/14 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]"
            >
              <PlatformLogo id={id} size={22} />
              {PLATFORM_META[id].label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
