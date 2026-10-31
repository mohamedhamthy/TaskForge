import { io } from "socket.io-client";
import { API_URL } from "./api";

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL?.trim() || new URL(API_URL).origin;
let socket;

export function connectSocket() {
  const token = localStorage.getItem("taskforge_token");

  if (!token) {
    return null;
  }

  socket =
    socket ||
    io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket"],
    });

  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}