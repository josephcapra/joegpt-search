// pages/api/ping.js
export default function handler(req, res) {
  res.status(200).json({
    ok: true,
    keyLoaded: !!process.env.JoeGPTWidget,
    env: Object.keys(process.env).filter(k => k.includes("JoeGPT")),
  });
}
