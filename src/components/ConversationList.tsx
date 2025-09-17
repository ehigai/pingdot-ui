interface Conversation {
  id: number;
  name: string;
  lastMessage: string;
}

const ConversationList = ({
  conversations,
  handleOpenConversation,
}: {
  conversations: Array<Conversation>;
  handleOpenConversation: (conversationId: string) => void;
}) => {
  return (
    <section className="flex flex-col h-full bg-gray-100 border-r border-gray-200 w-full">
      <header className="p-4 font-bold text-lg border-b border-gray-200">
        Conversations
      </header>
      <ul className="flex-1 overflow-y-auto">
        {conversations.map((conversation) => (
          <>
            <li
              onClick={() => handleOpenConversation(conversation.id.toString())}
              key={conversation.id}
              className="p-4 hover:bg-gray-200 font-bold cursor-pointer border-b border-gray-100"
            >
              {conversation.name}
              <p className="font-normal">{conversation.lastMessage}</p>
            </li>
          </>
        ))}
      </ul>
    </section>
  );
};

export default ConversationList;
