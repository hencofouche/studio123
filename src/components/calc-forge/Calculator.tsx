"use client"

import * as React from "react"
import type { Template, LineItemValues, LineItemDefinition, CalculationType } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value)
}

export default function Calculator({ template, values, onValuesChange }: CalculatorProps) {
  const handleValueChange = (lineItemId: string, field: "value1" | "value2", value: string) => {
    const numericValue = value === "" ? undefined : parseFloat(value)
    const newValues = {
      ...values,
      [lineItemId]: {
        ...values[lineItemId],
        [field]: numericValue,
      },
    }
    onValuesChange(newValues)
  }

  const { calculatedLines, subtotal, total } = React.useMemo(() => {
    const nonPercentageLines: CalculatedLine[] = []
    let subtotal = 0

    template.lines.forEach((line) => {
      if (line.type !== "percentage") {
        const lineValues = values[line.id] || {}
        let lineTotal = 0
        if (line.type === "fixed") {
          lineTotal = lineValues.value1 || 0
        } else if (line.type === "time" || line.type === "weight") {
          lineTotal = (lineValues.value1 || 0) * (lineValues.value2 || 0)
        }
        nonPercentageLines.push({ id: line.id, name: line.name, total: lineTotal, type: line.type })
        subtotal += lineTotal
      }
    })

    const percentageLines: CalculatedLine[] = []
    template.lines.forEach((line) => {
      if (line.type === "percentage") {
        const lineValues = values[line.id] || {}
        const percentage = lineValues.value1 || 0
        const lineTotal = subtotal * (percentage / 100)
        percentageLines.push({ id: line.id, name: line.name, total: lineTotal, type: line.type })
      }
    })

    const allLines = [...nonPercentageLines, ...percentageLines]
    const total = allLines.reduce((acc, line) => acc + line.total, 0)

    return { calculatedLines: allLines, subtotal, total }
  }, [template.lines, values])

  const getLineTotal = (lineId: string) => {
    return calculatedLines.find(l => l.id === lineId)?.total || 0
  }

  const renderInputs = (line: LineItemDefinition) => {
    const lineValues = values[line.id] || {}

    switch (line.type) {
      case "fixed":
        return (
          <div className="grid grid-cols-1 gap-2">
            <div>
              <Label htmlFor={`${line.id}-price`}>Price</Label>
              <Input
                id={`${line.id}-price`}
                type="number"
                placeholder="0.00"
                value={lineValues.value1 ?? ""}
                onChange={(e) => handleValueChange(line.id, "value1", e.target.value)}
              />
            </div>
          </div>
        )
      case "time":
        return (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor={`${line.id}-hours`}>Hours</Label>
              <Input
                id={`${line.id}-hours`}
                type="number"
                placeholder="0"
                value={lineValues.value1 ?? ""}
                onChange={(e) => handleValueChange(line.id, "value1", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor={`${line.id}-rate`}>Rate (/hr)</Label>
              <Input
                id={`${line.id}-rate`}
                type="number"
                placeholder="0.00"
                value={lineValues.value2 ?? ""}
                onChange={(e) => handleValueChange(line.id, "value2", e.target.value)}
              />
            </div>
          </div>
        )
      case "weight":
        return (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor={`${line.id}-amount`}>Amount (kg)</Label>
              <Input
                id={`${line.id}-amount`}
                type="number"
                placeholder="0"
                value={lineValues.value1 ?? ""}
                onChange={(e) => handleValueChange(line.id, "value1", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor={`${line.id}-rate`}>Rate (/kg)</Label>
              <Input
                id={`${line.id}-rate`}
                type="number"
                placeholder="0.00"
                value={lineValues.value2 ?? ""}
                onChange={(e) => handleValueChange(line.id, "value2", e.target.value)}
              />
            </div>
          </div>
        )
      case "percentage":
        return (
          <div className="grid grid-cols-1 gap-2">
            <div>
              <Label htmlFor={`${line.id}-percentage`}>Percentage (%)</Label>
              <Input
                id={`${line.id}-percentage`}
                type="number"
                placeholder="0"
                value={lineValues.value1 ?? ""}
                onChange={(e) => handleValueChange(line.id, "value1", e.target.value)}
              />
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      <div className="lg:col-span-2 space-y-4">
        {template.lines.map((line) => (
          <Card key={line.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <CalculationTypeIcon type={line.type} className="h-4 w-4 text-muted-foreground" />
                {line.name}
              </CardTitle>
              <span className="text-lg font-bold">{formatCurrency(getLineTotal(line.id))}</span>
            </CardHeader>
            <CardContent>
                {renderInputs(line)}
            </CardContent>
          </Card>
        ))}
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
                        <span>{formatCurrency(subtotal)}</span>
                    </div>
                    {calculatedLines.filter(l => l.type === 'percentage').map(line => (
                        <div key={line.id} className="flex justify-between text-muted-foreground">
                            <span>{line.name} ({values[line.id]?.value1 || 0}%)</span>
                            <span>{formatCurrency(line.total)}</span>
                        </div>
                    ))}
                    <Separator className="my-2"/>
                    </>
                )}
                <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>{formatCurrency(total)}</span>
                </div>
            </CardContent>
        </Card>
        
        <CostChart data={calculatedLines} />
      </div>
    </div>
  )
}
