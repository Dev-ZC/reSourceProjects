'use client'

import React, { useCallback, useState, useRef, useEffect, FormEvent } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  NodeProps,
  useReactFlow
} from '@xyflow/react';
import { Input } from "@/components/ui/input";
import ChatWindow, { Message } from './components/chatWindow';
import { useContinueChat } from '@/app/api/queries/chat';
import { useLoadFlow, useAutoSaveFlow } from '@/app/api/queries/flows';
import { useParams } from 'next/navigation';
 
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
  const params = useParams();
  const projectId = params.project_id as string;
  
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  
  // Load flow data on mount
  const { data: flowData, isLoading: isLoadingFlow } = useLoadFlow(projectId);
  
  // Auto-save functionality with 2-second debounce
  const { autoSave, isSaving, saveError } = useAutoSaveFlow(projectId, 2000);
 
    
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isChatFocused, setIsChatFocused] = useState(false);
  const [isChatRendered, setIsChatRendered] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatWindowRef = useRef<HTMLDivElement>(null);
  const chatBarRef = useRef<HTMLDivElement>(null);
  const continueChatMutation = useContinueChat();

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );
  
  // Auto-save when nodes or edges change
  useEffect(() => {
    if (nodes.length > 0 || edges.length > 0) {
      const flowState = {
        nodes,
        edges,
        viewport: { x: 0, y: 0, zoom: 1 } // You can get actual viewport from useReactFlow if needed
      };
      autoSave(flowState);
    }
  }, [nodes, edges, autoSave]);
  
  // Load flow data when available
  useEffect(() => {
    if (flowData?.flow_state) {
      const { nodes: loadedNodes, edges: loadedEdges } = flowData.flow_state;
      if (loadedNodes && loadedNodes.length > 0) {
        setNodes(loadedNodes);
      }
      if (loadedEdges && loadedEdges.length > 0) {
        setEdges(loadedEdges);
      }
    }
  }, [flowData, setNodes, setEdges]);

        const handleChatBarClick = () => {
    if (!isChatOpen) {
      setIsChatRendered(true);
      setTimeout(() => setIsChatOpen(true), 10); // Allow component to mount before animating
    }
    inputRef.current?.focus();
  };

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      text: inputValue,
      timestamp: new Date()
    };

    // Add user message to the chat
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Convert messages to an array of strings for the conversation history
      const conversationHistory = [...messages, userMessage].map(msg => msg.text);
      
      const result = await continueChatMutation.mutateAsync({
        conversation_history: conversationHistory,
        project_id: '58b89576-ec2b-4d7c-aafd-2adb4b72d88e' // HARDCODED!!!!
      });

      if (result.model_response) {
        const botMessage: Message = {
          id: `bot-${Date.now()}`,
          type: 'bot',
          text: result.model_response,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, botMessage]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        type: 'bot',
        text: 'Sorry, there was an error processing your message. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
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
    <div className="w-full h-full overflow-hidden">
        {/* Auto-save status indicator */}
        {isSaving && (
          <div className="absolute top-4 right-4 z-30 bg-blue-500 text-white px-3 py-1 rounded-md text-sm">
            Saving...
          </div>
        )}
        {saveError && (
          <div className="absolute top-4 right-4 z-30 bg-red-500 text-white px-3 py-1 rounded-md text-sm">
            Save failed: {saveError.message}
          </div>
        )}
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
          {isChatRendered && (
            <ChatWindow 
              messages={messages}
              isLoading={isLoading}
              onClose={handleCloseChat} 
            />
          )}
        </div>
        <div
          id="chat-bar"
          ref={chatBarRef}
          className={`absolute bottom-10 left-1/2 -translate-x-1/2 transition-all duration-200 z-20 ${isChatOpen ? 'scale-105' : ''}`}
          onClick={handleChatBarClick}
        >
            <form onSubmit={handleSendMessage} className="w-full">
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Start chatting now..."
                className={`w-[480px] h-12 border-0 placeholder:text-[#7C868D] pl-7 pr-12 outline-0 transition-all duration-200 ${isChatFocused ? 'ring-2 ring-blue-400' : ''}`}
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
                disabled={isLoading}
              />
              <button 
                type="submit" 
                className="absolute right-5 top-1/2 -translate-y-[55%] text-[#7C868D] hover:text-blue-500 focus:outline-none cursor-pointer"
                disabled={!inputValue.trim() || isLoading}
              >
                <svg 
                  className="w-5 h-5" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" 
                  />
                </svg>
              </button>
            </form>
        </div>
    </div>
  );
}
