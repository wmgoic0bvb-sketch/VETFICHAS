import JSZip from "jszip";
import { backupTimestampDir, runMongoBackup } from "@/lib/mongo-backup";
import type { RunMongoBackupOptions } from "@/lib/mongo-backup";

export async function createMongoBackupZipBuffer(
  options?: RunMongoBackupOptions,
): Promise<{ buffer: Buffer; zipFilename: string }> {
  const stamp = backupTimestampDir();
  const { files } = await runMongoBackup(options);
  const zip = new JSZip();
  for (const [filename, content] of files) {
    zip.file(filename, content);
  }
  const raw = await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
  });
  return { buffer: Buffer.from(raw), zipFilename: `vetfichas-backup-${stamp}.zip` };
}
