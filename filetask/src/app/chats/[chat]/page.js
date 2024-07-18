"use client";
import { User } from "lucide-react";
import { useEffect, useState } from "react";

const sampleChat = [
  { sender: "User", message: "Hi there!" },
  { sender: "Assistant", message: "Hello! How can I assist you today?" },
  { sender: "User", message: "I need some information about your services." },
  {
    sender: "Assistant",
    message:
      "Sure, we offer a variety of services including web development, mobile app development, and digital marketing. Which one are you interested in?",
  },
  { sender: "User", message: "I'm interested in web development." },
  {
    sender: "Assistant",
    message:
      "Great! We provide full-stack web development services including frontend and backend development. Do you have any specific requirements?",
  },
  { sender: "User", message: "Yes, I need a website for my new business." },
  {
    sender: "Assistant",
    message:
      "Awesome! We can definitely help with that. Can you provide more details about your business?",
  },
];

const ChatBubble = ({ sender, message }) => {
  const isUser = sender === "User";
  return (
    <div
      className={`flex items-center ${
        isUser ? "justify-end" : "justify-start"
      } mb-4`}
    >
      {!isUser && (
        <div className="mr-2">
          <User className="w-6 h-6 text-white" />
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

export const ChatUI = () => {
  const [chat, setChat] = useState(sampleChat);
  const [input, setInput] = useState("");

  const handleSendMessage = () => {
    if (input.trim() !== "") {
      setChat([...chat, { sender: "User", message: input }]);
      setInput("");
    }
  };

  return (
    <div className="w-full h-full flex justify-center items-center">
      <div className="w-full h-full flex flex-col items-center justify-center bg-bg">
        <div className="w-full h-full bg-transparent p-4 flex flex-col">
          <div className="flex flex-col gap-2 overflow-y-auto h-full">
            {chat.map((c, index) => (
              <ChatBubble key={index} sender={c.sender} message={c.message} />
            ))}
          </div>
          <div className="mt-4 flex items-center">
            <input
              type="text"
              className="flex-1 p-2 border border-gray-600 rounded-lg bg-transparent text-white"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
            />
            <button
              className="ml-2 p-2 bg-blue-500 text-white rounded-lg"
              onClick={handleSendMessage}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function ChatPage() {
  return (
    <div className="h-screen flex items-center justify-center">
      <ChatUI />
    </div>
  );
}
