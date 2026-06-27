import io from "socket.io-client";
import { API_URL } from "./config";

let socket: any = null;

export function getSocket() {
  if (socket) return socket;
  const url = API_URL.replace(/\/+$/, "");
  socket = io(url, {
    transports: ["websocket"],
    forceNew: true,
    autoConnect: true,
  });
  return socket;
}

export async function joinSession(sessionId: number, userId: number) {
  const s = getSocket();
  s.emit("join_session", { sessionId, userId });
}

export async function leaveSession(sessionId: number, userId: number) {
  const s = getSocket();
  s.emit("leave_session", { sessionId, userId });
}
