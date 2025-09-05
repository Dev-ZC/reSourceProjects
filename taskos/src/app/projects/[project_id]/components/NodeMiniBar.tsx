'use client'

import React from 'react';
import { DraggableDocNodeButton } from './DraggableDocNode';

interface NodeType {
  id: string;
  name: string;
  icon: React.ReactNode;
  onClick: () => void;
}

interface NodeMiniBarProps {
  nodeTypes?: NodeType[];
  onDocNodeAdded?: (nodeId: string) => void;
}

const SVG_WIDTH = "18";
const SVG_HEIGHT = "18";

export default function NodeMiniBar({ nodeTypes, onDocNodeAdded }: NodeMiniBarProps) {
  const defaultNodeTypes: NodeType[] = [
    {
      id: 'link',
      name: 'Link Node',
      icon: (
        <svg 
          width={SVG_WIDTH} 
          height={SVG_HEIGHT} 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
      ),
      onClick: () => console.log('Add link node')
    },
    {
      id: 'folder',
      name: 'Folder Node',
      icon: (
        <svg 
          width={SVG_WIDTH} 
          height={SVG_HEIGHT} 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
      ),
      onClick: () => console.log('Add folder node')
    }
  ];

  const finalNodeTypes = nodeTypes || defaultNodeTypes;

  return (
    <div 
      className="relative left-4 top-1/2 -translate-y-1/2 z-30 flex flex-col gap-2 p-2 rounded-2xl shadow-lg w-fit"
      style={{ backgroundColor: '#B4BDC3' }}
    >
      {finalNodeTypes.map((nodeType) => (
        <button
          key={nodeType.id}
          onClick={nodeType.onClick}
          className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-black/10 transition-colors duration-200 group cursor-pointer"
          title={nodeType.name}
        >
          <div className="text-black group-hover:scale-110 transition-transform duration-200">
            {nodeType.icon}
          </div>
        </button>
      ))}
      
      {/* Draggable Docs Node */}
      <div title="Docs Node (Drag & Drop)">
        <DraggableDocNodeButton 
          onNodeAdded={onDocNodeAdded || (() => {})}
        />
      </div>
    </div>
  );
}
