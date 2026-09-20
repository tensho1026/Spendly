"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatYen } from "@/lib/format";

const tooltip = (value: unknown) => formatYen(Number(value ?? 0));

export function AnnualCashflowChart({
  data,
}: {
  data: { label: string; income: number; expense: number; balance: number }[];
}) {
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="label" />
          <YAxis
            width={70}
            tickFormatter={(value) => `${Math.round(Number(value) / 10000)}万`}
          />
          <Tooltip formatter={tooltip} />
          <Legend />
          <Line
            type="monotone"
            dataKey="income"
            name="収入"
            stroke="#059669"
            strokeWidth={2}
          />
          <Line
            type="monotone"
            dataKey="expense"
            name="支出"
            stroke="#e11d48"
            strokeWidth={2}
          />
          <Line
            type="monotone"
            dataKey="balance"
            name="収支"
            stroke="#2563eb"
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function WeeklyCashflowChart({
  data,
}: {
  data: { label: string; income: number; expense: number }[];
}) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="label" />
          <YAxis
            width={60}
            tickFormatter={(value) => `${Math.round(Number(value) / 1000)}千`}
          />
          <Tooltip formatter={tooltip} />
          <Legend />
          <Bar
            dataKey="income"
            name="収入"
            fill="#059669"
            radius={[4, 4, 0, 0]}
          />
          <Bar
            dataKey="expense"
            name="支出"
            fill="#e11d48"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
