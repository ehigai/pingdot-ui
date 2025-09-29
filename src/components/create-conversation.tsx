import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { useQueryClient } from "@tanstack/react-query";
import { connectSocket, socket } from "@/api/socket";
import {
  MultiSelect,
  MultiSelectContent,
  MultiSelectGroup,
  MultiSelectItem,
  MultiSelectTrigger,
  MultiSelectValue,
} from "./ui/multi-select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import { useState } from "react";
import type { Conversation } from "@/api/api";

const formSchema = z.object({
  emails: z.array(z.string()).min(1, "Required"),
  message: z.string().optional(),
  name: z.string().optional(),
});

const CreateConversation = ({
  type,
  conversations,
}: {
  type?: "group";
  conversations?: Conversation[];
}) => {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),

    defaultValues: {
      emails: [],
    },
  });

  const {
    formState: { isSubmitting },
  } = form;

  function onSubmit(data: z.infer<typeof formSchema>) {
    const s = socket ?? connectSocket();
    s.emit(
      "conversation:create",
      {
        email: data.emails,
        message: data.message,
        name: data.name,
      },
      (ack: any) => {
        if (ack.status == "ok") {
          queryClient.invalidateQueries({ queryKey: ["get-conversations"] });
          console.log("ack", ack);
          form.reset();
          setOpen(false);
        }
      }
    );
  }

  if (type === "group") {
    return (
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button>New Group</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>Create a Group</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="w-2/3 space-y-6"
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Group Name</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="What would you call your group?"
                        value={field.value}
                        onChange={field.onChange}
                        required
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="emails"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Participants</FormLabel>

                    <MultiSelect
                      onValuesChange={field.onChange}
                      values={field.value}
                    >
                      <FormControl>
                        <MultiSelectTrigger className="w-full">
                          <MultiSelectValue placeholder="Select frameworks..." />
                        </MultiSelectTrigger>
                      </FormControl>

                      <MultiSelectContent>
                        <MultiSelectGroup>
                          {conversations?.map((conversation) => {
                            if (!conversation.isGroup) {
                              return (
                                <MultiSelectItem
                                  value={conversation.members?.[0].email}
                                >
                                  {conversation.name}
                                </MultiSelectItem>
                              );
                            }
                          })}
                        </MultiSelectGroup>
                      </MultiSelectContent>
                    </MultiSelect>

                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creatimg group..." : "Create group"}
              </Button>
            </form>
          </Form>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">New Contact</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>Create Conversation</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="w-2/3 space-y-6"
          >
            <FormField
              control={form.control}
              name="emails"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="Enter user email..."
                      value={field.value?.[0] ?? ""}
                      onChange={(e) => field.onChange([e.target.value])}
                      required
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Message..."
                      value={field.value}
                      onChange={field.onChange}
                      required
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Sending..." : "Send message"}
            </Button>
          </form>
        </Form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default CreateConversation;
