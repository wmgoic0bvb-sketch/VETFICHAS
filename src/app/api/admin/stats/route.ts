import { NextResponse } from "next/server";
import type { NextAuthRequest } from "next-auth";
import { auth } from "@/auth";
import { connectMongo } from "@/lib/mongodb";
import {
  SUCURSALES,
  computeDashboardStats,
  normalizeFilters,
  type Sucursal,
} from "@/lib/stats";

export const runtime = "nodejs";

function forbidden() {
  return NextResponse.json({ error: "No autorizado" }, { status: 403 });
}

export const GET = auth(async (req: NextAuthRequest) => {
  if (req.auth?.user?.role !== "admin") {
    return forbidden();
  }

  const sp = req.nextUrl.searchParams;
  const from = sp.get("from") ?? undefined;
  const to = sp.get("to") ?? undefined;
  const sucursalRaw = sp.get("sucursal");
  const sucursal: Sucursal | null = SUCURSALES.includes(
    sucursalRaw as Sucursal,
  )
    ? (sucursalRaw as Sucursal)
    : null;

  const filters = normalizeFilters({ from, to, sucursal });

  try {
    await connectMongo();
    const stats = await computeDashboardStats(filters);
    return NextResponse.json(stats);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
});
