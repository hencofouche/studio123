"use client"

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import type { CalculationType } from "@/lib/types"

interface CostChartProps {
  data: {
    id: string
    name: string
    total: number
    type: CalculationType
  }[],
  currency: string;
}

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

const CustomTooltip = ({ active, payload, currency }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    if (!currency) return null;
    return (
      <div className="rounded-lg border bg-background p-2 shadow-sm">
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col space-y-1">
            <span className="text-sm text-muted-foreground">{data.name}</span>
            <span className="font-bold">
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: currency,
              }).format(data.value)}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default function CostChart({ data, currency }: CostChartProps) {
  const chartData = data
    .filter((item) => item.total > 0)
    .map((item) => ({
      name: item.name,
      value: item.total,
    }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cost Breakdown</CardTitle>
        <CardDescription>Visual representation of cost distribution.</CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <div className="w-full h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip content={<CustomTooltip currency={currency} />} />
                <Legend
                  verticalAlign="bottom"
                  height={48}
                  iconSize={8}
                  formatter={(value, entry) => <span className="text-muted-foreground">{value}</span>}
                />
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  stroke="hsl(var(--background))"
                  strokeWidth={2}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex items-center justify-center h-[250px] text-muted-foreground text-sm">
            Enter some values to see the cost breakdown.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
