import { useEffect, useState } from "react";
import { socket, connectSocket } from "@/api/socket";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getOpenConversationMessages, type Message } from "@/api/api";
import { useUser } from "@/hooks/useAuth";

const ChatWindow = ({
  openConversationId,
  conversationName,
}: {
  openConversationId: string | null;
  conversationName: string;
}) => {
  // store messages per conversation
  const [messagesMap, setMessagesMap] = useState<Record<string, Message[]>>({});
  const [messageInput, setMessageInput] = useState<string>("");

  const { user } = useUser();

  // Fetch messages for active conversation
  const { data, isPending } = useQuery({
    queryKey: ["get-messages", openConversationId],
    queryFn: () => getOpenConversationMessages(openConversationId as string),
    enabled: !!openConversationId,
    refetchOnWindowFocus: true,
    //staleTime: 30_000, // only refetch if data is older than 30s
  });

  const queryClient = useQueryClient();

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
    console.log("openconversationid", openConversationId);
  }, [data, openConversationId]);

  // handle socket join/leave
  useEffect(() => {
    if (!openConversationId) return;

    const s = socket ?? connectSocket();
    s.emit("join-conversation", { conversationId: openConversationId });

    const onNew = (message: Message) => {
      if (
        message.conversationId === openConversationId &&
        user?.id !== message.senderId
      ) {
        setMessagesMap((prev) => ({
          ...prev,
          [openConversationId]: [...(prev[openConversationId] || []), message],
        }));
      }
    };

    s.on("new-message", onNew);

    return () => {
      s.off("new-message", onNew);
      s.emit("leave-conversation", { conversationId: openConversationId });
    };
  }, [openConversationId]);

  const messages = openConversationId
    ? messagesMap[openConversationId] || []
    : [];

  if (isPending && !messages.length) {
    return <div>Fetching Messages...</div>;
  }

  return (
    <section className="flex flex-col h-full w-full">
      <header className="p-4 font-bold text-lg border-b border-gray-200 bg-white">
        {conversationName}
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-white">
        {messages.map((message) => (
          <>
            <div
              key={message.clientId ?? message.id}
              className={`mb-2 ${
                message.senderId === user?.id ? "text-right" : ""
              }`}
            >
              {/* <span className="font-semibold">:</span> */}
              {message.content}
              <div className="text-green-700">{message.status}</div>
            </div>
          </>
        ))}
      </div>

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
              senderId: user?.id as string,
              conversationId: openConversationId,
              status: "PENDING" as "PENDING",
            };

            console.log("tempId", temp.id);

            //optimistic update only in the right conversation
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
                  console.log("returned", ack);
                  setMessagesMap((prev) => ({
                    ...prev,
                    [openConversationId]: prev[openConversationId].map((msg) =>
                      msg.clientId === ack.clientId ? ack.message : msg
                    ),
                  }));
                } else {
                  // remove temp on failure
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
