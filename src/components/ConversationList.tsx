import type { Conversation } from "@/api/api";
import CreateConversation from "./create-conversation";

const ConversationList = ({
  conversations,
  handleOpenConversation,
}: {
  conversations: Conversation[];
  handleOpenConversation: (conversationId: string) => void;
}) => {
  // runtime guard: ensure conversations is an array to avoid .map errors
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
            <p className="font-normal">{conversation.lastMessage}</p>
          </li>
        ))}
      </ul>
      <CreateConversation />
    </section>
  );
};

export default ConversationList;
