'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Node, NodeProps } from 'reactflow';
import { useReactFlow } from '@xyflow/react';
import Image from 'next/image';
import DocsNodeIcon from '../icons/docsNodeIcon.svg';
import NodeSettingsMenu from './NodeSettingsMenu';
import { useAutoSaveDocument, useGetDocument, useUpdateDocument } from '../../../api/queries/docs';

// Define the data shape for our docs node
type DocsNodeData = {
  title: string;
  createdAt: string;
  content?: string;
  isNew?: boolean;
  docId?: string; // Add document ID for autosave
};

type DocsNodeType = Node<DocsNodeData>;

// Import Quill styles
import 'quill/dist/quill.bubble.css';
import 'quill/dist/quill.snow.css';

const DocsNode = (props: NodeProps<DocsNodeData>) => {
    const { setCenter, getNode, getViewport, setNodes } = useReactFlow();
    const { data, id, selected } = props;
    const { title, createdAt, content: initialContent = '', isNew = false, docId } = data;
    const [expanded, setExpanded] = useState(false);
    const [content, setContent] = useState(initialContent);
    const [size, setSize] = useState({ width: 800, height: 600 });
    const [showSettings, setShowSettings] = useState(false);
    const [settingsPosition, setSettingsPosition] = useState({ x: 0, y: 0 });
    const [isLoadingContent, setIsLoadingContent] = useState(false);
    const expandedNodeRef = useRef<HTMLDivElement>(null);
    const collapsedNodeRef = useRef<HTMLDivElement>(null);
    const editorRef = useRef<HTMLDivElement>(null);
    const quillRef = useRef<any>(null);
    const isTypingRef = useRef(false);

    // Initialize autosave hook (only if docId exists)
    const { autoSave, isSaving, saveError, cleanup } = useAutoSaveDocument(docId || '', 3000);
  
    // Initialize get document hook
    const getDocumentMutation = useGetDocument(docId || '');
    const updateDocumentMutation = useUpdateDocument();

  // Handle settings save - backend-first approach
  const handleSettingsSave = async (data: { title: string }) => {
    if (!docId) {
      console.error('No docId available for update');
      return;
    }

    try {
      // Update in backend first
      await updateDocumentMutation.mutateAsync({
        doc_id: docId,
        data: { doc_name: data.title }
      });

      // Only update frontend after successful backend update
      setNodes((nodes) =>
        nodes.map((node) =>
          node.id === id
            ? { ...node, data: { ...node.data, title: data.title, isNew: false } }
            : node
        )
      );
    } catch (error) {
      console.error('Failed to update document:', error);
      // Optionally show user-friendly error message
    }
  };

  // Auto-open settings for new nodes
  useEffect(() => {
    if (isNew && collapsedNodeRef.current) {
      const rect = collapsedNodeRef.current.getBoundingClientRect();
      setSettingsPosition({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2 - 10
      });
      setShowSettings(true);
    }
  }, [isNew]);

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

  // Fetch document content when expanded
  useEffect(() => {
    if (expanded && docId && !content) {
      console.log('Fetching content for docId:', docId);
      setIsLoadingContent(true);
      getDocumentMutation.mutate(docId, {
        onSuccess: (data: any) => {
          console.log('Document fetch success, received data:', data);
          setIsLoadingContent(false);
          if (data.document?.content) {
            console.log('Setting content:', data.document.content);
            setContent(data.document.content);
          } else {
            console.log('No content found in document data');
          }
        },
        onError: (error: any) => {
          console.error('Failed to fetch document content:', error);
          setIsLoadingContent(false);
        }
      });
    }
  }, [expanded, docId, content]);

  // Initialize Quill only when expanded
  useEffect(() => {
    if (expanded && editorRef.current && !quillRef.current) {
      import('quill').then(QuillModule => {
        const Quill = QuillModule.default;
        
        // Create a fresh div for Quill
        const quillContainer = document.createElement('div');
        editorRef.current!.appendChild(quillContainer);
        
        // Add CSS fix for cursor positioning issue
        const styleId = `quill-cursor-fix`;
        let existingStyle = document.getElementById(styleId);
        if (!existingStyle) {
          const style = document.createElement('style');
          style.id = styleId;
          style.textContent = `
            .ql-editor > * { 
              cursor: initial !important;
            }
          `;
          document.head.appendChild(style);
        }
        
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
          console.log('Setting Quill content:', content);
          quillRef.current.root.innerHTML = content;
        } else {
          console.log('No content to set in Quill editor');
        }

        quillRef.current.on('text-change', (delta: any, oldDelta: any, source: string) => {
          // Only update content if the change came from user input
          if (source === 'user') {
            isTypingRef.current = true;
            const newContent = quillRef.current.root.innerHTML;
            setContent(newContent);
            
            console.log('Text changed, docId:', docId, 'content length:', newContent.length);
            
            if (docId) {
              console.log('Triggering autosave for docId:', docId);
              autoSave(newContent);
            } else {
              console.log('No docId provided, autosave skipped');
            }
            
            // Reset typing flag after a short delay
            setTimeout(() => {
              isTypingRef.current = false;
            }, 100);
          }
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
      
      // Cleanup autosave timeout
      cleanup();
    };
  }, [expanded, cleanup]);

  // Update Quill content when content state changes (but not during active editing)
  useEffect(() => {
    if (quillRef.current && content && !isTypingRef.current) {
      console.log('Updating Quill with new content:', content);
      quillRef.current.root.innerHTML = content;
    }
  }, [content]);

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
      
      // Cleanup autosave timeout
      cleanup();
    };
  }, [expanded, cleanup]);

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
      const currentContent = quillRef.current.root.innerHTML;
      setContent(currentContent);
      
      // Trigger immediate save if docId exists and content has changed
      if (docId && currentContent !== content) {
        console.log('Saving content on node close:', currentContent);
        autoSave(currentContent);
      }
      
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
  };

  // Render expanded state
  if (expanded) {
    return (
      <div 
        className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg flex flex-col overflow-hidden"
        style={expandedStyle}
        ref={expandedNodeRef}
        data-ignore-drag
        dir="ltr"
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
          <div className="flex items-center space-x-2 max-w-[60%]">
            <h3 className="font-medium text-gray-800 dark:text-gray-100 truncate">
              {title}
            </h3>
            {docId && isSaving && (
              <div className="flex items-center space-x-1 text-xs text-blue-500">
                <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Saving...</span>
              </div>
            )}
            {docId && saveError && (
              <div className="flex items-center space-x-1 text-xs text-red-500" title={saveError.message}>
                <svg className="h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <span>Error</span>
              </div>
            )}
          </div>
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
            className="nodrag flex-1 overflow-auto relative"
            style={{ 
                height: `calc(100% - 56px)`,
                backgroundColor: 'white',
                color: '#1F2937',
                cursor: 'text',
                pointerEvents: 'auto',
                direction: 'ltr',
                textAlign: 'left',
                unicodeBidi: 'normal'
            }}
            tabIndex={0}
        >
          {/* Loading overlay */}
          {isLoadingContent && (
            <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 z-10">
              <div className="flex items-center space-x-2 text-gray-500">
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Loading content...</span>
              </div>
            </div>
          )}
        </div>
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
      className="group flex flex-col items-center p-4 w-40 hover:scale-[1.03] cursor-pointer relative"
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
          {createdAt?.replace(/\//g, '-')}
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
        nodeType="docs"
        currentTitle={title}
        onSave={handleSettingsSave}
        position={settingsPosition}
      />
    </div>
  );
};

export default DocsNode;