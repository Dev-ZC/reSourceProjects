'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useRef } from 'react';
import { api } from '../client';

// Types for link operations
export interface LinkCreateRequest {
  project_id: string;
  url: string;
  string: string;
}

export interface LinkUpdateRequest {
  url?: string;
  string?: string;
}

export interface LinkResponse {
  id: string;
  project_id: string;
  url: string;
  string: string;
  user_id: string;
  created_at?: string;
  updated_at?: string;
}

export interface LinkOperationResponse {
  message: string;
  link?: LinkResponse;
  deleted?: boolean;
}

// Create link mutation
export const useCreateLink = () => {
  const queryClient = useQueryClient();
  
  return useMutation<LinkOperationResponse, Error, LinkCreateRequest>({
    mutationFn: async (data: LinkCreateRequest) => {
      const response = await api.post<LinkOperationResponse>('/api/links/create', data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['links'] });
      if (data.link?.project_id) {
        queryClient.invalidateQueries({ queryKey: ['links', data.link.project_id] });
      }
    },
  });
};

// Update link mutation
export const useUpdateLink = () => {
  const queryClient = useQueryClient();
  
  return useMutation<LinkOperationResponse, Error, { link_id: string; data: LinkUpdateRequest }>({
    mutationFn: async ({ link_id, data }) => {
      const response = await api.put<LinkOperationResponse>(`/api/links/update/${link_id}`, data);
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['links'] });
      queryClient.invalidateQueries({ queryKey: ['link', variables.link_id] });
      if (data.link?.project_id) {
        queryClient.invalidateQueries({ queryKey: ['links', data.link.project_id] });
      }
    },
  });
};

// Get link query
export const useGetLink = (link_id: string) => {
  return useMutation<LinkOperationResponse, Error, string>({
    mutationFn: async (linkId: string) => {
      const response = await api.get<LinkOperationResponse>(`/api/links/get/${linkId}`);
      return response.data;
    },
  });
};

// Delete link mutation
export const useDeleteLink = () => {
  const queryClient = useQueryClient();
  
  return useMutation<LinkOperationResponse, Error, string>({
    mutationFn: async (link_id: string) => {
      const response = await api.delete<LinkOperationResponse>(`/api/links/delete/${link_id}`);
      return response.data;
    },
    onSuccess: (data, link_id) => {
      queryClient.invalidateQueries({ queryKey: ['links'] });
      queryClient.removeQueries({ queryKey: ['link', link_id] });
    },
  });
};

// Create link and return node data for React Flow
export const useCreateLinkNode = () => {
  const createLinkMutation = useCreateLink();
  
  const createLinkNode = async ({
    project_id,
    position,
    url,
    string = ''
  }: {
    project_id: string;
    position: { x: number; y: number };
    url: string;
    string?: string;
  }) => {
    try {
      const result = await createLinkMutation.mutateAsync({
        project_id,
        url,
        string
      });
      
      if (!result.link) {
        throw new Error('No link returned from backend');
      }
      
      // Return React Flow node data with backend-generated ID
      return {
        id: result.link.id, // Use backend ID as node ID
        type: 'linkNode',
        position,
        data: {
          url: result.link.url,
          string: result.link.string,
          createdAt: new Date().toLocaleDateString().replace(/\//g, '-'),
          linkId: result.link.id, // Same ID for consistency with autosave
          isNew: true
        }
      };
    } catch (error) {
      console.error('Failed to create link node:', error);
      throw error;
    }
  };
  
  return {
    createLinkNode,
    isCreating: createLinkMutation.isPending,
    createError: createLinkMutation.error
  };
};

// Debounced auto-save hook for link content
export const useAutoSaveLink = (linkId: string, debounceMs: number = 3000) => {
  const queryClient = useQueryClient();
  const updateLinkMutation = useUpdateLink();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedDataRef = useRef<{ url?: string; string?: string } | null>(null);

  const debouncedSave = useCallback((data: { url?: string; string?: string }) => {
    console.log('debouncedSave called with linkId:', linkId, 'data:', data);
    
    // Don't save if the data hasn't changed
    if (lastSavedDataRef.current && 
        lastSavedDataRef.current.url === data.url && 
        lastSavedDataRef.current.string === data.string) {
      console.log('Data unchanged, skipping save');
      return;
    }
    
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      console.log('Cleared existing timeout');
    }

    console.log('Setting timeout for autosave in', debounceMs, 'ms');
    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      console.log('Executing autosave for linkId:', linkId);
      lastSavedDataRef.current = data;
      updateLinkMutation.mutate(
        {
          link_id: linkId,
          data
        },
        {
          onSuccess: (responseData) => {
            console.log('Autosave successful:', responseData);
            // Update the query cache with the saved data
            queryClient.setQueryData(['link', linkId], (oldData: LinkResponse | undefined) => ({
              ...oldData,
              ...responseData.link,
              updated_at: new Date().toISOString(),
            }));
          },
          onError: (error) => {
            console.error('Autosave failed:', error);
          },
        }
      );
    }, debounceMs);
  }, [linkId, debounceMs, updateLinkMutation, queryClient]);

  // Cleanup function to clear timeout
  const cleanup = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  return {
    autoSave: debouncedSave,
    isSaving: updateLinkMutation.isPending,
    saveError: updateLinkMutation.error,
    cleanup,
  };
};
