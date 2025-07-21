import React, { useEffect, useState, useRef, useContext } from "react";
import io from "socket.io-client";
import axios from "axios";
import { User } from "lucide-react";
import { ThemeContext } from "../context/ThemeContext";
const API_URL = import.meta.env.VITE_API_URL;
const socket = io(`${API_URL}`);

interface Message {
  _id?: string;
  senderName: string;
  content: string;
  fileUrl?: string;
  fileType?: string;
}

const ChatPage: React.FC = () => {
  const { darkMode } = useContext(ThemeContext);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [senderName, setSenderName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [editMessageId, setEditMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [showNewMessageNotification, setShowNewMessageNotification] =
    useState(false);

  const messagesContainerRef = useRef<HTMLDivElement | null>(null);

  const handleScroll = () => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const isAtBottom =
      container.scrollHeight - container.scrollTop <=
      container.clientHeight + 20;

    if (isAtBottom) {
      setShowNewMessageNotification(false);
    }
  };

  useEffect(() => {
    const storedName = localStorage.getItem("name");
    if (storedName) {
      setSenderName(storedName);
    } else {
      console.error("User name missing in localStorage.");
    }
  }, []);

  useEffect(() => {
    socket.on("new-message", (message: Message) => {
      setMessages((prev) => [...prev, message]);
    });

    fetchMessages();

    return () => {
      socket.off("new-message");
    };
  }, []);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleEdit = (msg: Message) => {
    setNewMessage(msg.content); // Load message content into input
    setEditMessageId(msg._id || null);
  };
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    const res = await axios.get(`${API_URL}/api/chats`);
    setMessages(res.data.messages);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() && !selectedFile) return;
    if (editMessageId) {
      await axios.put(`${API_URL}/api/chats/${editMessageId}`, {
        content: newMessage,
      });
      setEditMessageId(null);
      setNewMessage("");
      fetchMessages();
      return;
    }
    let fileUrl = "";
    let fileType = "";

    if (selectedFile) {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const res = await axios.post(`${API_URL}/api/chats/upload`, formData);
      fileUrl = res.data.fileUrl;
      fileType = selectedFile.type;
    }

    const messageData = {
      senderName,
      content: newMessage,
      fileUrl,
      fileType,
    };

    socket.emit("send-message", messageData);

    setNewMessage("");
    setSelectedFile(null);
  };
  const getFileUrl = (fileUrl?: string) => {
    if (!fileUrl) return "";
    if (fileUrl.startsWith("http")) return fileUrl;
    return `${API_URL}${fileUrl.startsWith("/") ? fileUrl : `/${fileUrl}`}`;
  };
  socket.on("new-message", (message: Message) => {
    const container = messagesContainerRef.current;
    const isAtBottom = container
      ? container.scrollHeight - container.scrollTop <=
        container.clientHeight + 20
      : true;

    setMessages((prev) => [...prev, message]);

    if (!isAtBottom) {
      setShowNewMessageNotification(true);
    } else {
      scrollToBottom();
    }
  });

  const filteredMessages = messages.filter((msg) =>
    msg.senderName.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const handleDelete = async (id?: string) => {
    if (!id) return;
    await axios.delete(`${API_URL}/api/chats/${id}`);
    fetchMessages();
  };

  return (
    <div
      className={`flex flex-col max-w-5xl mx-auto h-[90vh] rounded-lg transition p-3 ${
        darkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-black"
      }`}
    >
      <div className="p-4 sticky top-0 bg-inherit z-10">
        <h2 className="text-2xl font-bold mb-4 text-green-500 text-center">
          {" "}
          💬Classroom Chat
        </h2>

        <input
          type="text"
          placeholder="🔍 Search by Sender"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 mb-4 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>

      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className={`flex-1 p-3 overflow-y-auto p-3 space-y-4 rounded-lg w-full mb-4 transition focus:ring-2 ${
          darkMode
            ? "bg-gray-900 text-white border-gray-600 focus:ring-blue-500"
            : "bg-gray-100 text-black border-gray-300 focus:ring-blue-400"
        }`}
      >
        {showNewMessageNotification && (
          <button
            onClick={() => {
              scrollToBottom();
              setShowNewMessageNotification(false);
            }}
            className="fixed bottom-20 right-5 bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg z-50 animate-bounce"
          >
            ⬇️ New Messages
          </button>
        )}

        {filteredMessages.map((msg, index) => {
          const isOwnMessage = msg.senderName === senderName;
          return (
            <div
              key={index}
              className={`flex ${
                isOwnMessage ? "justify-end" : "justify-start"
              } mb-2`}
            >
              <div
                className={`p-3 rounded-xl max-w-xs break-words ${
                  isOwnMessage
                    ? "bg-green-600 text-white"
                    : "bg-gray-200 text-black"
                }`}
              >
                <p className="font-bold text-sm text-gray-700 capitalize flex items-center gap-2">
                  <User size={18} />
                  <strong className="text-black">{msg.senderName}</strong>
                </p>
                <p className="px-4 py-2">{msg.content}</p>

                {msg.fileUrl &&
                  (msg.fileType?.startsWith("image/") ? (
                    <img
                      src={getFileUrl(msg.fileUrl)}
                      alt="shared"
                      className="max-w-xs rounded-lg border"
                    />
                  ) : msg.fileType?.startsWith("video/") ? (
                    <video
                      src={getFileUrl(msg.fileUrl)}
                      controls
                      className="max-w-xs rounded-lg border"
                    />
                  ) : msg.fileType === "application/pdf" ? (
                    <a
                      href={getFileUrl(msg.fileUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500  font-semibold"
                    >
                      📄 {msg.fileUrl?.split("/").pop()}
                    </a>
                  ) : (
                    <a
                      href={getFileUrl(msg.fileUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-700 font-semibold"
                    >
                      Download File
                    </a>
                  ))}
                {msg.senderName === senderName && (
                  <div className="flex gap-2 mt-2 space-between">
                    <button
                      onClick={() => handleEdit(msg)}
                      className="text-sm bg-yellow-200 text-yellow-700 hover:text-white hover:bg-yellow-800 px-1 py-2 rounded-lg"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(msg._id)}
                      className="text-sm bg-red-500 text-white hover:text-white hover:bg-red-800 px-1 py-2 rounded-lg"
                    >
                      🗑️
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
      <input
        type="file"
        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
        className="mb-2"
      />
      <div className="flex items-center gap-2 bg-white rounded-xl shadow px-3 py-2 border border-gray-300">
        <textarea
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          rows={1}
          className="flex-1 resize-none rounded-xl border-none focus:ring-0 focus:outline-none p-2 text-gray-800 placeholder:text-gray-400 bg-transparent"
        />

        <button
          onClick={sendMessage}
          disabled={!newMessage.trim() && !selectedFile}
          className={`px-4 py-2 rounded-xl font-semibold text-white transition duration-200 ${
            newMessage.trim() || selectedFile
              ? "bg-green-600 hover:bg-green-700"
              : "bg-gray-400 cursor-not-allowed"
          }`}
        >
          {editMessageId ? "Update ✏️" : "Send ➤"}
        </button>
      </div>
    </div>
  );
};

export default ChatPage;
