export function StatusBadge({ status }: { status: string }) {
  const value = (status || "Pending").toLowerCase();
  const tone = value.includes("complete") || value.includes("approved") || value.includes("success")
    ? "bg-emerald-500/15 text-emerald-300 ring-emerald-500/20"
    : value.includes("progress") || value.includes("processing") || value.includes("pending") || value.includes("queued")
      ? "bg-sky-500/15 text-sky-300 ring-sky-500/20"
      : value.includes("cancel") || value.includes("refund") || value.includes("reject") || value.includes("fail")
        ? "bg-rose-500/15 text-rose-300 ring-rose-500/20"
        : value.includes("partial")
          ? "bg-amber-500/15 text-amber-300 ring-amber-500/20"
          : "bg-white/5 text-zinc-300 ring-white/10";
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ring-1 ring-inset ${tone}`}>
      {status || "Pending"}
    </span>
  );
}

export function PageHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-6">
      <h1 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">{title}</h1>
      {description && <p className="mt-1 text-sm text-zinc-500">{description}</p>}
    </div>
  );
}
