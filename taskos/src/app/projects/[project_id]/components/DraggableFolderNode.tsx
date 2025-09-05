'use client';

import { useDraggable } from '@neodrag/react';
import { useReactFlow, XYPosition } from '@xyflow/react';
import { useCallback, useRef, useState } from 'react';

// Simple ID generator for nodes
let id = 0;
const getId = () => `foldernode_${id++}`;

interface DraggableFolderNodeProps {
  className?: string;
  children: React.ReactNode;
  onDrop: (nodeId: string, position: XYPosition) => void;
}

export function DraggableFolderNode({ className, children, onDrop }: DraggableFolderNodeProps) {
  const draggableRef = useRef<HTMLDivElement | null>(null);
  const [position, setPosition] = useState<XYPosition>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  useDraggable(draggableRef as React.RefObject<HTMLElement>, {
    position: position,
    onDragStart: () => {
      setIsDragging(true);
    },
    onDrag: ({ offsetX, offsetY }) => {
      setPosition({
        x: offsetX,
        y: offsetY,
      });
    },
    onDragEnd: ({ event }) => {
      setPosition({ x: 0, y: 0 });
      setIsDragging(false);
      
      onDrop(getId(), {
        x: event.clientX,
        y: event.clientY,
      });
    },
  });

  return (
    <div 
      className={`${className} ${isDragging ? 'cursor-grabbing opacity-80' : 'cursor-grab'} transition-opacity duration-200`} 
      ref={draggableRef}
    >
      {children}
    </div>
  );
}

interface DraggableFolderNodeButtonProps {
  onNodeAdded: (nodeId: string) => void;
}

export function DraggableFolderNodeButton({ onNodeAdded }: DraggableFolderNodeButtonProps) {
  const { setNodes, screenToFlowPosition } = useReactFlow();

  const handleNodeDrop = useCallback(
    (nodeId: string, screenPosition: XYPosition) => {
      const flow = document.querySelector('.react-flow');
      const flowRect = flow?.getBoundingClientRect();
      const isInFlow =
        flowRect &&
        screenPosition.x >= flowRect.left &&
        screenPosition.x <= flowRect.right &&
        screenPosition.y >= flowRect.top &&
        screenPosition.y <= flowRect.bottom;

      // Create a new folder node and add it to the flow
      if (isInFlow) {
        const position = screenToFlowPosition(screenPosition);

        const newNode = {
          id: nodeId,
          type: 'folderNode',
          position,
          data: { 
            title: 'New Folder',
            createdAt: new Date().toISOString().split('T')[0],
            isNew: true // Flag to indicate this is a new node that should open settings
          },
        };

        setNodes((nds) => nds.concat(newNode));
        
        // Notify parent that a new node was added so it can open settings
        onNodeAdded(nodeId);
      }
    },
    [setNodes, screenToFlowPosition, onNodeAdded],
  );

  const SVG_WIDTH = "18";
  const SVG_HEIGHT = "18";

  return (
    <DraggableFolderNode 
      className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-black/10 transition-colors duration-200 group"
      onDrop={handleNodeDrop}
    >
      <div className="text-black group-hover:scale-110 transition-transform duration-200 pointer-events-none">
        <svg 
          width={SVG_WIDTH} 
          height={SVG_HEIGHT} 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
      </div>
    </DraggableFolderNode>
  );
}
