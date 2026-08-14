import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SYSTEM_PROMPT = `You are an AI assistant for "MZ". Parse the user's Omani customer message and extract the following structured JSON fields strictly:
- phone: (string, extract Omani phone number, format as 8 digits without country code, e.g. "91234567")
- location_url: (string, extract map URL/link if available, else null)
- product: (string, identify product like 'قفل ذكي', 'ماكينة سلايد', 'ماكينة سوينج', 'باب', 'سلايد', else null)
- appointment_time: (string, extract and format time like '04:00 مساءً', '10:00 صباحاً', 'العصر', 'الظهر', '08:30 صباحاً', else null)
- customer_details: (string, any extra context/notes about the customer or order, else null)

Return ONLY valid JSON, no markdown, no explanation.`;

interface AIResult {
  phone: string | null;
  location_url: string | null;
  product: string | null;
  appointment_time: string | null;
  customer_details: string | null;
}

function regexFallback(text: string): AIResult {
  const phoneMatch = text.match(/(?:\+?968)?\s*(\d{4}\s?\d{3,4}|\d{8})/);
  let phone = phoneMatch ? phoneMatch[1].replace(/\s/g, "") : null;
  if (phone && phone.length > 8) phone = phone.slice(-8);

  const urlMatch = text.match(/https?:\/\/[^\s]+/);
  const location_url = urlMatch ? urlMatch[0] : null;

  const productMatch = text.match(/(قفل\s*ذكي|ماكينة\s*سلايد|ماكينة\s*سوينج|سلايد|سوينج|باب|قفل|ماكينة|ريموت|كاميرا)/);
  const product = productMatch ? productMatch[0] : null;

  const timeMatch = text.match(/(الساعة\s*\d+[:：]\d*\d*\s*(صباحا?|مساء?)?|\d+[:：]\d*\d*\s*(صباحا?|مساء?)?|العصر|الظهر|الفجر|المغرب|صباحا?|مساء?)/);
  const appointment_time = timeMatch ? timeMatch[0] : null;

  return { phone, location_url, product, appointment_time, customer_details: null };
}

async function callGemini(text: string, apiKey: string): Promise<AIResult> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
  const body = {
    contents: [{ parts: [{ text: `${SYSTEM_PROMPT}\n\nCustomer message:\n${text}` }] }],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 512,
      responseMimeType: "application/json",
    },
  };

  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    throw new Error(`Gemini API error: ${resp.status}`);
  }

  const data = await resp.json();
  const content = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!content) throw new Error("Empty Gemini response");

  const parsed = JSON.parse(content);
  return {
    phone: parsed.phone ?? null,
    location_url: parsed.location_url ?? null,
    product: parsed.product ?? null,
    appointment_time: parsed.appointment_time ?? null,
    customer_details: parsed.customer_details ?? null,
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { text } = await req.json();
    if (!text || typeof text !== "string") {
      return new Response(JSON.stringify({ error: "Missing 'text' field" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("GEMINI_API_KEY");

    if (!apiKey) {
      const fallback = regexFallback(text);
      return new Response(JSON.stringify({ ...fallback, source: "fallback" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    try {
      const result = await callGemini(text, apiKey);
      return new Response(JSON.stringify({ ...result, source: "ai" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (aiErr) {
      const fallback = regexFallback(text);
      return new Response(JSON.stringify({ ...fallback, source: "fallback", ai_error: aiErr.message }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
