'use client'

import React, { useCallback, useState, useRef } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  NodeProps
} from '@xyflow/react';
import { Input } from "@/components/ui/input"
 
import '@xyflow/react/dist/style.css';
import dynamic from 'next/dynamic';

// Dynamically import the node components with no SSR
const FolderNode = dynamic(
  () => import('./components/folderNode'),
  { ssr: false }
);

const LinkNode = dynamic(
  () => import('./components/linkNode'),
  { ssr: false }
);

// Define the node types
const DocsNode = dynamic(
  () => import('./components/docsNode'),
  { ssr: false }
);

const nodeTypes = {
  folderNode: FolderNode as any,
  linkNode: LinkNode as any,
  docsNode: DocsNode as any,
};
 
const initialNodes = [
  {
    id: 'folder-1',
    type: 'folderNode',
    position: { x: 200, y: 200 },
    data: {
      title: 'Project Alpha',
      createdAt: '2025-06-27',
    },
  },
  {
    id: 'link-1',
    type: 'linkNode',
    position: { x: 500, y: 200 },
    data: {
      title: 'Example Website',
      url: 'https://www.nytimes.com/',
    },
  },
  {
    id: 'link-2',
    type: 'linkNode',
    position: { x: 800, y: 250 },
    data: {
      title: 'Example Website',
      url: 'https://docs.google.com/document/d/1r_cGl8PuoiJYjppm5GsTSj6v1BHZKr7vfqhnfkACgKA/edit?tab=t.0',
    },
  },
  {
    id: 'link-2',
    type: 'linkNode',
    position: { x: 600, y: 400 },
    data: {
      title: 'Example Website',
      url: 'https://calendar.google.com/calendar/u/0/r?pli=1',
    },
  },
  {
    id: 'docs-1',
    type: 'docsNode',
    position: { x: 650, y: 220 },
    data: {
      title: 'Requirements Doc',
      createdAt: '2025-07-20',
    },
  },
  {
    id: 'folder-2',
    type: 'folderNode',
    position: { x: 500, y: 300 },
    data: {
      title: 'Project Beta',
      createdAt: '2025-07-01',
    },
  },
];
const initialEdges = [{ id: 'e1-2', source: '1', target: '2' }];
 
export default function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
 
  const [isChatFocused, setIsChatFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  const handleChatBarClick = () => {
    inputRef.current?.focus();
  };
 
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
        <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            proOptions={{ hideAttribution: true }}
        >
        <Controls/>
        {/*<MiniMap />*/}
        <Background bgColor='#C4CACC' color='#C4CACC' gap={12} size={1} />
        </ReactFlow>
        <div 
          id="chat-bar" 
          className={`absolute bottom-10 left-1/2 -translate-x-1/2 transition-all duration-200 ${isChatFocused ? 'scale-105' : ''}`}
          onClick={handleChatBarClick}
        >
            <Input
              ref={inputRef}
              placeholder="Start chatting now..."
              className={`w-120 h-12 border-0 placeholder:text-[#7C868D] pl-7 outline-0 transition-all duration-200 ${isChatFocused ? 'ring-2 ring-blue-400' : ''}`}
              style={{ 
                background: isChatFocused ? '#E8EBED' : '#D0D5D8', 
                color: '#7C868D', 
                boxShadow: '1px 5px 10px rgba(0,0,0,0.1)', 
                outline: 'none', 
                borderRadius: '15px',
                transform: isChatFocused ? 'translateY(-2px)' : 'translateY(0)'
              }}
              onFocus={() => setIsChatFocused(true)}
              onBlur={() => setIsChatFocused(false)}
            />
        </div>
    </div>
  );
}
