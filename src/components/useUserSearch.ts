import { useState } from "react";

export function useUserSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const search = async (q: string) => {
    setQuery(q);
    setLoading(true);
    const res = await fetch(`/search?q=${encodeURIComponent(q)}`);
    const data = await res.json();
    setResults(data);
    setLoading(false);
  };

  return { query, setQuery, results, search, loading };
}
