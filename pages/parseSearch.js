// pages/api/parseSearch.js
import OpenAI from "openai";

export default async function handler(req, res) {
  // ✅ Enable CORS
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
      apiKey: process.env.OPENAI_API_KEY, // ✅ stored in Vercel
    });

    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ error: "Missing query in request body." });
    }

    // 🔎 Ask GPT to turn user query into a structured filter
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
      response_format: { type: "json_object" }, // ✅ force JSON
    });

    // Extract GPT output
    const parsed = JSON.parse(completion.choices[0].message.content);

    // Build a Real Geeks link from parsed filter
    const params = new URLSearchParams();
    if (parsed.geography?.cities?.length) {
      params.append("cities", parsed.geography.cities.join(","));
    }
    if (parsed.geography?.county) {
      params.append("county", parsed.geography.county);
    }
    if (parsed.price?.min) {
      params.append("min_price", parsed.price.min);
    }
    if (parsed.price?.max) {
      params.append("max_price", parsed.price.max);
    }
    if (parsed.beds?.min) {
      params.append("beds_min", parsed.beds.min);
    }
    if (parsed.beds?.max) {
      params.append("beds_max", parsed.beds.max);
    }
    if (parsed.baths?.min) {
      params.append("baths_min", parsed.baths.min);
    }
    if (parsed.baths?.max) {
      params.append("baths_max", parsed.baths.max);
    }

    const realGeeksLink = `https://www.paradiserealtyfla.com/search/results/?${params.toString()}`;

    return res.status(200).json({
      filter: parsed,
      realGeeksLink,
    });
  } catch (err) {
    console.error("parseSearch error:", err);
    return res
      .status(500)
      .json({ error: "Internal Server Error", details: err.message });
  }
}
