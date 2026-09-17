const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SYSTEM_INSTRUCTION = `You are FreightIQ's RFP Co-pilot. You help buyers create chartering inquiries for dry bulk freight.

CONTEXT: The company moves rice, cotton, cocoa, and coffee in dry bulk. Routes: Western India (Mundra, Kandla, Nhava Sheva) to Europe, Middle East, Africa.

YOUR JOB:
1. Gather: commodity, volume, origin port, destination port, incoterms, shipment window, free days, payment terms, special requirements.
2. If the buyer doesn't know a field, mark it TBC.
3. After 2-3 exchanges, output the RFP charter as JSON wrapped in <RFP_JSON>...</RFP_JSON> tags with these fields: commodity, volume, origin, destination, incoterms, shipment_window, rate_validity, free_days, payment_terms, special_requirements, vendors_invited, tbc_fields.

Be concise. Ask 2-3 questions at a time. Never fabricate values the buyer didn't provide. If the buyer says 'around 30 tons' or '3 shipments of 10 tons', record it exactly as 30 tons — do not round up or scale. Use the exact units the buyer states.

RESPONSE FORMAT:
When you are ready to output the RFP charter, end your message with:

<RFP_JSON>
{
  "commodity": "...",
  "volume": "...",
  "origin": "...",
  "destination": "...",
  "incoterms": "...",
  "shipment_window": "...",
  "rate_validity": "...",
  "free_days": "...",
  "payment_terms": "...",
  "special_requirements": "...",
  "vendors_invited": 8,
  "tbc_fields": ["destination", "incoterms"]
}
</RFP_JSON>

The frontend will parse this JSON and render the RFP Charter card. Do not output the JSON until you have gathered enough information from the buyer. Always wrap the JSON in <RFP_JSON></RFP_JSON> tags.`;

async function getGeminiApiKey(): Promise<string | null> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (!supabaseUrl || !serviceRoleKey) return null;

  const resp = await fetch(
    `${supabaseUrl}/rest/v1/app_config?select=value&key=eq.gemini_api_key&limit=1`,
    { headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` } }
  );
  if (!resp.ok) return null;
  const data = await resp.json();
  return data?.[0]?.value ?? null;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();

    if (!Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: "messages must be an array" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const contents = messages.map((msg: { role: string; text: string }) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.text }],
    }));

    const apiKey = await getGeminiApiKey();
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "Gemini API key not configured on the server." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${apiKey}`;

    let response: Response | null = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      response = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
          contents,
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 2048,
          },
        }),
      });
      if (response.ok) break;
      if (response.status === 503 && attempt < 2) {
        await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
        continue;
      }
      break;
    }

    if (!response || !response.ok) {
      const errorText = response ? await response.text() : "No response";
      return new Response(
        JSON.stringify({ error: `Gemini API error: ${errorText}` }),
        { status: response?.status || 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const geminiData = await response.json();
    const reply =
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ??
      "I could not generate a response. Please try again.";

    return new Response(
      JSON.stringify({ reply }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
