"use client";
import { Bot, User } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { getChatById, getMessagesByChat, addMessage } from "@/firebase/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import axios from "axios";
import { SmallPdfChat } from "@/functions/api-call";
import { useRouter } from "next/navigation";
import ReactMarkdown from 'react-markdown';

const ChatBubble = ({ sender, message }) => {
  const isUser = sender === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
      {!isUser && (
        <div className="mr-2 flex-shrink-0">
          <Bot className="w-6 h-6 text-white" />
        </div>
      )}
      <div
        className={`p-3 rounded-lg ${
          isUser ? "bg-gray-400/10 text-white max-w-md" : "bg-blue-800 text-white min-w-[40%] max-w-[60%]"
        }`}
      >
        {isUser ? (
          <p>{message}</p>
        ) : (
          <ReactMarkdown className="prose prose-invert max-w-none">
            {message}
          </ReactMarkdown>
        )}
      </div>
      {isUser && (
        <div className="ml-2 flex-shrink-0">
          <User className="w-6 h-6 text-white" />
        </div>
      )}
    </div>
  );
};

const ChatUI = ({
  chat,
  messages,
  newMessage,
  setNewMessage,
  handleSendMessage,
}) => {
  const sortedMessages = messages.sort((a, b) => a.timestamp - b.timestamp);

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSendMessage(e);
    }
  };
  const router = useRouter();

  return (
    <div className="w-full h-full flex justify-center items-center">
      <div className="w-full h-full flex flex-col items-center justify-center bg-bg">
        <div className="w-full h-full bg-transparent p-4 flex flex-col">
          <h1 className="text-2xl text-white font-bold">
            Talking With: {chat.title}
          </h1>
          <div className="flex flex-col gap-2 overflow-y-auto h-full">
            {sortedMessages.map((msg, index) => (
              <ChatBubble key={index} sender={msg.role} message={msg.content} />
            ))}
          </div>
          <div className="mt-4 flex items-center">
            <Input
              type="text"
              className="flex-1 p-2 border border-gray-600 rounded-lg bg-transparent text-white"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
            />
            <Button
              className="ml-2 p-2 bg-blue-500 text-white rounded-lg"
              onClick={handleSendMessage}
            >
              Send
            </Button>
            <Button
              className="ml-2 p-2 bg-red-500 text-white rounded-lg"
              onClick={() => router.push("/")}
            >
              Back
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function ChatPage({ params }) {
  const { chatId, sourceId } = params;
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
    try {
      await addMessage(chatId, newMessage, "user");
      const response = await SmallPdfChat({ sourceId, newMessage });

      if (response.data.content) {
        await addMessage(chatId, response.data.content, "assistant");
        await loadChatAndMessages();
        setNewMessage("");
      } else {
        console.error("Error: No content received from API");
      }
    } catch (error) {
      console.error(
        "Error sending message:",
        error.response ? error.response.data : error.message
      );
    }
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
