
"use client"

import * as React from "react"
import {
  FilePlus2,
  FolderOpen,
  Sigma,
  Trash2,
  PanelLeft,
  Download,
  Upload
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"


const defaultTemplate: Template = {
  id: 'default',
  name: 'New Calculation',
  currency: 'ZAR',
  lines: []
}

export default function Home() {
  const { toast } = useToast()
  const [templates, setTemplates] = useLocalStorage<Template[]>("calc-forge-templates", [])
  const [activeTemplateId, setActiveTemplateId] = useLocalStorage<string | null>("calc-forge-active", null)
  const [allValues, setAllValues] = useLocalStorage<{ [key: string]: LineItemValues }>("calc-forge-all-values", {})
  const [newTemplateName, setNewTemplateName] = React.useState("")
  const [isCreateDialogOpen, setCreateDialogOpen] = React.useState(false)
  const importFileInputRef = React.useRef<HTMLInputElement>(null);


  React.useEffect(() => {
    // On initial load, if the activeTemplateId from localStorage is invalid, reset it.
    if (activeTemplateId && !templates.some(t => t.id === activeTemplateId)) {
      setActiveTemplateId(null);
    }
  }, [templates, activeTemplateId, setActiveTemplateId]);


  const activeTemplate = React.useMemo(
    () => templates.find((t) => t.id === activeTemplateId) || null,
    [templates, activeTemplateId]
  )

  const lineItemValues = React.useMemo(() => {
    if (!activeTemplateId) return [];
    return allValues[activeTemplateId] || [];
  }, [allValues, activeTemplateId]);

  const handleSetLineItemValues = (newValues: LineItemValues) => {
    if (!activeTemplateId) return;
    setAllValues({
      ...allValues,
      [activeTemplateId]: newValues
    });
  };

  const handleCreateTemplate = () => {
    const name = newTemplateName.trim() || `New Calculation ${templates.length + 1}`;
    const newTemplate = { ...defaultTemplate, id: crypto.randomUUID(), name };
    const updatedTemplates = [...templates, newTemplate];
    setTemplates(updatedTemplates);
    setActiveTemplateId(newTemplate.id);
    setAllValues({
      ...allValues,
      [newTemplate.id]: []
    });
    toast({
      title: "New Calculation Created",
      description: `Switched to "${name}".`,
    });
    setNewTemplateName("");
    setCreateDialogOpen(false);
  }
  
  const handleUpdateTemplate = (updatedTemplate: Template) => {
    setTemplates(prev => prev.map(t => t.id === updatedTemplate.id ? updatedTemplate : t));
  };


  const handleSelectTemplate = (id: string) => {
    if (activeTemplateId !== id) {
      setActiveTemplateId(id)
    }
  }

  const handleDeleteTemplate = (id: string) => {
    const templateToDelete = templates.find(t => t.id === id);
    if (!templateToDelete) return;

    const updatedTemplates = templates.filter((t) => t.id !== id);
    setTemplates(updatedTemplates);

    // Also delete values associated with the template
    const newAllValues = { ...allValues };
    delete newAllValues[id];
    setAllValues(newAllValues);

    if (activeTemplateId === id) {
      if (updatedTemplates.length > 0) {
        setActiveTemplateId(updatedTemplates[0].id);
      } else {
        setActiveTemplateId(null)
      }
    }

    toast({
      title: "Template Deleted",
      description: `"${templateToDelete.name}" has been removed.`,
      variant: "destructive",
    });
  }

  const handleTitleChange = (newName: string) => {
    if (activeTemplate) {
      handleUpdateTemplate({ ...activeTemplate, name: newName });
    }
  };

  const handleExportTemplate = (id: string) => {
    const templateToExport = templates.find(t => t.id === id);
    if (!templateToExport) return;

    const valuesToExport = allValues[id] || [];
    const dataToExport = {
      template: templateToExport,
      values: valuesToExport,
    };

    const jsonString = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${templateToExport.name} TPSA Calculator.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({
      title: "Calculation Exported",
      description: `"${templateToExport.name}" has been downloaded.`,
    });
  };

  const handleImportTemplate = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const result = e.target?.result;
        if (typeof result !== 'string') {
          throw new Error("File could not be read properly.");
        }
        const importedData = JSON.parse(result);
        
        if (!importedData.template || !importedData.values) {
          throw new Error("Invalid JSON format for import.");
        }
        
        let newTemplate: Template = importedData.template;
        const newValues: LineItemValues = importedData.values;

        // Ensure unique ID
        if (templates.some(t => t.id === newTemplate.id)) {
            newTemplate.id = crypto.randomUUID();
        }
        // Ensure unique name
        if (templates.some(t => t.name === newTemplate.name)) {
            newTemplate.name = `${newTemplate.name} (copy)`;
        }

        setTemplates(prev => [...prev, newTemplate]);
        setAllValues(prev => ({...prev, [newTemplate.id]: newValues}));
        setActiveTemplateId(newTemplate.id);

        toast({
          title: "Calculation Imported",
          description: `Successfully imported and switched to "${newTemplate.name}".`,
        });

      } catch (error) {
        console.error("Import failed:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        toast({
          title: "Import Failed",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        // Reset file input
        if(importFileInputRef.current) {
          importFileInputRef.current.value = "";
        }
      }
    };
    reader.readAsText(file);
  };


  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center justify-between p-2">
            <div className="flex items-center gap-2">
              <Sigma className="size-7 text-primary" />
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                TPSA Calculator
              </h1>
            </div>
            <ModeToggle />
          </div>
        </SidebarHeader>
        <SidebarContent>
          <div className="p-2 space-y-2">
             <Dialog open={isCreateDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full">
                  <FilePlus2 />
                  <span>New Calculation</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Calculation</DialogTitle>
                  <DialogDescription>
                    Give your new calculation a name to get started.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                      Name
                    </Label>
                    <Input
                      id="name"
                      value={newTemplateName}
                      onChange={(e) => setNewTemplateName(e.target.value)}
                      className="col-span-3"
                      placeholder="e.g., Kitchen Renovation"
                      onKeyDown={(e) => e.key === 'Enter' && handleCreateTemplate()}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" onClick={handleCreateTemplate}>Create</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <input 
              type="file" 
              ref={importFileInputRef}
              className="hidden" 
              accept="application/json" 
              onChange={handleImportTemplate} 
            />
            <Button variant="outline" className="w-full" onClick={() => importFileInputRef.current?.click()}>
              <Upload />
              <span>Import Calculation</span>
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
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center">
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => handleExportTemplate(template.id)}>
                      <Download className="size-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive">
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
                  </div>
                </SidebarMenuItem>
              ))
            )}
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="md:hidden">
              <PanelLeft />
            </SidebarTrigger>
            {activeTemplate && (
              <Input
                value={activeTemplate.name}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="text-xl font-semibold border-none focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none p-0 h-auto"
              />
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
              onValuesChange={handleSetLineItemValues}
            />
          ) : (
             <div className="flex h-[calc(100vh-10rem)] items-center justify-center rounded-lg border-2 border-dashed bg-card">
              <div className="text-center">
                <FolderOpen className="mx-auto size-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">No Calculation Selected</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Create a new calculation or select one from the sidebar.
                </p>
                 <Dialog open={isCreateDialogOpen} onOpenChange={setCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="mt-4">
                      <FilePlus2 />
                      Create Calculation
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Calculation</DialogTitle>
                      <DialogDescription>
                        Give your new calculation a name to get started.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name-main" className="text-right">
                          Name
                        </Label>
                        <Input
                          id="name-main"
                          value={newTemplateName}
                          onChange={(e) => setNewTemplateName(e.target.value)}
                          className="col-span-3"
                          placeholder="e.g., Kitchen Renovation"
                           onKeyDown={(e) => e.key === 'Enter' && handleCreateTemplate()}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit" onClick={handleCreateTemplate}>Create</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          )}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
