import { io } from "socket.io-client";

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL || "http://127.0.0.1:5000";
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