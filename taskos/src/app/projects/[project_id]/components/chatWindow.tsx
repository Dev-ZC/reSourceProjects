import React, { useEffect, useRef } from 'react';
import UserMessage from './userMessage';
import BotMessage from './botMessage';

interface ChatWindowProps {
  onClose: () => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ onClose }) => {
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  const messages = [
    { type: 'user', text: 'Hello, how do I set up a new project?' },
    { type: 'bot', text: 'To set up a new project, you need to go to the dashboard and click on the "New Project" button.' },
    { type: 'user', text: 'Thanks!' },
    { type: 'user', text: 'Hello, how do I set up a new project?' },
    { type: 'bot', text: 'To set up a new project, you need to go to the dashboard and click on the "New Project" button.' },
    { type: 'user', text: 'Thanks!' },
    { type: 'user', text: 'Hello, how do I set up a new project?' },
    { type: 'bot', text: 'To set up a new project, you need to go to the dashboard and click on the "New Project" button.' },
    { type: 'user', text: 'Thanks!' }
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages]);

  return (
    <div 
      className="w-full h-[100%] shadow-lg flex flex-col rounded-lg glass-background"
    >
      <div className="flex-1 p-6 overflow-y-auto">
        {messages.map((msg, index) => (
          msg.type === 'user' ? (
            <UserMessage key={index} message={msg.text} />
          ) : (
            <BotMessage key={index} message={msg.text} />
          )
        ))}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default ChatWindow;
