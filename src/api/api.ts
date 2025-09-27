import API, { setAccessToken } from "./client";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload extends LoginPayload {
  full_name: string;
}

export interface User {
  id: string;
  email: string;
}

export interface Conversation {
  id: string;
  name?: string;
  isGroup?: boolean;
  lastMessage: string;
  members?: any[]; // type properly later
}

export interface Message {
  id: string;
  clientId?: string;
  sender: {
    id: string;
    email: string;
  };
  conversationId: string;
  content: string;
  imageUrl?: string;
  status: "SENT" | "DELIVERED" | "READ" | "PENDING";
}

export const login = async (
  data: LoginPayload
): Promise<{ accessToken: string }> => API.post("/auth/login", data);

export const register = async (data: RegisterPayload) =>
  API.post("/auth/register", data);

export const logout = async () =>
  API.post("/auth/logout").then(() => {
    setAccessToken(null);
  });

export const getUser = async (): Promise<User> => API.get("/users/profile");

export const getOpenConversationMessages = async (
  conversationId: string
): Promise<Message[]> => API.get(`/message/conversations/${conversationId}`);

export const getConversations = async (): Promise<Conversation[]> =>
  API.get("/message/conversations");

export const createConversation = async (data: {
  name?: string;
  email: string[];
  message?: string;
  isGroup?: boolean;
}) => API.post("/message/conversations/new", data);
