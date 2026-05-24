import { describe, expect, it } from "vitest";
import { isDeletableVercelBlobUrl } from "@/lib/patient-foto-blob";

describe("isDeletableVercelBlobUrl", () => {
  it("acepta URLs https de Vercel Blob", () => {
    expect(
      isDeletableVercelBlobUrl(
        "https://abc123.public.blob.vercel-storage.com/vetfichas/x.jpg",
      ),
    ).toBe(true);
  });

  it("rechaza otros hosts", () => {
    expect(isDeletableVercelBlobUrl("https://evil.com/fake.jpg")).toBe(false);
    expect(isDeletableVercelBlobUrl("http://x.blob.vercel-storage.com/a")).toBe(
      false,
    );
  });

  it("rechaza strings inválidas", () => {
    expect(isDeletableVercelBlobUrl("not a url")).toBe(false);
    expect(isDeletableVercelBlobUrl("")).toBe(false);
  });
});
