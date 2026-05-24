import { NextResponse } from "next/server";
import type { NextAuthRequest } from "next-auth";
import { auth } from "@/auth";
import { createMongoBackupZipBuffer } from "@/lib/mongo-backup-zip";

export const runtime = "nodejs";

function forbidden() {
  return NextResponse.json({ error: "No autorizado" }, { status: 403 });
}

export const POST = auth(async (req: NextAuthRequest) => {
  if (req.auth?.user?.role !== "admin") {
    return forbidden();
  }

  try {
    const { buffer, zipFilename: filename } = await createMongoBackupZipBuffer();
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
});
