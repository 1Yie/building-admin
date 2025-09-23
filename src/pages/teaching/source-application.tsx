import {
  Button,
  Table,
  Tag,
  Form,
  Input,
  Select,
  Modal,
  Popconfirm,
  Card,
} from "antd";
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";

interface Application {
  key: string;
  applicationNumber: string;
  applicationTime: string;
  applicationContent: string;
  status: "待审核" | "通过" | "驳回";
  reviewer: string;
  reviewNote?: string;
}

export default function SourceApplicationPage() {
  const { control, handleSubmit, reset } = useForm({
    defaultValues: {
      applicationNumber: "",
      status: "",
    },
  });

  // 表格数据
  const [data, setData] = useState<Application[]>([
    {
      key: "1",
      applicationNumber: "SQ20250001",
      applicationTime: "2025-09-16 09:00",
      applicationContent: "申请使用楼宇资产 LY001",
      status: "待审核",
      reviewer: "张三",
      reviewNote: "",
    },
    {
      key: "2",
      applicationNumber: "SQ20250002",
      applicationTime: "2025-09-16 10:30",
      applicationContent: "申请添加新空间 KJ002",
      status: "通过",
      reviewer: "李四",
      reviewNote: "审核通过",
    },
    {
      key: "3",
      applicationNumber: "SQ20250003",
      applicationTime: "2025-09-16 11:15",
      applicationContent: "申请新增传感器 CGQ003",
      status: "驳回",
      reviewer: "王五",
      reviewNote: "缺少说明",
    },
  ]);

  // 分页参数
  const [pageParams, setPageParams] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // 分页处理函数
  const onPageChange = (current: number, pageSize: number) => {
    setPageParams({
      current,
      pageSize,
      total: pageParams.total,
    });
  };

  // 控制新增申请弹窗
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [addForm] = Form.useForm();
  const [modalMode, setModalMode] = useState<"add" | "view">("add");
  const [selectedRecord, setSelectedRecord] = useState<Application | null>(
    null
  );

  // 搜索处理
  const onSearch = (values: any) => {
    const { applicationNumber, status } = values;
    let filtered = [...data];
    if (applicationNumber) {
      filtered = filtered.filter((item) =>
        item.applicationNumber.includes(applicationNumber)
      );
    }
    if (status) {
      filtered = filtered.filter((item) => item.status === status);
    }
    setData(filtered);
  };

  const onReset = () => {
    reset();
    // 模拟恢复原始数据
    setData([
      {
        key: "1",
        applicationNumber: "SQ20250001",
        applicationTime: "2025-09-16 09:00",
        applicationContent: "申请使用楼宇资产 LY001",
        status: "待审核",
        reviewer: "张三",
        reviewNote: "",
      },
      {
        key: "2",
        applicationNumber: "SQ20250002",
        applicationTime: "2025-09-16 10:30",
        applicationContent: "申请添加新空间 KJ002",
        status: "通过",
        reviewer: "李四",
        reviewNote: "审核通过",
      },
      {
        key: "3",
        applicationNumber: "SQ20250003",
        applicationTime: "2025-09-16 11:15",
        applicationContent: "申请新增传感器 CGQ003",
        status: "驳回",
        reviewer: "王五",
        reviewNote: "缺少说明",
      },
    ]);
  };

  // 新增申请提交
  const handleAdd = () => {
    addForm.validateFields().then((values) => {
      const newItem: Application = {
        key: (data.length + 1).toString(),
        applicationNumber: values.applicationNumber,
        applicationTime: new Date()
          .toISOString()
          .slice(0, 16)
          .replace("T", " "),
        applicationContent: values.applicationContent,
        status: "待审核",
        reviewer: "-",
        reviewNote: "",
      };
      setData([...data, newItem]);
      setIsModalOpen(false);
      addForm.resetFields();
    });
  };

  const columns = [
    {
      title: "申请编号",
      dataIndex: "applicationNumber",
      key: "applicationNumber",
    },
    { title: "申请时间", dataIndex: "applicationTime", key: "applicationTime" },
    {
      title: "申请内容",
      dataIndex: "applicationContent",
      key: "applicationContent",
      ellipsis: true,
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      render: (status: Application["status"]) => {
        let color = "default";
        if (status === "通过") color = "green";
        else if (status === "驳回") color = "red";
        else if (status === "待审核") color = "blue";
        return <Tag color={color}>{status}</Tag>;
      },
    },
    { title: "审核人", dataIndex: "reviewer", key: "reviewer" },
    {
      title: "审核备注",
      dataIndex: "reviewNote",
      key: "reviewNote",
      ellipsis: true,
    },
    {
      title: "操作",
      key: "action",
      render: (_: any, record: Application) => (
        <div className="flex gap-2">
          <Button
            type="default"
            onClick={() => {
              setModalMode("view");
              setSelectedRecord(record);
              setIsModalOpen(true);
            }}
          >
            查看
          </Button>
          <Popconfirm title="确定删除吗？" okText="确定" cancelText="取消">
            <Button type="default" danger>删除</Button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div className="">
      <div className="">
        <Card
          className="w-full"
          style={{ borderColor: "#f0f0f0" }}

        >
          <Form
            layout="inline"
            onFinish={handleSubmit(onSearch)}
            className="flex gap-2"
          >
            <Controller
              name="applicationNumber"
              control={control}
              render={({ field }) => (
                <Form.Item label="申请编号">
                  <Input {...field} placeholder="请输入申请编号" />
                </Form.Item>
              )}
            />
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Form.Item label="状态">
                  <Select
                    placeholder="请选择状态"
                    {...field}
                    value={field.value || undefined}
                    style={{ width: 120 }}
                    allowClear
                    options={[
                      { label: "待审核", value: "待审核" },
                      { label: "通过", value: "通过" },
                      { label: "驳回", value: "驳回" },
                    ]}
                  />
                </Form.Item>
              )}
            />
            <div className="flex gap-2">
              <Button type="primary" htmlType="submit">
                搜索
              </Button>
              <Button type="default" htmlType="button" onClick={onReset}>
                重置
              </Button>
            </div>
          </Form>
        </Card>
      </div>

      <div className="mt-5">
        <Card
          title="资源申请管理"
          extra={
            <Button
              type="primary"
              htmlType="button"
              onClick={() => {
                setModalMode("add");
                setIsModalOpen(true);
              }}
            >
              提交申请
            </Button>
          }
          className="w-full"
          style={{ borderColor: "#f0f0f0" }}
        >
          <Table
            dataSource={data}
            columns={columns}
            onChange={(pagination) =>
              onPageChange(pagination.current || 1, pagination.pageSize || 10)
            }
          />
        </Card>
      </div>

      <Modal
        title={modalMode === "add" ? "提交新申请" : "查看申请详情"}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={
          modalMode === "add"
            ? [
                <Button key="cancel" onClick={() => setIsModalOpen(false)}>
                  取消
                </Button>,
                <Button key="submit" type="primary" onClick={handleAdd}>
                  提交
                </Button>,
              ]
            : [
                <Button key="close" onClick={() => setIsModalOpen(false)}>
                  关闭
                </Button>,
              ]
        }
      >
        {modalMode === "add" ? (
          <Form form={addForm} layout="horizontal" className="space-y-7">
            <Form.Item
              label="申请编号"
              name="applicationNumber"
              rules={[{ required: true, message: "请输入申请编号" }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              label="申请内容"
              name="applicationContent"
              rules={[{ required: true, message: "请输入申请内容" }]}
            >
              <Input.TextArea rows={12} />
            </Form.Item>
          </Form>
        ) : (
          selectedRecord && (
            <div>
              <p>申请编号: {selectedRecord.applicationNumber}</p>
              <p>申请时间: {selectedRecord.applicationTime}</p>
              <p>申请内容: {selectedRecord.applicationContent}</p>
              <p>状态: {selectedRecord.status}</p>
              <p>审核人: {selectedRecord.reviewer}</p>
              <p>审核备注: {selectedRecord.reviewNote}</p>
            </div>
          )
        )}
      </Modal>
    </div>
  );
}
