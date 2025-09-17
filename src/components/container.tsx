import ConversationList from "./ConversationList";
import ChatWindow from "./ChatWindow";
import { useState } from "react";

const Container = () => {
  const [openConversationId, setOpenConversationId] = useState<string | null>(
    null
  );
  const conversations = [
    { id: 1, name: "Alice", lastMessage: "Hi there!" },
    { id: 2, name: "Bob", lastMessage: "How's it going?" },
    { id: 3, name: "Charlie", lastMessage: "See you later!" },
  ];

  function handleOpenConversation(conversationId: string) {
    setOpenConversationId(conversationId);
  }

  return (
    <div className="flex h-screen w-full bg-gray-50">
      <div className="flex-1 max-w-xs md:max-w-sm border-r border-gray-200 min-w-0 flex">
        <ConversationList
          conversations={conversations}
          handleOpenConversation={handleOpenConversation}
        />
      </div>
      <div className="flex-1 min-w-0 hidden md:flex">
        <ChatWindow openConversationId={openConversationId} />
      </div>
    </div>
  );
};

export default Container;
