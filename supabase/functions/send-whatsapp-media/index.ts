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

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { chatId, invoiceUrl, invoiceCaption, media } = await req.json() as SendRequestBody;

    if (!chatId) {
      return new Response(JSON.stringify({ error: "Missing chatId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const idInstance = Deno.env.get("GREEN_API_ID_INSTANCE");
    const apiTokenInstance = Deno.env.get("GREEN_API_TOKEN_INSTANCE");
    const apiUrl = Deno.env.get("GREEN_API_URL") || "https://7107.api.greenapi.com";

    if (!idInstance || !apiTokenInstance) {
      return new Response(JSON.stringify({ error: "Green API credentials not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results: { step: string; ok: boolean; detail: string }[] = [];

    // Step 1: Send invoice PDF
    if (invoiceUrl) {
      const r = await sendFileByUrl(
        idInstance,
        apiTokenInstance,
        apiUrl,
        chatId,
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
          chatId,
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
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
