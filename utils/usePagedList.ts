import { useCallback, useEffect, useRef, useState } from 'react';
import api from './api';
import { ApiPage, mergeItems, readPage } from './contracts';

export default function usePagedList<T extends object>(path: string, key: keyof T, enabled = true) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const state = useRef({ generation: 0, cursor: null as string | null, anchor: null as string | null,
    busy: false, controller: null as AbortController | null });

  const fetchPage = useCallback(async (mode: 'reset' | 'more' | 'latest') => {
    const reset = mode === 'reset';
    const current = state.current;
    if (!enabled || (!reset && (current.busy || (mode === 'more' && !current.cursor)))) return;
    if (reset) {
      current.controller?.abort();
      current.generation++;
    }
    const generation = current.generation;
    const controller = new AbortController();
    current.controller = controller;
    current.busy = true;
    setLoading(reset);
    setLoadingMore(!reset);
    setError(null);
    try {
      const anchor = current.anchor;
      let before = mode === 'more' ? current.cursor : null;
      let page: ApiPage<T>;
      let incoming: T[] = [];
      let latestAnchor: string | null = null;
      do {
        const response = await api.get<ApiPage<T>>(path, {
          params: { limit: 25, ...(before && { before }) }, signal: controller.signal,
        });
        page = readPage(response.data);
        if (generation !== current.generation || controller.signal.aborted) return;
        if (latestAnchor === null && page.data.length) latestAnchor = String(page.data[0][key]);
        incoming = mergeItems(incoming, page.data, item => String(item[key]));
        if (mode !== 'latest' || !anchor || page.data.some(item => String(item[key]) <= anchor) || !page.pagination.hasMore) break;
        if (page.pagination.nextCursor === before) throw new Error('Pagination cursor did not advance');
        before = page.pagination.nextCursor;
      } while (true);
      if (generation !== current.generation) return;
      if (mode !== 'latest' || !anchor) {
        current.cursor = page.pagination.nextCursor;
        setCursor(current.cursor);
      }
      if (mode !== 'more') current.anchor = latestAnchor;
      setItems(previous => reset ? incoming : mergeItems(previous, incoming, item => String(item[key])));
    } catch (error: any) {
      if (generation === current.generation && !controller.signal.aborted) {
        setError(error.response?.data?.message || 'Could not load this list. Please retry.');
      }
    } finally {
      if (generation === current.generation) {
        current.busy = false;
        setLoading(false);
        setLoadingMore(false);
      }
    }
  }, [path, key, enabled]);

  useEffect(() => {
    state.current.cursor = null;
    state.current.anchor = null;
    setCursor(null);
    setItems([]);
    setError(null);
    if (enabled) void fetchPage('reset');
    return () => {
      state.current.generation++;
      state.current.controller?.abort();
      state.current.busy = false;
    };
  }, [fetchPage, enabled]);

  const refresh = useCallback(() => fetchPage('reset'), [fetchPage]);
  const loadMore = useCallback(() => fetchPage('more'), [fetchPage]);
  const refreshLatest = useCallback(() => fetchPage('latest'), [fetchPage]);
  return { items, setItems, loading, loadingMore, error, hasMore: cursor !== null, refresh, loadMore, refreshLatest };
}
