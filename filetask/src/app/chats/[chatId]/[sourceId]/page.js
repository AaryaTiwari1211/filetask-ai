"use client";
import { Bot, User } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { getChatById, getMessagesByChat, addMessage } from "@/firebase/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import axios from "axios";

const ChatBubble = ({ sender, message }) => {
  const isUser = sender === "user";
  return (
    <div
      className={`flex items-center ${
        isUser ? "justify-end" : "justify-start"
      } mb-4`}
    >
      {!isUser && (
        <div className="mr-2">
          <Bot className="w-6 h-6 text-white" />
        </div>
      )}
      <div
        className={`p-3 rounded-lg max-w-md flex ${
          isUser ? "bg-gray-400/10 text-white" : "bg-transparent text-white"
        }`}
      >
        <p>{message}</p>
      </div>
      {isUser && (
        <div className="ml-2">
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

  return (
    <div className="w-full h-full flex justify-center items-center">
      <div className="w-full h-full flex flex-col items-center justify-center bg-bg">
        <div className="w-full h-full bg-transparent p-4 flex flex-col">
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
    console.log("Chat ID:", chatId);
    console.log("Source ID:", sourceId);
    try {
      await addMessage(chatId, newMessage, "user");

      // Make the API call to chatPDF
      const response = await axios.post(
        "https://api.chatpdf.com/v1/chats/message",
        {
          // stream: true,
          sourceId: sourceId,
          messages: [
            {
              role: "user",
              content: newMessage,
            },
          ],
        },
        {
          headers: {
            "x-api-key": process.env.NEXT_PUBLIC_CHATPDF_API_KEY,
          },
        }
      );

      // Add the assistant's response to the messages
      if (response.data.content) {
        await addMessage(chatId, response.data.content, "assistant");
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
