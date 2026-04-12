import { NextResponse } from "next/server";
import { getCarnetPublicoPorToken } from "@/lib/carnet-public";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ token: string }> | { token: string } },
) {
  const { token } = await Promise.resolve(ctx.params);
  const data = await getCarnetPublicoPorToken(token);
  if (!data) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }
  return NextResponse.json(data);
}
