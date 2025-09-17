import { useState } from "react";

const ChatWindow = ({
  openConversationId,
}: {
  openConversationId: string | null;
}) => {
  const [messageInput, setMessageInput] = useState<string>("");

  // const { data: conversation, isLoading } = useQuery({
  //   queryKey: ["conversationMessages", openConversationId],
  //   queryFn: () => getOpenConversations(openConversationId as string),
  // });

  const [messages, setMessages] = useState([
    { id: 1, sender: "Alice", content: "Hi there!" },
    { id: 2, sender: "You", content: "Hello!" },
    { id: 3, sender: "Alice", content: "How are you?" },
    { id: 4, sender: "You", content: "I'm good, thanks!" },
  ]);

  return (
    <section className="flex flex-col h-full w-full">
      <header className="p-4 font-bold text-lg border-b border-gray-200 bg-white">
        Chat
      </header>
      <div className="flex-1 overflow-y-auto p-4 bg-white">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`mb-2 ${message.sender === "You" ? "text-right" : ""}`}
          >
            <span className="font-semibold">{message.sender}:</span>{" "}
            {message.content}
          </div>
        ))}
      </div>
      <footer className="p-4 border-t border-gray-200 bg-white">
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (messageInput.trim()) {
              setMessages([
                ...messages,
                { id: Date.now(), sender: "You", content: messageInput },
              ]);
              setMessageInput("");
            }
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
