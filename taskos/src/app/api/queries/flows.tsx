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
      const response = await fetch(`/api/flows?project_id=${projectId}`, {
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
export const useAutoSaveFlow = (projectId: string, debounceMs: number = 2000) => {
  const queryClient = useQueryClient();
  const saveFlowMutation = useSaveFlow();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedSave = useCallback((flowState: FlowState) => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      saveFlowMutation.mutate(
        {
          project_id: projectId,
          flow_state: flowState,
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
