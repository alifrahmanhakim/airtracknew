
"use client";

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import type { StateLetterRecord } from "@/lib/types";

export function StateLetterAnalyticsDashboard({
  records,
}: {
  records: StateLetterRecord[];
}) {
  const statusCounts = records.reduce((acc, record) => {
    acc[record.status] = (acc[record.status] || 0) + 1;
    return acc;
  }, {} as Record<StateLetterRecord["status"], number>);

  const chartData = Object.entries(statusCounts).map(([status, count]) => ({
    name: status,
    "Number of Records": count,
  }));
  
  const chartConfig = {
    "Number of Records": {
      label: "Number of Records",
      color: "hsl(var(--chart-1))",
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Status Distribution</CardTitle>
        <CardDescription>A breakdown of the status of all state letter records.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-64 w-full">
            <ResponsiveContainer>
              <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }}
                    width={80}
                  />
                  <ChartTooltip
                    cursor={{ fill: 'hsl(var(--muted))' }}
                    content={<ChartTooltipContent />}
                  />
                  <Bar dataKey="Number of Records" fill="var(--color-Number of Records)" radius={4} />
              </BarChart>
            </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
