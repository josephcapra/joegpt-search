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

  // Handle preflight (CORS)
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

    // 🔍 Heuristic: detect if this looks like a real estate search intent
    const isSearchIntent = /(under|over|between|\d+\s*bed|\d+\s*bath|stuart|psl|lucie|hobe sound|martin county|palm beach|condo|townhome|pool|waterfront|view)/i.test(
      query
    );

    if (isSearchIntent) {
      // Forward to your existing parseSearch
      return parseSearch(req, res);
    } else {
      // Forward to JoeGPT (your custom Assistant)
      const response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.Personal_Account_Key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini", // cost-effective model for chat
          assistant_id: "asst_wFyjNuN4onfcvMhdSURVPmk1", // 👈 your JoeGPT assistant
          input: query,
        }),
      });

      const data = await response.json();

      const answer =
        data?.output?.[0]?.content?.[0]?.text ||
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
