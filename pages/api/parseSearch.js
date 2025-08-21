export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ error: "Missing query" });
    }

    // 🔑 Call OpenAI to parse query into structured filter
    const openaiResp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a real estate assistant. Convert user requests into JSON filters that follow this Real Geeks search logic:

- Location: county, city, subdivision
- Property types: single_family, condo, townhouse, land, multi_res
- Price: min and max
- Interior: minSqft, minBeds, minBaths
- Acres: min, max
- Year built: min, max
- Booleans: pool, shortSale, foreclosure, seniorCommunity, hoaRequired, membershipPurchaseRequired
- HOA: minFee, maxFee, includes (list of strings like "Pool(s)", "Security", etc.)
- Garage: minSpaces, maxSpaces
- Views: Bay, Canal, Golf Course, etc.
- Roofs: Tile, Shingle, Metal, etc.
- LotDimensions: "1/4 Acre", "Corner Lot", etc.
- Waterfronts: Canal Front, Ocean Access, River Front, etc.

Rules:
- Use OR when multiple values for same field.
- Use AND across different fields.
- Always exclude shortSale and foreclosure by default.
- If something isn’t mentioned, don’t include it.
Output ONLY valid JSON, no explanation.`
          },
          { role: "user", content: `Query: ${query}` }
        ],
        temperature: 0,
      }),
    });

    const data = await openaiResp.json();
    let filter;
    try {
      filter = JSON.parse(data.choices[0].message.content);
    } catch (e) {
      return res.status(500).json({ error: "Failed to parse OpenAI response", details: data });
    }

    // ✅ Build ParadiseRealtyFLA URL
    const params = new URLSearchParams();

    // Location
    if (filter.geography?.county) params.append("county", filter.geography.county);
    if (filter.geography?.cities?.length) params.append("city", filter.geography.cities.join(","));
    if (filter.geography?.subdivisions?.length) params.append("subdivision", filter.geography.subdivisions.join(","));

    // Property types
    if (filter.types?.length) {
      filter.types.forEach(t => {
        if (t === "single_family") params.append("type", "res");
        if (t === "condo") params.append("type", "con");
        if (t === "townhouse") params.append("type", "twn");
        if (t === "land") params.append("type", "lnd");
        if (t === "multi_res") params.append("type", "mul");
      });
    }

    // Price & interior
    if (filter.price?.min) params.append("list_price_min", filter.price.min);
    if (filter.price?.max) params.append("list_price_max", filter.price.max);
    if (filter.interior?.minSqft) params.append("area_min", filter.interior.minSqft);
    if (filter.interior?.minBeds) params.append("beds_min", filter.interior.minBeds);
    if (filter.interior?.minBaths) params.append("baths_min", filter.interior.minBaths);

    // Year built
    if (filter.yearBuilt?.min) params.append("year_built_min", filter.yearBuilt.min);
    if (filter.yearBuilt?.max) params.append("year_built_max", filter.yearBuilt.max);

    // Pool & statuses
    if (filter.booleans?.pool) params.append("pool", "true");
    params.append("short_sale", "false");
    params.append("foreclosure", "false");

    // HOA
    if (filter.booleans?.hoaRequired) params.append("hoa_yn", "true");
    if (filter.hoa?.minFee) params.append("hoa_fee_min", filter.hoa.minFee);
    if (filter.hoa?.maxFee) params.append("hoa_fee_max", filter.hoa.maxFee);

    // Views
    if (filter.views?.length) filter.views.forEach(v => params.append("view", v));

    // Roofs
    if (filter.roofs?.length) filter.roofs.forEach(r => params.append("roof", r));

    // Lot dimensions
    if (filter.lotDimensions?.length) filter.lotDimensions.forEach(ld => params.append("lot_dimensions", ld));

    // Waterfronts
    if (filter.waterfronts?.length) filter.waterfronts.forEach(w => params.append("waterfront", w));

    const realGeeksLink = `https://www.paradiserealtyfla.com/search/results/?${params.toString()}`;

    // ✅ Respond with filter, link, and summary
    res.status(200).json({
      filter,
      realGeeksLink,
      answer: `Here are homes matching your request: ${query}`,
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal Server Error", details: err.message });
  }
}
