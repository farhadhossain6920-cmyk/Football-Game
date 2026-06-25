import { io } from "socket.io-client";

// In development, the proxy is used. In production, it's the same origin.
export const socket = io({
  autoConnect: false,
});
