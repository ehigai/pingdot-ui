import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Plus } from "lucide-react";
import { Textarea } from "./ui/textarea";
import { useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { connectSocket, socket } from "@/api/socket";

const CreateConversation = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsSubmitting(true);
    const s = socket ?? connectSocket();

    s.emit(
      "create-conversation",
      {
        email: [email],
        message: message || undefined,
      },
      (ack: any) => {
        if (ack.status == "ok") {
          queryClient.invalidateQueries({ queryKey: ["get-conversations"] });
          setEmail("");
          setMessage("");
          console.log("ack", ack);
        }
        return setIsSubmitting(false);
      }
    );
  };
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="rounded-full w-10 h-10">
          <Plus />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>Create Conversation</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <form onSubmit={handleSubmit} className="space-y-2">
          <Input
            type="email"
            placeholder="Enter user email..."
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Textarea
            placeholder="Optional message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Sending..." : "Send message"}
          </Button>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default CreateConversation;
