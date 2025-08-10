import React from 'react';

interface BotMessageProps {
  message: string;
}

const BotMessage: React.FC<BotMessageProps> = ({ message }) => {
  return (
    <div className="flex justify-start mb-4">
      <div className="bg-gray-700 text-white rounded-lg py-2 px-4 max-w-sm">
        {message}
      </div>
    </div>
  );
};

export default BotMessage;
