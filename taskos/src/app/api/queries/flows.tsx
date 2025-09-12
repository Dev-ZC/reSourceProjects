'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useRef } from 'react';

export interface FlowState {
  nodes: any[];
  edges: any[];
  viewport: {
    x: number;
    y: number;
    zoom: number;
  };
  nodeStates?: {
    [nodeId: string]: {
      expanded?: boolean;
      size?: { width: number; height: number };
      zIndex?: number;
    };
  };
}

export interface SaveFlowData {
  project_id: string;
  flow_state: FlowState;
  flow_name?: string;
}

export interface LoadFlowResponse {
  message: string;
  flow_id?: string;
  project_id?: string;
  flow_state: FlowState;
  name?: string;
  created_at?: string;
  updated_at?: string;
}

// Save flow mutation
export const useSaveFlow = () => {
  return useMutation({
    mutationFn: async (data: SaveFlowData) => {
      const response = await fetch('/api/flows', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for authentication
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save flow');
      }

      return response.json();
    },
    onError: (error) => {
      console.error('Save flow error:', error);
    },
  });
};

// Load flow query
export const useLoadFlow = (projectId: string) => {
  return useQuery({
    queryKey: ['flow', projectId],
    queryFn: async (): Promise<LoadFlowResponse> => {
      console.log('🔍 FLOW QUERY: Loading flow for project', projectId);
      const response = await fetch(`/api/flows/load/${projectId}`, {
        credentials: 'include', // Include cookies for authentication
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load flow');
      }

      return response.json();
    },
    enabled: !!projectId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// Debounced auto-save hook
export const useAutoSaveFlow = (projectId: string, debounceMs: number = 4000) => {
  const queryClient = useQueryClient();
  const saveFlowMutation = useSaveFlow();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedStateRef = useRef<string | null>(null);

  const debouncedSave = useCallback((flowState: FlowState) => {
    // Create a copy of flowState without DocsNode content to compare for changes
    const flowStateForComparison = {
      ...flowState,
      nodes: flowState.nodes.map(node => {
        if (node.type === 'docsNode') {
          // Exclude content from comparison to prevent saves on content changes
          const { content, ...nodeWithoutContent } = node.data || {};
          return { ...node, data: nodeWithoutContent };
        }
        return node;
      })
    };
    
    const currentStateString = JSON.stringify(flowStateForComparison);
    
    // Don't save if the state (excluding DocsNode content) hasn't changed
    if (lastSavedStateRef.current === currentStateString) {
      return;
    }
    
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      lastSavedStateRef.current = currentStateString;
      saveFlowMutation.mutate(
        {
          project_id: projectId,
          flow_state: flowState, // Save the full state including content
        },
        {
          onSuccess: (data) => {
            // Update the query cache with the saved data
            queryClient.setQueryData(['flow', projectId], (oldData: LoadFlowResponse | undefined) => ({
              ...oldData,
              flow_state: flowState,
              updated_at: new Date().toISOString(),
              message: data.message,
            }));
          },
        }
      );
    }, debounceMs);
  }, [projectId, debounceMs, saveFlowMutation, queryClient]);

  return {
    autoSave: debouncedSave,
    isSaving: saveFlowMutation.isPending,
    saveError: saveFlowMutation.error,
  };
};
