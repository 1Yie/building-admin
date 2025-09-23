import React, { useState, useEffect } from "react";
import {
  Card,
  Row,
  Col,
  Progress,
  Button,
  Table,
  DatePicker,
  Select,
  Statistic,
  Badge,
  Tabs,
  Tag,
  Space,
  Tooltip as AntTooltip,
  Alert,
} from "antd";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import {
  FileTextOutlined,
  DownloadOutlined,
  EyeOutlined,
  AlertOutlined,
  CheckCircleOutlined,
  WifiOutlined,
  ExperimentOutlined,
  EnvironmentOutlined,
  DashboardOutlined,
  WarningOutlined,
  FireOutlined,
  SunOutlined,
  CloudOutlined
} from "@ant-design/icons";
import type { Dayjs } from "dayjs";

const { RangePicker } = DatePicker;
const { Option } = Select;
const { TabPane } = Tabs;

// 类型定义
interface SensorData {
  id: string;
  name: string;
  type:
    | "temperature"
    | "humidity"
    | "air_quality"
    | "light"
    | "noise"
    | "motion";
  value: number;
  unit: string;
  status: "online" | "offline" | "warning" | "error";
  lastUpdate: string;
  threshold: {
    min: number;
    max: number;
  };
}

interface Terminal {
  id: string;
  name: string;
  status: "online" | "offline" | "maintenance";
  sensors: SensorData[];
  lastHeartbeat: string;
  signalStrength: number;
}

interface Room {
  id: string;
  name: string;
  floor: number;
  terminals: Terminal[];
  averageValues: {
    temperature: number;
    humidity: number;
    airQuality: number;
  };
  alertCount: number;
}

interface Building {
  id: string;
  name: string;
  rooms: Room[];
  totalTerminals: number;
  onlineTerminals: number;
  totalSensors: number;
  activeSensors: number;
  alertCount: number;
}

type StatusType = "excellent" | "good" | "average" | "poor";
type SeverityType = "high" | "medium" | "low";

// 模拟数据
const mockBuildingData: Building[] = [
  {
    id: "building_1",
    name: "A栋教学楼",
    totalTerminals: 45,
    onlineTerminals: 42,
    totalSensors: 180,
    activeSensors: 175,
    alertCount: 3,
    rooms: [
      {
        id: "room_101",
        name: "101教室",
        floor: 1,
        alertCount: 1,
        averageValues: {
          temperature: 24.5,
          humidity: 65,
          airQuality: 85,
        },
        terminals: [
          {
            id: "terminal_101_1",
            name: "前排终端",
            status: "online",
            lastHeartbeat: "2024-01-20 14:30:25",
            signalStrength: 85,
            sensors: [
              {
                id: "sensor_temp_1",
                name: "温度传感器",
                type: "temperature",
                value: 24.5,
                unit: "°C",
                status: "online",
                lastUpdate: "2024-01-20 14:30:20",
                threshold: { min: 18, max: 28 },
              },
              {
                id: "sensor_hum_1",
                name: "湿度传感器",
                type: "humidity",
                value: 65,
                unit: "%",
                status: "warning",
                lastUpdate: "2024-01-20 14:30:20",
                threshold: { min: 40, max: 60 },
              },
            ],
          },
        ],
      },
    ],
  },
];

const mockRealtimeData = [
  { time: "14:00", temperature: 23.5, humidity: 62, airQuality: 88 },
  { time: "14:05", temperature: 24.0, humidity: 63, airQuality: 87 },
  { time: "14:10", temperature: 24.2, humidity: 64, airQuality: 86 },
  { time: "14:15", temperature: 24.5, humidity: 65, airQuality: 85 },
  { time: "14:20", temperature: 24.8, humidity: 66, airQuality: 84 },
  { time: "14:25", temperature: 25.0, humidity: 67, airQuality: 83 },
  { time: "14:30", temperature: 24.7, humidity: 65, airQuality: 85 },
];

const mockAlerts = [
  {
    id: 1,
    type: "温度异常",
    building: "A栋",
    room: "301教室",
    terminal: "后排终端",
    sensor: "温度传感器",
    severity: "high" as SeverityType,
    value: "29.5°C",
    threshold: "18-28°C",
    description: "教室温度超出正常范围",
    time: "2024-01-20 14:25:30",
  },
  {
    id: 2,
    type: "设备离线",
    building: "B栋",
    room: "205实验室",
    terminal: "中央终端",
    sensor: "-",
    severity: "medium" as SeverityType,
    value: "-",
    threshold: "-",
    description: "终端设备失去连接",
    time: "2024-01-20 14:20:15",
  },
];

