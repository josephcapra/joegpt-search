const response = await fetch("/api/normalizeSearch", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ query: "test" }),
});
