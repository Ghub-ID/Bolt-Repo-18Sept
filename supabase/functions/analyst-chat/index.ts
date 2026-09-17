const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SYSTEM_INSTRUCTION = `You are FreightIQ's Freight Analyst AI. You help procurement buyers analyze vendor bids for ocean freight RFPs.

You will receive extracted vendor data as a JSON block wrapped between [VENDOR_DATA_START] and [VENDOR_DATA_END] tags in the first user message. Use ONLY that JSON to answer questions. Never make up data that isn't in the JSON.

RESPONSE RULES:
- Be concise and direct. Use tables when comparing multiple vendors.
- Always mention confidence level and caveats when citing rates.
- If a vendor has free_days below 14, flag the detention risk explicitly.
- If a vendor has currency 'USD', flag the conversion risk.
- If the user sets a filter (e.g. 'past vendors only'), maintain it until changed.
- Process action commands: 'approve [vendor]', 'decline [vendor] because [reason]', 'send clarification to [vendor] about [topic]'. Confirm each action.
- When recommending, explain the trade-off clearly.
- Format currency as ₹ with Indian number notation.

SCENARIO ANALYSIS:
When the user asks a scenario question (split award, demurrage cost, filter combinations), filter vendors per constraints, calculate total cost at specified demurrage hours, and return a ranked table with columns: Combination, Total Cost, Risk Notes, Recommendation.

QUESTIONNAIRE HANDLING:
When asked about questionnaire compliance, show a table with: Vendor, Questions passed (X/8), Missing questions, Risk implication.

Always cite: (a) the field, (b) the source format, (c) the confidence level.
If the vendor data block is empty or missing, respond: 'Vendor data is not yet available. Please wait for extraction to complete on the RFP Detail page, then try again.'`;

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

    const contents = messages.map((msg: { role: string; text: string }, i: number) => {
      const role = msg.role === "user" ? "user" : "model";
      let text = msg.text;

      if (i === 0 && role === "user" && vendorData && Object.keys(vendorData).length > 0) {
        text = `[VENDOR_DATA_START]\n${JSON.stringify(vendorData, null, 2)}\n[VENDOR_DATA_END]\n\n${text}`;
      }

      return { role, parts: [{ text }] };
    });

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
