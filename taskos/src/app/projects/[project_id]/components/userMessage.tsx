import React from 'react';

interface UserMessageProps {
  message: string;
}

const UserMessage: React.FC<UserMessageProps> = ({ message }) => {
  return (
    <div className="flex justify-end mb-4">
      <div className="bg-blue-500 text-white rounded-lg py-2 px-4 max-w-sm">
        {message}
      </div>
    </div>
  );
};

export default UserMessage;
