import { useEffect, useRef, useState } from "react";
import { socket, connectSocket } from "@/api/socket";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getOpenConversationMessages, type Message } from "@/api/api";
import { useUser } from "@/hooks/useAuth";
import MessageBubble from "./MessageBubble";

const ChatWindow = ({
  openConversationId,
  conversationName,
  isGroup,
}: {
  openConversationId: string | null;
  conversationName: string;
  isGroup: boolean;
}) => {
  const [messagesMap, setMessagesMap] = useState<Record<string, Message[]>>({});
  const [messageInput, setMessageInput] = useState<string>("");

  const { user } = useUser();
  const queryClient = useQueryClient();

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Fetch messages for active conversation
  const { data, isPending } = useQuery({
    queryKey: ["get-messages", openConversationId],
    queryFn: () => getOpenConversationMessages(openConversationId as string),
    enabled: !!openConversationId,
    refetchOnWindowFocus: true,
  });

  // invalidate the query when switching conversations
  useEffect(() => {
    if (openConversationId) {
      queryClient.invalidateQueries({
        queryKey: ["get-messages", openConversationId],
      });
    }
  }, [openConversationId, queryClient]);

  // sync fetched messages into messagesMap
  useEffect(() => {
    if (data && openConversationId) {
      setMessagesMap((prev) => ({
        ...prev,
        [openConversationId]: data,
      }));
    }
  }, [data, openConversationId]);

  // handle socket join/leave
  useEffect(() => {
    if (!openConversationId) return;

    const s = socket ?? connectSocket();
    s.emit("join-conversation", { conversationId: openConversationId });

    const onNew = (message: Message) => {
      if (
        message.conversationId === openConversationId &&
        user?.id !== message.sender.id
      ) {
        setMessagesMap((prev) => ({
          ...prev,
          [openConversationId]: [...(prev[openConversationId] || []), message],
        }));

        s.emit("message:delivered", { messageId: message.id });
      }
    };

    s.on("new-message", onNew);
    s.on("message:statusUpdated", ({ messageId, status }) => {
      setMessagesMap((prev) => ({
        ...prev,
        [openConversationId]: [
          ...prev[openConversationId].map((m) => {
            if (m.id === messageId) {
              return {
                ...m,
                status,
              };
            }
            return m;
          }),
        ],
      }));
    });

    return () => {
      s.off("new-message", onNew);
      s.emit("leave-conversation", { conversationId: openConversationId });
    };
  }, [openConversationId, user?.id]);

  const messages = openConversationId
    ? messagesMap[openConversationId] || []
    : [];

  // auto scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, openConversationId]);

  if (isPending && !messages.length) {
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

      {/* Messages */}
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

      {/* Input */}
      <footer className="p-4 border-t border-gray-200 bg-white">
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!openConversationId || !messageInput.trim()) return;

            const clientId = crypto.randomUUID();

            const temp: Message = {
              id: clientId,
              clientId,
              content: messageInput,
              sender: {
                id: user?.id as string,
                email: user?.email as string,
              },
              createdAt: Date.now().toLocaleString(),
              conversationId: openConversationId,
              status: "PENDING" as "PENDING",
            };

            // optimistic update
            setMessagesMap((prev) => ({
              ...prev,
              [openConversationId]: [...(prev[openConversationId] || []), temp],
            }));

            const s = socket ?? connectSocket();
            s.emit(
              "send-message",
              {
                conversationId: openConversationId,
                message: { content: messageInput, clientId: temp.id },
              },
              (ack: any) => {
                if (ack?.status === "ok") {
                  setMessagesMap((prev) => ({
                    ...prev,
                    [openConversationId]: prev[openConversationId].map((msg) =>
                      msg.clientId === ack.clientId ? ack.message : msg
                    ),
                  }));
                } else {
                  setMessagesMap((prev) => ({
                    ...prev,
                    [openConversationId]: prev[openConversationId].filter(
                      (msg) => msg.id !== temp.id
                    ),
                  }));
                }
              }
            );

            setMessageInput("");
          }}
        >
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
