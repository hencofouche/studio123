"use client"

import * as React from "react"
import { PlusCircle, Trash2, X, ArrowUp, ArrowDown } from "lucide-react"
import type { Template, LineItemValues, LineItemDefinition, CalculationType, LineItemEntry } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import CostChart from "./CostChart"
import { Separator } from "@/components/ui/separator"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"

interface CalculatorProps {
  template: Template
  onTemplateChange: (template: Template) => void;
  values: LineItemValues
  onValuesChange: (values: LineItemValues) => void
}

interface CalculatedLine {
  id: string
  name: string
  total: number
  type: CalculationType
}

function formatCurrency(value: number, currency: string) {
  if (!currency) return ""
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
  }).format(value)
}

function getEntryTotal(entry: LineItemEntry): number {
  if (entry.type === "fixed") {
    // For fixed, value1 is quantity, value2 is price. Default quantity to 1.
    return (entry.value1 || 1) * (entry.value2 || 0)
  } else if (entry.type === "time" || entry.type === "weight" || entry.type === "volume") {
    // For time, value1 is minutes, value2 is rate per minute
    return (entry.value1 || 0) * (entry.value2 || 0)
  }
  return 0
}

export default function Calculator({ template, onTemplateChange, values, onValuesChange }: CalculatorProps) {
  const [newCategoryName, setNewCategoryName] = React.useState("");

  const handleAddCategory = () => {
    if (newCategoryName.trim() === "") return;
    const newCategory: LineItemDefinition = {
      id: crypto.randomUUID(),
      name: newCategoryName.trim(),
    };
    onTemplateChange({
      ...template,
      lines: [...template.lines, newCategory],
    });
    setNewCategoryName("");
  };

  const handleMoveCategory = (index: number, direction: 'up' | 'down') => {
    const newLines = [...template.lines];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= newLines.length) return;
    const [movedItem] = newLines.splice(index, 1);
    newLines.splice(newIndex, 0, movedItem);
    onTemplateChange({ ...template, lines: newLines });
  };
  
  const handleMoveEntry = (defId: string, entryId: string, direction: 'up' | 'down') => {
    const newValues = [...values];
    const entriesInDef = newValues.filter(v => v.defId === defId);
    const entryIndexInDef = entriesInDef.findIndex(e => e.id === entryId);
    
    if (entryIndexInDef === -1) return;

    const targetIndexInDef = direction === 'up' ? entryIndexInDef - 1 : entryIndexInDef + 1;
    if (targetIndexInDef < 0 || targetIndexInDef >= entriesInDef.length) return;

    const originalEntry = entriesInDef[entryIndexInDef];
    const targetEntry = entriesInDef[targetIndexInDef];

    const originalEntryIndexInAll = newValues.findIndex(v => v.id === originalEntry.id);
    const targetEntryIndexInAll = newValues.findIndex(v => v.id === targetEntry.id);
    
    // Swap them in the main values array
    [newValues[originalEntryIndexInAll], newValues[targetEntryIndexInAll]] = [newValues[targetEntryIndexInAll], newValues[originalEntryIndexInAll]];

    onValuesChange(newValues);
  };


  const handleAddEntry = (defId: string) => {
    const newEntry: LineItemEntry = {
      id: crypto.randomUUID(),
      defId,
      name: "",
      type: 'fixed',
    }
    onValuesChange([...values, newEntry])
  }

  const handleRemoveEntry = (entryId: string) => {
    onValuesChange(values.filter(entry => entry.id !== entryId))
  }

  const handleEntryChange = (entryId: string, field: keyof Omit<LineItemEntry, "id" | "defId">, value: any) => {
    onValuesChange(
      values.map(entry => {
        if (entry.id === entryId) {
          const updatedEntry = { ...entry, [field]: value };
          if (field === 'type') {
            updatedEntry.value1 = undefined;
            updatedEntry.value2 = undefined;
            updatedEntry.appliesTo = value === 'percentage' ? [] : undefined;
          }
          return updatedEntry;
        }
        return entry;
      })
    )
  }
  
  const handleNumericEntryChange = (entryId: string, field: keyof Omit<LineItemEntry, "id" | "defId">, value: string) => {
    const parsedValue = value === "" ? undefined : parseFloat(value)
    handleEntryChange(entryId, field, parsedValue as number)
  }
  
  const { calculatedLines, categorySummaries, total } = React.useMemo(() => {
    const entryTotals: { [id: string]: number } = {};
    
    // First pass: calculate totals for all non-percentage entries
    const nonPercentageEntries = values.filter(entry => entry.type !== 'percentage');
    nonPercentageEntries.forEach((entry) => {
      entryTotals[entry.id] = getEntryTotal(entry);
    });

    const subtotalOfAllItems = Object.values(entryTotals).reduce((acc, total) => acc + total, 0);

    // Second pass: calculate totals for all percentage entries
    const percentageEntries = values.filter(entry => entry.type === 'percentage');
    percentageEntries.forEach(entry => {
      let baseTotal = subtotalOfAllItems;
       if (entry.appliesTo && entry.appliesTo.length > 0) {
        baseTotal = entry.appliesTo.reduce((acc, appliedId) => acc + (entryTotals[appliedId] || 0), 0);
      }
      const percentage = entry.value1 || 0;
      const lineTotal = baseTotal * (percentage / 100);
      entryTotals[entry.id] = lineTotal;
    });

    // Third pass: build category summaries and overall totals
    const finalCategorySummaries = template.lines.map(lineDef => {
        const directEntries = values.filter(v => v.defId === lineDef.id && v.type !== 'percentage');
        const percentageEntries = values.filter(v => v.defId === lineDef.id && v.type === 'percentage');

        const directTotal = directEntries.reduce((acc, entry) => acc + (entryTotals[entry.id] || 0), 0);
        
        const percentageAdjustments = percentageEntries.map(entry => ({
            id: entry.id,
            name: entry.name,
            total: entryTotals[entry.id] || 0,
            percentage: entry.value1 || 0,
        }));
        
        const totalWithPercentages = directTotal + percentageAdjustments.reduce((acc, p) => acc + p.total, 0);
        
        return {
            id: lineDef.id,
            name: lineDef.name,
            directTotal,
            percentageAdjustments,
            total: totalWithPercentages,
        };
    }).filter(summary => summary.total > 0);

    const uncategorizedPercentageEntries = values.filter(entry => !entry.defId && entry.type === 'percentage');
    const finalCalculatedLines: CalculatedLine[] = uncategorizedPercentageEntries.map(entry => ({
        id: entry.id,
        name: entry.name || "Percentage",
        total: entryTotals[entry.id] || 0,
        type: 'percentage' as CalculationType
    }));

    const newTotal = finalCategorySummaries.reduce((acc, cat) => acc + cat.total, 0) + finalCalculatedLines.reduce((acc, line) => acc + line.total, 0);

    return { calculatedLines: finalCalculatedLines, categorySummaries: finalCategorySummaries, total: newTotal };
  }, [template.lines, values]);


  const renderInputs = (entry: LineItemEntry) => {
    const availableLinesForPercentage = values.filter(v => v.type !== 'percentage' && v.id !== entry.id);

    switch (entry.type) {
      case "fixed":
        return (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor={`${entry.id}-quantity`}>Quantity</Label>
              <Input
                id={`${entry.id}-quantity`}
                type="number"
                placeholder="1"
                value={entry.value1 ?? ""}
                onChange={(e) => handleNumericEntryChange(entry.id, "value1", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor={`${entry.id}-price`}>Unit Price</Label>
              <Input
                id={`${entry.id}-price`}
                type="number"
                placeholder="0.00"
                value={entry.value2 ?? ""}
                onChange={(e) => handleNumericEntryChange(entry.id, "value2", e.target.value)}
              />
            </div>
          </div>
        )
      case "time":
        return (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor={`${entry.id}-mins`}>Minutes</Label>
              <Input
                id={`${entry.id}-mins`}
                type="number"
                placeholder="0"
                value={entry.value1 ?? ""}
                onChange={(e) => handleNumericEntryChange(entry.id, "value1", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor={`${entry.id}-rate`}>Rate (/min)</Label>
              <Input
                id={`${entry.id}-rate`}
                type="number"
                placeholder="0.00"
                value={entry.value2 ?? ""}
                onChange={(e) => handleNumericEntryChange(entry.id, "value2", e.target.value)}
              />
            </div>
          </div>
        )
      case "weight":
        return (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor={`${entry.id}-amount`}>Amount (g)</Label>
              <Input
                id={`${entry.id}-amount`}
                type="number"
                placeholder="0"
                value={entry.value1 ?? ""}
                onChange={(e) => handleNumericEntryChange(entry.id, "value1", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${entry.id}-rate`}>Rate (/g)</Label>
              <Input
                id={`${entry.id}-rate`}
                type="number"
                placeholder="0.00"
                value={entry.value2 ?? ""}
                onChange={(e) => handleNumericEntryChange(entry.id, "value2", e.target.value)}
              />
            </div>
          </div>
        )
      case "volume":
        return (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor={`${entry.id}-amount`}>Amount (ml)</Label>
              <Input
                id={`${entry.id}-amount`}
                type="number"
                placeholder="0"
                value={entry.value1 ?? ""}
                onChange={(e) => handleNumericEntryChange(entry.id, "value1", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${entry.id}-rate`}>Rate (/ml)</Label>
              <Input
                id={`${entry.id}-rate`}
                type="number"
                placeholder="0.00"
                value={entry.value2 ?? ""}
                onChange={(e) => handleNumericEntryChange(entry.id, "value2", e.target.value)}
              />
            </div>
          </div>
        )
      case "percentage":
        return (
          <div className="grid grid-cols-1 gap-2">
            <div>
              <Label htmlFor={`${entry.id}-percentage`}>Percentage (%)</Label>
              <Input
                id={`${entry.id}-percentage`}
                type="number"
                placeholder="0"
                value={entry.value1 ?? ""}
                onChange={(e) => handleNumericEntryChange(entry.id, "value1", e.target.value)}
              />
            </div>
             <div>
              <Label>Applies To</Label>
                <MultiSelect
                  options={availableLinesForPercentage.map(l => ({ value: l.id, label: l.name || 'Untitled Entry' }))}
                  selected={entry.appliesTo || []}
                  onChange={(selected) => handleEntryChange(entry.id, 'appliesTo', selected)}
                  placeholder="Subtotal of all items"
                  className="w-full"
                />
            </div>
          </div>
        )
      default:
        return null
    }
  }

  const renderEntry = (entry: LineItemEntry, index: number, allEntries: LineItemEntry[]) => {
    const totalForEntry = (values.find(v => v.id === entry.id) && getEntryTotal(entry)) || 0;
    
    // Re-calculate total for percentage on the fly for display, as main calculation is memoized
    let displayTotal: number;
    if (entry.type === 'percentage') {
       const nonPercentageEntries = values.filter(v => v.type !== 'percentage');
       const entryTotalsForDisplay: { [id: string]: number } = {};
       nonPercentageEntries.forEach((e) => {
         entryTotalsForDisplay[e.id] = getEntryTotal(e);
       });
       let baseTotal = Object.values(entryTotalsForDisplay).reduce((acc, total) => acc + total, 0);

       if (entry.appliesTo && entry.appliesTo.length > 0) {
         baseTotal = entry.appliesTo.reduce((acc, appliedId) => acc + (entryTotalsForDisplay[appliedId] || 0), 0);
       }
       const percentage = entry.value1 || 0;
       displayTotal = baseTotal * (percentage / 100);
    } else {
        displayTotal = getEntryTotal(entry);
    }


    return (
    <div key={entry.id} className="p-4 border-b last:border-b-0">
       <div className="flex flex-col sm:flex-row items-start gap-4">
          <div className="flex items-start gap-1">
            <div className="flex flex-col">
              <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => handleMoveEntry(entry.defId, entry.id, 'up')} disabled={index === 0}>
                  <ArrowUp className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => handleMoveEntry(entry.defId, entry.id, 'down')} disabled={index === allEntries.length - 1}>
                  <ArrowDown className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1 space-y-2 w-full">
              <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                      placeholder="Description"
                      value={entry.name}
                      onChange={(e) => handleEntryChange(entry.id, "name", e.target.value)}
                      className="text-base font-medium flex-1"
                  />
                  <Select 
                    value={entry.type} 
                    onValueChange={(value) => handleEntryChange(entry.id, "type", value as CalculationType)}
                  >
                      <SelectTrigger className="w-full sm:w-[180px]">
                          <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                          <SelectItem value="fixed">Fixed Price</SelectItem>
                          <SelectItem value="time">Time (mins)</SelectItem>
                          <SelectItem value="weight">Weight (g)</SelectItem>
                          <SelectItem value="volume">Volume (ml)</SelectItem>
                          <SelectItem value="percentage">Percentage</SelectItem>
                      </SelectContent>
                  </Select>
              </div>
              {renderInputs(entry)}
            </div>
          </div>
          <div className="text-right w-full sm:w-auto ml-auto flex items-center gap-2">
             <div className="font-bold text-lg">{formatCurrency(displayTotal, template.currency)}</div>
              <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => handleRemoveEntry(entry.id)}
              >
                  <Trash2 className="size-4" />
              </Button>
          </div>
       </div>
    </div>
  )};
  
  const chartData = categorySummaries.map(cat => ({ id: cat.id, name: cat.name, total: cat.total }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      <div className="lg:col-span-2 space-y-4">
        <div className="flex items-center gap-2 p-2 rounded-lg border bg-card">
          <Input
            placeholder="New category name..."
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
            className="flex-1"
          />
          <Button onClick={handleAddCategory}>
            <PlusCircle className="mr-2" /> Add Category
          </Button>
        </div>

        {template.lines.map((lineDef, index) => {
          const entriesForDef = values.filter(v => v.defId === lineDef.id);

          return (
            <Card key={lineDef.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                     <div className="flex flex-col">
                        <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => handleMoveCategory(index, 'up')} disabled={index === 0}>
                           <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => handleMoveCategory(index, 'down')} disabled={index === template.lines.length - 1}>
                           <ArrowDown className="h-4 w-4" />
                        </Button>
                     </div>
                    <CardTitle className="text-base font-medium flex items-center gap-2">
                      {lineDef.name}
                    </CardTitle>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleAddEntry(lineDef.id)}>
                    <PlusCircle className="mr-2" /> Add Entry
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                 {entriesForDef.length > 0 ? (
                  entriesForDef.map((entry, entryIndex) => renderEntry(entry, entryIndex, entriesForDef))
                ) : (
                  <p className="text-sm text-muted-foreground px-6 pb-4">No entries for {lineDef.name}. Click "Add Entry" to start.</p>
                )}
              </CardContent>
            </Card>
          )
        })}

        {values.some(v => v.type === 'percentage' && !v.defId) && (
            <Card>
                <CardHeader>
                    <CardTitle className="text-base font-medium">Uncategorized Adjustments</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {values.filter(v => v.type === 'percentage' && !v.defId).map((entry, index, all) => renderEntry(entry, index, all))}
                </CardContent>
            </Card>
        )}
      </div>

      <div className="lg:col-span-1 space-y-6 sticky top-4">
         <Card>
            <CardHeader>
                <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {categorySummaries.map((cat, index) => (
                  <div key={cat.id}>
                    {cat.directTotal > 0 && (
                      <div className="flex justify-between text-muted-foreground">
                          <span>{cat.name} Subtotal</span>
                          <span>{formatCurrency(cat.directTotal, template.currency)}</span>
                      </div>
                    )}
                    {cat.percentageAdjustments.map(adj => (
                       <div key={adj.id} className="flex justify-between text-muted-foreground pl-4">
                         <span>{adj.name} ({adj.percentage}%)</span>
                         <span>{formatCurrency(adj.total, template.currency)}</span>
                     </div>
                    ))}
                    {index < categorySummaries.length - 1 && <Separator className="my-2" />}
                  </div>
                ))}

                {calculatedLines.length > 0 && (
                  <>
                    <Separator className="my-2" />
                    {calculatedLines.map(line => (
                        <div key={line.id} className="flex justify-between text-muted-foreground">
                            <span>{line.name} ({values.find(v => v.id === line.id)?.value1 || 0}%)</span>
                            <span>{formatCurrency(line.total, template.currency)}</span>
                        </div>
                    ))}
                  </>
                )}
                
                {(categorySummaries.length > 0 || calculatedLines.length > 0) && <Separator className="my-2"/>}

                <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>{formatCurrency(total, template.currency)}</span>
                </div>
              </div>
            </CardContent>
        </Card>
        
        <CostChart data={chartData} currency={template.currency} />
      </div>
    </div>
  )
}

