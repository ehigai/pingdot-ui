import { io, Socket } from "socket.io-client";
import { getAccessToken, refreshToken } from "./client";
import { logout } from "./api";

let socket: Socket | null = null;

export function createSocketInstance() {
  // create instance but do not auto-connect
  const token = getAccessToken();
  const instance = io(import.meta.env.VITE_API_WS_URL, {
    autoConnect: false,
    auth: {
      token: token ? `Bearer ${token}` : undefined,
    },
    withCredentials: true,
  });

  instance.on("connect_error", (err) => {
    console.error("Socket connection error:", err?.message || err);
  });

  instance.on("connect", () => {
    console.log("Socket connected:", instance.id);
  });

  instance.on("disconnect", async (reason) => {
    console.warn("Socket disconnected:", reason);
    if (reason === "io server disconnect") {
      try {
        await refreshToken();
        connectSocket();
      } catch (err) {
        logout();
      }
    }
  });

  instance.on("reconnect", (attemptNumber) => {
    console.log("Socket reconnected after", attemptNumber, "attempts");
  });

  return instance;
}

export function connectSocket() {
  if (!socket) socket = createSocketInstance();
  // update auth token before connecting
  const token = getAccessToken();
  if (token && socket) {
    // @ts-ignore mutate handshake auth
    socket.auth = { token: `Bearer ${token}` };
  }
  socket?.connect();
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}

export { socket };
