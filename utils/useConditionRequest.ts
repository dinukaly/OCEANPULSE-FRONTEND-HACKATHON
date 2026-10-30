import { useCallback, useEffect, useRef, useState } from 'react';
import api from './api';

type Params = Record<string, string | number>;
export default function useConditionRequest<T>(path: string, decode: (value: any) => T) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const state = useRef({ generation: 0, controller: null as AbortController | null });
  const cancel = useCallback(() => {
    state.current.generation++;
    state.current.controller?.abort();
  }, []);
  const load = useCallback(async (input: Params | (() => Promise<Params>)) => {
    cancel();
    const generation = state.current.generation;
    const controller = new AbortController();
    state.current.controller = controller;
    setData(null);
    setError(null);
    setLoading(true);
    try {
      const params = typeof input === 'function' ? await input() : input;
      if (generation !== state.current.generation) return;
      const response = await api.get(path, { params, signal: controller.signal, timeout: 15_000 });
      const result = decode(response.data);
      if (generation === state.current.generation) setData(result);
    } catch (error: any) {
      if (generation === state.current.generation && !controller.signal.aborted) {
        setError(error.response?.data?.message || (error.code === 'ECONNABORTED' ? 'Conditions request timed out. Please retry.' : error.message) || 'Conditions are unavailable. Please retry.');
      }
    } finally { if (generation === state.current.generation) setLoading(false); }
  }, [path, decode, cancel]);
  useEffect(() => cancel, [cancel]);
  return { data, loading, error, load, cancel };
}
