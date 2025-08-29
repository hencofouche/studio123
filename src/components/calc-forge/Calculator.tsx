"use client"

import * as React from "react"
import { PlusCircle, Trash2 } from "lucide-react"
import type { Template, LineItemValues, LineItemDefinition, CalculationType, LineItemEntry } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
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

function getEntryTotal(entry: LineItemEntry, type: CalculationType): number {
  if (type === "fixed") {
    return entry.value1 || 0
  } else if (type === "time" || type === "weight") {
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
    }
    onValuesChange([...values, newEntry])
  }

  const handleRemoveEntry = (entryId: string) => {
    onValuesChange(values.filter(entry => entry.id !== entryId))
  }

  const handleEntryChange = (entryId: string, field: keyof Omit<LineItemEntry, "id" | "defId">, value: string) => {
    const isNumeric = field === "value1" || field === "value2"
    const parsedValue = isNumeric ? (value === "" ? undefined : parseFloat(value)) : value

    onValuesChange(
      values.map(entry =>
        entry.id === entryId
          ? { ...entry, [field]: parsedValue }
          : entry
      )
    )
  }
  
  const { calculatedLines, subtotal, total } = React.useMemo(() => {
    const lineTotals: { [key: string]: number } = {};
    template.lines.forEach(line => lineTotals[line.id] = 0);

    const nonPercentageLines: CalculatedLine[] = []
    
    values.forEach((entry) => {
      const def = template.lines.find(d => d.id === entry.defId)
      if (def && def.type !== "percentage") {
        const lineTotal = getEntryTotal(entry, def.type)
        nonPercentageLines.push({ id: entry.id, name: entry.name || def.name, total: lineTotal, type: def.type })
        lineTotals[def.id] = (lineTotals[def.id] || 0) + lineTotal;
      }
    })

    const subtotal = nonPercentageLines.reduce((acc, line) => acc + line.total, 0);

    const percentageLines: CalculatedLine[] = []
    template.lines.forEach((lineDef) => {
      if (lineDef.type === "percentage") {
        let baseTotal = subtotal; // Default to overall subtotal
        if (lineDef.appliesTo && lineDef.appliesTo.length > 0) {
           baseTotal = lineDef.appliesTo.reduce((acc, appliedId) => acc + (lineTotals[appliedId] || 0), 0);
        }
        
        const entry = values.find(e => e.defId === lineDef.id)
        const percentage = entry?.value1 || 0
        const lineTotal = baseTotal * (percentage / 100)
        percentageLines.push({ id: lineDef.id, name: lineDef.name, total: lineTotal, type: lineDef.type })
      }
    })

    const allLines = [...nonPercentageLines, ...percentageLines]
    const total = allLines.reduce((acc, line) => acc + line.total, 0)

    return { calculatedLines: allLines, subtotal, total }
  }, [template.lines, values])

  const renderInputs = (entry: LineItemEntry, line: LineItemDefinition) => {
    switch (line.type) {
      case "fixed":
        return (
          <div className="grid grid-cols-1 gap-2">
            <div>
              <Label htmlFor={`${entry.id}-price`}>Price</Label>
              <Input
                id={`${entry.id}-price`}
                type="number"
                placeholder="0.00"
                value={entry.value1 ?? ""}
                onChange={(e) => handleEntryChange(entry.id, "value1", e.target.value)}
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
                onChange={(e) => handleEntryChange(entry.id, "value1", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor={`${entry.id}-rate`}>Rate (/hr)</Label>
              <Input
                id={`${entry.id}-rate`}
                type="number"
                placeholder="0.00"
                value={entry.value2 ?? ""}
                onChange={(e) => handleEntryChange(entry.id, "value2", e.target.value)}
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
                onChange={(e) => handleEntryChange(entry.id, "value1", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor={`${entry.id}-rate`}>Rate (/kg)</Label>
              <Input
                id={`${entry.id}-rate`}
                type="number"
                placeholder="0.00"
                value={entry.value2 ?? ""}
                onChange={(e) => handleEntryChange(entry.id, "value2", e.target.value)}
              />
            </div>
          </div>
        )
      case "percentage":
         const percentageEntry = values.find(e => e.defId === line.id);
        return (
          <div className="grid grid-cols-1 gap-2">
            <div>
              <Label htmlFor={`${line.id}-percentage`}>Percentage (%)</Label>
              <Input
                id={`${line.id}-percentage`}
                type="number"
                placeholder="0"
                value={percentageEntry?.value1 ?? ""}
                onChange={(e) => {
                   if (percentageEntry) {
                     handleEntryChange(percentageEntry.id, "value1", e.target.value)
                   } else {
                     const newEntry: LineItemEntry = { id: crypto.randomUUID(), defId: line.id, name: line.name, value1: parseFloat(e.target.value) };
                     onValuesChange([...values, newEntry]);
                   }
                }}
              />
            </div>
          </div>
        )
      default:
        return null
    }
  }

  const renderEntry = (entry: LineItemEntry, lineDef: LineItemDefinition) => (
    <div key={entry.id} className="p-4 border-b last:border-b-0">
       <div className="flex items-start gap-4">
          <div className="flex-1 space-y-2">
             <Input
                placeholder="Description"
                value={entry.name}
                onChange={(e) => handleEntryChange(entry.id, "name", e.target.value)}
                className="text-base font-medium"
             />
             {renderInputs(entry, lineDef)}
          </div>
          <div className="text-right">
             <div className="font-bold text-lg mb-2">{formatCurrency(getEntryTotal(entry, lineDef.type), template.currency)}</div>
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
            const percentageLine = calculatedLines.find(l => l.id === lineDef.id)
            return (
              <Card key={lineDef.id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    <CalculationTypeIcon type={lineDef.type} className="h-4 w-4 text-muted-foreground" />
                    {lineDef.name}
                  </CardTitle>
                  <span className="text-lg font-bold">
                    {formatCurrency(percentageLine?.total || 0, template.currency)}
                  </span>
                </CardHeader>
                <CardContent>
                  {renderInputs({id: "", defId: lineDef.id, name: lineDef.name}, lineDef)}
                </CardContent>
              </Card>
            )
          }

          const entries = values.filter(v => v.defId === lineDef.id)

          return (
            <Card key={lineDef.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    <CalculationTypeIcon type={lineDef.type} className="h-4 w-4 text-muted-foreground" />
                    {lineDef.name}
                  </CardTitle>
                  <Button variant="outline" size="sm" onClick={() => handleAddEntry(lineDef.id)}>
                    <PlusCircle className="mr-2" /> Add
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {entries.length > 0 ? (
                  entries.map(entry => renderEntry(entry, lineDef))
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
                            <span>{line.name} ({values.find(v => v.defId === line.id)?.value1 || 0}%)</span>
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
