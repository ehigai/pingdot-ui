import { useEffect, useRef, useState, useCallback } from "react";
import { socket, connectSocket } from "@/api/socket";
import { useQuery } from "@tanstack/react-query";
import { getOpenConversationMessages, type Message } from "@/api/api";
import { useUser } from "@/hooks/useAuth";
import MessageBubble from "./MessageBubble";

type MessageStatus = "PENDING" | "SENT" | "DELIVERED" | "READ";

const BUCKET_MS = 5000; // 5s bucket for fingerprinting

const ChatWindow = ({
  openConversationId,
  conversationName,
  isGroup,
}: {
  openConversationId: string | null;
  conversationName: string;
  isGroup: boolean;
}) => {
  const { user } = useUser();

  const [messagesMap, setMessagesMap] = useState<Record<string, Message[]>>({});
  const [messageInput, setMessageInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const deliveredRef = useRef<Set<string>>(new Set());
  const seenRef = useRef<Set<string>>(new Set());
  const socketRef = useRef(socket ?? connectSocket());

  // fetch messages for active conversation
  const { data, isPending } = useQuery({
    queryKey: ["get-messages", openConversationId],
    queryFn: () => getOpenConversationMessages(openConversationId as string),
    enabled: !!openConversationId,
    refetchOnWindowFocus: true,
  });

  // merge/sync fetched messages
  useEffect(() => {
    if (data && openConversationId) {
      setMessagesMap((prev) => ({ ...prev, [openConversationId]: data }));
      data.forEach((m) => {
        if (m.status === "DELIVERED") deliveredRef.current.add(m.id);
        if (m.status === "READ") seenRef.current.add(m.id);
      });
    }
  }, [data, openConversationId]);

  // Helpers
  // timestamping + fingerprinting
  const parseTs = (m: Message) => {
    if (typeof (m as any).createdAt === "number") return (m as any).createdAt;
    const t = Date.parse((m as any).createdAt ?? "");
    return Number.isFinite(t) ? t : Date.now();
  };

  // Messages from the same sender
  // with the same content (first 120 char)
  // within time window (BUCKET_MS) count as the same thing
  const fingerprintOf = (m: Message) => {
    const ts = Math.floor(parseTs(m) / BUCKET_MS);
    return `${m.sender?.id ?? "?"}|${(m.content ?? "").slice(0, 128)}|${ts}`;
  };

  // addMessage with deduplication (id, clientId, fingerprint)
  const addMessage = useCallback((msg: Message) => {
    setMessagesMap((prev) => {
      const convId = msg.conversationId;
      const existing = prev[convId] ?? [];

      // duplicate checks
      const already = existing.some(
        (m) =>
          m.id === msg.id ||
          (msg.clientId && m.clientId === msg.clientId) ||
          fingerprintOf(m) === fingerprintOf(msg)
      );
      if (already) return prev; // same mesage was found

      return { ...prev, [convId]: [...existing, msg] };
    });
  }, []);

  // update message by id
  const updateMessage = useCallback(
    (convId: string, id: string, patch: Partial<Message>) => {
      setMessagesMap((prev) => {
        const list = prev[convId];
        if (!list) return prev;
        return {
          ...prev,
          [convId]: list.map((m) => (m.id === id ? { ...m, ...patch } : m)),
        };
      });
    },
    []
  );

  // replace optimistic message matched by clientId (or fallback by fingerprint)
  const replaceOptimistic = useCallback((serverMsg: Message) => {
    setMessagesMap((prev) => {
      const convId = serverMsg.conversationId;
      const list = prev[convId] ?? [];

      // try clientId match first
      if (serverMsg.clientId) {
        const idx = list.findIndex((m) => m.clientId === serverMsg.clientId);
        if (idx >= 0) {
          const copy = [...list];
          copy[idx] = serverMsg;
          return { ...prev, [convId]: copy };
        }
      }

      // fallback: try fingerprint match to replace a pending one
      const fingPrint = fingerprintOf(serverMsg);
      const idx2 = list.findIndex(
        (m) => m.status === "PENDING" && fingerprintOf(m) === fingPrint
      );
      if (idx2 >= 0) {
        const copy = [...list];
        copy[idx2] = serverMsg;
        return { ...prev, [convId]: copy };
      }

      // otherwise if server id already exists skip, else append
      if (list.some((m) => m.id === serverMsg.id)) return prev;
      return { ...prev, [convId]: [...list, serverMsg] };
    });
  }, []);

  // socket listeners
  useEffect(() => {
    const s = socketRef.current;

    const onNewMessage = (message: Message) => {
      // replace optimistic if server sent clientId
      if (message.clientId) {
        replaceOptimistic(message);
      } else {
        // otherwise dedupe, then append
        addMessage(message);
      }

      // mark delivered immediately for other people's messages
      if (
        message.sender.id !== user?.id &&
        !deliveredRef.current.has(message.id)
      ) {
        s.emit("message:delivered", {
          messageId: message.id,
          conversationId: message.conversationId,
        });
        deliveredRef.current.add(message.id);
        updateMessage(message.conversationId, message.id, {
          status: "DELIVERED",
        });
      }
    };

    const onStatusUpdated = (message: Message) => {
      updateMessage(message.conversationId, message.id, {
        status: message.status,
      });
      if (message.status === "DELIVERED") deliveredRef.current.add(message.id);
      if (message.status === "READ") seenRef.current.add(message.id);
    };

    s.on("message:new", onNewMessage);
    s.on("message:statusUpdated", onStatusUpdated);

    return () => {
      s.off("message:new", onNewMessage);
      s.off("message:statusUpdated", onStatusUpdated);
    };
  }, [addMessage, replaceOptimistic, updateMessage, user?.id]);

  // When the active conversation opens, mark READ for all visible messages
  useEffect(() => {
    if (!openConversationId) return;
    const list = messagesMap[openConversationId] ?? [];
    const notSeen = list.filter(
      (m) =>
        m.sender.id !== user?.id &&
        m.status !== "READ" &&
        !seenRef.current.has(m.id)
    );
    if (notSeen.length === 0) return;

    const ids = notSeen.map((m) => m.id);
    const s = socketRef.current;
    s.emit(
      "message:read",
      { conversationId: openConversationId, messageIds: ids },
      (_ack: any) => {
        // optimistic handling
        ids.forEach((id) => {
          seenRef.current.add(id);
          updateMessage(openConversationId, id, { status: "READ" });
        });
      }
    );
  }, [openConversationId, messagesMap, updateMessage, user?.id]);

  // auto scroll
  const messages = openConversationId
    ? messagesMap[openConversationId] ?? []
    : [];
  useEffect(() => {
    if (messagesEndRef.current)
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages, openConversationId]);

  // send message
  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!openConversationId || !messageInput.trim() || !user) return;

    const clientId = crypto.randomUUID();
    const nowIso = new Date().toISOString();

    const temp: Message = {
      id: clientId, // use clientId as temporary id
      clientId,
      content: messageInput,
      sender: { id: user.id as string, email: user.email as string },
      createdAt: nowIso,
      conversationId: openConversationId,
      status: "PENDING" as MessageStatus,
    };

    // optimistic add
    addMessage(temp);

    const s = socketRef.current;
    s.emit(
      "message:send",
      {
        conversationId: openConversationId,
        message: { content: messageInput, clientId: temp.id },
      },
      (ack: any) => {
        if (ack?.status === "ok" && ack.message) {
          replaceOptimistic(ack.message);
        } else {
          // remove optimistic on error
          setMessagesMap((prev) => ({
            ...prev,
            [openConversationId]: (prev[openConversationId] ?? []).filter(
              (m) => m.id !== temp.id
            ),
          }));
        }
      }
    );

    setMessageInput("");
  };

  if (isPending && messages.length === 0) {
    return (
      <div className="flex items-center justify-center overflow-y-auto p-4 bg-white border w-full font-normal text-xl">
        Open a conversation or create a new conversation to get started
        messaging.
      </div>
    );
  }

  return (
    <section className="flex flex-col h-full w-full">
      <header className="p-4 font-bold text-lg border-b border-gray-200 bg-white">
        {conversationName}
      </header>

      {messages.length === 0 ? (
        <div className="flex-1 flex items-center justify-center overflow-y-auto p-4 bg-white border w-full font-normal text-xl">
          No messages to display
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-4 bg-white">
          {messages.map((message, i) => (
            <MessageBubble
              key={message.clientId ?? message.id}
              message={message}
              isGroup={isGroup}
              previousMessage={i > 0 ? messages[i - 1] : null}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>
      )}

      <footer className="p-4 border-t border-gray-200 bg-white">
        <form className="flex gap-2" onSubmit={handleSend}>
          <input
            type="text"
            className="flex-1 border rounded px-3 py-2 focus:outline-none focus:ring"
            placeholder="Type a message..."
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
          />
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Send
          </button>
        </form>
      </footer>
    </section>
  );
};

export default ChatWindow;
