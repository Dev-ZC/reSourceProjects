import React, { useEffect, useRef } from 'react';
import UserMessage from './userMessage';
import BotMessage from './botMessage';

export interface Message {
  id: string;
  type: 'user' | 'bot';
  text: string;
  timestamp: Date;
}

interface ChatWindowProps {
  messages: Message[];
  isLoading: boolean;
  onClose: () => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ messages, isLoading, onClose }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="w-full h-full flex flex-col rounded-lg glass-background shadow-lg">
      {/* Close button */}
      <div className="flex justify-end p-2">
        <button 
          onClick={onClose}
          className="text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white"
          aria-label="Close chat"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
            Start a conversation with the assistant...
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              message.type === 'user' ? (
                <UserMessage key={message.id} message={message.text} />
              ) : (
                <BotMessage key={message.id} message={message.text} />
              )
            ))}
            {isLoading && (
              <div className="flex items-center justify-start">
                <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 max-w-[80%] text-gray-800 dark:text-gray-200">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default ChatWindow;
