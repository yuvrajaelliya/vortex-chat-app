import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

const socket: Socket = io("http://localhost:4000");

export function useNeonverseChat() {
  const [messages, setMessages] = useState<{ user: string; text: string; seenBy?: string[]; imageUrl?: string }[]>([]);
  const [users, setUsers] = useState<string[]>([]);
  const [username, setUsername] = useState("");
  const [joined, setJoined] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  useEffect(() => {
    socket.on("message", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });
    socket.on("users", (users) => {
      setUsers(users);
    });
    socket.on("typing", (user) => {
      setTypingUsers((prev) => prev.includes(user) ? prev : [...prev, user]);
      setTimeout(() => {
        setTypingUsers((prev) => prev.filter(u => u !== user));
      }, 2000);
    });
    socket.on("seen", ({ messageIdx, user }) => {
      setMessages((prev) => prev.map((m, i) => i === messageIdx ? { ...m, seenBy: [...(m.seenBy || []), user] } : m));
    });
    // Listen for notification event
    socket.on("notification", ({ from }) => {
      // Add sender to active chat list if not present
      setTimeout(() => {
        if (typeof window !== "undefined") {
          // Custom event for NeonverseChatLayout to handle
          window.dispatchEvent(new CustomEvent("neonverse-new-chat", { detail: { from } }));
        }
      }, 100);
    });
    return () => {
      socket.off("message");
      socket.off("users");
      socket.off("typing");
      socket.off("seen");
      socket.off("notification");
    };
  }, []);

  const join = (name: string) => {
    setJoinError(null);
    socket.emit("join", name, (res: { success: boolean; error?: string }) => {
      if (res.success) {
        setUsername(name);
        setJoined(true);
      } else {
        setJoinError(res.error || "Username error");
      }
    });
  };

  const sendMessage = (text: string, imageUrl?: string, to?: string) => {
    if (text.trim() || imageUrl) {
      socket.emit("message", { text, imageUrl, to });
    }
  };

  const sendTyping = () => {
    socket.emit("typing");
  };

  const sendSeen = (messageIdx: number) => {
    socket.emit("seen", { messageIdx });
  };

  return { messages, users, username, joined, join, sendMessage, joinError, typingUsers, sendTyping, sendSeen };
}
