import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { Card } from "antd";
import type { ChartConfig } from "@/shadcn/ui/chart";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/shadcn/ui/chart";

interface ChartData {
  time: string;
  value: number;
}

export default function ChartLine({
  chartData,
  name,
  field,
}: {
  chartData: ChartData[];
  name: string;
  field: string;
}) {
  const chartConfig = {
    value: {
      label: field,
      color: "#2563eb",
    },
  } satisfies ChartConfig;

  return (
    <Card
      title={name}
      className="w-full"
      style={{ borderColor: "#f0f0f0" }}
    >
      <ChartContainer config={chartConfig} className="w-full h-80">
        <LineChart
          accessibilityLayer
          data={chartData}
          margin={{ top: 20, right: 50, bottom: 25, left: 10 }}
        >
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="time"
            tickLine={false}
            tickMargin={10}
            axisLine={false}
            label={{
              value: "时间",
              position: "bottom",
              fontSize: 14,
              offset: 10,
            }}
          />
          <YAxis
            dataKey="value"
            tickLine={false}
            tickMargin={10}
            axisLine={false}
            fontSize={12}
            label={{
              value: field,
              angle: -90,
              position: "insideLeft",
              fontSize: 14,
              style: { textAnchor: "middle" },
            }}
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Line dataKey="value" />
        </LineChart>
      </ChartContainer>
    </Card>
  );
}
