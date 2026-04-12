/**
 * Publica una notificación web a varios interests de Pusher Beams (servidor).
 * Requiere PUSHER_BEAMS_SECRET_KEY y NEXT_PUBLIC_PUSHER_BEAMS_INSTANCE_ID.
 */
export async function publishBeamsToInterests(opts: {
  interests: string[];
  title: string;
  body: string;
  deepLink?: string;
}): Promise<void> {
  const { interests, title, body, deepLink } = opts;
  if (interests.length === 0) return;

  const secret = process.env.PUSHER_BEAMS_SECRET_KEY?.trim();
  const instanceId = (
    process.env.PUSHER_BEAMS_INSTANCE_ID ??
    process.env.NEXT_PUBLIC_PUSHER_BEAMS_INSTANCE_ID
  )?.trim();

  if (!secret || !instanceId) {
    if (process.env.NODE_ENV === "development") {
      const faltan: string[] = [];
      if (!secret) faltan.push("PUSHER_BEAMS_SECRET_KEY");
      if (!instanceId) {
        faltan.push(
          "NEXT_PUBLIC_PUSHER_BEAMS_INSTANCE_ID (o PUSHER_BEAMS_INSTANCE_ID)",
        );
      }
      console.warn(
        `[beams] Falta ${faltan.join(" y ")}; no se envía push. En Beams: Instance ID + Secret Key (servidor).`,
      );
    }
    return;
  }

  const url = `https://${instanceId}.pushnotifications.pusher.com/publish_api/v1/instances/${instanceId}/publishes`;

  const notification: Record<string, string> = { title, body };
  if (deepLink) notification.deep_link = deepLink;

  const payload = {
    interests,
    web: {
      notification,
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${secret}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("[beams] publish falló", res.status, text);
  }
}
