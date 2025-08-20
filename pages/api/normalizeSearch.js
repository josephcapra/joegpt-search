// pages/api/normalizeSearch.js

export default function handler(req, res) {
  if (req.method === "POST") {
    const body = req.body;

    // For now just echo back the request (you can replace this with real logic later)
    res.status(200).json({
      message: "API working ✅",
      received: body,
    });
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
