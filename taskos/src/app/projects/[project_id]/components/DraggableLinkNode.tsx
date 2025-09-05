'use client';

import { useDraggable } from '@neodrag/react';
import { useReactFlow, XYPosition } from '@xyflow/react';
import { useCallback, useRef, useState } from 'react';

// Simple ID generator for nodes
let id = 0;
const getId = () => `linknode_${id++}`;

interface DraggableLinkNodeProps {
  className?: string;
  children: React.ReactNode;
  onDrop: (nodeId: string, position: XYPosition) => void;
}

export function DraggableLinkNode({ className, children, onDrop }: DraggableLinkNodeProps) {
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

interface DraggableLinkNodeButtonProps {
  onNodeAdded: (nodeId: string) => void;
}

export function DraggableLinkNodeButton({ onNodeAdded }: DraggableLinkNodeButtonProps) {
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

      // Create a new link node and add it to the flow
      if (isInFlow) {
        const position = screenToFlowPosition(screenPosition);

        const newNode = {
          id: nodeId,
          type: 'linkNode',
          position,
          data: { 
            title: 'New Link',
            url: '',
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
    <DraggableLinkNode 
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
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
      </div>
    </DraggableLinkNode>
  );
}
