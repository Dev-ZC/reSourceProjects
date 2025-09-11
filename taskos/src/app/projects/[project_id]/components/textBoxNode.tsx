import React, { useState, useRef, useEffect } from 'react';
import { Node, NodeProps } from 'reactflow';
import { useReactFlow } from '@xyflow/react';

// Add custom CSS for hiding scrollbars and text selection containment
const scrollbarHideStyles = `
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
  .text-container {
    contain: layout style;
    isolation: isolate;
  }
  .text-container::selection {
    background: rgba(59, 130, 246, 0.3);
  }
  .text-container *::selection {
    background: rgba(59, 130, 246, 0.3);
  }
`;

// Inject styles if not already present
if (typeof document !== 'undefined' && !document.getElementById('scrollbar-hide-styles')) {
  const style = document.createElement('style');
  style.id = 'scrollbar-hide-styles';
  style.textContent = scrollbarHideStyles;
  document.head.appendChild(style);
}

// Define the data shape for our text box node
type TextBoxNodeData = {
  text: string;
  isNew?: boolean;
  width?: number;
  height?: number;
};

type TextBoxNodeType = Node<TextBoxNodeData>;

const TextBoxNode = (props: NodeProps<TextBoxNodeData>) => {
  const { setNodes } = useReactFlow();
  const { data, id } = props;
  const { text, isNew = false, width = 200, height = 120 } = data;
  const [currentText, setCurrentText] = useState(text);
  const [isEditing, setIsEditing] = useState(false);
  const [nodeSize, setNodeSize] = useState({ width, height });
  const [isResizing, setIsResizing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const nodeRef = useRef<HTMLDivElement>(null);
  const resizeRef = useRef<HTMLDivElement>(null);

  // Handle delete - frontend-only for text boxes
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setNodes((nodes) => nodes.filter((node) => node.id !== id));
  };

  // Auto-start editing for new nodes
  React.useEffect(() => {
    if (isNew) {
      setIsEditing(true);
      // Mark as no longer new after starting edit
      setNodes((nodes) =>
        nodes.map((node) =>
          node.id === id
            ? { ...node, data: { ...node.data, isNew: false } }
            : node
        )
      );
    }
  }, [isNew, id, setNodes]);

  // Handle text editing
  const handleTextClick = (e: React.MouseEvent) => {
    if (!isResizing) {
      e.stopPropagation();
      setIsEditing(true);
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setCurrentText(newText);
    
    // Update the node data in real-time
    setNodes((nodes) =>
      nodes.map((node) =>
        node.id === id
          ? { ...node, data: { ...node.data, text: newText } }
          : node
      )
    );
  };

  const handleTextBlur = () => {
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsEditing(false);
    }
  };

  // Handle resizing
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = nodeSize.width;
    const startHeight = nodeSize.height;

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      
      const newWidth = Math.max(150, startWidth + (e.clientX - startX));
      const newHeight = Math.max(80, startHeight + (e.clientY - startY));
      
      setNodeSize({ width: newWidth, height: newHeight });
      
      // Update node data
      setNodes((nodes) =>
        nodes.map((node) =>
          node.id === id
            ? { ...node, data: { ...node.data, width: newWidth, height: newHeight } }
            : node
        )
      );
    };

    const handleMouseUp = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Focus textarea when editing starts
  useEffect(() => {
    if (textareaRef.current && isEditing) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  return (
    <div 
      ref={nodeRef}
      className="group relative bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 p-3"
      style={{ width: nodeSize.width, height: nodeSize.height, overflow: 'visible' }}
    >
      {isEditing ? (
        <textarea
          ref={textareaRef}
          value={currentText}
          onChange={handleTextChange}
          onBlur={handleTextBlur}
          onKeyDown={handleKeyDown}
          className="w-full h-full resize-none border-none outline-none bg-transparent text-gray-800 dark:text-gray-100 text-sm leading-relaxed nodrag scrollbar-hide overflow-y-auto overflow-x-hidden"
          placeholder="Enter your text..."
          style={{ 
            padding: '4px', 
            wordWrap: 'break-word', 
            overflowWrap: 'break-word',
            whiteSpace: 'pre-wrap'
          }}
        />
      ) : (
        <div
          onClick={handleTextClick}
          className="cursor-text text-gray-800 dark:text-gray-100 text-sm leading-relaxed whitespace-pre-wrap break-words h-full overflow-y-auto overflow-x-hidden nodrag scrollbar-hide text-container"
          style={{ 
            wordBreak: 'break-word', 
            overflowWrap: 'break-word',
            padding: '4px',
            position: 'relative',
            clipPath: 'inset(0)',
            contain: 'layout style'
          }}
        >
          {currentText || 'Click to edit text...'}
        </div>
      )}
      
      {/* Delete Button - appears on hover above the node like settings */}
      <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:-translate-y-2 cursor-pointer z-10">
        <button
          onClick={handleDelete}
          className="cursor-pointer bg-red-500 hover:bg-red-600 text-white rounded-full p-2 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110"
          title="Delete text box"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3,6 5,6 21,6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            <line x1="10" y1="11" x2="10" y2="17"></line>
            <line x1="14" y1="11" x2="14" y2="17"></line>
          </svg>
        </button>
      </div>
      
      {/* Resize Handle */}
      <div 
        ref={resizeRef}
        onMouseDown={handleMouseDown}
        className="absolute -bottom-1 -right-1 w-5 h-5 cursor-se-resize opacity-0 group-hover:opacity-100 transition-opacity duration-200 nodrag bg-white dark:bg-gray-800 rounded-br-lg flex items-center justify-center"
        title="Resize"
        style={{ pointerEvents: 'auto' }}
      >
        <div className="w-3 h-3 border-r-2 border-b-2 border-gray-400"></div>
      </div>
    </div>
  );
};

export default TextBoxNode;
