// pages/test-search.js
import { useEffect, useState } from "react";

export default function TestSearch() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function runTest() {
      try {
        const response = await fetch("/api/normalizeSearch", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            filter: {
              geography: { county: "Martin", cities: ["Stuart"] },
              price: { min: 300000, max: 600000 },
            },
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    runTest();
  }, []);

  return (
    <div style={{ padding: "2rem", fontFamily: "Arial, sans-serif" }}>
      <h1>Test Search Page</h1>
      {loading && <p>Loading...</p>}
      {error && <p style={{ color: "red" }}>Error: {error}</p>}
      {data && (
        <pre style={{ background: "#f4f4f4", padding: "1rem" }}>
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
}
