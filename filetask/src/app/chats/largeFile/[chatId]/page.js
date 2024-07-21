"use client";
import { Bot, User } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { getChatById, getMessagesByChat, addMessage } from "@/firebase/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import axios from "axios";
import { largePdfChat } from "@/functions/api-call";
import { ChatBubble } from "../../[chatId]/[sourceId]/page";
import { ChatUI } from "../../[chatId]/[sourceId]/page";

export default function ChatPage({ params }) {
  const { chatId } = params;
  const { user } = useUser();

  const [chat, setChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (chatId && user) {
      loadChatAndMessages();
    }
  }, [chatId, user]);

  const loadChatAndMessages = async () => {
    try {
      const chatData = await getChatById(chatId);
      setChat(chatData);

      const messagesData = await getMessagesByChat(chatId);
      setMessages(messagesData);
    } catch (error) {
      console.error("Error loading chat and messages:", error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;
    console.log("Sending message:", newMessage);
    console.log("Chat ID:", chatId);
    try {
      await addMessage(chatId, newMessage, "user");

      const response = await largePdfChat({
        context: chat.summary,
        prompt: newMessage,
      });

      console.log("Response:", response.data);

      if (response.data.response) {
        await addMessage(chatId, response.data.response, "assistant");
        await loadChatAndMessages();
      } else {
        console.error("Error: No content received from API");
      }
    } catch (error) {
      console.error(
        "Error sending message:",
        error.response ? error.response.data : error.message
      );
    }
    setNewMessage("");
  };

  if (!chat) {
    return <div>Loading...</div>;
  }

  return (
    <div className="h-screen flex items-center justify-center">
      <ChatUI
        chat={chat}
        messages={messages}
        newMessage={newMessage}
        setNewMessage={setNewMessage}
        handleSendMessage={handleSendMessage}
      />
    </div>
  );
}
