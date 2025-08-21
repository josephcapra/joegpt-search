// pages/api/parseSearch.js

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
    if (underMatch && underMatch[1]) {
      let val = underMatch[1];
      if (typeof val === "string") {
        if (val.toLowerCase().endsWith("k")) val = parseInt(val) * 1000;
        else if (val.toLowerCase().endsWith("m")) val = parseInt(val) * 1000000;
        else val = parseInt(val);
      }
      if (!isNaN(val)) {
        params.append("list_price_max", val);
        filter.priceMax = val;
      }
    }

    const overMatch = q.match(/over\s*\$?(\d+[kKmM]?)/);
    if (overMatch && overMatch[1]) {
      let val = overMatch[1];
      if (typeof val === "string") {
        if (val.toLowerCase().endsWith("k")) val = parseInt(val) * 1000;
        else if (val.toLowerCase().endsWith("m")) val = parseInt(val) * 1000000;
        else val = parseInt(val);
      }
      if (!isNaN(val)) {
        params.append("list_price_min", val);
        filter.priceMin = val;
      }
    }

    // ---- Bedrooms ----
    const bedMatch = q.match(/(\d+)\s*(bed|bedroom)/);
    if (bedMatch && bedMatch[1]) {
      const beds = parseInt(bedMatch[1]);
      if (!isNaN(beds)) {
        params.append("beds_min", beds);
        filter.beds = beds;
      }
    }

    // ---- Bathrooms ----
    const bathMatch = q.match(/(\d+)\s*(bath|bathroom)/);
    if (bathMatch && bathMatch[1]) {
      const baths = parseInt(bathMatch[1]);
      if (!isNaN(baths)) {
        params.append("baths_min", baths);
        filter.baths = baths;
      }
    }

    // ---- Pool ----
    if (q.includes("pool")) {
      params.append("pool", "True");
      filter.pool = true;
    }

    // ---- Year Built ----
    const yearMatch = q.match(/(after|since|built in|built after)\s*(\d{4})/);
    if (yearMatch && yearMatch[2]) {
      const year = parseInt(yearMatch[2]);
      if (!isNaN(year)) {
        params.append("year_built_min", year);
        filter.yearBuiltMin = year;
      }
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

    // ✅ Decide final link
    let realGeeksLink;
    let message;

    if (Object.keys(filter).length === 0) {
      // No useful filters → send to advanced search
      realGeeksLink = "https://www.paradiserealtyfla.com/search/advanced_search/";
      message =
        "I couldn’t find an exact match for what you typed 🤔. No worries though — try the Advanced Search tool where you can customize your search a little better!";
    } else {
      // Normal case
      realGeeksLink = `https://www.paradiserealtyfla.com/search/results/?${params.toString()}`;
      message =
        "Here are the closest matches I could find based on your search ✅";
    }

    res.writeHead(200, {
      "Content-Type": "application/json",
      ...corsHeaders(origin),
    });
    return res.end(JSON.stringify({ filter, realGeeksLink, message }));
  } catch (err) {
    console.error("parseSearch error:", err);
    res.writeHead(500, {
      "Content-Type": "application/json",
      ...corsHeaders(origin),
    });
    return res.end(
      JSON.stringify({ error: "parseSearch failed", details: err.message })
    );
  }
}

