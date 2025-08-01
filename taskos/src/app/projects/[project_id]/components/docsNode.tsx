'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Node, NodeProps } from 'reactflow';
import { useReactFlow } from '@xyflow/react';
import Image from 'next/image';
import DocsNodeIcon from '../icons/docsNodeIcon.svg';

// Define the data shape for our docs node
type DocsNodeData = {
  title: string;
  createdAt: string;
  content?: string;
};

type DocsNodeType = Node<DocsNodeData>;

// Import Quill styles
import 'quill/dist/quill.bubble.css';
import 'quill/dist/quill.snow.css';

const DocsNode = (props: NodeProps<DocsNodeData>) => {
    const { setCenter, getNode, getViewport } = useReactFlow();
    const { data, id, selected } = props;
    const { title, createdAt, content: initialContent = '' } = data;
    const [expanded, setExpanded] = useState(false);
    const [content, setContent] = useState(initialContent);
    const [size, setSize] = useState({ width: 800, height: 600 });
    const expandedNodeRef = useRef<HTMLDivElement>(null);
    const collapsedNodeRef = useRef<HTMLDivElement>(null);
    const editorRef = useRef<HTMLDivElement>(null);
    const quillRef = useRef<any>(null);

  // Initialize Quill only when expanded
  useEffect(() => {
    if (expanded && editorRef.current && !quillRef.current) {
      import('quill').then(QuillModule => {
        const Quill = QuillModule.default;
        
        // Create a fresh div for Quill
        const quillContainer = document.createElement('div');
        editorRef.current!.appendChild(quillContainer);
        
        quillRef.current = new Quill(quillContainer, {
          theme: 'bubble',
          bounds: editorRef.current,
          placeholder: 'Start writing...',
          modules: {
            toolbar: [
              ['bold', 'italic', 'underline', 'strike'],
              ['blockquote', 'code-block'],
              [{ 'header': 1 }, { 'header': 2 }],
              [{ 'list': 'ordered' }, { 'list': 'bullet' }],
              ['link']
            ]
          },
          formats: [
            'header',
            'bold', 'italic', 'underline', 'strike',
            'list',
            'link', 'code-block',
            'blockquote'
          ]
        });
  
        if (content) {
          quillRef.current.root.innerHTML = content;
        }
  
        quillRef.current.on('text-change', () => {
          setContent(quillRef.current.root.innerHTML);
        });
  
        // Custom bubble positioning logic
        const tooltip = quillRef.current.theme.tooltip;
        if (tooltip) {
          const originalPosition = tooltip.position.bind(tooltip);
          tooltip.position = function(reference: any) {
            const result = originalPosition(reference);
            
            const editorBounds = editorRef.current;
            if (!editorBounds) return result;

            const editorRect = editorBounds.getBoundingClientRect();
            const tooltipRect = this.root.getBoundingClientRect();
            
            const tooltipLeft = parseInt(this.root.style.left) || 0;
            const tooltipWidth = tooltipRect.width;
            
            if (tooltipLeft < 0) {
              this.root.style.left = '10px';
            } else if (tooltipLeft + tooltipWidth > editorRect.width) {
              this.root.style.left = `${editorRect.width - tooltipWidth - 10}px`;
            }
            
            return result;
          };
        }
      });
    }
  }, [expanded, content]);

  // Cleanup when collapsing or unmounting
  useEffect(() => {
    return () => {
      if (quillRef.current) {
        // Save content before cleanup
        if (quillRef.current.root) {
          setContent(quillRef.current.root.innerHTML);
        }
        
        // Remove event listeners
        if (quillRef.current.off) {
          quillRef.current.off('text-change');
        }
        
        // Clear Quill instance
        quillRef.current = null;
      }
      
      // Clear editor container completely
      if (editorRef.current) {
        editorRef.current.innerHTML = '';
      }
    };
  }, [expanded]);

  // Node size constraints
  const MIN_WIDTH = 500;
  const MIN_HEIGHT = 400;
  const MAX_WIDTH = 1000;
  const MAX_HEIGHT = 800;
  const SIZE_STEP = 100;

  const toggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Save content before toggling if we're collapsing
    if (expanded && quillRef.current && quillRef.current.root) {
      setContent(quillRef.current.root.innerHTML);
      
      // Clean up Quill instance immediately
      quillRef.current.off('text-change');
      quillRef.current = null;
      
      // Clear editor container
      if (editorRef.current) {
        editorRef.current.innerHTML = '';
      }
    }
    
    setExpanded(!expanded);
  };

  const incrementSize = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSize(prev => ({
      width: Math.min(prev.width + SIZE_STEP, MAX_WIDTH),
      height: Math.min(prev.height + SIZE_STEP, MAX_HEIGHT)
    }));
  };

  const decrementSize = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSize(prev => ({
      width: Math.max(prev.width - SIZE_STEP, MIN_WIDTH),
      height: Math.max(prev.height - SIZE_STEP, MIN_HEIGHT)
    }));
  };

  // Center the node using React Flow's setCenter API
  const centerNode = (e: React.MouseEvent) => {
    e.stopPropagation();
    const node = getNode(id);
    const currentNodeRef = expanded ? expandedNodeRef.current : collapsedNodeRef.current;
    
    if (node && currentNodeRef) {
      // Get the actual rendered dimensions of the node
      const nodeRect = currentNodeRef.getBoundingClientRect();
      const flow = currentNodeRef.closest('.react-flow');
      
      if (flow) {
        // Get current zoom level
        const { zoom } = getViewport();
        
        // Calculate actual node dimensions (unscaled)
        const nodeWidth = nodeRect.width / zoom;
        const nodeHeight = nodeRect.height / zoom;
        
        // Calculate the center point of the node
        const nodeCenterX = node.position.x + nodeWidth / 2;
        const nodeCenterY = node.position.y + nodeHeight / 2;
        
        console.log('Node dimensions:', { nodeWidth, nodeHeight, zoom, position: node.position });
        
        setCenter(nodeCenterX, nodeCenterY, { zoom: 1, duration: 500 });
      }
    }
  };

  // Style for expanded state with smooth transitions
  const expandedStyle = {
    width: size.width,
    height: size.height,
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    opacity: expanded ? 1 : 0,
    transform: expanded ? 'scale(1)' : 'scale(0.95)',
    transformOrigin: 'top left',
  };

  // Render expanded state
  if (expanded) {
    return (
      <div 
        className="flex flex-col bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
        style={{
            ...expandedStyle,
            pointerEvents: 'none',
          }}
        ref={expandedNodeRef}
        tabIndex={-1}
      >
        {/* Header with controls */}
        <div
            className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700 z-50 relative bg-white dark:bg-gray-800 select-none"
            style={{ cursor: 'grab', pointerEvents: 'auto', userSelect: 'none' }}
            data-drag-handle
            onMouseDown={e => e.stopPropagation()} 
            onPointerDown={e => e.stopPropagation()} 
            onClick={e => e.stopPropagation()}
          >
          <h3 className="font-medium text-gray-800 dark:text-gray-100 truncate max-w-[60%]">
            {title}
          </h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={centerNode}
              className="cursor-pointer p-1 text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400 transition-transform duration-150 hover:scale-125"
              title="Center view"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M8 12H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 16V8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button
              onClick={decrementSize}
              className="cursor-pointer p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-transform duration-150 hover:scale-125"
              disabled={size.width <= MIN_WIDTH && size.height <= MIN_HEIGHT}
              title="Shrink size"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="6" y="11" width="12" height="2" rx="1" fill="currentColor" />
              </svg>
            </button>
            <button
              onClick={incrementSize}
              className="cursor-pointer p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-transform duration-150 hover:scale-125"
              disabled={size.width >= MAX_WIDTH && size.height >= MAX_HEIGHT}
              title="Expand size"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="11" y="6" width="2" height="12" rx="1" fill="currentColor" />
                <rect x="6" y="11" width="12" height="2" rx="1" fill="currentColor" />
              </svg>
            </button>
            <button
              onClick={toggleExpand}
              className="cursor-pointer p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-transform duration-150 hover:scale-125"
              title="Minimize"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 15L12 9L18 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
        
        {/* Quill Editor Container */}
        <div 
            ref={editorRef} 
            className="nodrag flex-1 overflow-auto"
            style={{ 
                height: `calc(100% - 56px)`,
                backgroundColor: 'white',
                color: '#1F2937',
                cursor: 'text',
                pointerEvents: 'auto',
            }}
            tabIndex={0}
        />
      </div>
    );
  }

  // Collapsed state style
  const collapsedStyle = {
    opacity: expanded ? 0 : 1,
    transform: expanded ? 'scale(0.95)' : 'scale(1)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  };

  // Render collapsed state - completely separate from expanded
  return (
    <div 
      className="group flex flex-col items-center p-4 w-40 hover:scale-[1.03] cursor-pointer"
      style={collapsedStyle}
      ref={collapsedNodeRef}
      onClick={toggleExpand}
      data-ignore-drag
    >
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
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {createdAt}
        </div>
      </div>
    </div>
  );
};

export default DocsNode;