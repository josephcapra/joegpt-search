// pages/api/chatRouter.js
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

    // 🔍 Detect if this looks like a home search
    const isSearchIntent = /(under|over|between|\d+\s*bed|\d+\s*bath|stuart|psl|lucie|hobe sound|martin county|palm beach|condo|townhome|pool|waterfront|view)/i.test(
      query
    );

    if (isSearchIntent) {
      // Forward to your existing parseSearch
      return parseSearch(req, res);
    } else {
      // ✅ Call JoeGPT via Responses API using JoeGPTWidget key
      const response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.JoeGPTWidget}`, // 👈 updated here
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini", // or "gpt-5" if enabled
          custom_gpt_id: "g-68a76e50d7c8819196925f7f44243a1e", // ✅ Your team JoeGPT ID
          input: query,
        }),
      });

      const data = await response.json();
      console.log("JoeGPT API response:", data); // Debug logs in Vercel

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
