import React from 'react';
import { Node, NodeProps } from 'reactflow';
import Image from 'next/image';
import DocsNodeIcon from '../icons/docsNodeIcon.svg';

// Define the data shape for our docs node
type DocsNodeData = {
  title: string;
  createdAt: string;
};

type DocsNodeType = Node<DocsNodeData>;

const DocsNode = (props: NodeProps<DocsNodeData>) => {
  const { data } = props;
  const { title, createdAt } = data;

  return (
    <div className="group flex flex-col items-center p-4 w-40 transition-all duration-300 hover:scale-[1.03]">
      <div className="relative w-24 h-24 mb-2 flex items-center justify-center">
        <div className="absolute inset-0 dark:bg-gray-800/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="w-24 h-24 relative transform transition-all duration-300 group-hover:scale-105">
          <Image 
            src={DocsNodeIcon} 
            alt="Document" 
            fill
            style={{ objectFit: 'contain' }}
            className="transition-transform duration-300 group-hover:translate-y-[-2px]"
          />
        </div>
      </div>
      <div className="text-center">
        <div className="font-medium text-sm text-gray-800 dark:text-gray-100 truncate w-full transition-colors duration-300 group-hover:text-gray-900 dark:group-hover:text-white">
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

export default DocsNode;
