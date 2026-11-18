import { useEffect, useState } from "react";
import { base_url } from "../config/config";

const DEBOUNCE_MS = 250;

// Asks the server for matching products a short pause after typing stops.
// Older requests are cancelled so a slow reply can't overwrite a newer one.
export default function useProductSearch(query) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const controller = new AbortController();
    const timer = setTimeout(() => {
      fetch(`${base_url}/search?q=${encodeURIComponent(q)}`, { signal: controller.signal })
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => {
          setResults(Array.isArray(data) ? data : []);
          setLoading(false);
        })
        .catch((err) => {
          if (err.name === "AbortError") return;
          console.error(err);
          setResults([]);
          setLoading(false);
        });
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  return { results, loading };
}
