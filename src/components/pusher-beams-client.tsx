"use client";

import Script from "next/script";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { beamsInterestForUserId } from "@/lib/beams-interest";

type BeamsClient = {
  start: () => Promise<void>;
  addDeviceInterest: (interest: string) => Promise<void>;
};

declare global {
  interface Window {
    PusherPushNotifications?: {
      Client: new (opts: { instanceId: string }) => BeamsClient;
    };
  }
}

/**
 * Registra Pusher Beams para el usuario con sesión (interest `user-{id}`).
 */
export function PusherBeamsClient() {
  const instanceId = process.env.NEXT_PUBLIC_PUSHER_BEAMS_INSTANCE_ID;
  const { data: session, status } = useSession();
  const [sdkReady, setSdkReady] = useState(false);
  const clientRef = useRef<BeamsClient | null>(null);

  const onBeamsScriptLoad = useCallback(() => {
    if (!instanceId?.trim()) return;
    const SDK = window.PusherPushNotifications;
    if (!SDK) {
      console.error("[Beams] SDK no cargado");
      return;
    }
    const beamsClient = new SDK.Client({ instanceId });
    clientRef.current = beamsClient;
    beamsClient
      .start()
      .then(() => setSdkReady(true))
      .catch((e: unknown) => console.error("[Beams] start", e));
  }, [instanceId]);

  useEffect(() => {
    if (!sdkReady || status !== "authenticated" || !session?.user?.id) return;
    const c = clientRef.current;
    if (!c) return;
    const interest = beamsInterestForUserId(session.user.id);
    c.addDeviceInterest(interest).catch((e: unknown) =>
      console.error("[Beams] interest", e),
    );
  }, [sdkReady, status, session?.user?.id]);

  if (!instanceId?.trim()) return null;
  if (status !== "authenticated" || !session?.user?.id) return null;

  return (
    <Script
      key={session.user.id}
      src="https://js.pusher.com/beams/2.1.0/push-notifications-cdn.js"
      strategy="afterInteractive"
      onLoad={onBeamsScriptLoad}
    />
  );
}
