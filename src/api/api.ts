import API, { setAccessToken } from "./client";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload extends LoginPayload {
  full_name: string;
}

export interface Conversation {
  id: number;
  name?: string;
  isGroup?: boolean;
  lastMessage: string;
}

interface ConversationList {}

export const login = async (
  data: LoginPayload
): Promise<{ accessToken: string }> => API.post("/auth/login", data);

export const register = async (data: RegisterPayload) =>
  API.post("/auth/register", data);

export const logout = async () =>
  API.post("/auth/logout").then(() => {
    setAccessToken(null);
  });

export const getUser = async () => API.get("/users/profile");

export const getOpenConversations = async (
  conversationId: string
): Promise<ConversationList> =>
  API.get(`/message/conversations/${conversationId}`);

export const getConversations = async (): Promise<Conversation[]> =>
  API.get("/message/conversations");

export const createConversation = async (data: {
  name?: string;
  email: string[];
  message?: string;
  isGroup?: boolean;
}) => API.post("/message/conversations/new", data);
