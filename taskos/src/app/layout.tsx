import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/app-sidebar'
import './globals.css'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="h-screen w-screen">
        <SidebarProvider>
          <AppSidebar/>
          <main className="relative h-full -ml-0.5 mr-0.5">
            <SidebarTrigger className="absolute top-4 left-4 z-50" 
              style={{
                background: '#B4BDC3', 
                cursor: 'pointer'
                }}/>
            {children}
          </main>
        </SidebarProvider>
      </body>
    </html>
  )
}

