import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import { User } from "@/models/user";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: Ctx) {
  const { id } = await context.params;

  try {
    await connectMongo();
    const user = await User.findById(id)
      .select("imageData imageType")
      .lean()
      .exec() as { imageData?: string | null; imageType?: string | null } | null;

    if (!user?.imageData) {
      return new NextResponse(null, { status: 404 });
    }

    const contentType = user.imageType || "image/jpeg";
    const buffer = Buffer.from(user.imageData, "base64");

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "content-type": contentType,
        "content-length": String(buffer.byteLength),
        "cache-control": "private, no-cache",
      },
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}
