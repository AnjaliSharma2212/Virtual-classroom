import { io } from "socket.io-client";
const API_URL = import.meta.env.VITE_API_URL;
const socket = io(`${API_URL}`, {
  auth: { token: localStorage.getItem("token") || "" },
  transports: ["websocket"],
  autoConnect: false,
});

export default socket;
