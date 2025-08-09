import React from 'react';

interface ChatWindowProps {
  onClose: () => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ onClose }) => {
  return (
    <div 
      className="w-full h-[100%] shadow-lg flex flex-col rounded-lg glass-background"
    >
      <div className="flex-1 p-4 overflow-y-auto">
        {/* Messages will go here */}
      </div>
    </div>
  );
};

export default ChatWindow;
