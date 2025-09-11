import * as React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"

import { UserButton, useUser } from "@clerk/nextjs"
import { useProjectsForNavigation, useCreateProject, useUpdateProject, useDeleteProject } from "@/app/api/queries/projects"
import { Pencil, Trash2, MoreVertical, Check, X } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PlusCircle } from "lucide-react"

// Empty static navigation data - removed boilerplate
const staticNavData = {
  navMain: []
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useUser();
  const router = useRouter();
  const { projects, isLoading, error } = useProjectsForNavigation();
  const createProjectMutation = useCreateProject();
  const updateProjectMutation = useUpdateProject();
  const deleteProjectMutation = useDeleteProject();
  
  // State for new project creation
  const [showNewProjectInput, setShowNewProjectInput] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  
  // State for project editing
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editedProjectName, setEditedProjectName] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  
  // State for project deletion
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Handle project update
  const handleUpdateProject = async (projectId: string) => {
    if (!editedProjectName.trim() || isEditing) return;
    
    setIsEditing(true);
    try {
      await updateProjectMutation.mutateAsync({
        project_id: projectId,
        data: { project_name: editedProjectName.trim() }
      });
      
      // Reset state
      setEditingProjectId(null);
      setEditedProjectName("");
    } catch (error) {
      console.error("Failed to update project:", error);
    } finally {
      setIsEditing(false);
    }
  };
  
  // Handle project deletion
  const handleDeleteProject = async (projectId: string) => {
    if (isDeleting) return;
    
    setIsDeleting(true);
    try {
      await deleteProjectMutation.mutateAsync(projectId);
      
      // Reset state
      setShowDeleteConfirm(null);
      
      // If we're on the deleted project's page, redirect to projects page
      if (window.location.pathname.includes(projectId)) {
        router.push('/projects');
      }
    } catch (error) {
      console.error("Failed to delete project:", error);
    } finally {
      setIsDeleting(false);
    }
  };
  
  // Create navigation data with only user projects
  const navData = {
    navMain: [
      {
        title: "My Projects",
        url: "#",
        items: projects.map(project => ({
          title: project.project_name,
          url: `/projects/${project.id}`,
          id: project.id
        }))
      }
    ]
  };

  return (
    <div className="dark">
    <Sidebar {...props}>
      <SidebarHeader>
        <div className="p-4 flex items-center justify-center gap-3 w-full hover:bg-gray-800 transition-colors rounded-lg cursor-pointer group">
          <div className="flex-shrink-0 flex items-center">
            <UserButton /> {/* Styled in globals.css */}
          </div>
          {user && (
            <div 
              className="flex flex-col text-sm text-left flex-1 min-w-0 justify-center"
              onClick={(e) => {
                e.preventDefault();
                // Find the UserButton and trigger its click
                const userButtonElement = e.currentTarget.parentElement?.querySelector('button[data-testid="userButton-trigger"]') || 
                                        e.currentTarget.parentElement?.querySelector('[role="button"]') ||
                                        e.currentTarget.parentElement?.querySelector('button');
                if (userButtonElement) {
                  (userButtonElement as HTMLElement).click();
                }
              }}
            >
              <span className="font-medium text-white group-hover:text-gray-100 truncate">{user.fullName || user.firstName}</span>
              <span className="text-gray-400 group-hover:text-gray-300 truncate">{user.primaryEmailAddress?.emailAddress}</span>
            </div>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent className="no-scrollbar">
        {/* We create a SidebarGroup for each parent. */}
        {navData.navMain.map((item) => (
          <SidebarGroup key={item.title}>
            <SidebarGroupLabel>{item.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {item.title === "My Projects" && isLoading ? (
                  <SidebarMenuItem>
                    <SidebarMenuButton disabled>
                      Loading projects...
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ) : item.title === "My Projects" && error ? (
                  <SidebarMenuItem>
                    <SidebarMenuButton disabled>
                      Error loading projects
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ) : (
                  <>
                    {item.items.map((subItem: any) => (
                      <SidebarMenuItem key={subItem.id}>
                        <div className="flex items-center justify-between w-full group relative">
                          {editingProjectId === subItem.id ? (
                            <div className="flex items-center w-full gap-2">
                              <Input
                                value={editedProjectName}
                                onChange={(e) => setEditedProjectName(e.target.value)}
                                className="h-7 bg-gray-700 border-gray-600 text-white flex-1"
                                disabled={isEditing}
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleUpdateProject(subItem.id);
                                  } else if (e.key === 'Escape') {
                                    setEditingProjectId(null);
                                  }
                                }}
                              />
                              <div className="flex gap-1">
                                <div 
                                  className="inline-flex items-center justify-center h-7 w-7 text-green-400 hover:text-green-300 hover:bg-gray-700 cursor-pointer rounded-md transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleUpdateProject(subItem.id);
                                  }}
                                >
                                  <Check className="h-4 w-4" />
                                </div>
                                <div 
                                  className="inline-flex items-center justify-center h-7 w-7 text-gray-400 hover:text-gray-300 hover:bg-gray-700 cursor-pointer rounded-md transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingProjectId(null);
                                  }}
                                >
                                  <X className="h-4 w-4" />
                                </div>
                              </div>
                            </div>
                          ) : showDeleteConfirm === subItem.id ? (
                            <div className="flex items-center w-full">
                              <div className="flex-1 flex items-center justify-between pr-0 text-red-400 hover:text-red-300 px-2 py-1.5 rounded-md">
                                <span>Delete project?</span>
                                <div className="flex gap-1">
                                  <div 
                                    className="inline-flex items-center justify-center h-7 w-7 text-red-400 hover:text-red-300 hover:bg-gray-700 cursor-pointer rounded-md transition-colors"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteProject(subItem.id);
                                    }}
                                  >
                                    <Check className="h-4 w-4" />
                                  </div>
                                  <div 
                                    className="inline-flex items-center justify-center h-7 w-7 text-gray-400 hover:text-gray-300 hover:bg-gray-700 cursor-pointer rounded-md transition-colors"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setShowDeleteConfirm(null);
                                    }}
                                  >
                                    <X className="h-4 w-4" />
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <>
                              <SidebarMenuButton 
                                asChild={item.title !== "My Projects"} 
                                isActive={subItem.isActive}
                                onClick={item.title === "My Projects" ? () => router.push(subItem.url) : undefined}
                                className="flex-1 justify-start"
                              >
                                {item.title === "My Projects" ? (
                                  <span className="cursor-pointer">{subItem.title}</span>
                                ) : (
                                  <a href={subItem.url}>{subItem.title}</a>
                                )}
                              </SidebarMenuButton>
                              
                              <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                                <div 
                                  className="inline-flex items-center justify-center h-7 w-7 text-gray-400 hover:text-gray-300 hover:bg-gray-700 cursor-pointer rounded-md transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingProjectId(subItem.id);
                                    setEditedProjectName(subItem.title);
                                  }}
                                >
                                  <Pencil className="h-3 w-3" />
                                </div>
                                <div 
                                  className="inline-flex items-center justify-center h-7 w-7 text-gray-400 hover:text-red-400 hover:bg-gray-700 cursor-pointer rounded-md transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setShowDeleteConfirm(subItem.id);
                                  }}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </SidebarMenuItem>
                    ))}
                    
                    {/* Create New Project Button and Form */}
                    {item.title === "My Projects" && (
                      <SidebarMenuItem>
                        {showNewProjectInput ? (
                          <div className="flex flex-col gap-2 p-2">
                            <Input
                              placeholder="Project name"
                              value={newProjectName}
                              onChange={(e) => setNewProjectName(e.target.value)}
                              className="bg-gray-700 border-gray-600 text-white"
                              disabled={isCreating}
                            />
                            <div className="flex flex-col gap-2">
                              <div 
                                className="inline-flex items-center justify-center w-full px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md cursor-pointer transition-colors disabled:opacity-50"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  if (newProjectName.trim() && !isCreating) {
                                    try {
                                      const result = await createProjectMutation.mutateAsync({
                                        project_name: newProjectName.trim()
                                      });
                                      
                                      if (result?.project?.id) {
                                        // Navigate to the new project
                                        router.push(`/projects/${result.project.id}`);
                                        
                                        // Reset form state
                                        setNewProjectName("");
                                        setShowNewProjectInput(false);
                                      }
                                    } catch (error) {
                                      console.error("Failed to create project:", error);
                                    }
                                  }
                                }}
                              >
                                {isCreating ? "Creating..." : "Create"}
                              </div>
                              <div 
                                className="inline-flex items-center justify-center w-full px-3 py-2 text-sm font-medium text-gray-300 border border-gray-600 hover:bg-gray-700 rounded-md cursor-pointer transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (!isCreating) {
                                    setShowNewProjectInput(false);
                                    setNewProjectName("");
                                  }
                                }}
                              >
                                Cancel
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div 
                            className="w-full flex items-center justify-start gap-2 text-gray-300 hover:text-white hover:bg-gray-700 cursor-pointer px-3 py-2 rounded-md transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowNewProjectInput(true);
                            }}
                          >
                            <PlusCircle size={16} />
                            <span>Create New Project</span>
                          </div>
                        )}
                      </SidebarMenuItem>
                    )}
                  </>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarRail/>
    </Sidebar>
    </div>
  )
}
