import * as React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"

import { UserButton, useUser } from "@clerk/nextjs"
import { useProjectsForNavigation, useCreateProject } from "@/app/api/queries/projects"
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
  
  // State for new project creation
  const [showNewProjectInput, setShowNewProjectInput] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

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
                      <SidebarMenuItem key={subItem.title}>
                        <SidebarMenuButton 
                          asChild={item.title !== "My Projects"} 
                          isActive={subItem.isActive}
                          onClick={item.title === "My Projects" ? () => router.push(subItem.url) : undefined}
                        >
                          {item.title === "My Projects" ? (
                            <span className="cursor-pointer">{subItem.title}</span>
                          ) : (
                            <a href={subItem.url}>{subItem.title}</a>
                          )}
                        </SidebarMenuButton>
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
                              <Button 
                                size="sm" 
                                variant="default" 
                                className="w-full cursor-pointer" 
                                disabled={!newProjectName.trim() || isCreating}
                                onClick={async () => {
                                  if (!newProjectName.trim()) return;
                                  
                                  setIsCreating(true);
                                  try {
                                    const result = await createProjectMutation.mutateAsync({
                                      project_name: newProjectName.trim()
                                    });
                                    
                                    // Reset form
                                    setNewProjectName("");
                                    setShowNewProjectInput(false);
                                    
                                    // Navigate to the new project if created successfully
                                    if (result?.project?.id) {
                                      router.push(`/projects/${result.project.id}`);
                                    }
                                  } catch (error) {
                                    console.error("Failed to create project:", error);
                                  } finally {
                                    setIsCreating(false);
                                  }
                                }}
                              >
                                {isCreating ? "Creating..." : "Create"}
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="w-full cursor-pointer" 
                                onClick={() => {
                                  setNewProjectName("");
                                  setShowNewProjectInput(false);
                                }}
                                disabled={isCreating}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Button 
                            variant="ghost" 
                            className="w-full flex items-center justify-start gap-2 text-gray-300 hover:text-white hover:bg-gray-700 cursor-pointer"
                            onClick={() => setShowNewProjectInput(true)}
                          >
                            <PlusCircle size={16} />
                            <span>Create New Project</span>
                          </Button>
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
