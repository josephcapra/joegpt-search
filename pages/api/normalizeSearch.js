// pages/api/normalizeSearch.js

export default async function handler(req, res) {
  // ✅ Allow cross-origin
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  try {
    const { url, filter } = req.body;

    let normalizedFilter = filter || {};
    let realGeeksLink = "https://www.paradiserealtyfla.com/";

    // 🔑 Inject Vercel bypass token
    const BYPASS_TOKEN =
      process.env.VERCEL_AUTOMATION_BYPASS_SECRET ||
      "ZG3ivryl8xOd10sLUNzWmadRKYY1ciAD";

    // If URL provided
    if (url) {
      normalizedFilter = {
        geography: { cities: ["Stuart"] },
        price: { min: 200000, max: 800000 },
      };

      realGeeksLink = `https://joegpt-search-joe-1761s-projects.vercel.app/api/normalizeSearch` +
        `?x-vercel-set-bypass-cookie=true` +
        `&x-vercel-protection-bypass=${BYPASS_TOKEN}`;
    }

    // If filter provided
    if (filter) {
      const params = new URLSearchParams();

      if (filter.geography?.county) {
        params.append("county", filter.geography.county);
      }
      if (filter.geography?.cities?.length) {
        params.append("cities", filter.geography.cities.join(","));
      }
      if (filter.price?.min) {
        params.append("min_price", filter.price.min);
      }
      if (filter.price?.max) {
        params.append("max_price", filter.price.max);
      }
      if (filter.beds?.min) {
        params.append("beds_min", filter.beds.min);
      }
      if (filter.beds?.max) {
        params.append("beds_max", filter.beds.max);
      }

      // ✅ Always attach bypass token when proxying to ParadiseRealtyFLA
      realGeeksLink =
        `https://www.paradiserealtyfla.com/search/results/?${params.toString()}` +
        `&x-vercel-set-bypass-cookie=true&x-vercel-protection-bypass=${BYPASS_TOKEN}`;
    }

    return res.status(200).json({
      filter: normalizedFilter,
      realGeeksLink,
    });
  } catch (err) {
    console.error("normalizeSearch error:", err);
    return res
      .status(500)
      .json({ error: "Internal Server Error", details: err.message });
  }
}
