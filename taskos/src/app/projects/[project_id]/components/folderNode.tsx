import React, { useState } from 'react';
import { Node, NodeProps } from 'reactflow';
import { useReactFlow } from '@xyflow/react';
import Image from 'next/image';
import FolderIcon from '../icons/folderIcon.svg';
import NodeSettingsMenu from './NodeSettingsMenu';

// Define the data shape for our folder node
type FolderNodeData = {
  title: string;
  createdAt: string;
};

type FolderNodeType = Node<FolderNodeData>;

const FolderNode = (props: NodeProps<FolderNodeData>) => {
  const { setNodes } = useReactFlow();
  const { data, id } = props;
  const { title, createdAt } = data;
  const [showSettings, setShowSettings] = useState(false);
  const [settingsPosition, setSettingsPosition] = useState({ x: 0, y: 0 });

  // Handle settings save
  const handleSettingsSave = (data: { title: string }) => {
    setNodes((nodes) =>
      nodes.map((node) =>
        node.id === id
          ? { ...node, data: { ...node.data, title: data.title } }
          : node
      )
    );
  };

  // Handle settings button click
  const handleSettingsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setSettingsPosition({
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2 - 10
    });
    setShowSettings(true);
  };

  return (
    <div className="group flex flex-col items-center p-4 w-40 transition-all duration-300 hover:scale-[1.03] relative">
      <div className="relative w-24 h-24 mb-2 flex items-center justify-center">
        <div className="absolute inset-0 dark:bg-gray-800/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="w-24 h-24 relative transform transition-all duration-300 group-hover:scale-105">
          <Image 
            src={FolderIcon} 
            alt="Folder" 
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
      
      {/* Settings Icon - appears on hover above the node */}
      <div className="absolute -top-7 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:-translate-y-2 cursor-pointer">
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleSettingsClick(e);
          }}
          className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-full p-2 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110"
          title="Node settings"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600 dark:text-gray-300">
            <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z"/>
          </svg>
        </button>
      </div>
      
      {/* Settings Menu */}
      <NodeSettingsMenu
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        nodeType="folder"
        currentTitle={title}
        onSave={handleSettingsSave}
        position={settingsPosition}
      />
    </div>
  );
};

export default FolderNode;