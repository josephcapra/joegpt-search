// pages/api/test-search.js

export default function handler(req, res) {
  if (req.method === "GET") {
    res.status(200).json({
      message: "✅ Test API is working!",
      timestamp: new Date().toISOString(),
    });
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
