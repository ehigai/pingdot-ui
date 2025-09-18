import API from "./client";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload extends LoginPayload {
  full_name: string;
}

interface ConversationList {}

export const login = async (
  data: LoginPayload
): Promise<{ accessToken: string }> => API.post("/auth/login", data);

export const register = async (data: RegisterPayload) =>
  API.post("/auth/register", data);

export const getUser = async () => API.get("/users/profile");

export const getOpenConversations = async (
  conversationId: string
): Promise<ConversationList> =>
  API.get(`/messages/conversation/${conversationId}`);
