'use client';

import { useDraggable } from '@neodrag/react';
import { useReactFlow, XYPosition } from '@xyflow/react';
import { useCallback, useRef, useState } from 'react';

// Simple ID generator for nodes
let id = 0;
const getId = () => `docsnode_${id++}`;

interface DraggableDocNodeProps {
  className?: string;
  children: React.ReactNode;
  onDrop: (nodeId: string, position: XYPosition) => void;
}

export function DraggableDocNode({ className, children, onDrop }: DraggableDocNodeProps) {
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

interface DraggableDocNodeButtonProps {
  onNodeAdded: (nodeId: string) => void;
}

export function DraggableDocNodeButton({ onNodeAdded }: DraggableDocNodeButtonProps) {
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

      // Create a new docs node and add it to the flow
      if (isInFlow) {
        const position = screenToFlowPosition(screenPosition);

        const newNode = {
          id: nodeId,
          type: 'docsNode',
          position,
          data: { 
            title: 'New Document',
            createdAt: new Date().toISOString().split('T')[0],
            content: '',
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
    <DraggableDocNode 
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
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14,2 14,8 20,8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10,9 9,9 8,9" />
        </svg>
      </div>
    </DraggableDocNode>
  );
}
