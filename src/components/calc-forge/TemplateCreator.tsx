"use client"

import { useForm, useFieldArray } from "react-hook-form"
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
import type { CalculationType, Template } from "@/lib/types"

const lineItemSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["fixed", "time", "weight", "percentage"]),
})

const templateSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  lines: z.array(lineItemSchema).min(1, "At least one line item is required"),
})

type TemplateFormData = z.infer<typeof templateSchema>

interface TemplateCreatorProps {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  onSave: (template: Omit<Template, 'id'>) => void
}

export default function TemplateCreator({ isOpen, onOpenChange, onSave }: TemplateCreatorProps) {
  const form = useForm<TemplateFormData>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      name: "",
      lines: [{ name: "", type: "fixed" }],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "lines",
  })

  const onSubmit = (data: TemplateFormData) => {
    const newTemplateData = {
        name: data.name,
        lines: data.lines.map(line => ({
            ...line,
            id: crypto.randomUUID(),
            type: line.type as CalculationType,
        }))
    }
    onSave(newTemplateData)
    form.reset()
  }
  
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      form.reset();
    }
    onOpenChange(open);
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>Create New Template</DialogTitle>
          <DialogDescription>
            Define the structure of your calculator. Add line items with specific calculation types.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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

            <div>
              <h3 className="mb-2 text-sm font-medium">Line Items</h3>
              <div className="space-y-4">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex items-end gap-2 p-3 border rounded-lg bg-muted/50">
                    <FormField
                      control={form.control}
                      name={`lines.${index}.name`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
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
                        <FormItem className="w-[150px]">
                          <FormLabel>Type</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="fixed">Fixed Price</SelectItem>
                              <SelectItem value="time">Time</SelectItem>
                              <SelectItem value="weight">Weight</SelectItem>
                              <SelectItem value="percentage">Percentage</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      onClick={() => remove(index)}
                      disabled={fields.length <= 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={() => append({ name: "", type: "fixed" })}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Line Item
            </Button>
            
            <DialogFooter>
              <Button type="submit">Save Template</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
