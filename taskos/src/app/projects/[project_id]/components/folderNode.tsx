import React, { useState, useEffect } from 'react';
import { Node, NodeProps } from 'reactflow';
import { useReactFlow } from '@xyflow/react';
import Image from 'next/image';
import FolderIcon from '../icons/folderIcon.svg';
import NodeSettingsMenu from './NodeSettingsMenu';
import { useNodeStateContext } from '../contexts/NodeStateContext';

// Define the data shape for our folder node
type FolderNodeData = {
  title: string;
  createdAt: string;
  isNew?: boolean;
  groupedNodes?: string[]; // Array of node IDs that are grouped to this folder
};

type FolderNodeType = Node<FolderNodeData>;

const FolderNode = (props: NodeProps<FolderNodeData>) => {
  const { setNodes, getNodes } = useReactFlow();
  const { updateNodeState } = useNodeStateContext();
  const { data, id } = props;
  const { title, createdAt, isNew = false, groupedNodes = [] } = data;
  const [showSettings, setShowSettings] = useState(false);
  const [settingsPosition, setSettingsPosition] = useState({ x: 0, y: 0 });
  const [isExpanded, setIsExpanded] = useState(false);

  // Handle settings save
  const handleSettingsSave = (data: { title: string }) => {
    setNodes((nodes) =>
      nodes.map((node) =>
        node.id === id
          ? { ...node, data: { ...node.data, title: data.title, isNew: false } }
          : node
      )
    );
  };

  // Handle delete - frontend-only for folders
  const handleDelete = () => {
    setNodes((nodes) => {
      // First, show any grouped nodes by removing their groupedToFolder property
      const updatedNodes = nodes.map(node => {
        if (groupedNodes.includes(node.id)) {
          return { ...node, data: { ...node.data, groupedToFolder: undefined } };
        }
        return node;
      });
      // Then remove the folder
      return updatedNodes.filter((node) => node.id !== id);
    });
  };

  // Auto-open settings for new nodes
  React.useEffect(() => {
    if (isNew) {
      // Use a timeout to ensure the component is fully rendered
      setTimeout(() => {
        const folderElement = document.querySelector(`[data-id="${id}"]`);
        if (folderElement) {
          const rect = folderElement.getBoundingClientRect();
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
    console.log('Settings clicked for folder:', id);
    // Add settings functionality here
  };

  const handleUngroup = () => {
    console.log('Ungrouping all nodes from folder:', id);
    
    // Get all grouped nodes and ungroup them
    setNodes((currentNodes) => {
      return currentNodes.map((node) => {
        if (node.data?.groupedToFolder === id) {
          // Remove groupedToFolder property and make node visible
          return {
            ...node,
            data: {
              ...node.data,
              groupedToFolder: undefined
            },
            hidden: false,
            style: {
              ...node.style,
              opacity: 1
            }
          };
        } else if (node.id === id) {
          // Clear the folder's groupedNodes array
          return {
            ...node,
            data: {
              ...node.data,
              groupedNodes: [],
              isExpanded: false
            }
          };
        }
        return node;
      });
    });

    // Update persistent state to mark folder as collapsed
    updateNodeState(id, { expanded: false });
  };

  // Handle folder click to toggle grouped nodes
  const handleFolderClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('Folder clicked:', id, 'Grouped nodes:', groupedNodes);
    
    if (groupedNodes && groupedNodes.length > 0) {
      const newExpanded = !isExpanded;
      setIsExpanded(newExpanded);
      console.log('Setting expanded to:', newExpanded);
      
      // Force a delay to ensure state updates properly
      setTimeout(() => {
        if (newExpanded) {
          // First ensure ALL grouped nodes are collapsed regardless of their previous state
          setNodes((nodes) => 
            nodes.map((node) => {
              if (node.data?.groupedToFolder === id) {
                console.log('Force collapsing node before slide out:', node.id);
                // Update persistent state to force collapsed
                updateNodeState(node.id, { expanded: false });
                return {
                  ...node,
                  data: {
                    ...node.data,
                    expanded: false,
                    forceCollapsed: true // Force all nodes to be collapsed when folder opens
                  }
                };
              }
              return node;
            })
          );
          
          // Ensure nodes stay collapsed during slide out animation
          setTimeout(() => {
            setNodes((nodes) => 
              nodes.map((node) => {
                if (node.data?.groupedToFolder === id) {
                  // Ensure persistent state remains collapsed
                  updateNodeState(node.id, { expanded: false });
                  return {
                    ...node,
                    data: {
                      ...node.data,
                      expanded: false, // Ensure they remain collapsed
                      forceCollapsed: false // Allow expansion after slide out completes
                    }
                  };
                }
                return node;
              })
            );
          }, 50);
          
          // Then show grouped nodes sliding out to the right with animation
          setTimeout(() => {
            setNodes((nodes) => {
              const folderNode = nodes.find(n => n.id === id);
              if (!folderNode) return nodes;
              
              const folderX = folderNode.position.x;
              const folderY = folderNode.position.y;
              console.log('Folder position:', folderX, folderY);
              
              // Use the folder's groupedNodes array to maintain consistent ordering
              const folderGroupedNodes = groupedNodes || [];
              
              return nodes.map((node) => {
                // Check if this node is grouped to this specific folder
                if (node.data?.groupedToFolder === id) {
                  console.log('Found node to slide out:', node.id);
                  const index = folderGroupedNodes.indexOf(node.id);
                  
                  // Start nodes at folder position, then animate to final position
                  setTimeout(() => {
                    setNodes((currentNodes) => 
                      currentNodes.map((n) => {
                        if (n.id === node.id) {
                          return {
                            ...n,
                            position: {
                              x: folderX + 200 + (index * 200),
                              y: folderY
                            },
                            style: {
                              ...n.style,
                              transition: 'transform 0.5s ease-out, opacity 0.5s ease-out',
                              zIndex: -1, // Keep z-index lower than folder during animation
                              opacity: 1 // Full opacity when in final position
                            }
                          };
                        }
                        return n;
                      })
                    );
                  }, index * 100); // Stagger animation for each node
                  
                  // Also update persistent state to ensure collapsed state persists
                  updateNodeState(node.id, { expanded: false });
                  
                  return {
                    ...node,
                    position: {
                      x: folderX, // Start at folder position
                      y: folderY
                    },
                    data: {
                      ...node.data,
                      isSlideOut: true,
                      expanded: false, // Ensure nodes stay collapsed when sliding out
                      forceCollapsed: false // Allow expansion after slide out animation completes
                    },
                    style: {
                      ...node.style,
                      transition: 'transform 0.5s ease-out, opacity 0.5s ease-out',
                      zIndex: -1, // Set z-index lower than folder
                      opacity: 0.3 // Start with low opacity
                    },
                    hidden: false
                  };
                }
                return node;
              });
            });
          }, 100); // Small delay to ensure collapse happens first
        } else {
          // First collapse all grouped nodes and update persistent state - force collapsed permanently
          setNodes((nodes) => 
            nodes.map((node) => {
              if (node.data?.groupedToFolder === id) {
                console.log('Permanently collapsing node before hiding:', node.id);
                // Force persistent state to collapsed and lock it
                updateNodeState(node.id, { expanded: false });
                return {
                  ...node,
                  data: {
                    ...node.data,
                    expanded: false,
                    forceCollapsed: true // Add flag to remember this node should stay collapsed
                  }
                };
              }
              return node;
            })
          );
          
          // Then animate nodes back to folder position
          setTimeout(() => {
            setNodes((nodes) => {
              const folderNode = nodes.find(n => n.id === id);
              if (!folderNode) return nodes;
              
              const folderX = folderNode.position.x;
              const folderY = folderNode.position.y;
              
              return nodes.map((node) => {
                if (node.data?.groupedToFolder === id) {
                  return {
                    ...node,
                    position: {
                      x: folderX,
                      y: folderY
                    },
                    style: {
                      ...node.style,
                      transition: 'transform 0.4s ease-in, opacity 0.4s ease-in',
                      opacity: 0.3
                    }
                  };
                }
                return node;
              });
            });
            
            // Hide nodes after animation completes
            setTimeout(() => {
              setNodes((nodes) => 
                nodes.map((node) => {
                  if (node.data?.groupedToFolder === id) {
                    console.log('Hiding collapsed node:', node.id);
                    return {
                      ...node,
                      data: {
                        ...node.data,
                        isSlideOut: false
                      },
                      hidden: true
                    };
                  }
                  return node;
                })
              );
            }, 400); // Wait for animation to complete
          }, 100);
        }
      }, 50);
    }
  };
  
  // Effect to log node state when expanded changes
  useEffect(() => {
    console.log('isExpanded changed to:', isExpanded);
    if (isExpanded) {
      console.log('Nodes should be visible now');
    }
  }, [isExpanded]);


  return (
    <div 
      className="group flex flex-col items-center p-4 w-40 transition-all duration-300 hover:scale-[1.03] relative"
      onClick={handleFolderClick}
    >
      <div className="relative w-24 h-24 mb-2 flex items-center justify-center">
        <div className="absolute inset-0 dark:bg-gray-800/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="w-24 h-24 relative transform transition-all duration-300 group-hover:scale-105">
          <Image 
            src={FolderIcon} 
            alt="Folder" 
            fill
            style={{ objectFit: 'contain' }}
            className={`transition-transform duration-300 group-hover:translate-y-[-2px] ${
              isExpanded ? 'brightness-110' : ''
            }`}
          />
          {/* Grouped nodes count indicator */}
          {groupedNodes.length > 0 && (
            <div className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold shadow-lg">
              {groupedNodes.length}
            </div>
          )}
          {/* Expansion indicator - positioned to the right of the folder icon */}
          {groupedNodes.length > 0 && (
            <div className={`absolute top-1/2 -right-8 transform -translate-y-1/2 text-gray-600 dark:text-gray-300 transition-all duration-300 ${
              isExpanded ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
            }`}>
              <svg 
                width="20" 
                height="20" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                className="transition-transform duration-300"
              >
                <polyline points="9,18 15,12 9,6"></polyline>
              </svg>
            </div>
          )}
        </div>
      </div>
      <div className="text-center">
        <div className="font-medium text-sm text-gray-800 dark:text-gray-100 truncate w-full transition-colors duration-300 group-hover:text-gray-900 dark:group-hover:text-white">
          {title}
        </div>

        {/* Created At */}
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {createdAt}
        </div>
      </div>
      
      {/* Hover buttons - appears on hover above the node */}
      <div className="absolute -top-7 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:-translate-y-2 cursor-pointer flex items-center space-x-2">
        {/* Ungroup button - only show if folder has grouped nodes */}
        {groupedNodes.length > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleUngroup();
            }}
            className="cursor-pointer bg-orange-500 hover:bg-orange-600 text-white rounded-full p-2 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110"
            title="Ungroup all nodes"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
              <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
              <line x1="10" y1="12" x2="14" y2="12"></line>
            </svg>
          </button>
        )}
        
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
        nodeType="folder"
        currentTitle={title}
        onSave={handleSettingsSave}
        onDelete={handleDelete}
        position={settingsPosition}
      />
    </div>
  );
};

export default FolderNode;