import { useState } from "react";

export default function SearchTest() {
  const [result, setResult] = useState(null);

  async function runSearch() {
    const res = await fetch("/api/normalizeSearch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: "https://www.paradiserealtyfla.com/search/results/?city=Port+St+Lucie&minprice=300000&maxprice=600000&beds=3&baths=2"
      })
    });

    const data = await res.json();
    setResult(data);
  }

  return (
    <div>
      <button onClick={runSearch}>Run Search</button>
      <pre>{result && JSON.stringify(result, null, 2)}</pre>
    </div>
  );
}
