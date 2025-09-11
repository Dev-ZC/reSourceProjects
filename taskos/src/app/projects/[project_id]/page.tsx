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
  useReactFlow,
  Viewport
} from '@xyflow/react';
import { Input } from "@/components/ui/input";
import ChatWindow, { Message } from './components/chatWindow';
import NodeMiniBar from './components/NodeMiniBar';
import { useContinueChat } from '@/app/api/queries/chat';
import { useAutoSaveFlow, useLoadFlow } from '@/app/api/queries/flows';
import { useGetProject } from '@/app/api/queries/projects';
import { useParams, useRouter } from 'next/navigation';
 
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

const TextBoxNode = dynamic(
  () => import('./components/textBoxNode'),
  { ssr: false }
);

const nodeTypes = {
  folderNode: FolderNode as any,
  linkNode: LinkNode as any,
  docsNode: DocsNode as any,
  textBoxNode: TextBoxNode as any,
};
 
const initialNodes: any[] = [];
const initialEdges: any[] = [];
 
export default function App() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.project_id as string;
  
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  
  // Check if project exists
  const { data: projectData, isLoading: isLoadingProject, isError: isProjectError } = useGetProject(projectId);
  
  // Auto-save functionality
  const { autoSave, isSaving } = useAutoSaveFlow(projectId);
  const { data: loadedFlow, isLoading: isLoadingFlow, isError: isFlowError } = useLoadFlow(projectId);
  
  // Refs to track current state for auto-save
  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);
  const viewportRef = useRef({ x: 0, y: 0, zoom: 1 });
  
  // Update refs when state changes
  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);
  
  useEffect(() => {
    edgesRef.current = edges;
  }, [edges]);
  
 
    
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isChatFocused, setIsChatFocused] = useState(false);
  const [isChatRendered, setIsChatRendered] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newNodeId, setNewNodeId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatWindowRef = useRef<HTMLDivElement>(null);
  const chatBarRef = useRef<HTMLDivElement>(null);
  const continueChatMutation = useContinueChat();
  
  // Handle project not found or error
  useEffect(() => {
    // If project data loaded but project doesn't exist, or there was an error loading the project
    if ((!isLoadingProject && !projectData?.project) || isProjectError || isFlowError) {
      console.log('Project not found or error, redirecting to projects page');
      router.push('/projects');
    }
  }, [isLoadingProject, projectData, isProjectError, isFlowError, router]);

  // Load existing flow state on mount
  useEffect(() => {
    if (loadedFlow?.flow_state) {
      setNodes(loadedFlow.flow_state.nodes || []);
      setEdges(loadedFlow.flow_state.edges || []);
    }
  }, [loadedFlow, setNodes, setEdges]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );


  // Close chat when clicking on pane
  const onPaneClick = useCallback(() => {
    handleCloseChat();
  }, []);

  // Handle node changes with auto-save
  const handleNodesChange = useCallback((changes: any) => {
    onNodesChange(changes);
    
    // Use setTimeout to ensure state is updated before auto-save
    setTimeout(() => {
      autoSave({
        nodes: nodesRef.current,
        edges: edgesRef.current,
        viewport: viewportRef.current
      });
    }, 0);
  }, [onNodesChange, autoSave]);

  // Handle viewport changes (no auto-save)
  const handleViewportChange = useCallback((viewport: Viewport) => {
    viewportRef.current = viewport;
    // Removed auto-save from viewport changes - only save on node movements
  }, []);

  // Handle new doc node added via drag and drop
  const handleDocNodeAdded = useCallback((nodeId: string) => {
    setNewNodeId(nodeId);
    // Clear the flag after a short delay to allow the node to render
    setTimeout(() => {
      setNewNodeId(null);
    }, 100);
  }, []);

  // Handle new folder node added via drag and drop
  const handleFolderNodeAdded = useCallback((nodeId: string) => {
    setNewNodeId(nodeId);
    // Clear the flag after a short delay to allow the node to render
    setTimeout(() => {
      setNewNodeId(null);
    }, 100);
  }, []);

  // Handle new link node added via drag and drop
  const handleLinkNodeAdded = useCallback((nodeId: string) => {
    setNewNodeId(nodeId);
    // Clear the flag after a short delay to allow the node to render
    setTimeout(() => {
      setNewNodeId(null);
    }, 100);
  }, []);

  // Handle new text box node added via drag and drop
  const handleTextBoxNodeAdded = useCallback((nodeId: string) => {
    setNewNodeId(nodeId);
    // Clear the flag after a short delay to allow the node to render
    setTimeout(() => {
      setNewNodeId(null);
    }, 100);
  }, []);
  
  

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
        project_id: projectId
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
    <div className="w-full h-full overflow-hidden relative">
        <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={handleNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onViewportChange={handleViewportChange}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            proOptions={{ hideAttribution: true }}
            noDragClassName='nodrag'
            autoPanSpeed={20}
            panOnScroll
        >
        <Controls/>
        {/*<MiniMap />*/}
        <Background bgColor='#C4CACC' color='#C4CACC' gap={12} size={1} />
        <NodeMiniBar 
          onDocNodeAdded={handleDocNodeAdded}
          onFolderNodeAdded={handleFolderNodeAdded}
          onLinkNodeAdded={handleLinkNodeAdded}
          onTextBoxNodeAdded={handleTextBoxNodeAdded}
        />
        </ReactFlow>
        
        {/* Loading overlay for canvas */}
        {(isLoadingFlow || isLoadingProject) && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
            <div className="flex items-center space-x-2 text-gray-700 bg-white bg-opacity-90 px-4 py-2 rounded-lg shadow-lg">
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Loading project...</span>
            </div>
          </div>
        )}
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
                className="absolute right-5 top-1/2 -translate-y-[55%] text-[#7C868D] hover:text-gray-800 hover:scale-110 focus:outline-none cursor-pointer transition-all duration-200 ease-in-out"
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
