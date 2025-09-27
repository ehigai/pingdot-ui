import ConversationList from "./ConversationList";
import ChatWindow from "./ChatWindow";
import { useState } from "react";
//import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { getConversations } from "@/api/api";

const Container = () => {
  // const { user } = useAuth();
  const [openConversationId, setOpenConversationId] = useState<string | null>(
    null
  );

  const { data: conversations, isPending } = useQuery({
    queryKey: ["get-conversations"],
    queryFn: getConversations,
  });
  function handleOpenConversation(conversationId: string) {
    setOpenConversationId(conversationId);
  }

  if (isPending || conversations == undefined) {
    console.log("pending...");
    return <div>Fetching conversations...</div>;
  }

  const currentConversation = conversations.find(
    (c) => c.id === openConversationId
  );

  console.log("conversations", conversations);

  return (
    <>
      {openConversationId}
      <div className="flex h-screen w-full bg-gray-50">
        <div className="flex-1 max-w-xs md:max-w-sm border-r border-gray-200 min-w-0 flex">
          <ConversationList
            conversations={conversations}
            handleOpenConversation={handleOpenConversation}
          />
        </div>
        <div className="flex-1 min-w-0 hidden md:flex">
          <ChatWindow
            openConversationId={openConversationId}
            conversationName={currentConversation?.name as string}
            isGroup={currentConversation?.isGroup as boolean}
          />
        </div>
      </div>
    </>
  );
};

export default Container;
