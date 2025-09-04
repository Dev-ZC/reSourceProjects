import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Node, NodeProps } from 'reactflow';
// Locally defined because the type may be missing from @types/react-resizable

interface ResizeCallbackData {
  node: HTMLElement;
  size: { width: number; height: number };
  handle: 's' | 'w' | 'e' | 'n' | 'sw' | 'nw' | 'se' | 'ne';
}

import Image from 'next/image';
import LinkIcon from '../icons/websiteNodeIcon.svg';
// Custom styles for resizable handles to make them more visible
const resizableStyles = `
  .react-resizable {
    position: relative;
  }
  .react-resizable-handle {
    position: absolute;
    width: 20px;
    height: 20px;
    bottom: 0;
    right: 0;
    background: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA2IDYiIHN0eWxlPSJiYWNrZ3JvdW5kLWNvbG9yOiNmZmZmZmYwMCIgeD0iMHB4IiB5PSIwcHgiIHdpZHRoPSI2cHgiIGhlaWdodD0iNnB4Ij48ZyBvcGFjaXR5PSIwLjMwMiI+PHBhdGggZD0iTSA2IDYgTCAwIDYgTCAwIDQuMiBMIDQgNC4yIEwgNC4yIDQuMiBMIDQuMiAwIEwgNiAwIEwgNiA2IEwgNiA2IFoiIGZpbGw9IiMwMDAwMDAiLz48L2c+PC9zdmc+');
    background-position: bottom right;
    padding: 0 3px 3px 0;
    background-repeat: no-repeat;
    background-origin: content-box;
    box-sizing: border-box;
    cursor: se-resize;
    z-index: 10;
  }
  .react-resizable-handle-sw {
    transform: rotate(90deg);
    left: 0;
    right: auto;
    cursor: sw-resize;
  }
  .react-resizable-handle-nw {
    transform: rotate(180deg);
    top: 0;
    bottom: auto;
    cursor: nw-resize;
  }
  .react-resizable-handle-ne {
    transform: rotate(270deg);
    top: 0;
    bottom: auto;
    right: 0;
    left: auto;
    cursor: ne-resize;
  }
  .react-resizable-handle-s {
    width: 100%;
    height: 10px;
    bottom: 0;
    right: 0;
    cursor: s-resize;
  }
  .react-resizable-handle-n {
    width: 100%;
    height: 10px;
    top: 0;
    bottom: auto;
    cursor: n-resize;
  }
  .react-resizable-handle-e {
    width: 10px;
    height: 100%;
    right: 0;
    top: 0;
    cursor: e-resize;
  }
  .react-resizable-handle-w {
    width: 10px;
    height: 100%;
    left: 0;
    top: 0;
    cursor: w-resize;
  }
`;

// Add styles to document head
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.innerHTML = resizableStyles;
  document.head.appendChild(style);
}

// Define the data shape for our link node
type LinkNodeData = {
  title: string;
  url: string;
  isExpanded?: boolean;
};

type LinkNodeType = Node<LinkNodeData>;

const LinkNode = (props: NodeProps<LinkNodeData>) => {
  const { data } = props;
  const { title, url, isExpanded = false } = data;
  const [expanded, setExpanded] = useState(isExpanded);
  const MIN_WIDTH = 400;
const MIN_HEIGHT = 300;
const MAX_WIDTH = 1200;
const MAX_HEIGHT = 900;
const SIZE_STEP = 100;
const [size, setSize] = useState({ width: 800, height: 600 });

  const toggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded(!expanded);
  };

  const incrementSize = () => {
    setSize(prev => ({
      width: Math.min(prev.width + SIZE_STEP, MAX_WIDTH),
      height: Math.min(prev.height + SIZE_STEP, MAX_HEIGHT)
    }));
  };

  const decrementSize = () => {
    setSize(prev => ({
      width: Math.max(prev.width - SIZE_STEP, MIN_WIDTH),
      height: Math.max(prev.height - SIZE_STEP, MIN_HEIGHT)
    }));
  };

  // Remove custom resize logic and refs (not needed with react-resizable)


  // Add smooth transition for the expanded state
  const expandedStyle = {
    width: size.width,
    height: size.height,
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', // Smooth easing function
    overflow: 'hidden',
    opacity: expanded ? 1 : 0,
    transform: expanded ? 'scale(1)' : 'scale(0.95)',
    transformOrigin: 'top left',
  };

  if (expanded) {
    return (
      <div className="flex flex-col" style={expandedStyle}>
        {/* Header with controls - absolutely positioned above iframe */}
        <div 
          className="bg-white dark:bg-gray-800 rounded-t-lg border-t border-l border-r border-gray-200 dark:border-gray-700 z-50 relative transition-all duration-300"
          style={{ pointerEvents: 'auto' }}
        >
          <div className="flex justify-between items-center p-4">
            <h3 className="font-medium text-gray-800 dark:text-gray-100 truncate max-w-[80%]">
              {title}
            </h3>
            <div className="flex items-center space-x-2">
              <a 
                href={url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-1 text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400 transition-transform duration-150 hover:scale-125"
                onClick={(e) => e.stopPropagation()}
                title="Open in new tab"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                  <polyline points="15 3 21 3 21 9"></polyline>
                  <line x1="10" y1="14" x2="21" y2="3"></line>
                </svg>
              </a>
              <button
                onClick={decrementSize}
                className="cursor-pointer p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-transform duration-150 hover:scale-125"
                aria-label="Decrease Size"
                disabled={size.width === MIN_WIDTH && size.height === MIN_HEIGHT}
                title="Minimize size"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="6" y="11" width="12" height="2" rx="1" fill="currentColor" />
                </svg>
              </button>
              <button
                onClick={incrementSize}
                className="cursor-pointer p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-transform duration-150 hover:scale-125"
                aria-label="Increase Size"
                disabled={size.width === MAX_WIDTH && size.height === MAX_HEIGHT}
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
                aria-label="Minimize"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6 15L12 9L18 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
        
        {/* Iframe container - takes remaining space */}
        <div 
          className="flex-1 overflow-hidden border-b border-l border-r border-gray-200 dark:border-gray-700 rounded-b-lg"
          style={{
            width: '100%',
            height: `calc(100% - 72px)`, // Account for header height
            position: 'relative',
            zIndex: 1
          }}
        >
          <iframe
            src={url}
            className="w-full h-full"
            title={title}
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
            style={{
              border: 'none',
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundColor: 'white',
              zIndex: 1
            }}
          />
        </div>
      </div>
    );
  }

  const collapsedStyle = {
    opacity: expanded ? 0 : 1,
    transform: expanded ? 'scale(0.95)' : 'scale(1)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    width: '100%',
    height: '100%',
  };

  return (
    <div 
      className="group flex flex-col items-center p-4 w-40 hover:scale-[1.03] cursor-pointer relative"
      onClick={toggleExpand}
      style={collapsedStyle}
    >
      <div className="relative w-24 h-24 mb-2 flex items-center justify-center">
        <div className="absolute inset-0 dark:bg-gray-800/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="w-20 h-20 relative transform transition-all duration-300 group-hover:scale-105">
            <Image 
                src={LinkIcon} 
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
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate w-32">
          {new URL(url).hostname}
        </div>
      </div>
      
      {/* Settings Icon - appears on hover above the node */}
      <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:-translate-y-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            // Add settings functionality here
            console.log('Settings clicked for link:', title);
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
    </div>
  );
};

export default LinkNode;