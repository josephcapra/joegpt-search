// pages/api/parseSearch.js

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ error: "Missing query" });
    }

    const q = query.toLowerCase();
    const params = new URLSearchParams();
    const filter = {};

    // ---- Location ----
    if (q.includes("hobe sound")) {
      params.append("city", "Hobe Sound");
      filter.city = "Hobe Sound";
    }
    if (q.includes("stuart")) {
      params.append("city", "Stuart");
      filter.city = "Stuart";
    }
    if (q.includes("port st lucie") || q.includes("psl")) {
      params.append("city", "Port St. Lucie");
      filter.city = "Port St. Lucie";
    }
    if (q.includes("martin county")) {
      params.append("county", "Martin");
      filter.county = "Martin";
    }
    if (q.includes("st lucie county")) {
      params.append("county", "St. Lucie");
      filter.county = "St. Lucie";
    }
    if (q.includes("palm beach")) {
      params.append("county", "Palm Beach");
      filter.county = "Palm Beach";
    }

    // ---- Price ----
    const underMatch = q.match(/under\s*\$?(\d+[kKmM]?)/);
    if (underMatch) {
      let val = underMatch[1];
      if (val.toLowerCase().endsWith("k")) val = parseInt(val) * 1000;
      if (val.toLowerCase().endsWith("m")) val = parseInt(val) * 1000000;
      params.append("list_price_max", val);
      filter.priceMax = val;
    }

    const overMatch = q.match(/over\s*\$?(\d+[kKmM]?)/);
    if (overMatch) {
      let val = overMatch[1];
      if (val.toLowerCase().endsWith("k")) val = parseInt(val) * 1000;
      if (val.toLowerCase().endsWith("m")) val = parseInt(val) * 1000000;
      params.append("list_price_min", val);
      filter.priceMin = val;
    }

    // ---- Bedrooms ----
    const bedMatch = q.match(/(\d+)\s*(bed|bedroom)/);
    if (bedMatch) {
      params.append("beds_min", bedMatch[1]);
      filter.beds = bedMatch[1];
    }

    // ---- Bathrooms ----
    const bathMatch = q.match(/(\d+)\s*(bath|bathroom)/);
    if (bathMatch) {
      params.append("baths_min", bathMatch[1]);
      filter.baths = bathMatch[1];
    }

    // ---- Pool ----
    if (q.includes("pool")) {
      params.append("pool", "True");
      filter.pool = true;
    }

    // ---- Year Built ----
    const yearMatch = q.match(/(after|since|built in|built after)\s*(\d{4})/);
    if (yearMatch) {
      params.append("year_built_min", yearMatch[2]);
      filter.yearBuiltMin = yearMatch[2];
    }

    // ---- Views ----
    if (q.includes("water view") || q.includes("waterfront")) {
      params.append("waterfront", "True");
      filter.waterfront = true;
    }
    if (q.includes("ocean view")) {
      params.append("view", "Ocean");
      filter.view = "Ocean";
    }
    if (q.includes("golf view") || q.includes("on golf")) {
      params.append("view", "Golf Course");
      filter.view = "Golf Course";
    }

    // ---- Property Types ----
    if (q.includes("condo")) {
      params.append("type", "con");
      filter.type = "Condo";
    }
    if (q.includes("townhome") || q.includes("townhouse")) {
      params.append("type", "twn");
      filter.type = "Townhome";
    }
    if (q.includes("land") || q.includes("lot")) {
      params.append("type", "lnd");
      filter.type = "Land";
    }
    if (q.includes("multi") || q.includes("duplex")) {
      params.append("type", "mul");
      filter.type = "Multi-family";
    }

    // ✅ Final Real Geeks link
    const realGeeksLink = `https://www.paradiserealtyfla.com/search/results/?${params.toString()}`;

    return res.status(200).json({ filter, realGeeksLink });

  } catch (err) {
    console.error("parseSearch error:", err);
    return res.status(500).json({ error: "parseSearch failed", details: err.message });
  }
}
