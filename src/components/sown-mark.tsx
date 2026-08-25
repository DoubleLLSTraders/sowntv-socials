export function SownMark({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden
      className="shrink-0 rounded-md"
    >
      <rect x="6" y="6" width="52" height="52" fill="#9146ff" />
      <path
        d="M17 41C22 48 37 50 45 42C52 35 48 25 37 24L29 23C25 22 25 18 30 17C35 16 41 18 44 22"
        stroke="#ffffff"
        strokeWidth="7"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
      <path d="M19 43L10 54H24L19 43Z" fill="#ffca5f" />
      <path d="M43 20L54 10H39L43 20Z" fill="#ffca5f" />
      <path d="M25 38L39 32L25 26V38Z" fill="#202024" />
    </svg>
  );
}
