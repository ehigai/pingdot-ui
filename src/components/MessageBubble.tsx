import type { Message } from "@/api/api";
import { useUser } from "@/hooks/useAuth";
import { Check, CheckCheck } from "lucide-react"; // icons for status

type Props = {
  message: Message;
  isGroup: boolean;
  previousMessage?: Message | null;
};

const MessageBubble = ({ message, isGroup, previousMessage }: Props) => {
  const { user } = useUser();
  const isOwn = message.sender.id === user?.id;

  // Check if sender is same as previous message (for grouping in group chat)
  const isSameSender =
    previousMessage && previousMessage.sender.id === message.sender.id;

  // Format timestamp (you can swap with date-fns if you want better formatting)
  const timestamp = new Date(message.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  // Pick status icon for own messages
  const getStatusIcon = () => {
    if (!isOwn) return null;
    if (message.status === "SENT") return <Check size={14} />;
    if (message.status === "DELIVERED") return <CheckCheck size={14} />;
    if (message.status === "READ")
      return <CheckCheck size={14} className="text-blue-400" />;
    return null;
  };

  return (
    <div
      key={message.clientId ?? message.id}
      className={`flex ${
        isOwn ? "justify-end" : "justify-start"
      } mb-1 animate-dropIn`}
    >
      <div className="max-w-[70%]">
        {/* Show sender name only if group + not own + not same as previous */}
        {isGroup && !isOwn && !isSameSender && (
          <span className="text-xs font-semibold text-gray-500 mb-1 block px-1">
            {message.sender.email}
          </span>
        )}

        {/* Message bubble */}
        <div
          className={`rounded-2xl px-4 py-2 text-sm shadow-sm whitespace-pre-wrap break-words relative ${
            isOwn
              ? "bg-blue-600 text-white rounded-br-none"
              : "bg-gray-200 text-gray-900 rounded-bl-none"
          }`}
        >
          {message.content}

          {/* Timestamp + Status */}
          <div
            className={`flex items-center gap-1 text-xs mt-1 ${
              isOwn ? "text-gray-200 justify-end" : "text-gray-500 justify-end"
            }`}
          >
            <span>{timestamp}</span>
            {getStatusIcon()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
