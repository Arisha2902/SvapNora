import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Paginated list loader.
 * `fetcher(query)` must resolve to the API envelope `{ data: { items, meta } }`.
 * Re-runs whenever the query object's contents change, or on `refresh()`.
 */
export function useApiList(fetcher, query = {}) {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tick, setTick] = useState(0);

  const queryKey = JSON.stringify(query);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError('');

    fetcherRef
      .current(JSON.parse(queryKey))
      .then((res) => {
        if (!alive) return;
        setRows(res?.data?.items || []);
        setMeta(res?.data?.meta || null);
      })
      .catch((err) => {
        if (!alive) return;
        setRows([]);
        setMeta(null);
        setError(err?.message || 'Could not load records.');
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [queryKey, tick]);

  return { rows, meta, loading, error, refresh };
}

/** Single-record loader: `fetcher(id)` resolving to `{ data: {...} }`. */
export function useApiQuery(fetcher, id) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(Boolean(id));
  const [error, setError] = useState('');
  const [tick, setTick] = useState(0);

  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    if (!id) return undefined;
    let alive = true;
    setLoading(true);
    setError('');

    fetcherRef
      .current(id)
      .then((res) => {
        if (alive) setData(res?.data || null);
      })
      .catch((err) => {
        if (alive) setError(err?.message || 'Could not load this record.');
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [id, tick]);

  return { data, loading, error, refresh };
}
