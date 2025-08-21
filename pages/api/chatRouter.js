import parseSearch from "./parseSearch";

function corsHeaders(origin) {
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Credentials": "true",
  };
}

export default async function handler(req, res) {
  const origin = req.headers.origin || "*";

  // --- Handle preflight ---
  if (req.method === "OPTIONS") {
    res.writeHead(200, corsHeaders(origin));
    return res.end();
  }

  if (req.method !== "POST") {
    res.writeHead(405, {
      "Content-Type": "application/json",
      ...corsHeaders(origin),
    });
    return res.end(JSON.stringify({ error: "Method not allowed. Use POST." }));
  }

  try {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ error: "Missing query" });
    }

    // ✅ Use JoeGPTWidget if present, else fallback to OPENAI_API_KEY
    const apiKey = process.env.JoeGPTWidget || process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error("❌ No API key found. Check Vercel env vars.");
      return res.status(500).json({
        error: "Missing API key",
        details: "Set JoeGPTWidget or OPENAI_API_KEY in Vercel Environment Variables",
      });
    }

    // 🔍 Detect if this looks like a home search query
    const isSearchIntent = /(under|over|between|\d+\s*bed|\d+\s*bath|stuart|psl|lucie|hobe sound|martin county|palm beach|condo|townhome|pool|waterfront|view)/i.test(
      query
    );

    if (isSearchIntent) {
      // Forward to parseSearch
      return parseSearch(req, res);
    } else {
      // Forward to JoeGPT (custom GPT)
      const response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini", // or gpt-5 if you prefer
          custom_gpt_id: "g-68a76e50d7c8819196925f7f44243a1e", // JoeGPT ID
          input: query,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("❌ OpenAI API error:", data);
        return res.status(500).json({
          error: "OpenAI API call failed",
          details: data,
        });
      }

      const answer =
        data.output?.[0]?.content?.[0]?.text ||
        data.choices?.[0]?.message?.content ||
        "Sorry, I couldn’t find an answer.";

      res.writeHead(200, {
        "Content-Type": "application/json",
        ...corsHeaders(origin),
      });
      return res.end(JSON.stringify({ answer }));
    }
  } catch (err) {
    console.error("chatRouter error:", err);
    res.writeHead(500, {
      "Content-Type": "application/json",
      ...corsHeaders(origin),
    });
    return res.end(
      JSON.stringify({ error: "chatRouter failed", details: err.message })
    );
  }
}
