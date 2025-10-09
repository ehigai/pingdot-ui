import type { Conversation, Message } from "@/api/api";
import CreateConversation from "./create-conversation";
import { useEffect } from "react";
import { connectSocket, socket } from "@/api/socket";
import { useQueryClient } from "@tanstack/react-query";
import { useUser } from "@/hooks/useAuth";

const ConversationList = ({
  conversations,
  handleOpenConversation,
}: {
  conversations: Conversation[];
  handleOpenConversation: (conversationId: string) => void;
}) => {
  const queryClient = useQueryClient();
  const { user } = useUser();

  useEffect(() => {
    const s = socket ?? connectSocket();

    /** Add or merge a new conversation */
    const handleNewConversation = (conversation: Conversation) => {
      queryClient.setQueryData<Conversation[]>(
        ["get-conversations"],
        (old = []) => {
          const exists = old.some((c) => c.id === conversation.id);
          return exists ? old : [...old, conversation];
        }
      );

      // Immediately mark all incoming messages as delivered
      for (const messageId of conversation.messageIds ?? []) {
        s.emit("message:delivered", {
          messageId,
          conversationId: conversation.id,
        });
      }
    };

    /** Update conversation latestMessage on status update */
    const handleStatusUpdate = (message: Message) => {
      queryClient.setQueryData<Conversation[]>(
        ["get-conversations"],
        (old = []) =>
          old.map((c) =>
            c.id === message.conversationId
              ? {
                  ...c,
                  latestMessage: {
                    ...(c.latestMessage ?? {}),
                    ...message, // ensures id/content/status/createdAt are in sync
                  },
                }
              : c
          )
      );
    };

    /** Update latestMessage when a new one arrives */
    const handleNewMessage = (message: Message) => {
      queryClient.setQueryData<Conversation[]>(
        ["get-conversations"],
        (old = []) =>
          old.map((c) =>
            c.id === message.conversationId
              ? {
                  ...c,
                  latestMessage: {
                    ...(c.latestMessage ?? {}),
                    ...message,
                  },
                }
              : c
          )
      );
    };

    s.on("conversation:new", handleNewConversation);
    s.on("message:statusUpdated", handleStatusUpdate);
    s.on("message:new", handleNewMessage);

    return () => {
      s.off("conversation:new", handleNewConversation);
      s.off("message:statusUpdated", handleStatusUpdate);
      s.off("message:new", handleNewMessage);
    };
  }, [queryClient]);

  if (!Array.isArray(conversations) || conversations.length === 0) {
    return (
      <section className="flex flex-col h-full bg-gray-100 border-r border-gray-200 w-full">
        <header className="p-4 font-bold text-lg border-b border-gray-200">
          Conversations
        </header>
        <div className="p-4 text-gray-600">No conversations</div>
      </section>
    );
  }

  return (
    <section className="flex flex-col h-full bg-gray-100 border-r border-gray-200 w-full">
      <header className="p-4 font-bold text-lg border-b border-gray-200">
        Conversations
      </header>

      <ul className="flex-1 overflow-y-auto">
        {conversations.map((conversation) => {
          const latest = conversation.latestMessage;
          const isYou = latest?.senderId === user?.id;

          return (
            <li
              key={conversation.id}
              onClick={() => handleOpenConversation(conversation.id.toString())}
              className="flex items-center justify-between gap-2 p-4 cursor-pointer border-b border-gray-200 hover:bg-gray-50 transition"
            >
              {/* Left side: conversation name + message preview */}
              <div className="flex flex-col flex-1 min-w-0">
                <span className="font-semibold text-gray-900 truncate">
                  {conversation.name}
                </span>
                <span className="text-sm text-gray-600 truncate">
                  {latest ? (
                    isYou ? (
                      `You: ${latest.content}`
                    ) : latest.status !== "READ" ? (
                      <span className="font-bold text-green-600">
                        {latest.content}
                      </span>
                    ) : (
                      latest.content
                    )
                  ) : (
                    "No messages yet"
                  )}
                </span>
              </div>

              {/* Right side: status + time */}
              {latest && (
                <div className="flex flex-col items-end text-xs text-gray-500">
                  {isYou && (
                    <span>
                      {latest.status === "READ"
                        ? "✓✓ Read"
                        : latest.status === "DELIVERED"
                        ? "✓✓ Delivered"
                        : latest.status === "SENT"
                        ? "✓ Sent"
                        : ""}
                    </span>
                  )}
                  <span>
                    {latest.createdAt
                      ? new Date(latest.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : ""}
                  </span>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <CreateConversation />
      <CreateConversation type="group" conversations={conversations} />
    </section>
  );
};

export default ConversationList;
