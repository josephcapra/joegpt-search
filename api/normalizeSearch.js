// pages/api/normalizeSearch.js

export default async function handler(req, res) {
  // ✅ Allow CORS (so your Real Geeks site can call this API)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // ✅ Handle preflight requests
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // ✅ Only allow POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { filter, url } = req.body;

    if (!filter && !url) {
      return res.status(400).json({
        error: "Provide either 'url' or 'filter' in JSON body."
      });
    }

    // For now, just echo back the query so we know it's working
    return res.status(200).json({
      answer: `✅ JoeGPT received your query: "${filter || url}"`
    });
  } catch (err) {
    return res.status(500).json({
      error: "Server error",
      details: err.message
    });
  }
}
