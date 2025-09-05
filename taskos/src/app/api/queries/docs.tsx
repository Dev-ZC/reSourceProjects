'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
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
