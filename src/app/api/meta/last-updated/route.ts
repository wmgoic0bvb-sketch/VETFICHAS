import { NextResponse } from "next/server";
import type { NextAuthRequest } from "next-auth";
import { auth } from "@/auth";
import { connectMongo } from "@/lib/mongodb";
import { Patient } from "@/models/patient";

export const runtime = "nodejs";

export const GET = auth(async (req: NextAuthRequest) => {
  if (!req.auth?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  try {
    await connectMongo();
    const latest = await Patient.findOne()
      .sort({ updatedAt: -1 })
      .select({ updatedAt: 1 })
      .lean()
      .exec() as { updatedAt?: Date } | null;
    const ts = latest?.updatedAt ? new Date(latest.updatedAt).getTime() : 0;
    return NextResponse.json({ ts });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
});
