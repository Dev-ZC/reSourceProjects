'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGetUserProjects, useCreateProject } from '@/app/api/queries/projects';
import { Loader2 } from 'lucide-react';

export default function DefaultProjectPage() {
  const router = useRouter();
  const { data, isLoading: isLoadingProjects } = useGetUserProjects();
  const projects = data?.projects || [];
  const createProjectMutation = useCreateProject();
  const [isCreatingDefault, setIsCreatingDefault] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize the component and check session storage for ongoing operations
  useEffect(() => {
    // Only run once on component mount
    if (!hasInitialized) {
      // Check if we've already started a project creation process in this session
      const isCreatingInProgress = sessionStorage.getItem('isCreatingProject') === 'true';
      
      if (isCreatingInProgress) {
        setIsCreatingDefault(true);
        console.log('Project creation already in progress');
      }
      
      setHasInitialized(true);
    }
  }, [hasInitialized]);

  useEffect(() => {
    async function handleProjectNavigation() {
      try {
        // Skip if we're already redirecting or creating a project
        if (isRedirecting || isCreatingDefault) {
          return;
        }

        // If projects are loaded and there's at least one project
        if (projects && projects.length > 0) {
          setIsRedirecting(true);
          console.log('Redirecting to first project:', projects[0].id);
          // Clear any creation flags since we have projects
          sessionStorage.removeItem('isCreatingProject');
          router.push(`/projects/${projects[0].id}`);
          return;
        }

        // If projects are loaded but there are none, create a default project
        if (projects && projects.length === 0) {
          // Set flag in session storage to prevent duplicate creation
          sessionStorage.setItem('isCreatingProject', 'true');
          setIsCreatingDefault(true);
          console.log('Creating default project');
          
          const result = await createProjectMutation.mutateAsync({
            project_name: 'My First Project'
          });
          
          if (result?.project?.id) {
            setIsRedirecting(true);
            console.log('Created default project, redirecting:', result.project.id);
            // Clear the flag after successful creation
            sessionStorage.removeItem('isCreatingProject');
            router.push(`/projects/${result.project.id}`);
          } else {
            setError('Failed to create default project');
            sessionStorage.removeItem('isCreatingProject');
            setIsCreatingDefault(false);
          }
        }
      } catch (err) {
        console.error('Error handling project navigation:', err);
        setError('An error occurred while setting up your project');
        sessionStorage.removeItem('isCreatingProject');
        setIsCreatingDefault(false);
      }
    }

    // Only run this effect if projects are loaded (either empty or with data)
    // and we've initialized the component
    if (!isLoadingProjects && !isRedirecting && hasInitialized) {
      handleProjectNavigation();
    }
  }, [isLoadingProjects, router, createProjectMutation, isRedirecting, isCreatingDefault, projects, hasInitialized]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
      {error ? (
        <div className="text-red-400 mb-4">{error}</div>
      ) : (
        <>
          <Loader2 className="h-8 w-8 animate-spin mb-4" />
          <p className="text-lg">
            {isCreatingDefault 
              ? 'Creating your first project...' 
              : isRedirecting
                ? 'Redirecting to your project...'
                : isLoadingProjects 
                  ? 'Loading your projects...'
                  : 'Preparing your workspace...'}
          </p>
        </>
      )}
    </div>
  );
}
