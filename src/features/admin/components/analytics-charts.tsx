"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card } from "@/components/ui/card";

const MARK = "#7667F5";
const GRID = "#E5E7EB";
const AXIS = { fontSize: 12, fill: "#64748B" };

const shortDate = (value: string) => new Date(`${value}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

// One measure per chart, each on its own axis. The title names the series, so no legend.
export function TrendChart({
  title,
  total,
  data,
  dataKey,
}: {
  title: string;
  total: number;
  data: Record<string, string | number>[];
  dataKey: string;
}) {
  return (
    <Card className="p-5">
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-semibold">{title}</h2>
        <p className="text-sm text-secondary-text">
          <span className="font-semibold text-foreground">{total}</span> in this period
        </p>
      </div>
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke={GRID} />
            <XAxis dataKey="date" tickFormatter={shortDate} tick={AXIS} tickLine={false} axisLine={{ stroke: GRID }} minTickGap={32} />
            <YAxis allowDecimals={false} tick={AXIS} tickLine={false} axisLine={false} />
            <Tooltip
              cursor={{ fill: "#F0EEFF" }}
              labelFormatter={(value) => shortDate(String(value))}
              formatter={(value) => [String(value), title]}
              contentStyle={{ borderRadius: 8, borderColor: GRID, fontSize: 13 }}
            />
            <Bar dataKey={dataKey} fill={MARK} radius={[4, 4, 0, 0]} maxBarSize={16} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
