export default async function handler(req, res) {
  // ✅ CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  try {
    const { url, filter, query } = req.body;

    // ✅ 1. Handle natural language queries via parseSearch
    if (query) {
      const parseResp = await fetch(`${process.env.BASE_URL || "https://joegpt-search.vercel.app"}/api/parseSearch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });

      if (!parseResp.ok) {
        return res.status(parseResp.status).json({ error: "parseSearch failed" });
      }

      const parsed = await parseResp.json();
      return res.status(200).json({
        filter: parsed.filter,
        realGeeksLink: parsed.realGeeksLink,
        answer: parsed.answer || `Here are homes matching: ${query}`,
      });
    }

    // ✅ 2. Handle URL-based normalization (fallback)
    let normalizedFilter = filter || {};
    let realGeeksLink = "https://www.paradiserealtyfla.com/";

    if (url) {
      // Example fallback: always Stuart if only URL provided
      normalizedFilter = {
        geography: { cities: ["Stuart"] },
        price: { min: 200000, max: 800000 },
      };
      realGeeksLink = "https://www.paradiserealtyfla.com/search/results/?city=Stuart&min=200000&max=800000";
    }

    if (filter) {
      const params = new URLSearchParams();

      if (filter.geography?.county) params.append("county", filter.geography.county);
      if (filter.geography?.cities?.length) params.append("city", filter.geography.cities.join(","));
      if (filter.price?.min) params.append("list_price_min", filter.price.min);
      if (filter.price?.max) params.append("list_price_max", filter.price.max);
      if (filter.interior?.minBeds) params.append("beds_min", filter.interior.minBeds);
      if (filter.interior?.minBaths) params.append("baths_min", filter.interior.minBaths);

      // Always exclude short sales & foreclosures
      params.append("short_sale", "false");
      params.append("foreclosure", "false");

      realGeeksLink = `https://www.paradiserealtyfla.com/search/results/?${params.toString()}`;
    }

    return res.status(200).json({
      filter: normalizedFilter,
      realGeeksLink,
      answer: "Here are listings based on your filter.",
    });
  } catch (err) {
    console.error("normalizeSearch error:", err);
    return res.status(500).json({ error: "Internal Server Error", details: err.message });
  }
}
