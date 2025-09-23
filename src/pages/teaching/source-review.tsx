import {
  Button,
  Table,
  Tag,
  Form,
  Input,
  Select,
  Modal,
  message,
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

export default function SourceReviewPage() {
  const { control, handleSubmit, reset } = useForm({
    defaultValues: {
      applicationNumber: "",
      status: "",
    },
  });

  // 模拟审核数据 - 主要显示待审核的申请
  const [data, setData] = useState<Application[]>([
    {
      key: "1",
      applicationNumber: "SQ20250001",
      applicationTime: "2025-09-16 09:00",
      applicationContent: "申请使用楼宇资产 LY001",
      status: "待审核",
      reviewer: "",
      reviewNote: "",
    },
    {
      key: "2",
      applicationNumber: "SQ20250004",
      applicationTime: "2025-09-16 14:20",
      applicationContent: "申请新增网关设备 WG004",
      status: "待审核",
      reviewer: "",
      reviewNote: "",
    },
    {
      key: "3",
      applicationNumber: "SQ20250002",
      applicationTime: "2025-09-16 10:30",
      applicationContent: "申请添加新空间 KJ002",
      status: "通过",
      reviewer: "李四",
      reviewNote: "审核通过",
    },
    {
      key: "4",
      applicationNumber: "SQ20250003",
      applicationTime: "2025-09-16 11:15",
      applicationContent: "申请新增传感器 CGQ003",
      status: "驳回",
      reviewer: "王五",
      reviewNote: "缺少详细说明",
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

  // 控制审核弹窗
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewForm] = Form.useForm();
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
        reviewer: "",
        reviewNote: "",
      },
      {
        key: "2",
        applicationNumber: "SQ20250004",
        applicationTime: "2025-09-16 14:20",
        applicationContent: "申请新增网关设备 WG004",
        status: "待审核",
        reviewer: "",
        reviewNote: "",
      },
      {
        key: "3",
        applicationNumber: "SQ20250002",
        applicationTime: "2025-09-16 10:30",
        applicationContent: "申请添加新空间 KJ002",
        status: "通过",
        reviewer: "李四",
        reviewNote: "审核通过",
      },
      {
        key: "4",
        applicationNumber: "SQ20250003",
        applicationTime: "2025-09-16 11:15",
        applicationContent: "申请新增传感器 CGQ003",
        status: "驳回",
        reviewer: "王五",
        reviewNote: "缺少详细说明",
      },
    ]);
  };

  // 审核处理
  const handleReview = () => {
    reviewForm.validateFields().then((values) => {
      const { reviewStatus, reviewNote } = values;

      // 更新数据
      const updatedData = data.map((item) => {
        if (item.key === selectedRecord?.key) {
          return {
            ...item,
            status: reviewStatus,
            reviewer: "当前审核员", // TODO: 实际项目中应该从用户信息获取
            reviewNote: reviewNote || "",
          };
        }
        return item;
      });

      setData(updatedData);
      setIsReviewModalOpen(false);
      reviewForm.resetFields();
      message.success(`申请已${reviewStatus === "通过" ? "通过" : "驳回"}`);
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
              setSelectedRecord(record);
              setIsReviewModalOpen(true);
              // 预填充表单
              reviewForm.setFieldsValue({
                reviewStatus: record.status === "待审核" ? "" : record.status,
                reviewNote: record.reviewNote,
              });
            }}
          >
            {record.status === "待审核" ? "审核" : "查看"}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="">
      <div className="">
        <Card
          title="搜索条件"
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
          title="资源审核管理"
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

      {/* 审核弹窗 */}
      <Modal
        title={
          selectedRecord?.status === "待审核" ? "审核申请" : "查看审核详情"
        }
        open={isReviewModalOpen}
        onCancel={() => setIsReviewModalOpen(false)}
        footer={
          selectedRecord?.status === "待审核"
            ? [
                <Button
                  key="cancel"
                  onClick={() => setIsReviewModalOpen(false)}
                >
                  取消
                </Button>,
                <Button key="submit" type="primary" onClick={handleReview}>
                  提交审核
                </Button>,
              ]
            : [
                <Button key="close" onClick={() => setIsReviewModalOpen(false)}>
                  关闭
                </Button>,
              ]
        }
      >
        {selectedRecord && (
          <div className="space-y-4">
            {/* 申请信息展示 */}
            <div className="bg-gray-50 p-4 rounded">
              <h4 className="font-medium mb-2">申请信息</h4>
              <p>
                <strong>申请编号:</strong> {selectedRecord.applicationNumber}
              </p>
              <p>
                <strong>申请时间:</strong> {selectedRecord.applicationTime}
              </p>
              <p>
                <strong>申请内容:</strong> {selectedRecord.applicationContent}
              </p>
            </div>

            {/* 审核表单 */}
            {selectedRecord.status === "待审核" ? (
              <Form form={reviewForm} layout="horizontal" className="space-y-7">
                <Form.Item
                  label="审核结果"
                  name="reviewStatus"
                  rules={[{ required: true, message: "请选择审核结果" }]}
                >
                  <Select
                    placeholder="请选择审核结果"
                    options={[
                      { label: "通过", value: "通过" },
                      { label: "驳回", value: "驳回" },
                    ]}
                  />
                </Form.Item>
                <Form.Item
                  label="审核备注"
                  name="reviewNote"
                  rules={[{ required: true, message: "请输入审核备注" }]}
                >
                  <Input.TextArea rows={4} placeholder="请输入审核备注" />
                </Form.Item>
              </Form>
            ) : (
              <div className="bg-gray-50 p-4 rounded">
                <h4 className="font-medium mb-2">审核结果</h4>
                <p>
                  <strong>状态:</strong>{" "}
                  <Tag
                    color={selectedRecord.status === "通过" ? "green" : "red"}
                  >
                    {selectedRecord.status}
                  </Tag>
                </p>
                <p>
                  <strong>审核人:</strong> {selectedRecord.reviewer}
                </p>
                <p>
                  <strong>审核备注:</strong> {selectedRecord.reviewNote}
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
