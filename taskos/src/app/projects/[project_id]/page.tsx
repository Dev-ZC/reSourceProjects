'use client'

import React, { useCallback, useState, useRef, useEffect } from 'react';
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
import { Input } from "@/components/ui/input";
import ChatWindow from './components/chatWindow';
 
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
 
    
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isChatFocused, setIsChatFocused] = useState(false);
  const [isChatRendered, setIsChatRendered] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatWindowRef = useRef<HTMLDivElement>(null);
  const chatBarRef = useRef<HTMLDivElement>(null);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

        const handleChatBarClick = () => {
    if (!isChatOpen) {
      setIsChatRendered(true);
      setTimeout(() => setIsChatOpen(true), 10); // Allow component to mount before animating
    }
    inputRef.current?.focus();
  };

      const handleCloseChat = () => {
    setIsChatOpen(false);
    setIsChatFocused(false);
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        chatWindowRef.current &&
        !chatWindowRef.current.contains(event.target as Node) &&
        chatBarRef.current &&
        !chatBarRef.current.contains(event.target as Node)
      ) {
        setIsChatOpen(false);
        setIsChatFocused(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [chatWindowRef, chatBarRef]);

  useEffect(() => {
    if (!isChatOpen) {
      const timer = setTimeout(() => {
        setIsChatRendered(false);
      }, 200); // Match the duration of the transition
      return () => clearTimeout(timer);
    }
  }, [isChatOpen]);
 
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
        <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onPaneClick={handleCloseChat}
            nodeTypes={nodeTypes}
            proOptions={{ hideAttribution: true }}
            noDragClassName='nodrag'
            autoPanSpeed={20}
            panOnScroll
        >
        <Controls/>
        {/*<MiniMap />*/}
        <Background bgColor='#C4CACC' color='#C4CACC' gap={12} size={1} />
        </ReactFlow>
        <div 
          id="chat-window"
          ref={chatWindowRef}
          className={`absolute bottom-28 left-1/2 h-[80%] -translate-x-1/2 w-[700px] transition-all duration-300 ease-in-out z-10 ${isChatOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}
        >
          {isChatRendered && <ChatWindow onClose={handleCloseChat} />}
        </div>
        <div
          id="chat-bar"
          ref={chatBarRef}
          className={`absolute bottom-10 left-1/2 -translate-x-1/2 transition-all duration-200 z-20 ${isChatOpen ? 'scale-105' : ''}`}
          onClick={handleChatBarClick}
        >
            <Input
              ref={inputRef}
              placeholder="Start chatting now..."
              className={`w-[480px] h-12 border-0 placeholder:text-[#7C868D] pl-7 outline-0 transition-all duration-200 ${isChatFocused ? 'ring-2 ring-blue-400' : ''}`}
              style={{ 
                background: isChatFocused ? '#E8EBED' : '#D0D5D8', 
                color: '#7C868D', 
                boxShadow: '1px 5px 10px rgba(0,0,0,0.1)', 
                outline: 'none', 
                borderRadius: '15px',
                transform: isChatFocused ? 'translateY(-2px)' : 'translateY(0)'
              }}
              onFocus={() => {
                setIsChatFocused(true);
                if (!isChatOpen) {
                  setIsChatRendered(true);
                  setTimeout(() => setIsChatOpen(true), 10);
                }
              }}
              onBlur={() => setIsChatFocused(false)}
            />
        </div>
    </div>
  );
}
