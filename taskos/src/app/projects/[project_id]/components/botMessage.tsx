import React from 'react';

interface BotMessageProps {
  message: string;
}

const BotMessage: React.FC<BotMessageProps> = ({ message }) => {
  return (
    <div className="flex justify-start mb-4">
      <div className="bg-gray-800 text-gray-300 dark:bg-gray-900 dark:text-gray-400 rounded-lg py-2 px-4 max-w-sm">
        {message}
      </div>
    </div>
  );
};

export default BotMessage;
