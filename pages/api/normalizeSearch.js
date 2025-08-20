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

    // 🔑 Vercel bypass token
    const BYPASS_TOKEN =
      process.env.VERCEL_AUTOMATION_BYPASS_SECRET ||
      "ZG3ivryl8xOd10sLUNzWmadRKYY1ciAD";

    // ✅ Fallback ParadiseRealtyFLA link
    let realGeeksLink = "https://www.paradiserealtyfla.com/";

    if (url) {
      normalizedFilter = {
        geography: { cities: ["Stuart"] },
        price: { min: 200000, max: 800000 },
      };
      realGeeksLink =
        "https://www.paradiserealtyfla.com/search/results/?city=Stuart&min=200000&max=800000";
    }

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

      realGeeksLink = `https://www.paradiserealtyfla.com/search/results/?${params.toString()}`;
    }

    // ✅ Fetch live MLS data from joegpt-search with bypass token
    const upstreamUrl =
      `https://joegpt-search-joe-1761s-projects.vercel.app/api/normalizeSearch` +
      `?x-vercel-set-bypass-cookie=true` +
      `&x-vercel-protection-bypass=${BYPASS_TOKEN}`;

    const upstreamResp = await fetch(upstreamUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, filter }),
    });

    let upstreamData = {};
    if (upstreamResp.ok) {
      upstreamData = await upstreamResp.json();
    } else {
      console.warn("Upstream normalizeSearch failed:", upstreamResp.status);
    }

    // ✅ Merge upstream link if available (canonical link always upstream’s)
    const mergedLink = upstreamData.realGeeksLink || realGeeksLink;

    return res.status(200).json({
      filter: upstreamData.filter || normalizedFilter,
      realGeeksLink: mergedLink,
      results: upstreamData.results || upstreamData.data || null,
    });
  } catch (err) {
    console.error("normalizeSearch error:", err);
    return res
      .status(500)
      .json({ error: "Internal Server Error", details: err.message });
  }
}
