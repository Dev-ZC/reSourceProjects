'use client';

import React, { createContext, useContext, ReactNode, useCallback } from 'react';

interface NodeState {
  expanded?: boolean;
  size?: { width: number; height: number };
}

interface NodeStateContextType {
  updateNodeState: (nodeId: string, state: Partial<NodeState>) => void;
  getNodeState: (nodeId: string) => NodeState;
  removeNodeState: (nodeId: string) => void;
  nodeStates: { [nodeId: string]: NodeState };
  setNodeStates: (states: { [nodeId: string]: NodeState }) => void;
}

const NodeStateContext = createContext<NodeStateContextType | undefined>(undefined);

interface NodeStateProviderProps {
  children: ReactNode;
  nodeStates: { [nodeId: string]: NodeState };
  onNodeStatesChange: (states: { [nodeId: string]: NodeState }) => void;
}

export function NodeStateProvider({ children, nodeStates, onNodeStatesChange }: NodeStateProviderProps) {
  const updateNodeState = useCallback((nodeId: string, state: Partial<NodeState>) => {
    const newStates = {
      ...nodeStates,
      [nodeId]: {
        ...nodeStates[nodeId],
        ...state
      }
    };
    onNodeStatesChange(newStates);
  }, [nodeStates, onNodeStatesChange]);

  const getNodeState = useCallback((nodeId: string): NodeState => {
    return nodeStates[nodeId] || {};
  }, [nodeStates]);

  const removeNodeState = useCallback((nodeId: string) => {
    const newStates = { ...nodeStates };
    delete newStates[nodeId];
    onNodeStatesChange(newStates);
  }, [nodeStates, onNodeStatesChange]);

  const setNodeStates = useCallback((states: { [nodeId: string]: NodeState }) => {
    onNodeStatesChange(states);
  }, [onNodeStatesChange]);

  const value = {
    updateNodeState,
    getNodeState,
    removeNodeState,
    nodeStates,
    setNodeStates
  };

  return (
    <NodeStateContext.Provider value={value}>
      {children}
    </NodeStateContext.Provider>
  );
}

export function useNodeStateContext() {
  const context = useContext(NodeStateContext);
  if (context === undefined) {
    throw new Error('useNodeStateContext must be used within a NodeStateProvider');
  }
  return context;
}
