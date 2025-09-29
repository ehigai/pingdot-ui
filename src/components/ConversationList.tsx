import type { Conversation } from "@/api/api";
import CreateConversation from "./create-conversation";
import { useEffect } from "react";
import { connectSocket, socket } from "@/api/socket";

import { useQueryClient } from "@tanstack/react-query";

const ConversationList = ({
  conversations,
  handleOpenConversation,
}: {
  conversations: Conversation[];
  handleOpenConversation: (conversationId: string) => void;
}) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const s = socket ?? connectSocket();

    const handleNewConversation = (conversation: Conversation) => {
      queryClient.setQueryData<Conversation[]>(["get-conversations"], (old) => {
        if (!old) return [conversation];
        if (old.some((c) => c.id === conversation.id)) return old;
        return [...old, conversation];
      });

      for (const messageId of conversation.messageIds ?? []) {
        s.emit("message:delivered", { messageId });
      }
    };

    s.on("new-conversation", handleNewConversation);
    return () => {
      s.off("new-conversation", handleNewConversation);
    };
  }, []);

  if (!Array.isArray(conversations)) {
    return (
      <section className="flex flex-col h-full bg-gray-100 border-r border-gray-200 w-full">
        <header className="p-4 font-bold text-lg border-b border-gray-200">
          Conversations
        </header>
        <div className="p-4">No conversations</div>
      </section>
    );
  }

  return (
    <section className="flex flex-col h-full bg-gray-100 border-r border-gray-200 w-full">
      <header className="p-4 font-bold text-lg border-b border-gray-200">
        Conversations
      </header>
      <ul className="flex-1 overflow-y-auto">
        {conversations.map((conversation) => (
          <li
            onClick={() => handleOpenConversation(conversation.id.toString())}
            key={conversation.id}
            className="p-4 hover:bg-gray-200 font-bold cursor-pointer border-b border-gray-100"
          >
            {conversation.name}
            <p className="font-normal">{conversation.latestMessage.content}</p>
          </li>
        ))}
      </ul>
      <CreateConversation />
      <CreateConversation type="group" conversations={conversations} />
    </section>
  );
};

export default ConversationList;