interface MultiSelectProps {
  options: { label: string; value: string }[]
  selected: string[]
  onChange: (selected: string[]) => void
  className?: string
  placeholder?: string
}

function MultiSelect({ options, selected, onChange, className, placeholder = "Select..." }: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  const selectedValues = new Set(selected);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between h-auto min-h-10", className)}
        >
          <div className="flex gap-1 flex-wrap">
            {selected.length === 0 && placeholder}
            {selected.map(value => {
              const label = options.find(opt => opt.value === value)?.label;
              return (
                <Badge
                  key={value}
                  variant="secondary"
                  className="mr-1"
                >
                  {label}
                  <span
                    role="button"
                    aria-label={`Remove ${label} from selection`}
                    className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onClick={() => onChange(selected.filter(v => v !== value))}
                  >
                    <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                  </span>
                </Badge>
              );
            })}
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <ScrollArea className="max-h-60">
           <div className="p-2">
            {options.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground">No items to select.</p>
            ) : (
                options.map((option) => (
                    <div
                        key={option.value}
                        className="flex items-center space-x-2 p-2 rounded-md hover:bg-accent cursor-pointer"
                        onClick={() => {
                            const newSelected = selectedValues.has(option.value)
                            ? selected.filter(v => v !== option.value)
                            : [...selected, option.value];
                            onChange(newSelected);
                        }}
                    >
                        <Checkbox
                            id={`multi-select-${option.value}`}
                            checked={selectedValues.has(option.value)}
                            onCheckedChange={() => {
                                const newSelected = selectedValues.has(option.value)
                                ? selected.filter(v => v !== option.value)
                                : [...selected, option.value];
                                onChange(newSelected);
                            }}
                        />
                        <Label
                            htmlFor={`multi-select-${option.value}`}
                            className="flex-1 cursor-pointer"
                        >
                            {option.label}
                        </Label>
                    </div>
                ))
            )}
           </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
