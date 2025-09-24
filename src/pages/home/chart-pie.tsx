import { Pie, PieChart } from "recharts";
import type { OutLineInfoResponse } from "@/request/home";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/shadcn/ui/chart";

export function ChartPie({
  pieData,
}: {
  pieData: OutLineInfoResponse["sensor_kind_unit"];
}) {
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#AF19FF"];

  const chartConfig = pieData?.reduce((acc, item, index) => {
    (acc as Record<string, { label: string; color: string }>)[item.kind] = {
      label: item.kind,
      color: COLORS[index % COLORS.length],
    };
    return acc;
  }, {});

  const chartData = pieData?.map((item) => ({
    ...item,
    fill:
      (chartConfig as Record<string, { label: string; color: string }>)[
        item.kind
      ]?.color || "#8884d8",
  }));

  return (
    <ChartContainer config={chartConfig || {}}>
      <PieChart className="mt-5" margin={{ top: 20 }}>
        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
        <Pie
          data={chartData}
          dataKey="count"
          nameKey="kind"
          innerRadius="50%"
          outerRadius="80%"
          strokeWidth={5}
          cx="50%"
          cy="50%"
          labelLine={false}
          label
        />
        <ChartLegend
          className="text-base"
          content={<ChartLegendContent />}
          verticalAlign="bottom"
        />
      </PieChart>
    </ChartContainer>
  );
}
