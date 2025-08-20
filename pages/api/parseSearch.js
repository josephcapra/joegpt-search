// pages/api/normalSearch.js
import OpenAI from "openai";

export default async function handler(req, res) {
  // ✅ CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  try {
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY, // 🔑 set in Vercel
    });

    const { url, filter, query } = req.body;

    let normalizedFilter = filter || {};
    let realGeeksLink = "https://www.paradiserealtyfla.com/";

    // 1️⃣ If query (natural language) is passed → use GPT to parse
    if (query && !filter) {
      const completion = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are JoeGPT, a real estate assistant. Parse natural language into structured JSON filters with keys: geography (cities, county), price (min, max), beds (min, max), baths (min, max).",
          },
          { role: "user", content: query },
        ],
        response_format: { type: "json_object" },
      });

      normalizedFilter = JSON.parse(
        completion.choices[0].message.content
      );
    }

    // 2️⃣ If URL provided → pretend parse (sample logic)
    if (url && !filter && !query) {
      normalizedFilter = {
        geography: { cities: ["Stuart"] },
        price: { min: 200000, max: 800000 },
      };
    }

    // 3️⃣ Build Real Geeks link from filter
    if (normalizedFilter) {
      const params = new URLSearchParams();

      if (normalizedFilter.geography?.county) {
        params.append("county", normalizedFilter.geography.county);
      }
      if (normalizedFilter.geography?.cities?.length) {
        params.append("cities", normalizedFilter.geography.cities.join(","));
      }
      if (normalizedFilter.price?.min) {
        params.append("min_price", normalizedFilter.price.min);
      }
      if (normalizedFilter.price?.max) {
        params.append("max_price", normalizedFilter.price.max);
      }
      if (normalizedFilter.beds?.min) {
        params.append("beds_min", normalizedFilter.beds.min);
      }
      if (normalizedFilter.beds?.max) {
        params.append("beds_max", normalizedFilter.beds.max);
      }
      if (normalizedFilter.baths?.min) {
        params.append("baths_min", normalizedFilter.baths.min);
      }
      if (normalizedFilter.baths?.max) {
        params.append("baths_max", normalizedFilter.baths.max);
      }

      realGeeksLink = `https://www.paradiserealtyfla.com/search/results/?${params.toString()}`;
    }

    // ✅ Return both
    return res.status(200).json({
      filter: normalizedFilter,
      realGeeksLink,
    });
  } catch (err) {
    console.error("normalSearch error:", err);
    return res
      .status(500)
      .json({ error: "Internal Server Error", details: err.message });
  }
}

