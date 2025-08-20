// pages/api/parseSearch.js

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ error: "Missing query" });
    }

    // Example: hardcoded parse
    // Later you can swap this with GPT call
    const filter = {
      geography: { cities: ["Hobe Sound"] },
      price: { min: 0, max: 600000 },
      beds: 3,
    };

    const realGeeksLink = `https://paradiserealtyfla.realgeeks.com/search/results/?city=Hobe+Sound&max_price=600000&beds_min=3`;

    return res.status(200).json({ filter, realGeeksLink });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}


