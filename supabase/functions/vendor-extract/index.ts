const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const FIELD_LIST = [
  "Ocean Freight", "BAF", "THC Origin", "THC Destination", "Documentation", "BL+ISPS",
  "Total Rate/Ton", "Rate per Container", "Currency", "Rate Validity",
  "Vessel Name", "Vessel DWT", "Vessel Flag", "Laycan Start", "Laycan End",
  "Transit Time", "Load Rate (MT/day)", "Discharge Rate (MT/day)",
  "Free Days", "Demurrage Rate (PDPR)", "Dispatch Rate", "Laytime Allowance",
  "NOR Clause", "Payment Terms", "Volume Discount Threshold",
  "Fumigation Certificate (Y/N)", "Phytosanitary Certificate (Y/N)",
  "Hold Cleanliness Standard", "Stowage Factor", "Container Type/Count",
];

const EXTRACTION_PROMPT = `You are a charter party field extraction agent. Read the provided vendor file content and extract the 30 fields listed below. For each field, return a JSON object with: field_name, value, confidence (0-1), source_snippet (exact text from the file), source_location (page X, paragraph Y or cell reference), and notes (any caveats).

If a field is not found, return value="NOT_FOUND" and confidence=0.0.
If the source is a photo or scan, lower confidence by 0.2.
If the value is buried in a footnote or prose, lower confidence by 0.15 and note "buried in {location}".
Do not guess. Do not infer. Only extract what is explicitly stated.

If a vendor quotes an all-in rate without breaking out components, and the source is a Word document or prose format, estimate components as: Ocean Freight 75%, BAF 10%, THC Origin 5%, THC Dest 5%, Documentation 5% of total. Mark each estimated component with confidence 0.5 and note 'AI-estimated from all-in rate'.

THE 30 FIELDS:
Group 1 — Freight Components: Ocean Freight, BAF, THC Origin, THC Destination, Documentation, BL+ISPS, Total Rate/Ton, Rate per Container, Currency, Rate Validity
Group 2 — Vessel & Voyage: Vessel Name, Vessel DWT, Vessel Flag, Laycan Start, Laycan End, Transit Time, Load Rate (MT/day), Discharge Rate (MT/day)
Group 3 — Terms & Conditions: Free Days, Demurrage Rate (PDPR), Dispatch Rate, Laytime Allowance, NOR Clause, Payment Terms, Volume Discount Threshold
Group 4 — Compliance & Cargo: Fumigation Certificate (Y/N), Phytosanitary Certificate (Y/N), Hold Cleanliness Standard, Stowage Factor, Container Type/Count

Return ONLY a valid JSON array of 30 objects. No markdown, no explanation, just the JSON array.`;

interface ExtractedField {
  field_name: string;
  value: string;
  confidence: number;
  source_snippet: string;
  source_location: string;
  notes: string;
}

function notFoundFields(): ExtractedField[] {
  return FIELD_LIST.map((name) => ({
    field_name: name,
    value: "NOT_FOUND",
    confidence: 0.0,
    source_snippet: "",
    source_location: "",
    notes: "Extraction failed — file could not be fetched or parsed",
  }));
}

async function getApiKey(): Promise<string | null> {
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
    const body = await req.json();
    const { vendorId, vendorName, fileContent, fileType } = body as {
      vendorId: string;
      vendorName: string;
      fileContent: string;
      fileType: "csv" | "pdf" | "docx" | "jpg" | "txt";
    };

    if (!vendorId || !fileContent) {
      return new Response(
        JSON.stringify({ error: "vendorId and fileContent are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiKey = await getApiKey();
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "Gemini API key not configured on the server." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // For text-based files (CSV, TXT), fileContent is the raw text
    // For binary files (PDF, DOCX, JPG), fileContent is a base64 string
    const isText = fileType === "csv" || fileType === "txt";

    let parts: object[];

    if (isText) {
      parts = [
        { text: `${EXTRACTION_PROMPT}\n\n--- FILE CONTENT (${fileType.toUpperCase()}) ---\n${fileContent}` },
      ];
    } else {
      const mimeTypeMap: Record<string, string> = {
        pdf: "application/pdf",
        docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        jpg: "image/jpeg",
      };
      parts = [
        { text: EXTRACTION_PROMPT },
        { inline_data: { mime_type: mimeTypeMap[fileType] ?? "application/octet-stream", data: fileContent } },
      ];
    }

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${apiKey}`;

    // Retry on 503 (model overloaded) — up to 2 retries with backoff
    let response: Response;
    let lastError = "";
    for (let attempt = 0; attempt < 3; attempt++) {
      response = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 4096,
          },
        }),
      });
      if (response.ok) break;
      if (response.status === 503 && attempt < 2) {
        await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
        continue;
      }
      const errText = await response.text();
      lastError = `Gemini error (${response.status}): ${errText}`;
      break;
    }

    if (!response!.ok) {
      return new Response(
        JSON.stringify({ error: lastError, vendorId, vendorName, fields: notFoundFields(), extracted: false }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      return new Response(
        JSON.stringify({ vendorId, vendorName, fields: notFoundFields(), extracted: false }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let jsonText = rawText.trim();
    if (jsonText.startsWith("```")) {
      jsonText = jsonText.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
    }

    let fields: ExtractedField[];
    try {
      fields = JSON.parse(jsonText);
      if (!Array.isArray(fields)) throw new Error("not array");
    } catch {
      return new Response(
        JSON.stringify({ vendorId, vendorName, fields: notFoundFields(), extracted: false, parseError: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ vendorId, vendorName, fields, extracted: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
