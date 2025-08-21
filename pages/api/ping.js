export default function handler(req, res) {
  // Check if key is loaded
  const key = process.env.JoeGPTWidget;
  const envVars = Object.keys(process.env).filter(k =>
    k.toLowerCase().includes("gpt") || k.toLowerCase().includes("openai")
  );

  res.status(200).json({
    ok: true,
    keyLoaded: !!key,
    envVars, // shows only the variable names, never the secret values
  });
}
