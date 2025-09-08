
"use client"

import * as React from "react"
import { SidebarProvider } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"

export function ClientProviderWrapper({ children }: { children: React.ReactNode }) {
  const [isClient, setIsClient] = React.useState(false)

  React.useEffect(() => {
    setIsClient(true)
  }, [])

  // Render a placeholder on the server and the actual content on the client
  if (!isClient) {
    return null;
  }

  return (
    <SidebarProvider>
      <TooltipProvider delayDuration={0}>
        {children}
      </TooltipProvider>
    </SidebarProvider>
  )
}
