'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useRef } from 'react';
import { api } from '../client';

// Types for document operations
export interface DocumentCreateRequest {
  project_id: string;
  doc_name: string;
  content: string;
}

export interface DocumentUpdateRequest {
  doc_name?: string;
  content?: string;
}

export interface DocumentResponse {
  id: string;
  project_id: string;
  doc_name: string;
  content: string;
  user_id: string;
  created_at?: string;
  updated_at?: string;
}

export interface DocumentOperationResponse {
  message: string;
  document?: DocumentResponse;
  deleted?: boolean;
}

// Create document mutation
export const useCreateDocument = () => {
  const queryClient = useQueryClient();
  
  return useMutation<DocumentOperationResponse, Error, DocumentCreateRequest>({
    mutationFn: async (data: DocumentCreateRequest) => {
      const response = await api.post<DocumentOperationResponse>('/api/docs/create', data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      if (data.document?.project_id) {
        queryClient.invalidateQueries({ queryKey: ['documents', data.document.project_id] });
      }
    },
  });
};

// Update document mutation
export const useUpdateDocument = () => {
  const queryClient = useQueryClient();
  
  return useMutation<DocumentOperationResponse, Error, { doc_id: string; data: DocumentUpdateRequest }>({
    mutationFn: async ({ doc_id, data }) => {
      const response = await api.put<DocumentOperationResponse>(`/api/docs/update/${doc_id}`, data);
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['document', variables.doc_id] });
      if (data.document?.project_id) {
        queryClient.invalidateQueries({ queryKey: ['documents', data.document.project_id] });
      }
    },
  });
};

// Get document query
export const useGetDocument = (doc_id: string) => {
  return useMutation<DocumentOperationResponse, Error, string>({
    mutationFn: async (docId: string) => {
      const response = await api.get<DocumentOperationResponse>(`/api/docs/get/${docId}`);
      return response.data;
    },
  });
};

// Delete document mutation
export const useDeleteDocument = () => {
  const queryClient = useQueryClient();
  
  return useMutation<DocumentOperationResponse, Error, string>({
    mutationFn: async (doc_id: string) => {
      const response = await api.delete<DocumentOperationResponse>(`/api/docs/delete/${doc_id}`);
      return response.data;
    },
    onSuccess: (data, doc_id) => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.removeQueries({ queryKey: ['document', doc_id] });
    },
  });
};

// Create document and return node data for React Flow
export const useCreateDocumentNode = () => {
  const createDocumentMutation = useCreateDocument();
  
  const createDocumentNode = async ({
    project_id,
    position,
    title = 'Untitled Document',
    content = ''
  }: {
    project_id: string;
    position: { x: number; y: number };
    title?: string;
    content?: string;
  }) => {
    try {
      const result = await createDocumentMutation.mutateAsync({
        project_id,
        doc_name: title,
        content
      });
      
      if (!result.document) {
        throw new Error('No document returned from backend');
      }
      
      // Return React Flow node data with backend-generated ID
      return {
        id: result.document.id, // Use backend ID as node ID
        type: 'docsNode',
        position,
        data: {
          title: result.document.doc_name,
          createdAt: new Date().toLocaleDateString(),
          content: result.document.content,
          docId: result.document.id, // Same ID for consistency with autosave
          isNew: true
        }
      };
    } catch (error) {
      console.error('Failed to create document node:', error);
      throw error;
    }
  };
  
  return {
    createDocumentNode,
    isCreating: createDocumentMutation.isPending,
    createError: createDocumentMutation.error
  };
};

// Debounced auto-save hook for document content
export const useAutoSaveDocument = (docId: string, debounceMs: number = 3000) => {
  const queryClient = useQueryClient();
  const updateDocumentMutation = useUpdateDocument();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedContentRef = useRef<string | null>(null);

  const debouncedSave = useCallback((content: string) => {
    console.log('debouncedSave called with docId:', docId, 'content length:', content.length);
    
    // Don't save if the content hasn't changed
    if (lastSavedContentRef.current === content) {
      console.log('Content unchanged, skipping save');
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
      console.log('Executing autosave for docId:', docId);
      lastSavedContentRef.current = content;
      updateDocumentMutation.mutate(
        {
          doc_id: docId,
          data: { content }
        },
        {
          onSuccess: (data) => {
            console.log('Autosave successful:', data);
            // Update the query cache with the saved data
            queryClient.setQueryData(['document', docId], (oldData: DocumentResponse | undefined) => ({
              ...oldData,
              ...data.document,
              updated_at: new Date().toISOString(),
            }));
          },
          onError: (error) => {
            console.error('Autosave failed:', error);
          },
        }
      );
    }, debounceMs);
  }, [docId, debounceMs, updateDocumentMutation, queryClient]);

  // Cleanup function to clear timeout
  const cleanup = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  return {
    autoSave: debouncedSave,
    isSaving: updateDocumentMutation.isPending,
    saveError: updateDocumentMutation.error,
    cleanup,
  };
};
