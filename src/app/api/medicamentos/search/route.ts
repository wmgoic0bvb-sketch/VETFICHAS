import { NextResponse } from "next/server";
import { searchMedicamentos } from "@/lib/medicamentos";

export const runtime = "nodejs";

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 20;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim() ?? "";
  const limitParam = Number(url.searchParams.get("limit"));
  const limit = Number.isFinite(limitParam) && limitParam > 0
    ? Math.min(limitParam, MAX_LIMIT)
    : DEFAULT_LIMIT;

  if (!q) return NextResponse.json({ items: [] });

  try {
    const items = await searchMedicamentos(q, limit);
    return NextResponse.json(
      { items },
      { headers: { "Cache-Control": "public, max-age=300" } },
    );
  } catch (e) {
    console.error("[medicamentos/search] fallback vacío:", e);
    return NextResponse.json({ items: [] });
  }
}
