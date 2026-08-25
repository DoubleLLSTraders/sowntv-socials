import Link from "next/link";
import { SownMark } from "./sown-mark";

export function Brand({ size = "md" }: { size?: "sm" | "md" | "lg"; invert?: boolean }) {
  const scale = size === "lg" ? "text-xl" : size === "sm" ? "text-[15px]" : "text-base";
  const mark = size === "lg" ? 36 : size === "sm" ? 28 : 32;
  return (
    <Link href="/" className="flex min-w-0 items-center gap-2 sm:gap-2.5">
      <SownMark size={mark} />
      <span className={`truncate font-semibold tracking-tight text-white ${scale}`}>SownTV Socials</span>
    </Link>
  );
}
