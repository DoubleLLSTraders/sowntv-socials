import { StatusBadge } from "@/components/status-badge";

export function BroadcastConsole() {
  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-zinc-950">
      <div className="flex items-center gap-2 border-b border-white/10 bg-black px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
        <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
        <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
        <span className="ml-2 text-xs text-zinc-500">sowntv.socials / dashboard</span>
      </div>
      <div className="grid sm:grid-cols-[168px_1fr]">
        <div className="hidden space-y-1 border-r border-white/10 bg-black p-3 text-xs text-zinc-400 sm:block">
          {["Dashboard", "New order", "Services", "Orders", "Wallet"].map((item, i) => (
            <div key={item} className={`rounded-md px-2.5 py-1.5 ${i === 0 ? "bg-red-500 text-white" : ""}`}>
              {item}
            </div>
          ))}
        </div>
        <div className="p-4">
          <div className="grid grid-cols-3 gap-2">
            {[
              ["Balance", "KES 12,480.00"],
              ["Services", "3,210"],
              ["Orders", "18"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border border-white/10 p-3">
                <p className="text-[11px] text-zinc-500">{label}</p>
                <p className="mt-1 text-sm font-semibold text-white">{value}</p>
              </div>
            ))}
          </div>
          <table className="mt-4 w-full text-left text-xs">
            <thead>
              <tr className="text-zinc-500">
                <th className="pb-2 font-medium">Service</th>
                <th className="pb-2 font-medium">Qty</th>
                <th className="pb-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="text-zinc-200">
              <tr className="border-t border-white/10">
                <td className="py-2.5">YouTube Subscribers</td>
                <td>2,500</td>
                <td>
                  <StatusBadge status="In progress" />
                </td>
              </tr>
              <tr className="border-t border-white/10">
                <td className="py-2.5">Instagram Followers</td>
                <td>5,000</td>
                <td>
                  <StatusBadge status="Completed" />
                </td>
              </tr>
              <tr className="border-t border-white/10">
                <td className="py-2.5">TikTok Views</td>
                <td>20,000</td>
                <td>
                  <StatusBadge status="Pending" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
