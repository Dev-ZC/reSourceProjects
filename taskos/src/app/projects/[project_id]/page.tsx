'use client'

import React, { useCallback } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection
} from '@xyflow/react';
import { Input } from "@/components/ui/input"
 
import '@xyflow/react/dist/style.css';
import FolderNode from './components/folderNode';

const nodeTypes = {
  folderNode: FolderNode,
};
 
const initialNodes = [
  { id: '1', position: { x: 200, y: 200 }, data: { label: '1' } },
  { id: '2', position: { x: 500, y: 500 }, data: { label: '2' } },
  {
    id: '3',
    type: 'folderNode',
    position: { x: 500, y: 100 },
    data: {
      title: 'Project Alpha',
      createdAt: '2025-06-27',
    },
  },
];
const initialEdges = [{ id: 'e1-2', source: '1', target: '2' }];
 
export default function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
 
  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );
 
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
        <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
        >
        <Controls/>
        {/*<MiniMap />*/}
        <Background bgColor='#C4CACC' color='#C4CACC' gap={12} size={1} />
        </ReactFlow>
        <div className='absolute bottom-10 left-1/2 -translate-x-1/2'>
            <Input
            placeholder="Start chatting now..."
            className="w-120 h-12 border-0 placeholder:text-[#7C868D] pl-7 outline-0"
            style={{ background: '#D0D5D8', color: '#7C868D', boxShadow: '1px 5px 10px', outline: 'none', borderRadius: '30px' }}
            />
        </div>
    </div>
  );
}
