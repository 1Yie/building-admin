import { useQuery } from "@tanstack/react-query";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { getLivenessCountList } from "@/request/home";
import type { ChartConfig } from "@/shadcn/ui/chart";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/shadcn/ui/chart";

const chartConfig = {
  value: {
    label: "活跃设备数量",
    color: "#2563eb",
  },
} satisfies ChartConfig;

export function ChartLine({ type }: { type: "daily" | "week" | "month" }) {
  const { data: chartDataDayRes } = useQuery({
    queryKey: ["activeUnitTrendDay"],
    queryFn: () => getLivenessCountList({ time_unit: "daily" }),
  });
  const chartDataDay = chartDataDayRes?.times.map((time, index) => ({
    time,
    value: chartDataDayRes?.values[index],
  }));

  const { data: chartDataWeekRes } = useQuery({
    queryKey: ["activeUnitTrendWeek"],
    queryFn: () => getLivenessCountList({ time_unit: "week" }),
  });
  const chartDataWeek = chartDataWeekRes?.times.map((time, index) => ({
    time,
    value: chartDataWeekRes?.values[index],
  }));

  const { data: chartDataMonthRes } = useQuery({
    queryKey: ["activeUnitTrendMonth"],
    queryFn: () => getLivenessCountList({ time_unit: "month" }),
  });
  const chartDataMonth = chartDataMonthRes?.times.map((time, index) => ({
    time,
    value: chartDataMonthRes?.values[index],
  }));

  const chartDataMap = {
    daily: chartDataDay,
    week: chartDataWeek,
    month: chartDataMonth,
  };

  return (
    <ChartContainer config={chartConfig} className="w-full h-80">
      <LineChart accessibilityLayer data={chartDataMap[type]}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="time"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
        />
        <YAxis
          dataKey="value"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          fontSize={12}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Line dataKey="value" />
      </LineChart>
    </ChartContainer>
  );
}
