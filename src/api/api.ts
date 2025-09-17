import API from "./client";

interface ConversationList {}

export const getOpenConversations = async (
  conversationId: string
): Promise<ConversationList> =>
  API.get(`/messages/conversation/${conversationId}`);
