import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/app-sidebar'
import { Providers } from './providers'
import './globals.css'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="h-screen w-screen">
        <Providers>
          <SidebarProvider>
            <AppSidebar/>
            <main className="relative h-full -ml-0.5 mr-0">
              <SidebarTrigger className="absolute top-4 left-4 z-50" 
                style={{
                  background: '#B4BDC3', 
                  cursor: 'pointer'
                  }}/>
              {children}
            </main>
          </SidebarProvider>
        </Providers>
      </body>
    </html>
  )
}

