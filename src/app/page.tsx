"use client"

import * as React from "react"
import {
  FilePlus2,
  FolderOpen,
  Sigma,
  Trash2,
  PanelLeft,
} from "lucide-react"

import type { Template, LineItemValues } from "@/lib/types"
import { useLocalStorage } from "@/hooks/use-local-storage"
import { Button } from "@/components/ui/button"
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import Calculator from "@/components/calc-forge/Calculator"
import TemplateCreator from "@/components/calc-forge/TemplateCreator"
import { useToast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function Home() {
  const { toast } = useToast()
  const [templates, setTemplates] = useLocalStorage<Template[]>("calc-forge-templates", [])
  const [activeTemplateId, setActiveTemplateId] = React.useState<string | null>(null)
  const [lineItemValues, setLineItemValues] = useLocalStorage<LineItemValues>("calc-forge-values", [])
  const [isCreatorOpen, setIsCreatorOpen] = React.useState(false)

  React.useEffect(() => {
    if (!activeTemplateId && templates.length > 0) {
      setActiveTemplateId(templates[0].id)
    }
    if(templates.length === 0) {
      setActiveTemplateId(null)
    }
  }, [templates, activeTemplateId])

  const activeTemplate = React.useMemo(
    () => templates.find((t) => t.id === activeTemplateId),
    [templates, activeTemplateId]
  )

  const handleCreateTemplate = (newTemplate: Omit<Template, "id">) => {
    const templateWithId = { ...newTemplate, id: crypto.randomUUID() }
    const updatedTemplates = [...templates, templateWithId]
    setTemplates(updatedTemplates)
    setActiveTemplateId(templateWithId.id)
    setLineItemValues([])
    setIsCreatorOpen(false)
    toast({
      title: "Template Created",
      description: `"${newTemplate.name}" has been saved.`,
    })
  }

  const handleSelectTemplate = (id: string) => {
    if (activeTemplateId !== id) {
      setActiveTemplateId(id)
      setLineItemValues([])
    }
  }

  const handleDeleteTemplate = (id: string) => {
    const updatedTemplates = templates.filter((t) => t.id !== id)
    setTemplates(updatedTemplates)

    if (activeTemplateId === id) {
      setActiveTemplateId(updatedTemplates.length > 0 ? updatedTemplates[0].id : null)
      setLineItemValues([])
    }
    
    toast({
      title: "Template Deleted",
      description: "The template has been removed.",
      variant: "destructive",
    })
  }

  return (
    <SidebarProvider>
      <TemplateCreator
        isOpen={isCreatorOpen}
        onOpenChange={setIsCreatorOpen}
        onSave={handleCreateTemplate}
      />
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2 p-2">
            <Sigma className="size-7 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              CalcForge
            </h1>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <div className="p-2">
            <Button
              className="w-full"
              onClick={() => setIsCreatorOpen(true)}
            >
              <FilePlus2 />
              <span>New Template</span>
            </Button>
          </div>
          <SidebarMenu>
            <li className="px-4 pt-2 pb-1 text-xs font-medium text-muted-foreground">
              <div className="flex items-center gap-2">
                <FolderOpen className="size-4" />
                <span>Saved Templates</span>
              </div>
            </li>
            {templates.length === 0 ? (
              <p className="px-4 text-sm text-muted-foreground">No templates yet.</p>
            ) : (
              templates.map((template) => (
                <SidebarMenuItem key={template.id}>
                  <SidebarMenuButton
                    onClick={() => handleSelectTemplate(template.id)}
                    isActive={template.id === activeTemplateId}
                    className="justify-between"
                  >
                    <span className="truncate">{template.name}</span>
                  </SidebarMenuButton>
                   <AlertDialog>
                    <AlertDialogTrigger asChild>
                       <Button variant="ghost" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-destructive">
                          <Trash2 className="size-4" />
                       </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete the "{template.name}" template.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteTemplate(template.id)}>
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </SidebarMenuItem>
              ))
            )}
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <div className="p-4 flex items-center gap-4">
          <SidebarTrigger className="md:hidden">
            <PanelLeft />
          </SidebarTrigger>
          {activeTemplate && (
            <h2 className="text-xl font-semibold">
              {activeTemplate.name}
            </h2>
          )}
        </div>
        <main className="flex-1 p-4 pt-0">
          {activeTemplate ? (
            <Calculator
              key={activeTemplate.id}
              template={activeTemplate}
              values={lineItemValues}
              onValuesChange={setLineItemValues}
            />
          ) : (
            <div className="flex h-[calc(100vh-10rem)] items-center justify-center rounded-lg border-2 border-dashed bg-card">
              <div className="text-center">
                <FolderOpen className="mx-auto size-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">No Template Selected</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Create a new template or select one from the sidebar.
                </p>
                <Button className="mt-4" onClick={() => setIsCreatorOpen(true)}>
                  <FilePlus2 />
                  Create Template
                </Button>
              </div>
            </div>
          )}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
