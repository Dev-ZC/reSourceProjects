import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Node, NodeProps } from 'reactflow';
import { useReactFlow } from '@xyflow/react';
import NodeSettingsMenu from './NodeSettingsMenu';
import { useUpdateLink, useDeleteLink } from '../../../api/queries/links';
import { useNodeStateContext } from '../contexts/NodeStateContext';
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
  title?: string;
  url: string;
  string: string;
  linkId?: string; // Backend-generated ID
  isNew?: boolean;
};

type LinkNodeType = Node<LinkNodeData>;

const LinkNode = (props: NodeProps<LinkNodeData>) => {
  const { setNodes, setCenter, getNode, getViewport } = useReactFlow();
  const { data, id } = props;
  const { title = data.string, url, string, linkId, isNew = false } = data;
  const [showSettings, setShowSettings] = useState(false);
  const [settingsPosition, setSettingsPosition] = useState({ x: 0, y: 0 });
  const updateLinkMutation = useUpdateLink();
  const deleteLinkMutation = useDeleteLink();
  const { updateNodeState, getNodeState, removeNodeState } = useNodeStateContext();

  // Helper function to safely get hostname from URL
  const getHostname = (url: string): string => {
    if (!url || url.trim() === '') {
      return 'No URL set';
    }
    try {
      return new URL(url).hostname;
    } catch {
      return 'Invalid URL';
    }
  };

  // Helper function to detect and convert YouTube URLs to embed format
  const getEmbedUrl = (url: string): string => {
    if (!url || url.trim() === '') {
      return url;
    }

    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.toLowerCase();
      
      // Check if it's a YouTube URL
      if (hostname === 'www.youtube.com' || hostname === 'youtube.com' || hostname === 'm.youtube.com') {
        const searchParams = urlObj.searchParams;
        const videoId = searchParams.get('v');
        
        if (videoId) {
          // Convert to embed URL
          return `https://www.youtube.com/embed/${videoId}`;
        }
      }
      
      // Check if it's a YouTube short URL (youtu.be)
      if (hostname === 'youtu.be') {
        const videoId = urlObj.pathname.slice(1); // Remove the leading '/'
        if (videoId) {
          return `https://www.youtube.com/embed/${videoId}`;
        }
      }
      
      // Check if it's already an embed URL
      if (hostname === 'www.youtube.com' && urlObj.pathname.startsWith('/embed/')) {
        return url; // Already an embed URL
      }
      
      // For non-YouTube URLs, return as-is
      return url;
    } catch {
      return url; // Return original URL if parsing fails
    }
  };

  // Helper function to check if URL is a YouTube video
  const isYouTubeVideo = (url: string): boolean => {
    if (!url || url.trim() === '') {
      return false;
    }

    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.toLowerCase();
      
      return (
        (hostname === 'www.youtube.com' || hostname === 'youtube.com' || hostname === 'm.youtube.com') &&
        (urlObj.searchParams.has('v') || urlObj.pathname.startsWith('/embed/'))
      ) || hostname === 'youtu.be';
    } catch {
      return false;
    }
  };

  // Helper function to check if URL is a Google service (for error handling)
  const getGoogleServiceName = (url: string): string => {
    if (!url || url.trim() === '') {
      return '';
    }

    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.toLowerCase();
      const pathname = urlObj.pathname.toLowerCase();
      
      if (hostname === 'docs.google.com') {
        if (pathname.includes('/document/')) {
          return 'Google Docs';
        } else if (pathname.includes('/spreadsheets/')) {
          return 'Google Sheets';
        } else if (pathname.includes('/presentation/')) {
          return 'Google Slides';
        } else if (pathname.includes('/forms/')) {
          return 'Google Forms';
        }
      } else if (hostname === 'colab.research.google.com') {
        return 'Google Colab';
      } else if (hostname === 'drive.google.com') {
        return 'Google Drive';
      }
      
      return '';
    } catch {
      return '';
    }
  };

  // Handle iframe load error
  const handleIframeError = () => {
    setIframeError(true);
    const googleService = getGoogleServiceName(url);
    if (googleService) {
      setShowGoogleInstructions(true);
    }
  };

  // Reset error states when URL changes
  React.useEffect(() => {
    setIframeError(false);
    setShowGoogleInstructions(false);
  }, [url]);

  // Handle settings save - backend-first approach
  const handleSettingsSave = async (data: { title: string; url?: string }) => {
    if (!linkId) {
      console.error('No linkId available for update');
      return;
    }

    try {
      // Update in backend first
      await updateLinkMutation.mutateAsync({
        link_id: linkId,
        data: { 
          string: data.title,
          url: data.url || url
        }
      });

      // Only update frontend after successful backend update
      setNodes((nodes) =>
        nodes.map((node) =>
          node.id === id
            ? { ...node, data: { ...node.data, string: data.title, url: data.url || node.data.url, isNew: false } }
            : node
        )
      );
    } catch (error) {
      console.error('Failed to update link:', error);
      // Optionally show user-friendly error message
    }
  };

  // Handle delete - backend-first approach
  const handleDelete = async () => {
    if (!linkId) {
      console.error('No linkId available for delete');
      return;
    }

    try {
      // Delete from backend first
      await deleteLinkMutation.mutateAsync(linkId);

      // Remove persistent state
      removeNodeState(id);

      // Only remove from frontend after successful backend deletion
      setNodes((nodes) => nodes.filter((node) => node.id !== id));
    } catch (error) {
      console.error('Failed to delete link:', error);
      // Optionally show user-friendly error message
    }
  };

  // Auto-open settings for new nodes
  React.useEffect(() => {
    if (isNew) {
      // Use a timeout to ensure the component is fully rendered
      setTimeout(() => {
        const linkElement = document.querySelector(`[data-id="${id}"]`);
        if (linkElement) {
          const rect = linkElement.getBoundingClientRect();
          setSettingsPosition({
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2 - 10
          });
          setShowSettings(true);
        }
      }, 100);
    }
  }, [isNew, id]);

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

  // Get persistent state
  const persistentState = getNodeState(id);
  const [expanded, setExpanded] = useState(persistentState.expanded || false);
  const MIN_WIDTH = 400;
  const MIN_HEIGHT = 300;
  const MAX_WIDTH = 1200;
  const MAX_HEIGHT = 900;
  const SIZE_STEP = 100;
  const [size, setSize] = useState(persistentState.size || { width: 800, height: 600 });
  const [iframeError, setIframeError] = useState(false);
  const [showGoogleInstructions, setShowGoogleInstructions] = useState(false);

  const toggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newExpanded = !expanded;
    setExpanded(newExpanded);
    updateNodeState(id, { expanded: newExpanded });
  };

  const incrementSize = () => {
    setSize(prev => {
      const newSize = {
        width: Math.min(prev.width + SIZE_STEP, MAX_WIDTH),
        height: Math.min(prev.height + SIZE_STEP, MAX_HEIGHT)
      };
      updateNodeState(id, { size: newSize });
      return newSize;
    });
  };

  const decrementSize = () => {
    setSize(prev => {
      const newSize = {
        width: Math.max(prev.width - SIZE_STEP, MIN_WIDTH),
        height: Math.max(prev.height - SIZE_STEP, MIN_HEIGHT)
      };
      updateNodeState(id, { size: newSize });
      return newSize;
    });
  };

  // Center the node using React Flow's setCenter API
  const centerNode = (e: React.MouseEvent) => {
    e.stopPropagation();
    const node = getNode(id);
    
    if (node) {
      // Get current zoom level
      const { zoom } = getViewport();
      
      // Calculate the center point of the node based on current size
      const nodeWidth = expanded ? size.width : 160; // 160px is the collapsed width (w-40)
      const nodeHeight = expanded ? size.height : 120; // Approximate collapsed height
      
      const nodeCenterX = node.position.x + nodeWidth / 2;
      const nodeCenterY = node.position.y + nodeHeight / 2;
      
      setCenter(nodeCenterX, nodeCenterY, { zoom: 1, duration: 500 });
    }
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
                className="p-1 text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400 transition-transform duration-150 hover:scale-125 mr-3"
                onClick={(e) => e.stopPropagation()}
                title="Open in new tab"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                  <polyline points="15 3 21 3 21 9"></polyline>
                  <line x1="10" y1="14" x2="21" y2="3"></line>
                </svg>
              </a>
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
          {iframeError ? (
            <div className="w-full h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-8">
              <div className="max-w-md text-center">
                {showGoogleInstructions ? (
                  // Google-specific instructions
                  <>
                    <div className="mb-4">
                      <svg className="w-16 h-16 mx-auto text-blue-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">
                      {getGoogleServiceName(url)} Embedding
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      This {getGoogleServiceName(url)} document couldn't be embedded. You may need to publish it to the web.
                    </p>
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 text-left">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Try these steps:
                      </p>
                      <ol className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                        <li>1. Open your document in {getGoogleServiceName(url)}</li>
                        <li>2. Click the <strong>Share</strong> button (top right corner)</li>
                        <li>3. Set permissions to <strong>"Anyone with the link"</strong> if you want others to edit within the frame</li>
                        <li>4. Go to <strong>File → Share → Publish to the web</strong></li>
                        <li>5. Click <strong>Publish</strong></li>
                        <li>6. Copy the embed URL that starts with:</li>
                        <li className="font-mono bg-gray-100 dark:bg-gray-700 p-1 rounded text-xs">
                          https://docs.google.com/...
                        </li>
                        <li>7. Update this link node with the embed URL</li>
                      </ol>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-2 italic">
                        💡 Setting "Anyone with the link" permissions allows collaborative editing directly within the embedded frame.
                      </p>
                    </div>
                  </>
                ) : (
                  // Generic connection refused message
                  <>
                    <div className="mb-4">
                      <svg className="w-16 h-16 mx-auto text-red-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">
                      Connection Refused
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      This website doesn't allow embedding in frames for security reasons.
                    </p>
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 text-left">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Why this happens:
                      </p>
                      <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                        <li>• The site has X-Frame-Options security headers</li>
                        <li>• Content Security Policy blocks iframe embedding</li>
                        <li>• The site prevents clickjacking attacks</li>
                      </ul>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mt-3 mb-2">
                        What you can do:
                      </p>
                      <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                        <li>• Use the "Open Original" button to view in a new tab</li>
                        <li>• Look for an embed or share option on the website</li>
                        <li>• Check if the site offers an API or widget</li>
                      </ul>
                    </div>
                  </>
                )}
                <div className="flex gap-2 mt-4">
                  <a 
                    href={url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg transition-colors"
                  >
                    Open Original
                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                  <button
                    onClick={() => {
                      setShowGoogleInstructions(false);
                      setIframeError(false);
                    }}
                    className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <iframe
              src={getEmbedUrl(url)}
              className="w-full h-full"
              title={title}
              sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
              allow={isYouTubeVideo(url) ? "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" : undefined}
              onError={handleIframeError}
              onLoad={() => {
                // Reset error state on successful load
                setIframeError(false);
                setShowGoogleInstructions(false);
              }}
              style={{
                border: 'none',
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundColor: 'white',
                zIndex: 1,
                display: iframeError ? 'none' : 'block'
              }}
            />
          )}
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
          {title || string}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate w-32">
          {getHostname(url)}
        </div>
      </div>
      
      {/* Hover buttons - appear on hover above the node */}
      <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:-translate-y-2 flex items-center space-x-2">
        {/* Go to link button */}
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="cursor-pointer bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-full p-2 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110"
          title="Go to link"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600 dark:text-blue-400">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
            <polyline points="15 3 21 3 21 9"></polyline>
            <line x1="10" y1="14" x2="21" y2="3"></line>
          </svg>
        </a>
        
        {/* Settings button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleSettingsClick(e);
          }}
          className="cursor-pointer bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-full p-2 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110"
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
        nodeType="link"
        currentTitle={title || string || 'New Link'}
        currentUrl={url}
        onSave={handleSettingsSave}
        onDelete={handleDelete}
        position={settingsPosition}
      />
    </div>
  );
};

export default LinkNode;