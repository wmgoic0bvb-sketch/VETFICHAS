"use client";

import type { ReactNode } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSession } from "next-auth/react";
import { playNotificationSound } from "@/lib/play-notification-sound";

export type StaffNotificationItem = {
  id: string;
  kind: "estudio_subido";
  read: boolean;
  createdAt: string;
  patientId: string;
  patientNombre: string;
  estudioId: string;
  estudioCategoria: string;
  titulo: string;
  uploadedByName: string;
};

type NotificationsContextValue = {
  items: StaffNotificationItem[];
  unreadCount: number;
  loading: boolean;
  refresh: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
};

const NotificationsContext = createContext<NotificationsContextValue | null>(
  null,
);

const POLL_MS = 25_000;

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { status } = useSession();
  const [items, setItems] = useState<StaffNotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const prevUnreadRef = useRef<number | null>(null);

  const refresh = useCallback(async () => {
    if (status !== "authenticated") return;
    setLoading(true);
    try {
      const res = await fetch("/api/notifications", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as {
        items: StaffNotificationItem[];
        unreadCount: number;
      };
      const next = data.unreadCount ?? 0;
      const prev = prevUnreadRef.current;
      prevUnreadRef.current = next;
      setItems(data.items ?? []);
      setUnreadCount(next);
      if (prev !== null && next > prev) {
        playNotificationSound();
      }
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    if (status !== "authenticated") {
      setItems([]);
      setUnreadCount(0);
      prevUnreadRef.current = null;
      return;
    }
    void refresh();
  }, [status, refresh]);

  useEffect(() => {
    if (status !== "authenticated") return;
    const t = setInterval(() => void refresh(), POLL_MS);
    return () => clearInterval(t);
  }, [status, refresh]);

  useEffect(() => {
    if (status !== "authenticated") return;
    const onVis = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [status, refresh]);

  const markRead = useCallback(
    async (id: string) => {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) void refresh();
    },
    [refresh],
  );

  const markAllRead = useCallback(async () => {
    const res = await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAllRead: true }),
    });
    if (res.ok) void refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({
      items,
      unreadCount,
      loading,
      refresh,
      markRead,
      markAllRead,
    }),
    [items, unreadCount, loading, refresh, markRead, markAllRead],
  );

  if (status !== "authenticated") {
    return <>{children}</>;
  }

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications(): NotificationsContextValue | null {
  return useContext(NotificationsContext);
}
