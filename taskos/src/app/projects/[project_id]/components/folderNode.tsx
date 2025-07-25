import React from 'react';
import { NodeProps } from 'reactflow';
import FolderIcon from '../icons/folderIcon.svg'; // Adjust the import path as necessary

interface FolderNodeData {
  title: string;
  createdAt: string;
}

const FolderNode: React.FC<NodeProps<FolderNodeData>> = ({ data }) => {
  const { title, createdAt } = data;

  return (
    <div 
      className="p-4 rounded-lg shadow-md bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-center w-36 relative"
      style={{
        backgroundImage: `url(${FolderIcon})`,
        backgroundSize: '60px 60px', // Adjust size as needed
        backgroundPosition: 'center 20%', // Position the folder icon
        backgroundRepeat: 'no-repeat',
        backgroundBlendMode: 'multiply', // Optional: blend with background color
        opacity: 0.1 // Make background subtle
      }}
    >
      {/* Overlay to ensure text readability */}
      <div className="relative z-10">
        {/* Title */}
        <div className="font-semibold text-sm text-gray-800 dark:text-gray-100 truncate mt-8">
          {title}
        </div>

        {/* Created At */}
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {createdAt}
        </div>
      </div>
    </div>
  );
};

export default FolderNode;