export default function Evaluation() {
  const [selectedBuilding, setSelectedBuilding] = useState<string>("all");
  const [dateRange, setDateRange] = useState<
    [Dayjs | null, Dayjs | null] | null
  >(null);
  const [activeTab, setActiveTab] = useState<string>("realtime");

  const getStatusColor = (status: string): string => {
    const colorMap: Record<string, string> = {
      online: "#52c41a",
      offline: "#f5222d",
      warning: "#faad14",
      error: "#ff4d4f",
      maintenance: "#722ed1",
    };
    return colorMap[status] || "#d9d9d9";
  };

  const getStatusBadge = (status: StatusType) => {
    const statusMap: Record<StatusType, { color: string; text: string }> = {
      excellent: { color: "green", text: "优秀" },
      good: { color: "blue", text: "良好" },
      average: { color: "orange", text: "一般" },
      poor: { color: "red", text: "较差" },
    };
    const config = statusMap[status];
    return <Badge color={config.color} text={config.text} />;
  };

  const getSeverityColor = (severity: SeverityType) => {
    const colorMap: Record<SeverityType, "error" | "warning" | "processing"> = {
      high: "error",
      medium: "warning",
      low: "processing",
    };
    return colorMap[severity];
  };

  const getSensorIcon = (type: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      temperature: <ExperimentOutlined />,
      humidity: <ExperimentOutlined />,
      air_quality: <EnvironmentOutlined />,
      light: <DashboardOutlined />,
      noise: <WifiOutlined />,
      motion: <AlertOutlined />,
    };
    return iconMap[type] || <DashboardOutlined />;
  };

  // 表格列定义
  const alertColumns = [
    {
      title: "告警类型",
      dataIndex: "type",
      key: "type",
      render: (type: string) => (
        <Tag color="red" icon={<WarningOutlined />}>
          {type}
        </Tag>
      ),
    },
    {
      title: "位置信息",
      key: "location",
      render: (record: any) => (
        <div>
          <div>
            {record.building} - {record.room}
          </div>
          <div className="text-gray-500 text-sm">
            {record.terminal} / {record.sensor}
          </div>
        </div>
      ),
    },
    {
      title: "当前值",
      dataIndex: "value",
      key: "value",
      render: (value: string, record: any) => (
        <div>
          <div className="font-semibold">{value}</div>
          <div className="text-gray-500 text-sm">阈值: {record.threshold}</div>
        </div>
      ),
    },
    {
      title: "严重程度",
      dataIndex: "severity",
      key: "severity",
      render: (severity: SeverityType) => (
        <Badge
          status={getSeverityColor(severity)}
          text={
            severity === "high" ? "高" : severity === "medium" ? "中" : "低"
          }
        />
      ),
    },
    {
      title: "发生时间",
      dataIndex: "time",
      key: "time",
    },
    {
      title: "操作",
      key: "action",
      render: () => (
        <Space>
          <Button type="link" size="small" icon={<EyeOutlined />}>
            查看
          </Button>
          <Button type="link" size="small">
            处理
          </Button>
        </Space>
      ),
    },
  ];

  const terminalColumns = [
    {
      title: "终端名称",
      dataIndex: "name",
      key: "name",
      render: (name: string, record: Terminal) => (
        <div className="flex items-center">
          <WifiOutlined
            style={{
              color: getStatusColor(record.status),
              marginRight: 8,
            }}
          />
          {name}
        </div>
      ),
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Badge
          status={
            status === "online"
              ? "success"
              : status === "offline"
              ? "error"
              : "warning"
          }
          text={
            status === "online"
              ? "在线"
              : status === "offline"
              ? "离线"
              : "维护中"
          }
        />
      ),
    },
    {
      title: "信号强度",
      dataIndex: "signalStrength",
      key: "signalStrength",
      render: (strength: number) => (
        <div className="flex items-center">
          <Progress
            percent={strength}
            size="small"
            style={{ width: 80, marginRight: 8 }}
            strokeColor={
              strength > 70 ? "#52c41a" : strength > 40 ? "#faad14" : "#f5222d"
            }
          />
          <span>{strength}%</span>
        </div>
      ),
    },
    {
      title: "传感器数量",
      key: "sensorCount",
      render: (record: Terminal) => <span>{record.sensors.length}个</span>,
    },
    {
      title: "最后心跳",
      dataIndex: "lastHeartbeat",
      key: "lastHeartbeat",
    },
    {
      title: "操作",
      key: "action",
      render: () => (
        <Space>
          <Button type="link" size="small">
            详情
          </Button>
          <Button type="link" size="small">
            配置
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-5 min-h-screen">
      <div className="mb-6">
        {/* 筛选条件 */}
        <Card
          title="筛选条件"
          className="w-full"
          style={{ borderColor: "#f0f0f0" }}
        >
          <div className="flex gap-4">
            <Select
              value={selectedBuilding}
              onChange={setSelectedBuilding}
              style={{ width: 200 }}
              placeholder="选择建筑"
            >
              <Option value="all">全部建筑</Option>
              <Option value="A">A栋教学楼</Option>
              <Option value="B">B栋实验楼</Option>
              <Option value="C">C栋办公楼</Option>
            </Select>

            <RangePicker
              value={dateRange}
              onChange={setDateRange}
              placeholder={["开始日期", "结束日期"]}
            />

            <Button type="primary" icon={<DownloadOutlined />}>
              导出报告
            </Button>
          </div>
        </Card>
      </div>

      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="实时监测" key="realtime">
          {/* 系统概览统计 */}
          {/* 告警信息 */}
          <div className="mb-6">
            {mockAlerts.length > 0 && (
              <Alert
                message="系统告警"
                description={`当前有 ${mockAlerts.length} 个告警需要处理，请及时查看并处理相关问题。`}
                type="warning"
                showIcon
                className="mb-6"
                action={
                  <Button
                    size="small"
                    type="primary"
                    onClick={() => setActiveTab("alerts")}
                  >
                    查看详情
                  </Button>
                }
              />
            )}
          </div>
          <Row gutter={[16, 16]} className="mb-6">
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="在线终端"
                  value={mockBuildingData[0]?.onlineTerminals || 0}
                  suffix={`/ ${mockBuildingData[0]?.totalTerminals || 0}`}
                  valueStyle={{ color: "#52c41a" }}
                  prefix={<WifiOutlined />}
                />
                <Progress
                  percent={Math.round(
                    ((mockBuildingData[0]?.onlineTerminals || 0) /
                      (mockBuildingData[0]?.totalTerminals || 1)) *
                      100
                  )}
                  strokeColor="#52c41a"
                  size="small"
                  className="mt-2"
                />
              </Card>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="活跃传感器"
                  value={mockBuildingData[0]?.activeSensors || 0}
                  suffix={`/ ${mockBuildingData[0]?.totalSensors || 0}`}
                  valueStyle={{ color: "#1890ff" }}
                  prefix={<DashboardOutlined />}
                />
                <Progress
                  percent={Math.round(
                    ((mockBuildingData[0]?.activeSensors || 0) /
                      (mockBuildingData[0]?.totalSensors || 1)) *
                      100
                  )}
                  strokeColor="#1890ff"
                  size="small"
                  className="mt-2"
                />
              </Card>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="当前温度"
                  value={24.5}
                  suffix="°C"
                  valueStyle={{ color: "#faad14" }}
                  prefix={<ExperimentOutlined />}
                />
                <div className="mt-2 text-sm text-gray-500">
                  正常范围: 18-28°C
                </div>
              </Card>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="告警数量"
                  value={mockAlerts.length}
                  valueStyle={{
                    color: mockAlerts.length > 0 ? "#f5222d" : "#52c41a",
                  }}
                  prefix={<AlertOutlined />}
                />
                <div className="mt-2">
                  {mockAlerts.length > 0 ? (
                    <Tag color="red">需要处理</Tag>
                  ) : (
                    <Tag color="green">系统正常</Tag>
                  )}
                </div>
              </Card>
            </Col>
          </Row>

          {/* 实时数据图表 */}
          <Row gutter={[16, 16]} className="mb-6">
            <Col xs={24} lg={16}>
              <Card
                title="实时环境数据趋势"
                extra={
                  <Space>
                    <Badge status="processing" text="实时更新" />
                    <Button type="link" size="small">
                      设置阈值
                    </Button>
                  </Space>
                }
              >
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={mockRealtimeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="temperature"
                      stackId="1"
                      stroke="#ff7300"
                      fill="#ff7300"
                      fillOpacity={0.3}
                      name="温度(°C)"
                    />
                    <Area
                      type="monotone"
                      dataKey="humidity"
                      stackId="2"
                      stroke="#82ca9d"
                      fill="#82ca9d"
                      fillOpacity={0.3}
                      name="湿度(%)"
                    />
                    <Area
                      type="monotone"
                      dataKey="airQuality"
                      stackId="3"
                      stroke="#8884d8"
                      fill="#8884d8"
                      fillOpacity={0.3}
                      name="空气质量"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Card>
            </Col>

            <Col xs={24} lg={8}>
              <Card title="传感器状态分布">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="flex items-center">
                      <FireOutlined className="mr-2" />
                      温度传感器
                    </span>
                    <div>
                      <Badge status="success" />
                      <span className="ml-1">45个在线</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center">
                      <ExperimentOutlined className="mr-2" />
                      湿度传感器
                    </span>
                    <div>
                      <Badge status="warning" />
                      <span className="ml-1">43个在线</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center">
                      <CloudOutlined className="mr-2" />
                      空气质量
                    </span>
                    <div>
                      <Badge status="success" />
                      <span className="ml-1">42个在线</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center">
                      <SunOutlined className="mr-2" />
                      光照传感器
                    </span>
                    <div>
                      <Badge status="success" />
                      <span className="ml-1">40个在线</span>
                    </div>
                  </div>
                </div>
              </Card>
            </Col>
          </Row>
        </TabPane>

        <TabPane tab="设备管理" key="devices">
          <Card
            title="终端设备状态"
            extra={
              <Space>
                <Button type="primary" icon={<FileTextOutlined />}>
                  设备报告
                </Button>
                <Button>添加设备</Button>
              </Space>
            }
          >
            <Table
              columns={terminalColumns}
              dataSource={mockBuildingData[0]?.rooms[0]?.terminals || []}
              pagination={false}
              rowKey="id"
            />
          </Card>
        </TabPane>

        <TabPane tab="告警中心" key="alerts">
          <Card
            title={
              <div className="flex items-center ">
                <AlertOutlined className="mr-2 text-red-500" />
                告警监控中心
                <Badge count={mockAlerts.length} className="ml-" />
              </div>
            }
            extra={
              <Space>
                <Button type="primary" danger>
                  处理全部
                </Button>
                <Button>导出告警</Button>
              </Space>
            }
          >
            <Table
              columns={alertColumns}
              dataSource={mockAlerts}
              pagination={false}
              rowKey="id"
            />
          </Card>
        </TabPane>

        <TabPane tab="数据分析" key="analysis">
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Card title="环境数据对比分析">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={mockRealtimeData.slice(-6)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="temperature" fill="#ff7300" name="温度" />
                    <Bar dataKey="humidity" fill="#82ca9d" name="湿度" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Col>

            <Col xs={24} lg={12}>
              <Card title="系统运行建议">
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold text-blue-800 flex items-center">
                      <CheckCircleOutlined className="mr-2" />
                      设备状态良好
                    </h4>
                    <p className="text-blue-600 mt-2">
                      当前93%的终端设备在线运行，系统整体状态良好
                    </p>
                  </div>
                  <div className="p-4 bg-orange-50 rounded-lg">
                    <h4 className="font-semibold text-orange-800 flex items-center">
                      <WarningOutlined className="mr-2" />
                      环境监测提醒
                    </h4>
                    <p className="text-orange-600 mt-2">
                      部分区域湿度偏高，建议检查通风系统运行状态
                    </p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h4 className="font-semibold text-green-800 flex items-center">
                      <CheckCircleOutlined className="mr-2" />
                      温度控制优化
                    </h4>
                    <p className="text-green-600 mt-2">
                      温度控制系统运行稳定，建议保持当前设置参数
                    </p>
                  </div>
                </div>
              </Card>
            </Col>
          </Row>
        </TabPane>
      </Tabs>
    </div>
  );
}
