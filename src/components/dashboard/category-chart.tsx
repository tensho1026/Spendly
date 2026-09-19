"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChartBar, ChartPie } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Button } from "@/components/ui/button";
import { formatYen } from "@/lib/format";
import { colorForIndex } from "./chart-colors";

type CategoryDatum = {
  categoryId: string;
  name: string;
  total: number;
};

type ChartMode = "pie" | "bar";

type CategoryChartProps = {
  data: CategoryDatum[];
  selectedCategoryId?: string;
  onSelect?: (categoryId: string) => void;
};

const CHART_HEIGHT = 280;

/** 軸ラベル用の短縮表記（¥24,300 → 2.4万）。 */
function formatCompactYen(value: number): string {
  if (!Number.isFinite(value)) return "";
  if (value >= 10000) return `${Math.round(value / 1000) / 10}万`;
  if (value >= 1000) return `${Math.round(value / 100) / 10}千`;
  return String(Math.round(value));
}

export function CategoryChart({
  data,
  selectedCategoryId,
  onSelect,
}: CategoryChartProps) {
  const [mode, setMode] = useState<ChartMode>("pie");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // onSelect が渡されていないとき（サーバーコンポーネントから利用するとき）は
  // クエリパラメータ ?category=... をトグルして内訳表示を切り替える。
  const handleSelect = (categoryId: string | undefined) => {
    if (!categoryId) return;
    if (onSelect) {
      onSelect(categoryId);
      return;
    }
    const params = new URLSearchParams(searchParams.toString());
    if (params.get("category") === categoryId) {
      params.delete("category");
    } else {
      params.set("category", categoryId);
    }
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  };

  const sliceOpacity = (categoryId: string) =>
    !selectedCategoryId || selectedCategoryId === categoryId ? 1 : 0.3;

  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground"
        style={{ height: CHART_HEIGHT }}
      >
        この月の支出はまだありません
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div
        className="flex items-center justify-end gap-1"
        role="group"
        aria-label="グラフの表示形式"
      >
        <Button
          type="button"
          size="sm"
          variant={mode === "pie" ? "secondary" : "ghost"}
          aria-pressed={mode === "pie"}
          onClick={() => setMode("pie")}
        >
          <ChartPie className="size-4" />
          円グラフ
        </Button>
        <Button
          type="button"
          size="sm"
          variant={mode === "bar" ? "secondary" : "ghost"}
          aria-pressed={mode === "bar"}
          onClick={() => setMode("bar")}
        >
          <ChartBar className="size-4" />
          棒グラフ
        </Button>
      </div>

      <div className="w-full" style={{ height: CHART_HEIGHT }}>
        <ResponsiveContainer width="100%" height="100%">
          {mode === "pie" ? (
            <PieChart>
              <Tooltip formatter={(value) => formatYen(Number(value))} />
              <Legend
                verticalAlign="bottom"
                height={36}
                wrapperStyle={{ fontSize: 12 }}
              />
              <Pie
                data={data}
                dataKey="total"
                nameKey="name"
                cx="50%"
                cy="45%"
                innerRadius={52}
                outerRadius={92}
                paddingAngle={2}
                isAnimationActive={false}
                onClick={(_, index) => handleSelect(data[index]?.categoryId)}
              >
                {data.map((item, index) => (
                  <Cell
                    key={item.categoryId}
                    fill={colorForIndex(index)}
                    fillOpacity={sliceOpacity(item.categoryId)}
                    stroke={
                      selectedCategoryId === item.categoryId
                        ? "#0f172a"
                        : "#ffffff"
                    }
                    strokeWidth={selectedCategoryId === item.categoryId ? 2 : 1}
                    cursor="pointer"
                  />
                ))}
              </Pie>
            </PieChart>
          ) : (
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 8, right: 16, bottom: 8, left: 0 }}
            >
              <CartesianGrid
                horizontal={false}
                strokeDasharray="3 3"
                stroke="#e2e8f0"
              />
              <XAxis
                type="number"
                tickFormatter={(value) => formatCompactYen(Number(value))}
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={76}
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                formatter={(value) => formatYen(Number(value))}
                cursor={{ fill: "rgba(148, 163, 184, 0.15)" }}
              />
              <Legend
                verticalAlign="bottom"
                height={28}
                wrapperStyle={{ fontSize: 12 }}
              />
              <Bar
                dataKey="total"
                name="金額"
                radius={[0, 4, 4, 0]}
                isAnimationActive={false}
                onClick={(_, index) => handleSelect(data[index]?.categoryId)}
              >
                {data.map((item, index) => (
                  <Cell
                    key={item.categoryId}
                    fill={colorForIndex(index)}
                    fillOpacity={sliceOpacity(item.categoryId)}
                    cursor="pointer"
                  />
                ))}
              </Bar>
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
