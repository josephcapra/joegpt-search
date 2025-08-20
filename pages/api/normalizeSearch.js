// pages/api/normalizeSearch.js

export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  try {
    const { url, filter } = req.body;

    // If URL is passed, pretend we parse it into a filter
    let normalizedFilter = filter || {};
    let realGeeksLink = "https://www.paradiserealtyfla.com/";

    if (url) {
      // Example logic: (replace this with real parsing)
      normalizedFilter = {
        geography: { cities: ["Stuart"] },
        price: { min: 200000, max: 800000 },
      };
      realGeeksLink = `https://www.paradiserealtyfla.com/search/results/?city=Stuart&min=200000&max=800000`;
    }

    // If filter object exists, build a Real Geeks link
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

      realGeeksLink = `https://www.paradiserealtyfla.com/search/results/?${params.toString()}`;
    }

    return res.status(200).json({
      filter: normalizedFilter,
      realGeeksLink,
    });
  } catch (err) {
    console.error("normalizeSearch error:", err);
    return res.status(500).json({ error: "Internal Server Error", details: err.message });
  }
}
