'use client'

import React from 'react';
import { DraggableDocNodeButton } from './DraggableDocNode';
import { DraggableFolderNodeButton } from './DraggableFolderNode';
import { DraggableLinkNodeButton } from './DraggableLinkNode';
import { DraggableTextBoxNodeButton } from './DraggableTextBoxNode';

interface NodeMiniBarProps {
  onDocNodeAdded?: (nodeId: string) => void;
  onFolderNodeAdded?: (nodeId: string) => void;
  onLinkNodeAdded?: (nodeId: string) => void;
  onTextBoxNodeAdded?: (nodeId: string) => void;
}

export default function NodeMiniBar({ 
  onDocNodeAdded, 
  onFolderNodeAdded, 
  onLinkNodeAdded,
  onTextBoxNodeAdded 
}: NodeMiniBarProps) {
  return (
    <div 
      className="relative left-4 top-1/2 -translate-y-1/2 z-30 flex flex-col gap-2 p-2 rounded-2xl shadow-lg w-fit"
      style={{ backgroundColor: '#B4BDC3' }}
    >
      {/* Draggable Link Node */}
      <div title="Link Node (Drag & Drop)">
        <DraggableLinkNodeButton 
          onNodeAdded={onLinkNodeAdded || (() => {})}
        />
      </div>
      
      {/* Draggable Docs Node */}
      <div title="Docs Node (Drag & Drop)">
        <DraggableDocNodeButton 
          onNodeAdded={onDocNodeAdded || (() => {})}
        />
      </div>
      
      {/* Draggable Folder Node */}
      <div title="Folder Node (Drag & Drop)">
        <DraggableFolderNodeButton 
          onNodeAdded={onFolderNodeAdded || (() => {})}
        />
      </div>
      
      {/* Draggable Text Box Node */}
      <div title="Text Box Node (Drag & Drop)">
        <DraggableTextBoxNodeButton 
          onNodeAdded={onTextBoxNodeAdded || (() => {})}
        />
      </div>
    </div>
  );
}
