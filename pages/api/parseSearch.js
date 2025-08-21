// pages/api/parseSearch.js

export default async function handler(req, res) {
  // ✅ Allow CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ error: "Missing query" });
    }

    console.log("🔍 Incoming query:", query);

    // --- STEP 1: Ask GPT to parse into filters ---
    const gptPrompt = `
You are a real estate search parser.
Convert this query into structured JSON with fields:
geography, price, beds, baths, pool, yearBuilt, waterfront, hoa, etc.

Example:
{"geography":{"cities":["Hobe Sound"]},"price":{"max":600000},"beds":{"min":3},"booleans":{"pool":true}}

User query: "${query}"
`;

    let filter;
    try {
      const gptResp = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: "You convert natural language into Real Geeks filters." },
            { role: "user", content: gptPrompt },
          ],
          temperature: 0,
        }),
      });

      const gptData = await gptResp.json();
      const raw = gptData.choices?.[0]?.message?.content || "{}";

      console.log("📝 GPT raw output:", raw);

      filter = JSON.parse(raw);
    } catch (err) {
      console.error("❌ GPT parse error:", err);
      filter = null;
    }

    // --- STEP 2: Build Real Geeks link ---
    let realGeeksLink = "https://www.paradiserealtyfla.com/search/results/?";

    if (filter) {
      const params = new URLSearchParams();

      if (filter.geography?.county) {
        params.append("county", filter.geography.county);
      }
      if (filter.geography?.cities?.length) {
        params.append("city", filter.geography.cities.join(","));
      }
      if (filter.price?.min) {
        params.append("list_price_min", filter.price.min);
      }
      if (filter.price?.max) {
        params.append("list_price_max", filter.price.max);
      }
      if (filter.beds?.min) {
        params.append("beds_min", filter.beds.min);
      }
      if (filter.baths?.min) {
        params.append("baths_min", filter.baths.min);
      }
      if (filter.booleans?.pool) {
        params.append("pool", "true");
      }
      if (filter.yearBuilt?.min) {
        params.append("year_built_min", filter.yearBuilt.min);
      }
      if (filter.waterfront) {
        params.append("waterfront", filter.waterfront);
      }
      if (filter.hoa?.maxFee) {
        params.append("hoa_fee_max", filter.hoa.maxFee);
      }

      realGeeksLink += params.toString();
    } else {
      console.warn("⚠️ GPT failed — using fallback link.");
      realGeeksLink += "city=Stuart&list_price_max=800000&beds_min=3";
    }

    console.log("✅ Built Real Geeks link:", realGeeksLink);

    // --- STEP 3: Return response ---
    return res.status(200).json({
      filter: filter || {},
      realGeeksLink,
    });
  } catch (err) {
    console.error("🔥 parseSearch fatal error:", err);
    return res.status(500).json({
      error: "parseSearch failed",
      details: err.message,
    });
  }
}
