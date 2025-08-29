"use client"

import { useForm, useFieldArray, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PlusCircle, Trash2 } from "lucide-react"
import type { Template } from "@/lib/types"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import React from "react"
import { cn } from "@/lib/utils"

const lineItemSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  type: z.enum(["fixed", "time", "weight", "percentage", "quantity", "default"]).optional(),
  appliesTo: z.array(z.string()).optional(),
})

const templateSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  currency: z.string().min(1, "Currency is required"),
  lines: z.array(lineItemSchema).min(1, "At least one line item is required"),
})

type TemplateFormData = z.infer<typeof templateSchema>

interface TemplateCreatorProps {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  onSave: (template: Omit<Template, 'id'>) => void
}

const currencies = [
    { code: 'USD', name: 'United States Dollar' },
    { code: 'EUR', name: 'Euro' },
    { code: 'JPY', name: 'Japanese Yen' },
    { code: 'GBP', name: 'British Pound Sterling' },
    { code: 'AUD', name: 'Australian Dollar' },
    { code: 'CAD', name: 'Canadian Dollar' },
    { code: 'CHF', name: 'Swiss Franc' },
    { code: 'CNY', name: 'Chinese Yuan' },
    { code: 'SEK', name: 'Swedish Krona' },
    { code: 'NZD', name: 'New Zealand Dollar' },
    { code: 'ZAR', name: 'South African Rand' },
]

export default function TemplateCreator({ isOpen, onOpenChange, onSave }: TemplateCreatorProps) {
  const form = useForm<TemplateFormData>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      name: "",
      currency: "ZAR",
      lines: [{ id: crypto.randomUUID(), name: "", type: "default", appliesTo: [] }],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "lines",
  })
  
  const watchedLines = useWatch({
    control: form.control,
    name: "lines",
  });

  const onSubmit = (data: TemplateFormData) => {
    const newTemplateData = {
        name: data.name,
        currency: data.currency,
        lines: data.lines.map(line => ({
            id: line.id || crypto.randomUUID(),
            name: line.name,
            type: line.type === 'percentage' ? 'percentage' : undefined, 
            appliesTo: line.type === 'percentage' ? line.appliesTo : undefined
        })).map(({ type, ...rest }) => {
            const finalLine: any = { ...rest };
            if (type === 'percentage') {
                finalLine.type = 'percentage';
            }
            return finalLine;
        }) as Template['lines']
    }
    onSave(newTemplateData)
    form.reset()
  }
  
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      form.reset({
        name: "",
        currency: "ZAR",
        lines: [{ id: crypto.randomUUID(), name: "", type: "default", appliesTo: [] }],
      });
    }
    onOpenChange(open);
  }

  const availableLinesForPercentage = watchedLines.filter(line => line.type !== 'percentage');

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[625px] grid-rows-[auto_minmax(0,1fr)_auto] p-0 max-h-[90vh]">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>Create New Template</DialogTitle>
          <DialogDescription>
            Define the structure of your calculator. Add line items as categories for your costs.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <ScrollArea className="h-[65vh] overflow-y-auto">
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Template Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Project Quote" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Currency</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a currency" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {currencies.map(c => <SelectItem key={c.code} value={c.code}>{c.code} - {c.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div>
                  <h3 className="mb-2 text-sm font-medium">Line Item Categories</h3>
                  <div className="space-y-4">
                    {fields.map((field, index) => {
                      const currentLine = watchedLines[index];
                      return (
                        <div key={field.id} className="p-3 border rounded-lg bg-muted/50 space-y-4">
                          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-2">
                            <FormField
                              control={form.control}
                              name={`lines.${index}.name`}
                              render={({ field }) => (
                                <FormItem className="flex-1 w-full">
                                  <FormLabel>Name</FormLabel>
                                  <FormControl>
                                    <Input placeholder="e.g., Labor" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                             <FormField
                              control={form.control}
                              name={`lines.${index}.type`}
                              render={({ field }) => (
                                <FormItem className="w-full sm:w-[180px]">
                                   <FormLabel>Type (Optional)</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Default (User selects)" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="default">User Selects in Calc</SelectItem>
                                      <SelectItem value="percentage">Percentage</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </FormItem>
                              )}
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              onClick={() => remove(index)}
                              disabled={fields.length <= 1}
                              className="w-full sm:w-10 mt-2 sm:mt-0 self-end"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>

                          {currentLine?.type === "percentage" && (
                             <FormField
                              control={form.control}
                              name={`lines.${index}.appliesTo`}
                              render={() => (
                                <FormItem>
                                   <div className="mb-2">
                                    <FormLabel className="text-sm font-medium">Applies To</FormLabel>
                                    <FormDescription className="text-xs">
                                      Select which line items this percentage should be calculated from. If none are selected, it applies to the subtotal.
                                    </FormDescription>
                                  </div>
                                  {availableLinesForPercentage.length > 0 ? (
                                    <div className="space-y-2">
                                      {availableLinesForPercentage.map((line) => (
                                        <FormField
                                          key={line.id}
                                          control={form.control}
                                          name={`lines.${index}.appliesTo`}
                                          render={({ field }) => {
                                            return (
                                              <FormItem
                                                key={line.id}
                                                className="flex flex-row items-start space-x-3 space-y-0"
                                              >
                                                <FormControl>
                                                  <Checkbox
                                                    checked={field.value?.includes(line.id!)}
                                                    onCheckedChange={(checked) => {
                                                      const newValue = checked
                                                        ? [...(field.value || []), line.id!]
                                                        : (field.value || []).filter(
                                                            (value) => value !== line.id
                                                          );
                                                      field.onChange(newValue);
                                                    }}
                                                  />
                                                </FormControl>
                                                <FormLabel className="font-normal">
                                                  {line.name || "Untitled Line"}
                                                </FormLabel>
                                              </FormItem>
                                            )
                                          }}
                                        />
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="text-xs text-muted-foreground">Add other line item categories to apply percentages to them.</p>
                                  )}
                                </FormItem>
                              )}
                            />
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => append({ id: crypto.randomUUID(), name: "", type: "default", appliesTo: [] })}
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Category
                </Button>
              </div>
            </ScrollArea>
            <DialogFooter className="p-6 pt-0 border-t">
              <Button type="submit">Save Template</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
