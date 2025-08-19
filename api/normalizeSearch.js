const BASE = process.env.REALGEEKS_SEARCH_BASE || "https://paradiserealtyfla.realgeeks.com/search/results/";

// ---------------- Helpers ----------------
function asBool(v) {
  if (v === undefined || v === null) return null;
  if (typeof v === "boolean") return v;
  const s = String(v).toLowerCase();
  if (["1", "true", "yes"].includes(s)) return true;
  if (["0", "false", "no"].includes(s)) return false;
  return null;
}
function asNum(v) {
  if (v === undefined || v === null) return null;
  const s = String(v).toLowerCase();
  if (s === "all" || s === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
function fixLabel(s) {
  if (s == null) return s;
  return String(s)
    .replace(/intercoastal/gi, "Intracoastal")
    .replace(/Pool\(s\)/gi, "Pool")
    .replace(/\s+/g, " ")
    .trim();
}

const typeMap = { res: "single_family", con: "condo", twn: "townhouse", land: "land", "multi-res": "multi_res" };
const revTypeMap = { single_family: "res", condo: "con", townhouse: "twn", land: "land", multi_res: "multi-res" };

function toArraySearch(params, key) {
  const vals = params.getAll(key);
  return vals.map(decodeURIComponent).map(fixLabel);
}

// ---------------- Parse RealGeeks URL into Filter ----------------
function parseRealGeeksUrl(url) {
  const u = new URL(url);
  const q = u.searchParams;
  const types = q.getAll("type").map(t => typeMap[t] || t).filter(Boolean);

  const cityParam = q.get("city");
  const subParam = q.get("subdivision");

  const filter = {
    geography: {
      county: q.get("county") || undefined,
      cities: cityParam && cityParam.toLowerCase() !== "all" ? [cityParam] : null,
      subdivisions: subParam && subParam.toLowerCase() !== "all" ? [subParam] : null,
    },
    types: types.length ? types : undefined,
    price: { min: asNum(q.get("list_price_min")), max: asNum(q.get("list_price_max")) },
    interior: {
      minSqft: asNum(q.get("area_min")),
      minBeds: asNum(q.get("beds_min")),
      minBaths: asNum(q.get("baths_min"))
    },
    lot: { minAcres: asNum(q.get("acres_min")), lotDimensions: q.get("lot_dimensions") ?? null },
    yearBuilt: { min: asNum(q.get("year_built_min")) },
    booleans: {
      pool: asBool(q.get("pool")),
      shortSale: asBool(q.get("short_sale")),
      foreclosure: asBool(q.get("foreclosure")),
      seniorCommunity: asBool(q.get("senior_community_yn")),
      hoaRequired: asBool(q.get("hoa_yn")),
      membershipPurchaseRequired: asBool(q.get("membership_purch_rqd")),
    },
    hoa: {
      minFee: asNum(q.get("hoa_fee_min")),
      maxFee: asNum(q.get("hoa_fee_max")),
      includes: q.getAll("hoa_fee_includes").map(fixLabel),
    },
    garage: { minSpaces: asNum(q.get("garage_spaces_min")), maxSpaces: asNum(q.get("garage_spaces_max")) },
    views: toArraySearch(q, "view"),
    roofs: toArraySearch(q, "roof"),
    waterfronts: toArraySearch(q, "waterfront"),
  };

  filter.derived = {
    wantsWater: (filter.waterfronts && filter.waterfronts.length > 0) ||
      (filter.views && filter.views.some(v => /bay|canal|lake|ocean|river|water/i.test(v))) || false
  };

  // Sanity for ranges
  if (filter.price?.min != null && filter.price?.max != null && filter.price.min > filter.price.max) {
    const t = filter.price.min; filter.price.min = filter.price.max; filter.price.max = t;
  }
  if (filter.hoa?.minFee != null && filter.hoa?.maxFee != null && filter.hoa.minFee > filter.hoa.maxFee) {
    const t = filter.hoa.minFee; filter.hoa.minFee = filter.hoa.maxFee; filter.hoa.maxFee = t;
  }
  return filter;
}

// ---------------- Convert Filter to RealGeeks URL ----------------
function toRealGeeksUrl(base, f) {
  const q = new URLSearchParams();
  if (f.geography?.county) q.set("county", f.geography.county);
  q.set("city", f.geography?.cities?.[0] ?? "all");
  q.set("subdivision", f.geography?.subdivisions?.[0] ?? "all");

  (f.types ?? []).forEach(t => q.append("type", revTypeMap[t] || t));

  if (f.price) {
    if (f.price.min != null) q.set("list_price_min", String(f.price.min));
    q.set("list_price_max", f.price.max != null ? String(f.price.max) : "all");
  }
  if (f.interior?.minSqft != null) q.set("area_min", String(f.interior.minSqft));
  if (f.lot?.minAcres != null) q.set("acres_min", String(f.lot.minAcres));
  if (f.interior?.minBeds != null) q.set("beds_min", String(f.interior.minBeds));
  if (f.interior?.minBaths != null) q.set("baths_min", String(f.interior.minBaths));
  if (f.yearBuilt?.min != null) q.set("year_built_min", String(f.yearBuilt.min));

  const setBool = (k, v) => { if (v === true || v === false) q.set(k, String(v)); };
  setBool("senior_community_yn", f.booleans?.seniorCommunity);
  setBool("pool", f.booleans?.pool);
  setBool("short_sale", f.booleans?.shortSale);
  setBool("foreclosure", f.booleans?.foreclosure);
  setBool("hoa_yn", f.booleans?.hoaRequired);
  if (f.hoa?.minFee != null) q.set("hoa_fee_min", String(f.hoa.minFee));
  if (f.hoa?.maxFee != null) q.set("hoa_fee_max", String(f.hoa.maxFee));
  (f.hoa?.includes ?? []).forEach(v => q.append("hoa_fee_includes", v));

  if (f.garage?.minSpaces != null) q.set("garage_spaces_min", String(f.garage.minSpaces));
  if (f.garage?.maxSpaces != null) q.set("garage_spaces_max", String(f.garage.maxSpaces));
  setBool("membership_purch_rqd", f.booleans?.membershipPurchaseRequired);

  (f.views ?? []).forEach(v => q.append("view", v));
  (f.roofs ?? []).forEach(v => q.append("roof", v));
  (f.waterfronts ?? []).forEach(v => q.append("waterfront", v));

  q.set("lot_dimensions", f.lot?.lotDimensions ?? "all");
  return `${base}?${q.toString()}`;
}

// ---------------- Convert Filter to Backend Query ----------------
function toBackendQuery(f) {
  const must = [];
  const should = [];
  const filter = [];

  const pushRange = (field, gte, lte) => {
    const r = {};
    if (gte != null) r.gte = gte;
    if (lte != null) r.lte = lte;
    if (Object.keys(r).length) filter.push({ range: { [field]: r } });
  };
  const pushTerm = (field, v) => { if (v !== null && v !== undefined) filter.push({ term: { [field]: v } }); };
  const pushTerms = (field, arr) => { if (arr && arr.length) filter.push({ terms: { [field]: arr } }); };

  if (f.geography?.county) pushTerm("county", f.geography.county);
  if (f.geography?.cities?.length) pushTerms("city", f.geography.cities);
  if (f.geography?.subdivisions?.length) pushTerms("subdivision", f.geography.subdivisions);

  if (f.types?.length) pushTerms("property_type", f.types);

  pushRange("list_price", f.price?.min ?? null, f.price?.max ?? null);
  if (f.interior?.minSqft != null) pushRange("sqft", f.interior.minSqft, null);
  if (f.interior?.minBeds != null) pushRange("beds", f.interior.minBeds, null);
  if (f.interior?.minBaths != null) pushRange("baths", f.interior.minBaths, null);
  if (f.lot?.minAcres != null) pushRange("acres", f.lot.minAcres, null);
  if (f.yearBuilt?.min != null) pushRange("year_built", f.yearBuilt.min, null);

  const b = f.booleans || {};
  pushTerm("pool", b.pool);
  pushTerm("is_short_sale", b.shortSale);
  pushTerm("is_foreclosure", b.foreclosure);
  pushTerm("senior_community", b.seniorCommunity);
  pushTerm("hoa_required", b.hoaRequired);
  pushTerm("membership_purchase_required", b.membershipPurchaseRequired);

  pushRange("hoa_fee", f.hoa?.minFee ?? null, f.hoa?.maxFee ?? null);
  if (f.hoa?.includes?.length) pushTerms("hoa.includes", f.hoa.includes);

  pushTerms("view", f.views);
  pushTerms("roof", f.roofs);
  pushTerms("waterfront", f.waterfronts);

  if (f.derived?.wantsWater) should.push({ term: { has_water_view: true } });

  return { query: { bool: { must, filter, should, minimum_should_match: should.length ? 1 : 0 } } };
}

// ---------------- Natural Text Parser ----------------
function parseNaturalText(text) {
  const lower = text.toLowerCase();

  // Detect property type
  let type = "single_family";
  if (/\bcondo(s)?\b/.test(lower)) type = "condo";
  if (/\btownhome(s)?\b|\btownhouse(s)?\b/.test(lower)) type = "townhouse";
  if (/\bland\b/.test(lower)) type = "land";
  if (/\bmulti[- ]?res(idential)?\b/.test(lower)) type = "multi_res";

  // Extract city name
  let cityMatch = text.match(/in ([a-z\s]+?)(?: homes| houses| condos| townhomes| townhouses| land|$)/i);
  const city = cityMatch ? cityMatch[1].trim().replace(/\b\w/g, c => c.toUpperCase()) : null;

  // Extract price range
  let priceMatch = text.match(/(\d+)[kK]?\s*[-to]+\s*(\d+)[kK]?/);
  let maxMatch = text.match(/under\s*(\d+)[kK]?/i);

  let minPrice = 0, maxPrice = null;
  if (priceMatch) {
    minPrice = parseInt(priceMatch[1]) * (priceMatch[0].toLowerCase().includes("k") ? 1000 : 1);
    maxPrice = parseInt(priceMatch[2]) * (priceMatch[0].toLowerCase().includes("k") ? 1000 : 1);
  } else if (maxMatch) {
    maxPrice = parseInt(maxMatch[1]) * (maxMatch[0].toLowerCase().includes("k") ? 1000 : 1);
  }

  // Amenities
  const hasPool = /\bpool\b/.test(lower);
  const isWaterfront = /\bwaterfront\b|\bocean\b|\briver\b|\blake\b|\bcanal\b/.test(lower);

  return {
    filter: {
      geography: { county: "", cities: city ? [city] : [], subdivisions: [] },
      types: [type],
      price: { min: minPrice, max: maxPrice },
      interior: { minSqft: 0, minBeds: 0, minBaths: 0 },
      yearBuilt: { min: 0, max: 0 },
      booleans: {
        pool: hasPool, shortSale: false, foreclosure: false,
        seniorCommunity: false, hoaRequired: false, membershipPurchaseRequired: false
      },
      hoa: { minFee: 0, maxFee: 0, includes: [] },
      garage: { minSpaces: 0, maxSpaces: 0 },
      views: [],
      roofs: [],
      waterfronts: isWaterfront ? ["Waterfront"] : [],
      sort: "newest", page: 1, pageSize: 20,
      derived: { wantsWater: isWaterfront }
    }
  };
}

// ---------------- Main Handler ----------------
module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Use POST" });
    return;
  }

  let body = req.body;

  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      body = parseNaturalText(body);
    }
  }

  if (!body || (body.url == null && body.filter == null)) {
    res.status(400).json({ error: "Provide either `url` or `filter` in JSON body." });
    return;
  }

  let parsed;
  try {
    parsed = body.url ? parseRealGeeksUrl(body.url) : body.filter;
  } catch (err) {
    console.error("Error parsing input:", err);
    return res.status(500).json({ error: "Failed to parse input", details: err.message });
  }

  let realGeeksLink, backendQuery;
  try {
    realGeeksLink = toRealGeeksUrl(BASE, parsed);
    backendQuery = toBackendQuery(parsed);
  } catch (err) {
    console.error("Error building queries:", err);
    return res.status(500).json({ error: "Failed to build queries", details: err.message, parsed });
  }

  res.status(200).json({ filter: parsed, realGeeksLink, backendQuery });
};
