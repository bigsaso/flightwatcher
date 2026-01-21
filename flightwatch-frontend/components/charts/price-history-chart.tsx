"use client"

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

import type { WatchResult } from "@/types/watch";

type Props = {
  results: WatchResult[];
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-CA", {
    month: "short",
    day: "numeric",
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleString("en-CA", {
    timeZone: "America/Toronto",
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function PriceHistoryChart({ results }: Props) {
  if (!results.length) {
    return (
      <p className="text-muted-foreground text-sm">
        No historical data yet.
      </p>
    );
  }

  const currency = results[0].currency;

  return (
    <div className="w-full h-[260px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={results}
          margin={{ top: 10, right: 20, bottom: 10, left: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />

          <XAxis
            dataKey="captured_at"
            tickFormatter={formatDate}
            fontSize={12}
          />

          <YAxis
            domain={["dataMin - 50", "dataMax + 50"]}
            tickFormatter={(v) => `${currency} ${v}`}
            fontSize={12}
          />

          <Tooltip
            formatter={(value: number) => [`${currency} ${value}`, "Price"]}
            labelFormatter={(label) => formatTime(label)}
          />

          <Line
            type="monotone"
            dataKey="total_price"
            stroke="#2563eb"
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}