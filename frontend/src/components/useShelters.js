import { useEffect, useState } from "react";

export function useShelters(town = "", page = 1) {
  const [state, setState] = useState({ key: "", shelters: [], hasMore: false, error: false });
  const [retry, setRetry] = useState(0);
  const key = JSON.stringify([town, page, retry]);
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const params = new URLSearchParams({ town, page: String(page) });
        const response = await fetch(`/api/shelters?${params}`, { signal: AbortSignal.any([controller.signal, AbortSignal.timeout(20000)]) });
        const body = await response.json();
        if (!response.ok || !body.success || !Array.isArray(body.shelters)) throw new Error("Unable to load shelters");
        if (!controller.signal.aborted) setState({ key, shelters: body.shelters, hasMore: Boolean(body.hasMore), error: false });
      } catch {
        if (!controller.signal.aborted) setState({ key, shelters: [], hasMore: false, error: true });
      }
    }
    const timer = setTimeout(load, 250);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [town, page, key]);
  return { ...state, loading: state.key !== key, refresh: () => setRetry((value) => value + 1) };
}
