"use client";

import { useEffect, useState } from "react";
import { LottieSpinner } from "@/components/ui/lottie-loading";

// Límites del plan FREE/HOBBY (en bytes)
const BLOB_LIMIT = 1 * 1024 * 1024 * 1024;        // 1 GB — Vercel Hobby
const MONGO_LIMIT = 512 * 1024 * 1024;             // 512 MB — MongoDB Atlas M0

type BlobStats =
  | { ok: true; totalSize: number; fileCount: number }
  | { ok: false; error: string };

type MongoStats =
  | {
      ok: true;
      dataSize: number;
      storageSize: number;
      totalSize: number;
      collections: number;
      objects: number;
      indexSize: number;
    }
  | { ok: false; error: string };

type StorageData = {
  blob: BlobStats;
  mongo: MongoStats;
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function UsageBar({ used, limit }: { used: number; limit: number }) {
  const pct = Math.min((used / limit) * 100, 100);
  const color =
    pct >= 90 ? "bg-red-500" : pct >= 70 ? "bg-amber-400" : "bg-emerald-500";

  return (
    <div className="mt-3 mb-1">
      <div className="flex justify-between text-xs text-[#888] mb-1.5">
        <span>{formatBytes(used)} usados</span>
        <span>{pct.toFixed(1)}% de {formatBytes(limit)}</span>
      </div>
      <div className="h-2.5 w-full rounded-full bg-[#e8e0d8] overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-[#f0ebe4] last:border-0">
      <span className="text-sm text-[#666]">{label}</span>
      <span className="text-sm font-medium text-[#333] font-mono">{value}</span>
    </div>
  );
}

function StorageCard({
  title,
  icon,
  plan,
  children,
  error,
}: {
  title: string;
  icon: string;
  plan: string;
  children?: React.ReactNode;
  error?: string;
}) {
  return (
    <div className="rounded-2xl border border-[#e8e0d8] bg-white shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 bg-[#f5f0eb] border-b border-[#e8e0d8]">
        <div className="flex items-center gap-2">
          <span className="text-lg" aria-hidden>{icon}</span>
          <h3 className="font-semibold text-[#1a1a1a]">{title}</h3>
        </div>
        <span className="text-xs text-[#888] bg-[#e8e0d8] rounded-full px-2 py-0.5">{plan}</span>
      </div>
      <div className="px-5 py-3">
        {error ? (
          <p className="text-sm text-red-600 py-2">{error}</p>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

export function AdminStoragePanel() {
  const [data, setData] = useState<StorageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/admin/storage");
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(typeof j.error === "string" ? j.error : "Error al cargar");
        }
        setData((await res.json()) as StorageData);
      } catch (e) {
        setFetchError(e instanceof Error ? e.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="mx-auto w-full max-w-4xl px-5 py-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[#1a1a1a]">Uso de almacenamiento</h2>
        <p className="mt-1 text-sm text-[#666]">
          Estadísticas en tiempo real de Vercel Blob y MongoDB.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-3 py-10">
          <LottieSpinner size={80} />
          <span className="text-sm text-[#888]">Consultando servicios…</span>
        </div>
      ) : fetchError ? (
        <p className="text-sm text-red-600">{fetchError}</p>
      ) : data ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Vercel Blob */}
          <StorageCard
            title="Vercel Blob"
            icon="🗂"
            plan="Hobby · 1 GB"
            error={!data.blob.ok ? data.blob.error : undefined}
          >
            {data.blob.ok && (
              <>
                <UsageBar used={data.blob.totalSize} limit={BLOB_LIMIT} />
                <div className="mt-3">
                  <StatRow label="Archivos" value={data.blob.fileCount.toLocaleString("es-AR")} />
                  <StatRow label="Tamaño total" value={formatBytes(data.blob.totalSize)} />
                </div>
              </>
            )}
          </StorageCard>

          {/* MongoDB */}
          <StorageCard
            title="MongoDB Atlas"
            icon="🍃"
            plan="M0 · 512 MB"
            error={!data.mongo.ok ? data.mongo.error : undefined}
          >
            {data.mongo.ok && (
              <>
                <UsageBar used={data.mongo.totalSize} limit={MONGO_LIMIT} />
                <div className="mt-3">
                  <StatRow label="Documentos" value={data.mongo.objects.toLocaleString("es-AR")} />
                  <StatRow label="Colecciones" value={data.mongo.collections.toLocaleString("es-AR")} />
                  <StatRow label="Datos" value={formatBytes(data.mongo.dataSize)} />
                  <StatRow label="Índices" value={formatBytes(data.mongo.indexSize)} />
                  <StatRow label="Total en disco" value={formatBytes(data.mongo.totalSize)} />
                </div>
              </>
            )}
          </StorageCard>
        </div>
      ) : null}
    </div>
  );
}
