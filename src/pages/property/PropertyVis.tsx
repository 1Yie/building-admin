"use client";

import { useState } from "react";
import { Form, Input, Button, Card, Row, Col, Spin, Typography } from "antd";
import {
  getAssetsByBuilding,
  type SensorItem,
} from "@/lib/get-sensors-by-building";
import { Cpu, Fan, Server, AlertCircle } from "lucide-react";
import ReactECharts from "echarts-for-react";

const { Title } = Typography;

export default function PropertyVis() {
  const [assets, setAssets] = useState<SensorItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<SensorItem | null>(null);
  const [floorOrRoom, setFloorOrRoom] = useState(""); // 新增第二个搜索框状态

  const getIcon = (type: string) => {
    switch (type) {
      case "房间":
        return <Server className="text-blue-500" />;
      case "终端":
        return <Cpu className="text-green-500" />;
      case "设备":
        return <Fan className="text-purple-500" />;
      case "传感器":
        return <AlertCircle className="text-red-500" />;
      default:
        return <Server />;
    }
  };

  // 根据楼宇 + 层数/房间名过滤房间
  const rooms = assets
    .filter((a) => a.property_type === "房间")
    .filter((r) =>
      floorOrRoom ? r.property_name.includes(floorOrRoom) : true
    );

  const getRoomAssets = (room: SensorItem) => {
    const roomMatch = room.property_name.match(/(.+?)\((.+?)\)/);
    const roomBaseName = roomMatch
      ? roomMatch[1].trim()
      : room.property_name.trim();
    const roomNumber = roomMatch ? roomMatch[2].trim() : "";

    return assets
      .filter(
        (a) =>
          a.property_type !== "房间" && a.building === room.building && a.space
      )
      .map((a) => ({
        ...a,
        x: a.x ?? Math.random() * 90 + 5,
        y: a.y ?? Math.random() * 90 + 5,
      }))
      .filter((a) => {
        const normalizedSpace = a.space.replace(/\s+/g, "");
        const normalizedName = roomBaseName.replace(/\s+/g, "");
        return (
          normalizedSpace.includes(normalizedName) ||
          normalizedSpace.includes(roomNumber)
        );
      });
  };

  const onFinish = async (values: { building: string }) => {
    if (!values.building) return;
    setLoading(true);
    const res = await getAssetsByBuilding(values.building);
    setAssets(res);
    setLoading(false);
  };

  const getRoomChartOption = (room: SensorItem) => {
    const roomAssets = getRoomAssets(room);
    return {
      title: { text: room.property_name, left: "center" },
      xAxis: { min: 0, max: 100, show: false },
      yAxis: { min: 0, max: 100, show: false, inverse: true },
      grid: { left: 0, right: 0, top: 0, bottom: 0 },
      tooltip: {
        formatter: (params: any) =>
          `${params.data.name}<br/>${params.data.type}<br>${
            params.data.is_liveness ? "在线" : "离线"
          }`,
      },
      series: [
        {
          type: "scatter",
          data: roomAssets.map((a) => ({
            value: [a.x!, a.y!],
            name: a.property_name,
            type: a.property_type,
            is_liveness: a.is_liveness,
            itemStyle: {
              color: a.is_liveness
                ? a.property_type === "终端"
                  ? "#4ade80"
                  : a.property_type === "设备"
                  ? "#a78bfa"
                  : a.property_type === "网关（智能箱）"
                  ? "#3b82f6"
                  : "#60a5fa" // 传感器或其他类型
                : "#9ca3af", // 离线统一灰色
            },

            symbolSize: a.property_type === "传感器" ? 20 : 30,
          })),
          label: { show: true, formatter: "{b}", position: "top" },
        },
      ],
    };
  };

  if (selectedRoom) {
    return (
      <div className="p-5">
        <Button onClick={() => setSelectedRoom(null)} className="mb-5">
          返回房间列表
        </Button>
        <ReactECharts
          option={getRoomChartOption(selectedRoom)}
          style={{ height: 400 }}
        />
      </div>
    );
  }

  return (
    <div className="p-5">
      <Form layout="inline" onFinish={onFinish} className="mb-5">
        <Form.Item
          name="building"
          label="楼宇"
          rules={[{ required: true, message: "请输入楼宇名称" }]}
        >
          <Input placeholder="输入楼宇名称" />
        </Form.Item>

        <Form.Item label="层数/房间名">
          <Input
            placeholder="输入层数或房间名"
            value={floorOrRoom}
            onChange={(e) => setFloorOrRoom(e.target.value)}
          />
        </Form.Item>

        <Form.Item>
          <div className="flex gap-2">
            <Button type="primary" htmlType="submit">
              搜索
            </Button>
            <Button
              type="default"
              htmlType="button"
              onClick={() => {
                setFloorOrRoom("");
                setSelectedRoom(null);
              }}
            >
              重置
            </Button>
          </div>
        </Form.Item>
      </Form>

      {loading ? (
        <div className="flex justify-center items-center p-12">
          <Spin className="w-12 h-12" />
        </div>
      ) : (
        <div className="mb-6 mt-6">
          <Title level={4}>房间（{rooms.length}）</Title>
          <Row gutter={[16, 16]}>
            {rooms.map((room) => (
              <Col key={room.property_id} xs={24} sm={12} md={8} lg={6}>
                <Card
                  title={room.property_name}
                  size="small"
                  hoverable
                  onClick={() => setSelectedRoom(room)}
                  style={{ cursor: "pointer" }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {getIcon(room.property_type)}
                    <span>{room.property_type}</span>
                  </div>
                  <div>楼宇: {room.building}</div>
                  <div>终端: {room.terminal}</div>
                  <div>传感器: {room.counts?.device}个</div>
                  <div>
                    状态：
                    <span
                      className={
                        room.is_liveness ? "text-green-500" : "text-gray-500"
                      }
                    >
                      {room.is_liveness ? "在线" : "离线"}
                    </span>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      )}
    </div>
  );
}
