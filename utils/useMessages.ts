import { useCallback, useEffect, useRef, useState } from "react";
import { randomUUID } from "expo-crypto";
import api from "./api";
import usePagedList from "./usePagedList";
import { connectMessages } from "./messageConnection";
import {
  Message,
  Receipt,
  applyReceipts,
  conversationMessages,
  inConversation,
  isMessage,
  isReceipt,
  mergeMessages,
  messageKey,
} from "./messaging";

export default function useMessages(
  me: string | null,
  peer: string,
  active: boolean,
) {
  const path = `messages/get?user1=${encodeURIComponent(me || "")}&user2=${encodeURIComponent(peer)}`;
  const history = usePagedList<Message>(
    path,
    "id",
    Boolean(me && peer),
    mergeMessages,
  );
  const { items, setItems, refreshLatest } = history;
  const [pending, setPending] = useState<Message[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("Connecting");
  const current = useRef({
    items,
    pending,
    active,
    generation: 0,
    recovering: false,
    visible: [] as string[],
    reading: new Set<string>(),
    sending: new Set<string>(),
    controllers: new Set<AbortController>(),
  });
  current.current.items = items;
  current.current.pending = pending;
  current.current.active = active;
  const apply = useCallback(
    (receipts: Receipt[]) => {
      if (receipts.some((receipt) => !isReceipt(receipt)))
        throw new Error("Invalid read receipts");
      setItems((previous) => applyReceipts(previous, receipts));
    },
    [setItems],
  );

  const markVisible = useCallback(
    async (visible?: string[]) => {
      const state = current.current;
      if (visible) state.visible = visible;
      if (!me || !state.active) return;
      const generation = state.generation;
      const ids = state.items
        .filter(
          (message) =>
            isMessage(message) &&
            inConversation(message, me, peer) &&
            message.receiverId === me &&
            !message.read &&
            state.visible.includes(message.id) &&
            !state.reading.has(message.id),
        )
        .map((message) => message.id)
        .slice(0, 100);
      if (!ids.length) return;
      ids.forEach((id) => state.reading.add(id));
      const controller = new AbortController();
      state.controllers.add(controller);
      try {
        const response = await api.post(
          "messages/mark-read",
          { messageIds: ids },
          { timeout: 15000, signal: controller.signal },
        );
        const receipts = response.data?.data?.receipts;
        if (!response.data?.success || !Array.isArray(receipts))
          throw new Error("Invalid read acknowledgement");
        if (generation === state.generation) apply(receipts);
      } catch {
        /* Keep unread locally and retry while visible on the next recovery. */
      } finally {
        ids.forEach((id) => state.reading.delete(id));
        state.controllers.delete(controller);
      }
    },
    [me, peer, apply],
  );

  const recover = useCallback(async () => {
    const state = current.current;
    if (!me || !state.active || state.recovering) return;
    state.recovering = true;
    const generation = state.generation;
    const controller = new AbortController();
    state.controllers.add(controller);
    try {
      await refreshLatest();
      // Receipts for old loaded sends may be outside the newest history page.
      const ids = state.items
        .filter(
          (message) =>
            isMessage(message) &&
            inConversation(message, me, peer) &&
            message.senderId === me &&
            !message.read,
        )
        .map((message) => message.id);
      for (let start = 0; start < ids.length; start += 100) {
        if (generation !== state.generation || !state.active) break;
        const response = await api.post(
          "messages/receipts",
          { messageIds: ids.slice(start, start + 100) },
          { timeout: 15000, signal: controller.signal },
        );
        if (!response.data?.success || !Array.isArray(response.data.data))
          throw new Error("Invalid receipts");
        if (generation === state.generation) apply(response.data.data);
      }
      if (generation === state.generation) void markVisible();
    } catch {
      /* The next foreground/poll/reconnect recovers; never discard loaded history. */
    } finally {
      if (generation === state.generation) state.recovering = false;
      state.controllers.delete(controller);
    }
  }, [me, peer, refreshLatest, apply, markVisible]);

  useEffect(() => {
    const state = current.current;
    state.generation++;
    state.visible = [];
    state.reading.clear();
    state.sending.clear();
    state.recovering = false;
    setPending([]);
    setError(null);
    return () => {
      state.generation++;
      state.controllers.forEach((controller) => controller.abort());
      state.controllers.clear();
    };
  }, [me, peer]);

  useEffect(() => {
    if (!me || !active) return;
    void recover();
    const stop = connectMessages({
      onStatus: setStatus,
      onReady: () => {
        void recover();
      },
      onEvent: (event) => {
        if (
          event.type === "message.saved" &&
          isMessage(event.message) &&
          inConversation(event.message, me, peer)
        ) {
          setItems((previous) => mergeMessages(previous, [event.message]));
        } else if (
          event.type === "messages.read" &&
          Array.isArray(event.receipts)
        ) {
          try {
            apply(event.receipts);
          } catch {
            /* Invalid events cannot change read state. */
          }
        }
      },
    });
    // Also covers process crashes, missed notifications and deployments with multiple API instances.
    const interval = setInterval(() => {
      void recover();
    }, 15000);
    return () => {
      stop();
      clearInterval(interval);
    };
  }, [me, peer, active, recover, setItems, apply]);

  useEffect(() => {
    const keys = new Set(items.filter(isMessage).map(messageKey));
    setPending((previous) =>
      previous.some((message) => keys.has(messageKey(message)))
        ? previous.filter((message) => !keys.has(messageKey(message)))
        : previous,
    );
    if (active) void markVisible();
  }, [items, active, markVisible]);

  const transmit = useCallback(
    async (message: Message) => {
      const state = current.current;
      const key = messageKey(message);
      if (state.sending.has(key)) return;
      state.sending.add(key);
      const generation = state.generation;
      const controller = new AbortController();
      state.controllers.add(controller);
      setPending((previous) =>
        previous.map((item) =>
          messageKey(item) === key ? { ...item, localStatus: "sending" } : item,
        ),
      );
      setError(null);
      try {
        const response = await api.post(
          "messages/send",
          {
            receiverId: peer,
            message: message.message,
            clientMessageId: message.clientMessageId,
          },
          { timeout: 15000, signal: controller.signal },
        );
        const saved = response.data?.data;
        if (
          !response.data?.success ||
          !isMessage(saved) ||
          saved.senderId !== me ||
          saved.receiverId !== peer ||
          saved.clientMessageId !== message.clientMessageId ||
          saved.message !== message.message
        ) {
          throw new Error("Invalid message acknowledgement");
        }
        if (generation !== state.generation) return;
        setItems((previous) => mergeMessages(previous, [saved]));
        setPending((previous) =>
          previous.filter((item) => messageKey(item) !== key),
        );
      } catch (failure: any) {
        if (generation !== state.generation) return;
        if (state.items.some((item) => messageKey(item) === key)) return; // A socket may have confirmed a lost HTTP reply.
        setPending((previous) =>
          previous.map((item) =>
            messageKey(item) === key
              ? { ...item, localStatus: "failed" }
              : item,
          ),
        );
        setError(
          failure.response?.data?.message ||
            "Send not confirmed. Retry the message to check or send it once.",
        );
      } finally {
        state.sending.delete(key);
        state.controllers.delete(controller);
      }
    },
    [me, peer, setItems],
  );

  const send = useCallback(
    (value: string) => {
      const state = current.current;
      const text = value.trim();
      if (!me || !text || text.length > 4000 || state.sending.size)
        return false;
      if (state.pending.length >= 20) {
        setError("Retry or discard failed messages before sending more.");
        return false;
      }
      try {
        const clientMessageId = randomUUID();
        const message: Message = {
          id: `pending-${clientMessageId}`,
          clientMessageId,
          senderId: me,
          receiverId: peer,
          message: text,
          timestamp: new Date().toISOString(),
          read: false,
          readAt: null,
          localStatus: "sending",
        };
        state.pending = [...state.pending, message];
        setPending(state.pending);
        void transmit(message);
        return true;
      } catch {
        setError("Could not prepare this message. Your text has been kept.");
        return false;
      }
    },
    [me, peer, transmit],
  );
  const discard = useCallback((key: string) => {
    setPending((previous) =>
      previous.filter(
        (message) =>
          messageKey(message) !== key || message.localStatus === "sending",
      ),
    );
  }, []);
  const messages = conversationMessages(
    items.filter(
      (message) =>
        isMessage(message) && Boolean(me) && inConversation(message, me!, peer),
    ),
    pending,
  );
  return {
    ...history,
    messages,
    error: error || history.error,
    status,
    send,
    retry: transmit,
    discard,
    markVisible,
    sending: pending.some((message) => message.localStatus === "sending"),
  };
}
