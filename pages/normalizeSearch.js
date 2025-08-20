export default function handler(req, res) {
  if (req.method === "POST") {
    const { query } = req.body;
    res.status(200).json({ normalized: query.toLowerCase() });
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
