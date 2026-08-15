export interface GreenApiMediaItem {
  url: string;
  fileName: string;
  caption: string;
}

export interface SendGreenApiInvoiceOptions {
  chatId: string;
  invoiceUrl?: string;
  invoiceCaption?: string;
  media?: GreenApiMediaItem[];
  message?: string;
}

function normalizeGreenApiUrl(rawUrl: string): string {
  return (rawUrl || "https://7107.api.greenapi.com")
    .replace(/[\[\]{}()]/g, "")
    .trim()
    .replace(/\/+$/, "");
}

function getGreenApiConfig() {
  const env = import.meta.env as Record<string, string | undefined>;

  return {
    url: normalizeGreenApiUrl(env.VITE_GREEN_API_URL || env.GREEN_API_URL || "https://7107.api.greenapi.com"),
    idInstance: (env.VITE_GREEN_API_ID_INSTANCE || env.GREEN_API_ID_INSTANCE || "").trim(),
    tokenInstance: (env.VITE_GREEN_API_TOKEN_INSTANCE || env.GREEN_API_TOKEN_INSTANCE || "").trim(),
  };
}

function normalizeChatId(chatId: string): string {
  const value = String(chatId || "").trim();
  if (!value) return "";

  const withoutSpaces = value.replace(/\s+/g, "");
  if (withoutSpaces.includes("@")) {
    return withoutSpaces.replace(/\+/g, "");
  }

  const digits = withoutSpaces.replace(/\+/g, "").replace(/\D/g, "");
  return digits ? `${digits}@c.us` : "";
}

async function parseGreenApiError(response: Response): Promise<string> {
  try {
    const text = await response.text();
    if (!text) return `Green API request failed (${response.status})`;

    try {
      const json = JSON.parse(text) as Record<string, unknown>;
      if (typeof json.error === "string" && json.error.trim()) return json.error.trim();
      if (typeof json.message === "string" && json.message.trim()) return json.message.trim();
      if (typeof json.details === "string" && json.details.trim()) return json.details.trim();
      return text;
    } catch {
      return text;
    }
  } catch {
    return `Green API request failed (${response.status})`;
  }
}

async function sendTextMessage(
  chatId: string,
  message: string,
  idInstance: string,
  tokenInstance: string,
  apiUrl: string,
) {
  const endpoint = `${apiUrl}/waInstance${idInstance}/sendMessage/${tokenInstance}`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chatId, message }),
  });

  if (!response.ok) {
    throw new Error(await parseGreenApiError(response));
  }

  return response.json();
}

async function sendFileByUrl(
  chatId: string,
  urlFile: string,
  fileName: string,
  caption: string,
  idInstance: string,
  tokenInstance: string,
  apiUrl: string,
) {
  const endpoint = `${apiUrl}/waInstance${idInstance}/sendFileByUrl/${tokenInstance}`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chatId, urlFile, fileName, caption }),
  });

  if (!response.ok) {
    throw new Error(await parseGreenApiError(response));
  }

  return response.json();
}

export async function sendWhatsAppDirect({
  chatId,
  invoiceUrl,
  invoiceCaption,
  media = [],
  message,
}: SendGreenApiInvoiceOptions) {
  const { url: apiUrl, idInstance, tokenInstance } = getGreenApiConfig();

  if (!idInstance || !tokenInstance) {
    throw new Error("Green API credentials are missing. Set GREEN_API_ID_INSTANCE and GREEN_API_TOKEN_INSTANCE.");
  }

  const normalizedChatId = normalizeChatId(chatId);
  if (!normalizedChatId) {
    throw new Error("Phone number is missing or invalid before sending to Green API.");
  }

  const results: Array<{ step: string; ok: boolean; detail?: unknown }> = [];

  if (message) {
    const data = await sendTextMessage(normalizedChatId, message, idInstance, tokenInstance, apiUrl);
    results.push({ step: "message", ok: true, detail: data });
  }

  if (invoiceUrl) {
    const invoiceData = await sendFileByUrl(
      normalizedChatId,
      invoiceUrl,
      "Invoice.pdf",
      invoiceCaption || "",
      idInstance,
      tokenInstance,
      apiUrl,
    );
    results.push({ step: "invoice", ok: true, detail: invoiceData });
  }

  for (let i = 0; i < media.length; i++) {
    const item = media[i];
    await new Promise((resolve) => setTimeout(resolve, 1500));
    const data = await sendFileByUrl(
      normalizedChatId,
      item.url,
      item.fileName,
      item.caption,
      idInstance,
      tokenInstance,
      apiUrl,
    );
    results.push({ step: `media_${i}`, ok: true, detail: data });
  }

  return { success: true, results };
}
