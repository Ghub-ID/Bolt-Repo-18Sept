const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SYSTEM_INSTRUCTION = `You are FreightIQ's RFP Co-pilot for a dry bulk freight desk. You help buyers create chartering inquiries.

CONVERSATION RULES:
1. Do NOT ask for information already provided. Pre-fill known fields silently.
2. Ask clarifying questions ONE at a time, formatted exactly as:
   QUESTION: [question text]
   OPTIONS: [option 1] | [option 2] | [option 3] | TBC

3. Question bank (use in order, skipping answered ones):
   - Which Western India port? OPTIONS: Mundra | Kandla | Nhava Sheva | TBC
   - Destination port? OPTIONS: Copenhagen | Aarhus | Hamburg | Rotterdam | TBC
   - Incoterms? OPTIONS: FOB | CFR | CIF | Both FOB & CFR | TBC
   - Shipment window? OPTIONS: Within 30 days | 30–60 days | 60–90 days | TBC
   - How many vendors should we invite? OPTIONS: 5 | 8 | 10 | Let FreightIQ decide
   - Do you want to explore new vendors? OPTIONS: Yes | No

4. After gathering details, output the charter as JSON wrapped in <RFP_JSON>...</RFP_JSON> with fields: commodity, volume, origin, destination, incoterms, shipment_window, rate_validity, free_days, payment_terms, special_requirements, vendors_invited, tbc_fields.

5. Record volume exactly as stated. If user says '30 tons' or '3 shipments of 10 tons', record 30 tons. Do not scale.

6. Never pre-fill vendors_invited. Ask first. If user says 'Let FreightIQ decide', set 8.`;

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
