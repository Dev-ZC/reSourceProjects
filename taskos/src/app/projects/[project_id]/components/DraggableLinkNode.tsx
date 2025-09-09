'use client';

import { useDraggable } from '@neodrag/react';
import { useReactFlow, XYPosition } from '@xyflow/react';
import { useCallback, useRef, useState } from 'react';
import { useCreateLinkNode } from '@/app/api/queries/links';
import { useParams } from 'next/navigation';

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
      
      onDrop(`temp_${Date.now()}`, {
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
  const params = useParams();
  const projectId = params.project_id as string;
  const { createLinkNode, isCreating, createError } = useCreateLinkNode();

  const handleNodeDrop = useCallback(
    async (tempNodeId: string, screenPosition: XYPosition) => {
      const flow = document.querySelector('.react-flow');
      const flowRect = flow?.getBoundingClientRect();
      const isInFlow =
        flowRect &&
        screenPosition.x >= flowRect.left &&
        screenPosition.x <= flowRect.right &&
        screenPosition.y >= flowRect.top &&
        screenPosition.y <= flowRect.bottom;

      // Create a new link node with backend-first approach
      if (isInFlow && !isCreating) {
        const position = screenToFlowPosition(screenPosition);

        try {
          // Create link in backend first and get the node data
          const newNode = await createLinkNode({
            project_id: projectId,
            position,
            url: 'https://example.com',
            string: 'New Link'
          });

          // Add the node with backend-generated ID to the flow
          setNodes((nds) => nds.concat(newNode));
          
          // Notify parent that a new node was added
          onNodeAdded(newNode.id);
        } catch (error) {
          console.error('Failed to create link node:', error);
          // Optionally show user-friendly error message
        }
      }
    },
    [setNodes, screenToFlowPosition, onNodeAdded, projectId, createLinkNode, isCreating],
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
