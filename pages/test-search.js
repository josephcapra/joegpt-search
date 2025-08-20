import { useState } from "react";

export default function TestSearch() {
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState("");

  async function sendQuery() {
    try {
      const res = await fetch("/api/normalizeSearch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ filter: query }) // 👈 send filter in POST body
      });

      const data = await res.json();
      setResponse(JSON.stringify(data, null, 2));
    } catch (err) {
      setResponse("Error: " + err.message);
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Test JoeGPT Search</h1>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Ask something..."
        style={{ width: "300px" }}
      />
      <button onClick={sendQuery}>Send</button>
      <pre>{response}</pre>
    </div>
  );
}
