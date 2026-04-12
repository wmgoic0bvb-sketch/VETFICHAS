"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useNotifications } from "@/components/providers/notifications-provider";

function BellIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}

function formatShort(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString("es-AR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

export function NavNotificationsBell() {
  const ctx = useNotifications();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  if (!ctx) return null;

  const { items, unreadCount, markRead, markAllRead } = ctx;
  const badge =
    unreadCount > 0 ? (unreadCount > 99 ? "99+" : String(unreadCount)) : null;

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#e8e0d8] bg-white text-[#5c1838] hover:bg-[#efe8e0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5c1838]/40"
        aria-label="Notificaciones"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((o) => !o)}
      >
        <BellIcon className="h-[18px] w-[18px]" />
        {badge ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#5c1838] px-1 text-[10px] font-semibold leading-none text-white">
            {badge}
          </span>
        ) : null}
      </button>
      {open ? (
        <div
          role="dialog"
          aria-label="Lista de notificaciones"
          className="absolute right-0 top-full z-[120] mt-1 w-[min(100vw-2rem,22rem)] max-h-[min(70vh,24rem)] overflow-hidden rounded-lg border border-[#e8e0d8] bg-white shadow-md"
        >
          <div className="flex items-center justify-between border-b border-[#f0ebe4] px-3 py-2">
            <span className="text-sm font-semibold text-[#1a1a1a]">
              Notificaciones
            </span>
            {unreadCount > 0 ? (
              <button
                type="button"
                className="text-xs font-medium text-[#5c1838] hover:underline"
                onClick={() => void markAllRead()}
              >
                Marcar leídas
              </button>
            ) : null}
          </div>
          <ul className="max-h-[min(60vh,20rem)] overflow-y-auto py-1">
            {items.length === 0 ? (
              <li className="px-3 py-6 text-center text-sm text-[#888]">
                No hay notificaciones
              </li>
            ) : (
              items.map((n) => (
                <li key={n.id} className="border-b border-[#f7f4f0] last:border-0">
                  <Link
                    href={`/patient/${n.patientId}`}
                    className={`block px-3 py-2.5 text-left hover:bg-[#f5f0eb] ${n.read ? "opacity-80" : "bg-[#faf7f4]"}`}
                    onClick={() => {
                      if (!n.read) void markRead(n.id);
                      setOpen(false);
                    }}
                  >
                    <p className="text-sm font-medium text-[#1a1a1a]">
                      Nuevo estudio · {n.patientNombre}
                    </p>
                    {n.titulo ? (
                      <p className="truncate text-xs text-[#555]">{n.titulo}</p>
                    ) : (
                      <p className="text-xs text-[#555]">{n.estudioCategoria}</p>
                    )}
                    <p className="mt-1 text-[11px] text-[#999]">
                      {n.uploadedByName ? `${n.uploadedByName} · ` : ""}
                      {formatShort(n.createdAt)}
                    </p>
                  </Link>
                </li>
              ))
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
