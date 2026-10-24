export type Message = {
  id: string;
  senderId: string;
  receiverId: string;
  clientMessageId: string | null;
  message: string;
  timestamp: string | null;
  read: boolean;
  readAt: string | null;
  localStatus?: "sending" | "failed";
};
export type Receipt = Pick<Message, "id" | "read" | "readAt">;
const id = (value: unknown): value is string =>
  typeof value === "string" && /^[a-f0-9]{24}$/.test(value);
const date = (value: unknown) =>
  value === null ||
  (typeof value === "string" && Number.isFinite(Date.parse(value)));
export const isMessage = (value: any): value is Message =>
  Boolean(
    value &&
    id(value.id) &&
    id(value.senderId) &&
    id(value.receiverId) &&
    typeof value.message === "string" &&
    value.message.length <= 4000 &&
    (value.clientMessageId === null ||
      (typeof value.clientMessageId === "string" &&
        /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(
          value.clientMessageId,
        ))) &&
    typeof value.read === "boolean" &&
    date(value.timestamp) &&
    date(value.readAt),
  );
export const isReceipt = (value: any): value is Receipt =>
  Boolean(
    value &&
    id(value.id) &&
    typeof value.read === "boolean" &&
    date(value.readAt),
  );
export const inConversation = (message: Message, me: string, peer: string) =>
  (message.senderId === me && message.receiverId === peer) ||
  (message.senderId === peer && message.receiverId === me);
export const messageKey = (message: Message) =>
  message.clientMessageId
    ? `${message.senderId}:${message.clientMessageId}`
    : message.id;

// Read state only advances; an older HTTP response must not undo a newer socket receipt.
export function mergeMessages(existing: Message[], incoming: Message[]) {
  const messages = new Map(
    existing.map((message) => [messageKey(message), message]),
  );
  for (const message of incoming) {
    if (!isMessage(message)) continue;
    const old = messages.get(messageKey(message));
    messages.set(messageKey(message), {
      ...message,
      read: Boolean(old?.read || message.read),
      readAt: old?.readAt || message.readAt,
      localStatus: undefined,
    });
  }
  return [...messages.values()];
}
export function applyReceipts(messages: Message[], receipts: Receipt[]) {
  const byId = new Map(
    receipts.filter(isReceipt).map((receipt) => [receipt.id, receipt]),
  );
  let changed = false;
  const result = messages.map((message) => {
    const receipt = byId.get(message.id);
    if (!receipt?.read || (message.read && (message.readAt || !receipt.readAt)))
      return message;
    changed = true;
    return { ...message, read: true, readAt: message.readAt || receipt.readAt };
  });
  return changed ? result : messages;
}
export function conversationMessages(history: Message[], pending: Message[]) {
  const known = new Set(history.map(messageKey));
  return [
    ...history,
    ...pending.filter((message) => !known.has(messageKey(message))),
  ].sort((a, b) => {
    if (Boolean(a.localStatus) !== Boolean(b.localStatus))
      return a.localStatus ? 1 : -1;
    return a.localStatus
      ? (a.timestamp || "").localeCompare(b.timestamp || "")
      : a.id.localeCompare(b.id);
  });
}
