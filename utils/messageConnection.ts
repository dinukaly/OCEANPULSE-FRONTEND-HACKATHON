import getBaseUrl from "../constants/BASEURL";
import { getToken } from "./session";

type Options = {
  onEvent: (event: any) => void;
  onReady: () => void;
  onStatus: (status: string) => void;
  url?: string;
  token?: () => Promise<string | null>;
  socket?: (url: string) => WebSocket;
};
export function socketUrl(base: string) {
  const url = new URL(base);
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  ) {
    throw new Error("Invalid messaging URL");
  }
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  url.pathname = `${url.pathname.replace(/\/+$/, "")}/messages/socket`;
  return url.toString();
}

export function connectMessages(options: Options) {
  let stopped = false;
  let attempt = 0;
  let generation = 0;
  let ws: WebSocket | undefined;
  let retry: ReturnType<typeof setTimeout> | undefined;
  let watchdog: ReturnType<typeof setTimeout> | undefined;
  const deadline = (connection: WebSocket, ms: number) => {
    clearTimeout(watchdog);
    watchdog = setTimeout(() => {
      connection.close();
    }, ms);
  };
  const schedule = () => {
    if (stopped || retry) return;
    options.onStatus("Reconnecting; checking saved messages periodically");
    const delay =
      Math.min(30000, 1000 * 2 ** Math.min(attempt++, 5)) +
      Math.floor(Math.random() * 500);
    retry = setTimeout(() => {
      retry = undefined;
      void open();
    }, delay);
  };
  const open = async () => {
    const current = ++generation;
    try {
      const token = await (options.token || getToken)();
      if (stopped || current !== generation) return;
      if (!token) {
        options.onStatus("Sign in again to connect");
        return;
      }
      const base = options.url || getBaseUrl();
      if (!base) throw new Error("API URL is not configured");
      const connection = (options.socket || ((url) => new WebSocket(url)))(
        socketUrl(base),
      );
      ws = connection;
      let ready = false;
      options.onStatus("Connecting");
      deadline(connection, 10000);
      connection.onopen = () => {
        if (stopped || current !== generation) return connection.close();
        connection.send(JSON.stringify({ type: "auth", token }));
      };
      connection.onmessage = ({ data }) => {
        if (
          stopped ||
          current !== generation ||
          typeof data !== "string" ||
          data.length > 65536
        )
          return;
        try {
          const event = JSON.parse(data);
          if (event.type === "ready" && !ready) {
            ready = true;
            attempt = 0;
            options.onStatus("Connected");
            options.onReady(); // Always recover durable history after each handshake.
          } else if (ready && event.type !== "heartbeat")
            options.onEvent(event);
          if (ready) deadline(connection, 45000);
        } catch {
          connection.close();
        }
      };
      connection.onerror = () => {
        connection.close();
      };
      connection.onclose = ({ code }) => {
        if (stopped || current !== generation) return;
        clearTimeout(watchdog);
        if (code === 4401) {
          // REST will confirm session validity through the normal 401/logout path.
          options.onStatus("Session unavailable; checking saved messages");
          options.onReady();
        }
        schedule();
      };
    } catch {
      if (!stopped && current === generation) schedule();
    }
  };
  void open();
  return () => {
    stopped = true;
    generation++;
    clearTimeout(retry);
    clearTimeout(watchdog);
    ws?.close();
  };
}
