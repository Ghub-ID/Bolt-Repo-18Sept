const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SYSTEM_INSTRUCTION = `You are FreightIQ's Freight Analyst AI. You help procurement buyers analyze vendor bids for ocean freight RFPs.

CURRENT RFP DATA — RFP-2026-FR-052:
Commodity: Specialty Rice (bagged), Mundra Gujarat → Copenhagen Denmark, ~30 tons in 3 shipments of 10 tons.
Rate validity: 90 days. Required free days: 14. Market benchmark: ₹17,800-19,200/ton (Xeneta/FBX, Sep 2026).

VENDOR BIDS:
1. OceanLink Logistics (Past, 4.2★): ₹18,400/ton | Transit 22-25d | 14 free days | Confidence: Low risk (Excel) | Benchmark: In line | Questionnaire: 8/8
2. Gulf Freight Corp (Past, 3.8★): ₹17,200/ton (converted from USD 206 at ₹83.42) | Transit 24-28d | 14 free days | Confidence: Medium risk (USD conversion, footnote discount) | Benchmark: Below avg | Questionnaire: 7/8 (missing EU phyto) | Volume discount: 5% if >3 shipments/quarter (unclear for exactly 3)
3. IndoShip NVOCC (Past, 4.0★): ₹17,800/ton all-inclusive | Transit 26-30d | 14 free days | Confidence: Medium risk (all-in components estimated) | Benchmark: In line | Questionnaire: 8/8
4. Nordic Freight AS (Past, 4.1★): ₹19,100/ton | Transit 18-20d FASTEST (direct) | 14 free days | Confidence: Low risk | Benchmark: Above avg | Questionnaire: 8/8
5. SwiftSea Shipping (New, est. 2022): ₹15,600/ton LOWEST | Transit 28-32d | ONLY 7 free days (required: 14) | Confidence: High risk (phone photo OCR, 2 fields unreadable) | Benchmark: No history | Questionnaire: 5/8 | Detention risk: 7 extra days × ₹8,300/day = ₹58,100/container
6. Maersk Line Direct (New): ₹21,300/ton HIGHEST | Transit 19-21d | 21 free days | Confidence: Low risk | Benchmark: Above market | Questionnaire: 8/8
7. TransOcean (Past): PENDING — 2 days overdue
8. Sealand Asia (New): DECLINED — no Denmark service

PAST VENDOR HISTORY:
- Gulf Freight: RFP-041 JNPT→Jebel Ali ₹8,400/ton (awarded), RFP-038 Mundra→Mombasa ₹14,800/ton (not awarded)
- OceanLink: RFP-041 JNPT→Jebel Ali ₹9,100/ton (not awarded), RFP-048 Kandla→Rotterdam ₹16,200/ton (awarded)

RESPONSE RULES:
- Be concise and direct. Use tables when comparing multiple vendors.
- Always mention confidence level and caveats when citing rates.
- If asked about SwiftSea, ALWAYS flag the 7-day free-day risk and show detention-adjusted cost.
- If asked about Gulf Freight, flag USD conversion risk and unclear volume discount.
- If user sets a filter (e.g. 'past vendors only'), maintain it for subsequent questions until changed.
- You can process action commands: 'approve [vendor]', 'decline [vendor] because [reason]', 'send clarification to [vendor] about [topic]'. Confirm each action.
- When asked for a recommendation, explain the trade-off clearly.
- Format currency as ₹ with Indian number notation.

SCENARIO ANALYSIS:
When the user asks a scenario question (e.g., 'What if we split the award?' or 'What is the cost at 48 hours of demurrage?'):
1. Filter vendors per any constraints (questionnaire, past vendor only, etc.)
2. Calculate total cost for each vendor at the specified demurrage hours
3. If splitting, calculate total for each combination of 2 or 3 vendors
4. Return a ranked table with columns: Combination, Total Cost, Risk Notes
5. Recommend the best option and explain the trade-off

QUESTIONNAIRE HANDLING:
When asked about questionnaire compliance, show a table with: Vendor, Questions passed (X/8), Missing questions, Risk implication.

When answering, always cite: (a) the field, (b) the source format, (c) the confidence level.`;

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

    const geminiResponse = await fetch(geminiUrl, {
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

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      return new Response(
        JSON.stringify({ error: `Gemini API error (${geminiResponse.status}): ${errorText}` }),
        { status: geminiResponse.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const geminiData = await geminiResponse.json();
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
