"use client"

import * as React from "react"
import { PlusCircle, Trash2 } from "lucide-react"
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
import { CalculationTypeIcon } from "@/components/icons"
import CostChart from "./CostChart"
import { Separator } from "@/components/ui/separator"

interface CalculatorProps {
  template: Template
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
  } else if (entry.type === "time" || entry.type === "weight") {
    return (entry.value1 || 0) * (entry.value2 || 0)
  }
  return 0
}

export default function Calculator({ template, values, onValuesChange }: CalculatorProps) {
  const handleAddEntry = (defId: string) => {
    const newEntry: LineItemEntry = {
      id: crypto.randomUUID(),
      defId,
      name: "",
      type: "fixed",
    }
    onValuesChange([...values, newEntry])
  }

  const handleRemoveEntry = (entryId: string) => {
    onValuesChange(values.filter(entry => entry.id !== entryId))
  }

  const handleEntryChange = (entryId: string, field: keyof Omit<LineItemEntry, "id" | "defId">, value: string | number) => {
    onValuesChange(
      values.map(entry => {
        if (entry.id === entryId) {
          const updatedEntry = { ...entry, [field]: value };
          if (field === 'type') {
            updatedEntry.value1 = undefined;
            updatedEntry.value2 = undefined;
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
  
  const { calculatedLines, subtotal, total } = React.useMemo(() => {
    const lineTotals: { [key: string]: number } = {};
    template.lines.forEach(line => lineTotals[line.id] = 0);

    const nonPercentageLines: CalculatedLine[] = []
    
    values.forEach((entry) => {
      const def = template.lines.find(d => d.id === entry.defId)
      if (def && entry.type !== "percentage") {
        const lineTotal = getEntryTotal(entry)
        nonPercentageLines.push({ id: entry.id, name: entry.name || "Untitled", total: lineTotal, type: entry.type })
        lineTotals[def.id] = (lineTotals[def.id] || 0) + lineTotal;
      }
    })

    const subtotal = nonPercentageLines.reduce((acc, line) => acc + line.total, 0);

    const percentageLines: CalculatedLine[] = []
    template.lines.forEach((lineDef) => {
      const percentageEntry = values.find(e => e.defId === lineDef.id && e.type === 'percentage');
      if (lineDef.type === "percentage" && percentageEntry) {
        let baseTotal = subtotal;
        if (lineDef.appliesTo && lineDef.appliesTo.length > 0) {
           baseTotal = lineDef.appliesTo.reduce((acc, appliedId) => acc + (lineTotals[appliedId] || 0), 0);
        }
        
        const percentage = percentageEntry?.value1 || 0
        const lineTotal = baseTotal * (percentage / 100)
        percentageLines.push({ id: percentageEntry.id, name: lineDef.name, total: lineTotal, type: 'percentage' })
      }
    })

    const allLines = [...nonPercentageLines, ...percentageLines]
    const total = allLines.reduce((acc, line) => acc + line.total, 0)

    return { calculatedLines: allLines, subtotal, total }
  }, [template.lines, values])

  const renderInputs = (entry: LineItemEntry) => {
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
              <Label htmlFor={`${entry.id}-hours`}>Hours</Label>
              <Input
                id={`${entry.id}-hours`}
                type="number"
                placeholder="0"
                value={entry.value1 ?? ""}
                onChange={(e) => handleNumericEntryChange(entry.id, "value1", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor={`${entry.id}-rate`}>Rate (/hr)</Label>
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
            <div>
              <Label htmlFor={`${entry.id}-amount`}>Amount (kg)</Label>
              <Input
                id={`${entry.id}-amount`}
                type="number"
                placeholder="0"
                value={entry.value1 ?? ""}
                onChange={(e) => handleNumericEntryChange(entry.id, "value1", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor={`${entry.id}-rate`}>Rate (/kg)</Label>
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
          </div>
        )
      default:
        return null
    }
  }
  
  const renderPercentageInput = (lineDef: LineItemDefinition) => {
    const entry = values.find(e => e.defId === lineDef.id)
    return (
       <div className="grid grid-cols-1 gap-2">
        <div>
          <Label htmlFor={`${lineDef.id}-percentage`}>Percentage (%)</Label>
          <Input
            id={`${lineDef.id}-percentage`}
            type="number"
            placeholder="0"
            value={entry?.value1 ?? ""}
            onChange={(e) => {
              const value = e.target.value;
               if (entry) {
                 handleNumericEntryChange(entry.id, "value1", value)
               } else {
                 const newEntry: LineItemEntry = {
                    id: crypto.randomUUID(),
                    defId: lineDef.id,
                    name: lineDef.name,
                    type: 'percentage',
                    value1: parseFloat(value)
                 };
                 onValuesChange([...values, newEntry]);
               }
            }}
          />
        </div>
      </div>
    )
  }


  const renderEntry = (entry: LineItemEntry) => (
    <div key={entry.id} className="p-4 border-b last:border-b-0">
       <div className="flex flex-col sm:flex-row items-start gap-4">
          <div className="flex-1 space-y-2 w-full">
             <div className="flex flex-col sm:flex-row gap-2">
                <Input
                    placeholder="Description"
                    value={entry.name}
                    onChange={(e) => handleEntryChange(entry.id, "name", e.target.value)}
                    className="text-base font-medium flex-1"
                />
                <Select value={entry.type} onValueChange={(value) => handleEntryChange(entry.id, "type", value as CalculationType)}>
                    <SelectTrigger className="w-full sm:w-[150px]">
                        <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="fixed">Fixed Price</SelectItem>
                        <SelectItem value="time">Time</SelectItem>
                        <SelectItem value="weight">Weight</SelectItem>
                        <SelectItem value="percentage">Percentage</SelectItem>
                    </SelectContent>
                </Select>
             </div>
             {renderInputs(entry)}
          </div>
          <div className="text-right w-full sm:w-auto">
             <div className="font-bold text-lg mb-2">{formatCurrency(getEntryTotal(entry), template.currency)}</div>
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
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      <div className="lg:col-span-2 space-y-4">
        {template.lines.map((lineDef) => {
          if (lineDef.type === 'percentage') {
            const percentageLine = calculatedLines.find(l => {
              const entry = values.find(v => v.id === l.id);
              return entry?.defId === lineDef.id;
            });
            return (
              <Card key={lineDef.id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    <CalculationTypeIcon type="percentage" className="h-4 w-4 text-muted-foreground" />
                    {lineDef.name}
                  </CardTitle>
                  <span className="text-lg font-bold">
                    {formatCurrency(percentageLine?.total || 0, template.currency)}
                  </span>
                </CardHeader>
                <CardContent>
                  {renderPercentageInput(lineDef)}
                </CardContent>
              </Card>
            )
          }

          const entries = values.filter(v => v.defId === lineDef.id);

          return (
            <Card key={lineDef.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    {lineDef.name}
                  </CardTitle>
                  <Button variant="outline" size="sm" onClick={() => handleAddEntry(lineDef.id)}>
                    <PlusCircle className="mr-2" /> Add Entry
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {entries.length > 0 ? (
                  entries.map(entry => renderEntry(entry))
                ) : (
                  <p className="text-sm text-muted-foreground px-6 pb-4">No entries for {lineDef.name}. Click "Add" to start.</p>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="lg:col-span-1 space-y-6 sticky top-4">
         <Card>
            <CardHeader>
                <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent>
                {calculatedLines.filter(l => l.type !== 'percentage').length > 0 && (
                    <>
                    <div className="flex justify-between text-muted-foreground">
                        <span>Subtotal</span>
                        <span>{formatCurrency(subtotal, template.currency)}</span>
                    </div>
                    {calculatedLines.filter(l => l.type === 'percentage').map(line => (
                        <div key={line.id} className="flex justify-between text-muted-foreground">
                            <span>{line.name} ({values.find(v => v.id === line.id)?.value1 || 0}%)</span>
                            <span>{formatCurrency(line.total, template.currency)}</span>
                        </div>
                    ))}
                    <Separator className="my-2"/>
                    </>
                )}
                <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>{formatCurrency(total, template.currency)}</span>
                </div>
            </CardContent>
        </Card>
        
        <CostChart data={calculatedLines} currency={template.currency} />
      </div>
    </div>
  )
}
