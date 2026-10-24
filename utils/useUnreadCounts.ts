import { useEffect, useState } from "react";
import api from "./api";
import { connectMessages } from "./messageConnection";

export default function useUnreadCounts(senderIds: string[], active: boolean) {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);
  const key = [...new Set(senderIds)].sort().join(",");
  useEffect(() => {
    if (!active || !key) return;
    let stopped = false;
    let busy = false;
    const controller = new AbortController();
    const refresh = async () => {
      if (stopped || busy) return;
      busy = true;
      try {
        const ids = key.split(",");
        const next: Record<string, number> = {};
        for (let start = 0; start < ids.length; start += 100) {
          const page = ids.slice(start, start + 100);
          const response = await api.post(
            "messages/unread",
            { senderIds: page },
            { timeout: 15000, signal: controller.signal },
          );
          if (!response.data?.success || !Array.isArray(response.data.data))
            throw new Error("Invalid counts");
          page.forEach((id) => {
            next[id] = 0;
          });
          for (const row of response.data.data) {
            if (
              !page.includes(row.senderId) ||
              !Number.isSafeInteger(row.count) ||
              row.count < 0
            )
              throw new Error("Invalid count");
            next[row.senderId] = row.count;
          }
        }
        if (!stopped) {
          setCounts(next);
          setError(null);
        }
      } catch {
        if (!stopped) setError("Unread counts could not be refreshed");
      } finally {
        busy = false;
      }
    };
    void refresh();
    const stop = connectMessages({
      onReady: () => {
        void refresh();
      },
      onEvent: () => {
        void refresh();
      },
      onStatus: () => {},
    });
    const interval = setInterval(() => {
      void refresh();
    }, 15000);
    return () => {
      stopped = true;
      controller.abort();
      stop();
      clearInterval(interval);
    };
  }, [key, active]);
  return { counts, error };
}
