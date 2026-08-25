import { getSessionUser, jsonError, requireUser } from "@/lib/auth";
import { getCatalog } from "@/lib/catalog";
import { detectPlatform } from "@/lib/platforms";
import { publicService } from "@/lib/public";

export async function GET(req: Request) {
  try {
    await requireUser();
    const url = new URL(req.url);
    const force = url.searchParams.get("refresh") === "1";
    const q = (url.searchParams.get("q") || "").toLowerCase();
    const platform = url.searchParams.get("platform") || "all";
    const serviceId = url.searchParams.get("service");
    const rawLimit = url.searchParams.get("limit");
    const unlimited = rawLimit === "all";
    const limit = unlimited ? Number.POSITIVE_INFINITY : Math.min(Math.max(Number(rawLimit || 5000), 1), 20000);
    const catalog = await getCatalog(force);
    const user = await getSessionUser();

    const filtered = catalog.services.filter((s) => {
      if (serviceId && String(s.service) === String(serviceId)) return true;
      const hay = `${s.name} ${s.category} ${s.service}`.toLowerCase();
      const okQ = !q || hay.includes(q);
      const okP = platform === "all" || s.platform === platform || detectPlatform(s.category || "", s.name) === platform;
      return okQ && okP;
    });

    const role = user?.role === "admin" ? "admin" : "user";
    const services = filtered
      .slice(0, Number.isFinite(limit) ? limit : filtered.length)
      .map((s) => publicService(s, role));

    return Response.json({
      currency: catalog.currency,
      markup: user?.role === "admin" ? catalog.markup : undefined,
      hidden: user?.role === "admin" ? catalog.hidden : undefined,
      total: catalog.services.length,
      matched: filtered.length,
      count: services.length,
      services,
    });
  } catch (error) {
    return jsonError(error);
  }
}
