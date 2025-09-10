'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../client';

// Types for project operations
export interface ProjectCreateRequest {
  project_name: string;
}

export interface ProjectUpdateRequest {
  project_name: string;
}

export interface ProjectResponse {
  id: string;
  project_name: string;
  user_id: string;
  created_at?: string;
  updated_at?: string;
}

export interface ProjectOperationResponse {
  message: string;
  project?: ProjectResponse;
  projects?: ProjectResponse[];
  deleted?: boolean;
}

// Create project mutation
export const useCreateProject = () => {
  const queryClient = useQueryClient();
  
  return useMutation<ProjectOperationResponse, Error, ProjectCreateRequest>({
    mutationFn: async (data: ProjectCreateRequest) => {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
};

// Update project mutation
export const useUpdateProject = () => {
  const queryClient = useQueryClient();
  
  return useMutation<ProjectOperationResponse, Error, { project_id: string; data: ProjectUpdateRequest }>({
    mutationFn: async ({ project_id, data }) => {
      const response = await fetch('/api/projects', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          project_id,
          ...data
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project', variables.project_id] });
    },
  });
};

// Get single project query
export const useGetProject = (project_id: string, enabled: boolean = true) => {
  return useQuery<ProjectOperationResponse, Error>({
    queryKey: ['project', project_id],
    queryFn: async () => {
      const response = await fetch(`/api/projects?project_id=${project_id}`, {
        method: 'GET',
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return response.json();
    },
    enabled: enabled && !!project_id,
  });
};

// Get all user projects query
export const useGetUserProjects = (options?: { enabled?: boolean }) => {
  return useQuery<ProjectOperationResponse, Error>({
    queryKey: ['projects'],
    queryFn: async () => {
      console.log('🔥 PROJECTS QUERY: Starting fetch for all user projects');
      const response = await fetch('/api/projects', {
        method: 'GET',
        credentials: 'include',
      });
      
      console.log('🔥 PROJECTS QUERY: Response status:', response.status);
      console.log('🔥 PROJECTS QUERY: Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ PROJECTS QUERY: Error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }
      
      const data = await response.json();
      console.log('✅ PROJECTS QUERY: Success response:', data);
      return data;
    },
    enabled: options?.enabled ?? true,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 1,
  });
};

// Delete project mutation
export const useDeleteProject = () => {
  const queryClient = useQueryClient();
  
  return useMutation<ProjectOperationResponse, Error, string>({
    mutationFn: async (project_id: string) => {
      const response = await fetch(`/api/projects?project_id=${project_id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return response.json();
    },
    onSuccess: (data, project_id) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.removeQueries({ queryKey: ['project', project_id] });
    },
  });
};

// Hook to get projects for sidebar or navigation
export const useProjectsForNavigation = () => {
  const { data, isLoading, error } = useGetUserProjects();
  
  console.log('🔥 PROJECTS NAV: Hook state - isLoading:', isLoading, 'error:', error, 'data:', data);
  console.log('🔥 PROJECTS NAV: Projects array:', data?.projects);
  
  return {
    projects: data?.projects || [],
    isLoading,
    error,
    refetch: () => {
      // This will be handled by the query client
    }
  };
};
