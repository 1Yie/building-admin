import { useQuery } from "@tanstack/react-query";
import { ArrowUp, Plus, CircleSlash, Ban } from "lucide-react";
import { useState } from "react";
import { Link, NavLink } from "react-router";
import { getAlarmInfo, getOutLineInfo } from "@/request/home";
import { getTaskInterVal } from "@/request/settings";

import { Button } from "@/shadcn/ui/button";
import { Card, Skeleton } from "antd";
import { Tabs as ShadcnTabs, TabsList, TabsTrigger } from "@/shadcn/ui/tabs";
import { ChartLine } from "./chart-line";
import { ChartPie } from "./chart-pie";
import { BuildingTable } from "./table";
import { useAuth } from "@/hooks/use-auth";
import {
  ThunderboltFilled,
  BellFilled,
  LayoutFilled,
  PieChartFilled,
  SoundFilled,
  PoweroffOutlined,
  UserOutlined,
  CloudOutlined,
  CodeFilled,
} from "@ant-design/icons";
import { Droplet, Skull, Thermometer } from "lucide-react";

export default function HomePage() {
  const { permissions, isLoggedIn } = useAuth();

  // 图标映射
  const sensorIconMap: Record<string, React.ReactElement> = {
    breaker: <PoweroffOutlined className="text-red-500 text-sm" />,
    noise: <SoundFilled className="text-red-500 text-sm" />,
    humanbody: <UserOutlined className="text-red-500 text-sm" />,
    temphumi: <Thermometer className="text-red-500 text-sm" />,
    tvoc: <Skull className="text-red-500 text-sm" />, // 有害气体
    coo: <CloudOutlined className="text-red-500 text-sm" />, // 二氧化碳
    waterleakage: <Droplet className="text-red-500 text-sm" />,
  };

  // 设备信息概览
  const { data: outlineInfo } = useQuery({
    queryKey: ["getOutLineInfo"],
    queryFn: getOutLineInfo,
  });

  const {
    device_unit,
    alarm_unit,
    property_unit,
    building_property_unit,
    sensor_kind_unit,
  } = outlineInfo || {};

  // 预警信息
  const { data: alarmInfo } = useQuery({
    queryKey: ["alarm"],
    queryFn: getAlarmInfo,
  });

  // 任务间隔
  const { data: taskInterVal } = useQuery({
    queryKey: ["getTaskInterVal"],
    queryFn: getTaskInterVal,
  });

  // 折线图类型切换
  const [lineChartType, setLineChartType] = useState<
    "daily" | "week" | "month"
  >("daily");

  const hasPermission = (perm: string) => permissions.includes(perm);

  const hasAvailablePermission = permissions.some((p) =>
    ["menu_building-楼宇资产", "menu_building-日志管理"].includes(p)
  );

  const hasParentPermission = (parent: string) =>
    permissions.some(
      (p) =>
        p === `menu_building-${parent}` ||
        p.startsWith(`menu_building-${parent}-`)
    );

  // 根据 content 返回对应图标组件
  function getSensorIcon(content: string) {
    if (content.includes("终端及其传感器掉线")) {
      return <CodeFilled className="text-red-500 text-sm" />;
    }
    for (const sensor of Object.keys(sensorIconMap)) {
      // 如果 content 包含传感器中文名，就返回对应图标
      if (content.includes(sensorIconNameMap[sensor])) {
        return sensorIconMap[sensor];
      }
    }
    return <BellFilled className="text-red-500 text-sm" />; // 默认
  }

  const sensorIconNameMap: Record<string, string> = {
    breaker: "断路器",
    noise: "噪音传感器",
    humanbody: "人体传感器",
    temphumi: "温湿度传感器",
    tvoc: "有害气体传感器",
    coo: "二氧化碳传感器",
    waterleakage: "水浸传感器",
  };

  function formatTime(minutes: number | string) {
    const total = Number(minutes);
    if (isNaN(total)) return "--";

    if (total == 0) return "刚刚";

    const h = Math.floor(total / 60);
    const m = total % 60;

    if (h > 0) {
      return `${h} 小时 ${m} 分钟`;
    }

    return `${m} 分钟`;
  }

  return (
    <div className="p-5">
      {isLoggedIn && !hasAvailablePermission && (
        <div className="h-full flex flex-col items-center justify-center gap-4">
          <CircleSlash size={100} />
          <h1 className="text-2xl font-bold">无权限</h1>
          <p className="text-gray-500">你貌似没有任何权限访问状态信息</p>
        </div>
      )}

      <div className="gap-5 grid grid-cols-3">
        {hasPermission("menu_building-实时数据") && device_unit ? (
          <Card className="w-full" style={{ borderColor: "#e5e7eb" }}>
            <div className="h-full flex flex-col">
              <div className="flex justify-between items-start flex-1">
                <div className="space-y-1 flex-1">
                  <div className="text-gray-600 text-2xl font-medium">
                    在线设备
                  </div>
                  <div className="font-bold py-2 text-4xl text-gray-900">
                    {device_unit.count}
                  </div>

                  {/* 在线率上升绿色 下降为红色 */}
                  <div
                    className={`flex items-center text-sm ${
                      device_unit.trend === "decrease"
                        ? "text-red-500"
                        : "text-green-500"
                    }`}
                  >
                    {device_unit.trend === "decrease" ? (
                      <ArrowUp size={20} className="rotate-180" />
                    ) : (
                      <ArrowUp size={20} />
                    )}
                    <span className="text-base font-bold ml-1">
                      {device_unit.trend_count}%
                    </span>
                    <span className="ml-1 text-sm">较昨日</span>
                  </div>
                </div>

                {/* 右上角图标 */}
                <div className="w-10 h-10 text-green-500 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <ThunderboltFilled className="text-lg" />
                </div>
              </div>

              {/* 底部进度条 */}
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mt-2">
                <div
                  className="h-full bg-green-500 rounded-full transition-all duration-300"
                  style={{
                    width: (() => {
                      if (device_unit.count === 0) return "0%";

                      // 根据百分比变化计算昨日数量
                      const yesterdayCount =
                        device_unit.trend === "increase"
                          ? device_unit.count /
                            (1 + device_unit.trend_count / 100)
                          : device_unit.count /
                            (1 - device_unit.trend_count / 100);

                      // 以昨日的值作为基准
                      const width = (device_unit.count / yesterdayCount) * 100;
                      // 限制在 0~100%
                      return `${Math.min(100, Math.max(0, width))}%`;
                    })(),
                  }}
                ></div>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="w-full" style={{ borderColor: "#e5e7eb" }}>
            <Skeleton className="h-full flex flex-col items-center justify-center gap-4" />
          </Card>
        )}

        {hasParentPermission("日志管理") && alarm_unit ? (
          <Card className="w-full" style={{ borderColor: "#e5e7eb" }}>
            <div className="h-full flex flex-col">
              <div className="flex justify-between items-start flex-1">
                <div className="space-y-1 flex-1">
                  <div className="text-gray-600 text-2xl font-medium">
                    预警数量
                  </div>
                  <div className="font-bold py-2 text-4xl text-gray-900">
                    {alarm_unit.count}
                  </div>

                  {/* 预警数量上升红色 下降为绿色 */}
                  <div
                    className={`flex items-center text-sm ${
                      alarm_unit.trend === "decrease"
                        ? "text-green-500"
                        : "text-red-500"
                    }`}
                  >
                    {alarm_unit.trend === "decrease" ? (
                      <ArrowUp size={20} className="rotate-180" />
                    ) : (
                      <ArrowUp size={20} />
                    )}
                    <span className="text-base font-bold ml-1">
                      {alarm_unit.trend_count}个
                    </span>
                    <span className="ml-1 text-sm">较昨日</span>
                  </div>
                </div>

                {/* 右上角图标 */}
                <div className="w-10 h-10 text-red-500 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <BellFilled className="text-lg" />
                </div>
              </div>

              {/* 底部进度条 */}
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mt-2">
                <div
                  className="h-full bg-red-500 rounded-full transition-all duration-300"
                  style={{
                    width: (() => {
                      if (alarm_unit.count === 0) return "0%";

                      // trend_count 是变化的具体个数
                      // 计算昨日数量
                      const yesterdayCount =
                        alarm_unit.trend === "increase"
                          ? alarm_unit.count - alarm_unit.trend_count
                          : alarm_unit.count + alarm_unit.trend_count;

                      // 以两日最大值作为基准
                      const maxCount = Math.max(
                        alarm_unit.count,
                        yesterdayCount,
                        1
                      );
                      return `${Math.min(
                        100,
                        (alarm_unit.count / maxCount) * 100
                      )}%`;
                    })(),
                  }}
                ></div>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="w-full" style={{ borderColor: "#e5e7eb" }}>
            <Skeleton className="h-full flex flex-col items-center justify-center gap-4" />
          </Card>
        )}

        {hasPermission("menu_building-楼宇资产") && property_unit ? (
          <Card className="w-full" style={{ borderColor: "#e5e7eb" }}>
            <div className="h-full flex flex-col">
              <div className="flex justify-between items-start flex-1">
                <div className="space-y-1 flex-1">
                  <div className="text-gray-600 text-2xl font-medium">
                    房间/空间总数
                  </div>
                  <div className="font-bold py-2 text-4xl text-gray-900">
                    {building_property_unit?.[0]?.space_count ?? 0}
                  </div>

                  <div className="text-gray-500 text-sm">
                    含
                    <span className="text-base mx-1 text-purple-600 font-bold">
                      {property_unit.terminals_count}
                    </span>
                    个网关(智能箱)
                  </div>
                </div>

                {/* 右上角图标 */}
                <div className="w-10 h-10 text-purple-500 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <LayoutFilled className="text-lg" />
                </div>
              </div>

              {/* 底部进度条 */}
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mt-2">
                <div
                  className="h-full bg-purple-500 rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.max(
                        10,
                        (property_unit.terminals_count /
                          Math.max(
                            building_property_unit?.[0]?.space_count || 1,
                            property_unit.terminals_count
                          )) *
                          100
                      )
                    )}%`,
                  }}
                ></div>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="w-full" style={{ borderColor: "#e5e7eb" }}>
            <Skeleton className="h-full flex flex-col items-center justify-center gap-4" />
          </Card>
        )}
      </div>

      {/* 活跃设备趋势折线图 */}
      {hasPermission("menu_building-实时数据") && (
        <div className="gap-5 grid grid-cols-3 mt-5">
          <Card
            className="col-span-2"
            style={{ borderColor: "#f0f0f0" }}
            title={
              <div className="flex flex-row justify-between items-center">
                <div>
                  <span>
                    <ThunderboltFilled className="mr-1" />
                    活跃设备数量趋势（
                  </span>
                  <span className="text-red-500"> {taskInterVal} </span>
                  <span>秒内设备数据有变化视为活跃）</span>
                  <NavLink
                    to="/settings"
                    className="ml-2 font-normal text-blue-500 text-sm underline"
                  >
                    活跃规则
                  </NavLink>
                </div>
                <ShadcnTabs
                  defaultValue="daily"
                  onValueChange={(value) =>
                    setLineChartType(value as "daily" | "week" | "month")
                  }
                >
                  <TabsList>
                    <TabsTrigger value="daily">日</TabsTrigger>
                    <TabsTrigger value="week">周</TabsTrigger>
                    <TabsTrigger value="month">月</TabsTrigger>
                  </TabsList>
                </ShadcnTabs>
              </div>
            }
          >
            <ChartLine type={lineChartType} />
          </Card>

          {hasParentPermission("日志管理") && (
            <Card
              className="col-span-1 rounded-2xl h-full"
              style={{ borderColor: "#f0f0f0" }}
              title={
                <div className="flex justify-between items-center">
                  <span>
                    <BellFilled className="mr-1" />
                    预警信息
                  </span>
                  <Button variant="link" className="text-blue-500">
                    <Link to="/log">查看全部</Link>
                  </Button>
                </div>
              }
            >
              <div className="flex flex-col gap-3 max-h-80 overflow-y-auto rounded-lg">
                {alarmInfo?.slice(0, 15).map((item, index) => (
                  <div
                    key={item.content || index}
                    className="bg-red-50 p-4 border-l-4 border-red-500 rounded-lg"
                    role="alert"
                  >
                    <div className="flex items-center gap-3">
                      {/* 预警图标 */}
                      <div className="w-8 h-8 text-red-500 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                        {getSensorIcon(item.content)}
                      </div>

                      <div className="flex-1 min-w-0">
                        {/* 预警标题 */}
                        <h4 className="font-semibold text-black text-sm mb-1 leading-tight">
                          {item.content}
                        </h4>

                        {/* 预警描述 */}
                        <p className="text-gray-700 text-sm leading-relaxed">
                          {item.description}
                        </p>

                        {/* 时间显示 */}
                        <p className="text-gray-400 text-xs mt-1">
                          {formatTime(item.time)}前
                        </p>
                      </div>
                    </div>
                  </div>
                ))}

                {alarmInfo?.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 py-8">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                      <Ban className="text-gray-400" size={24} />
                    </div>
                    <p className="text-sm text-gray-500">暂无预警信息</p>
                  </div>
                ) : (
                  <div className="text-center py-2">
                    <p className="text-xs text-gray-400">仅显示最近预警信息</p>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* 楼宇资产分布和设备类型统计 */}
      {hasPermission("menu_building-楼宇资产") && (
        <div className="gap-5 grid grid-cols-3 mt-5 h-100">
          <Card
            className="col-span-2 h-full"
            style={{ borderColor: "#f0f0f0" }}
            title={
              <div className="flex justify-between items-center">
                <span>
                  <LayoutFilled className="mr-1" />
                  楼宇资产分布
                </span>
                {hasPermission("menu_building-楼宇资产") && (
                  <Button variant="link" className="text-blue-500">
                    <Link to="/property?add=true" className="flex items-center">
                      <Plus />
                      新增资产
                    </Link>
                  </Button>
                )}
              </div>
            }
          >
            <BuildingTable tableData={building_property_unit || []} />
          </Card>

          {hasPermission("menu_building-楼宇资产") && (
            <Card
              className="col-span-1 h-full"
              style={{ borderColor: "#f0f0f0" }}
              title={
                <div className="flex justify-between items-center">
                  <span>
                    <PieChartFilled className="mr-1" />
                    设备类型统计
                  </span>
                </div>
              }
            >
              <ChartPie pieData={sensor_kind_unit || []} />
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
