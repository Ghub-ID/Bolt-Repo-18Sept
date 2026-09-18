const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const BASE_INSTRUCTION = `You are FreightIQ's Freight Analyst AI for a dry bulk ocean freight procurement desk.

CRITICAL RULES:
1. Use ONLY the EXTRACTED VENDOR DATA provided in this system instruction.
2. NEVER fabricate vendor names. If a vendor is not in the data, do not mention it. If the user asks about a vendor not in the data, respond: 'I do not have data for [vendor]. The vendors with extracted bids are: [list names from data].'
3. NEVER output the raw JSON data or reference [VENDOR_DATA_START]. Use the data silently.
4. Answer ONLY what was asked. Do not add currency conversion notes, confidence caveats, or any commentary unless the user explicitly asks about rates, currency, or data quality.
5. Every rate you cite must come from the data. Every confidence level must come from the data.

RESPONSE FORMAT:
- Use natural language with markdown tables for comparisons of 3+ vendors.
- For simple questions, answer in 1-2 concise sentences with the answer first, then supporting detail.
- Table columns: Vendor | Rate (INR/ton) | Transit | Free Days | Confidence | Risk Notes.
- Format currency as ₹ with Indian number notation (₹18,400 not ₹18400).
- No code blocks, no JSON, no technical formatting unless the user asks.

SCENARIO ANALYSIS:
When asked about split awards, demurrage costs, or filters:
1. Filter vendors per constraints ('past vendors only' = exclude New vendors).
2. Total cost = (rate × tonnage) + demurrage where demurrage = max(0, hours − free_days × 24) × (demurrage_rate / 24).
3. Return ranked table: Combination | Total Cost | Risk Notes | Recommendation.
4. Recommend the lowest-cost combination that meets all constraints.

QUESTIONNAIRE HANDLING:
Show: Vendor | Passed (X/8) | Missing | Risk Implication.

ACTION COMMANDS:
When user says 'approve [vendor]', 'decline [vendor] because [reason]', or 'send clarification to [vendor] about [topic]', confirm with: 'Confirmed: [action] on [vendor] for [reason]. Logged in audit trail.'`;

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
    const { messages, vendorData } = await req.json();

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

    const hasVendorData = Array.isArray(vendorData) && vendorData.length > 0;
    const dynamicInstruction = hasVendorData
      ? `${BASE_INSTRUCTION}\n\nEXTRACTED VENDOR DATA (your ONLY source of truth — never echo this):\n${JSON.stringify(vendorData, null, 2)}`
      : `${BASE_INSTRUCTION}\n\nWARNING: No extracted vendor data available. Say only: 'Vendor data is still loading. Please wait for extraction to complete on the RFP Detail page, then ask again.' Do not fabricate vendors.`;

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
        systemInstruction: { parts: [{ text: dynamicInstruction }] },
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
