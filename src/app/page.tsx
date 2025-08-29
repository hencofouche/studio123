"use client"

import * as React from "react"
import {
  FilePlus2,
  FolderOpen,
  Sigma,
  Trash2,
  PanelLeft,
  PlusCircle,
} from "lucide-react"

import type { Template, LineItemValues, LineItemDefinition } from "@/lib/types"
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
  SidebarFooter,
} from "@/components/ui/sidebar"
import Calculator from "@/components/calc-forge/Calculator"
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
import { ModeToggle } from "@/components/mode-toggle"

const defaultTemplate: Template = {
  id: 'default',
  name: 'New Calculation',
  currency: 'USD',
  lines: [
    { id: crypto.randomUUID(), name: 'Labor' },
    { id: crypto.randomUUID(), name: 'Materials' },
  ]
}

export default function Home() {
  const { toast } = useToast()
  const [templates, setTemplates] = useLocalStorage<Template[]>("calc-forge-templates", [])
  const [activeTemplateId, setActiveTemplateId] = React.useState<string | null>(null)
  const [lineItemValues, setLineItemValues] = useLocalStorage<LineItemValues>("calc-forge-values", [])

  React.useEffect(() => {
    if (templates.length === 0) {
      // If there are no templates, create a default one to start
      const newDefaultTemplate = { ...defaultTemplate, id: crypto.randomUUID() };
      setTemplates([newDefaultTemplate]);
      setActiveTemplateId(newDefaultTemplate.id);
      setLineItemValues([]);
    } else if (!activeTemplateId || !templates.some(t => t.id === activeTemplateId)) {
      // If there's no active template or the active one is invalid, select the first one
      setActiveTemplateId(templates[0].id);
      // Don't clear values if we're just re-selecting
    }
  }, [templates, activeTemplateId, setTemplates, setLineItemValues]);


  const activeTemplate = React.useMemo(
    () => templates.find((t) => t.id === activeTemplateId) || null,
    [templates, activeTemplateId]
  )

  const handleCreateTemplate = () => {
    const newTemplate = { ...defaultTemplate, id: crypto.randomUUID(), name: `New Calculation ${templates.length + 1}` };
    const updatedTemplates = [...templates, newTemplate];
    setTemplates(updatedTemplates);
    setActiveTemplateId(newTemplate.id);
    setLineItemValues([]);
    toast({
      title: "New Calculation Created",
      description: `Switched to "${newTemplate.name}".`,
    });
  }
  
  const handleUpdateTemplate = (updatedTemplate: Template) => {
    setTemplates(prev => prev.map(t => t.id === updatedTemplate.id ? updatedTemplate : t));
  };


  const handleSelectTemplate = (id: string) => {
    if (activeTemplateId !== id) {
      setActiveTemplateId(id)
      // When switching templates, we might want to clear values,
      // or in the future, store values per template. For now, we clear.
      setLineItemValues([])
    }
  }

  const handleDeleteTemplate = (id: string) => {
    const templateToDelete = templates.find(t => t.id === id);
    if (!templateToDelete) return;

    const updatedTemplates = templates.filter((t) => t.id !== id);
    setTemplates(updatedTemplates);

    if (activeTemplateId === id) {
      // If the active template is deleted, switch to another one or create a new default
      if (updatedTemplates.length > 0) {
        setActiveTemplateId(updatedTemplates[0].id);
      } else {
        const newDefaultTemplate = { ...defaultTemplate, id: crypto.randomUUID() };
        setTemplates([newDefaultTemplate]);
        setActiveTemplateId(newDefaultTemplate.id);
      }
      setLineItemValues([]);
    }

    toast({
      title: "Template Deleted",
      description: `"${templateToDelete.name}" has been removed.`,
      variant: "destructive",
    });
  }

  return (
    <SidebarProvider>
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
              onClick={handleCreateTemplate}
            >
              <FilePlus2 />
              <span>New Calculation</span>
            </Button>
          </div>
          <SidebarMenu>
            <li className="px-4 pt-2 pb-1 text-xs font-medium text-muted-foreground">
              <div className="flex items-center gap-2">
                <FolderOpen className="size-4" />
                <span>Saved Calculations</span>
              </div>
            </li>
            {templates.length === 0 ? (
              <p className="px-4 text-sm text-muted-foreground">No calculations yet.</p>
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
                          This action cannot be undone. This will permanently delete the "{template.name}" calculation.
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
        <SidebarFooter>
          <ModeToggle />
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="md:hidden">
              <PanelLeft />
            </SidebarTrigger>
            {activeTemplate && (
              <h2 className="text-xl font-semibold">
                {activeTemplate.name}
              </h2>
            )}
          </div>
        </div>
        <main className="flex-1 p-4 pt-0">
          {activeTemplate ? (
            <Calculator
              key={activeTemplate.id}
              template={activeTemplate}
              onTemplateChange={handleUpdateTemplate}
              values={lineItemValues}
              onValuesChange={setLineItemValues}
            />
          ) : (
            <div className="flex h-[calc(100vh-10rem)] items-center justify-center rounded-lg border-2 border-dashed bg-card">
              <div className="text-center">
                <FolderOpen className="mx-auto size-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">No Calculation Selected</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Create a new calculation or select one from the sidebar.
                </p>
                <Button className="mt-4" onClick={handleCreateTemplate}>
                  <FilePlus2 />
                  Create Calculation
                </Button>
              </div>
            </div>
          )}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
