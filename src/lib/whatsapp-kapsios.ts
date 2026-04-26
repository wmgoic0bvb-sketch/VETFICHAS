type KapsoSendMessageParams = {
  to: string;
  message: string;
  patientName: string;
  controlFechaHora: string;
  externalId?: string;
};

type KapsoSendMessageResult = {
  providerMessageId?: string;
  raw: unknown;
};

type KapsoConfig = {
  apiKey: string;
  baseUrl: string;
  phoneNumberId: string;
  templateName: string;
  templateLanguage: string;
};

function resolveKapsoConfig(): KapsoConfig {
  const apiKey =
    process.env.KAPSO_API_KEY?.trim() ?? process.env.KAPSIOS_API_KEY?.trim();
  const baseUrl =
    process.env.KAPSO_API_BASE_URL?.trim() ??
    "https://api.kapso.ai/meta/whatsapp/v24.0";
  const phoneNumberId = process.env.KAPSO_PHONE_NUMBER_ID?.trim();
  const templateName = process.env.KAPSO_TEMPLATE_NAME?.trim();
  const templateLanguage =
    process.env.KAPSO_TEMPLATE_LANGUAGE?.trim() ?? "es_AR";
  if (!apiKey) {
    throw new Error("Falta KAPSO_API_KEY (o KAPSIOS_API_KEY)");
  }
  if (!phoneNumberId) {
    throw new Error("Falta KAPSO_PHONE_NUMBER_ID");
  }
  if (!templateName) {
    throw new Error("Falta KAPSO_TEMPLATE_NAME");
  }
  return { apiKey, baseUrl, phoneNumberId, templateName, templateLanguage };
}

function parseErrorPayload(payload: unknown): string {
  if (payload && typeof payload === "object") {
    const msg = (payload as { message?: unknown }).message;
    if (typeof msg === "string" && msg.trim()) return msg.trim();
    const err = (payload as { error?: unknown }).error;
    if (typeof err === "string" && err.trim()) return err.trim();
  }
  return "Error desconocido del proveedor Kapso";
}

export async function sendControlReminderWhatsapp(
  params: KapsoSendMessageParams,
): Promise<KapsoSendMessageResult> {
  const { apiKey, baseUrl, phoneNumberId, templateName, templateLanguage } =
    resolveKapsoConfig();
  const apiUrl = `${baseUrl.replace(/\/$/, "")}/${phoneNumberId}/messages`;
  const payload = {
    messaging_product: "whatsapp",
    to: params.to,
    type: "template",
    ...(params.externalId ? { biz_opaque_callback_data: params.externalId } : {}),
    template: {
      name: templateName,
      language: { code: templateLanguage },
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", text: params.patientName },
            { type: "text", text: params.controlFechaHora },
            { type: "text", text: params.message },
          ],
        },
      ],
    },
  };
  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": apiKey,
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(15_000),
  });

  const raw = await response.json().catch(async () => {
    const text = await response.text().catch(() => "");
    return { text };
  });

  if (!response.ok) {
    const detail = parseErrorPayload(raw);
    throw new Error(`Kapso ${response.status}: ${detail}`);
  }

  const providerMessageId = (() => {
    if (!raw || typeof raw !== "object") return undefined;
    const id = (raw as { id?: unknown; messageId?: unknown }).id;
    if (typeof id === "string" && id.trim()) return id.trim();
    const messageId = (raw as { messageId?: unknown }).messageId;
    if (typeof messageId === "string" && messageId.trim()) {
      return messageId.trim();
    }
    return undefined;
  })();

  return { providerMessageId, raw };
}
