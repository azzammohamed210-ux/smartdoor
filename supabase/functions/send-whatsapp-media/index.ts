import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface MediaItem {
  url: string;
  fileName: string;
  caption: string;
}

interface SendRequestBody {
  chatId: string;
  invoiceUrl?: string;
  invoiceCaption?: string;
  media?: MediaItem[];
  message?: string;
}

function normalizeGreenApiUrl(rawUrl: string): string {
  return (rawUrl || "https://7107.api.greenapi.com")
    .replace(/[\[\]]/g, "")
    .trim()
    .replace(/\/+$/, "");
}

function normalizeGreenApiChatId(rawChatId: string): string {
  const value = (rawChatId || "").trim();
  if (!value) return "";

  const withAt = value.includes("@") ? value : `${value.replace(/\+/g, "").replace(/\D/g, "")}@c.us`;
  return withAt.replace(/[\[\]\\]/g, "").trim();
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function sendFileByUrl(
  idInstance: string,
  apiTokenInstance: string,
  apiUrl: string,
  chatId: string,
  urlFile: string,
  fileName: string,
  caption: string,
): Promise<{ ok: boolean; status: number; body: string }> {
  const endpoint = `${apiUrl}/waInstance${idInstance}/sendFileByUrl/${apiTokenInstance}`;
  const body = JSON.stringify({ chatId, urlFile, fileName, caption });
  const resp = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
  const text = await resp.text();
  return { ok: resp.ok, status: resp.status, body: text };
}

async function sendTextMessage(
  idInstance: string,
  apiTokenInstance: string,
  apiUrl: string,
  chatId: string,
  message: string,
): Promise<{ ok: boolean; status: number; body: string }> {
  const endpoint = `${apiUrl}/waInstance${idInstance}/sendMessage/${apiTokenInstance}`;
  const body = JSON.stringify({ chatId, message });
  const resp = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
  const text = await resp.text();
  return { ok: resp.ok, status: resp.status, body: text };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body = await req.json() as SendRequestBody;
    const { chatId, invoiceUrl, invoiceCaption, media, message } = body;

    if (!chatId) {
      return new Response(JSON.stringify({ error: "Missing chatId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const idInstance = Deno.env.get("GREEN_API_ID_INSTANCE");
    const apiTokenInstance = Deno.env.get("GREEN_API_TOKEN_INSTANCE");
    const apiUrl = normalizeGreenApiUrl(Deno.env.get("GREEN_API_URL") || "https://7107.api.greenapi.com");

    if (!idInstance || !apiTokenInstance) {
      return new Response(JSON.stringify({ error: "Green API credentials not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const normalizedChatId = normalizeGreenApiChatId(chatId);
    if (!normalizedChatId) {
      return new Response(JSON.stringify({ error: "Invalid chatId format" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results: { step: string; ok: boolean; detail: string }[] = [];

    if (message) {
      const textResult = await sendTextMessage(idInstance, apiTokenInstance, apiUrl, normalizedChatId, message);
      results.push({ step: "message", ok: textResult.ok, detail: textResult.body });
      if (!textResult.ok) {
        return new Response(JSON.stringify({ error: "Failed to send message", results }), {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Step 1: Send invoice PDF
    if (invoiceUrl) {
      const r = await sendFileByUrl(
        idInstance,
        apiTokenInstance,
        apiUrl,
        normalizedChatId,
        invoiceUrl,
        "Invoice.pdf",
        invoiceCaption || "",
      );
      results.push({ step: "invoice", ok: r.ok, detail: r.body });
      if (!r.ok) {
        return new Response(JSON.stringify({ error: "Failed to send invoice", results }), {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Step 2: Send product videos sequentially with delay
    if (media && media.length > 0) {
      for (let i = 0; i < media.length; i++) {
        const item = media[i];
        await delay(1500);
        const r = await sendFileByUrl(
          idInstance,
          apiTokenInstance,
          apiUrl,
          normalizedChatId,
          item.url,
          item.fileName,
          item.caption,
        );
        results.push({ step: `video_${i}`, ok: r.ok, detail: r.body });
        if (!r.ok) {
          return new Response(JSON.stringify({ error: `Failed to send video ${i + 1}`, results }), {
            status: 502,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || "Unknown Green API error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
