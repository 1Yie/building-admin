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
  message,
} from "antd";
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { ControlFilled } from "@ant-design/icons";
import { useQuery, useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { application } from "@/request/virtual";
import { useAuth } from "@/hooks/use-auth";

// ---------------- Zod 校验 ----------------
const addApplicationSchema = z.object({
  applicationNumber: z.string().min(1, "请输入申请编号"),
  applicationContent: z.string().min(1, "请输入申请内容"),
});

// ---------------- TS 类型 ----------------
type ApplicationItem = z.infer<typeof addApplicationSchema> & {
  key: string;
  applicationTime: string;
  status: "待审核" | "通过" | "驳回";
  reviewer: string;
  reviewNote?: string;
};

interface SearchFormValues {
  applicationNumber?: string;
  status?: "待审核" | "通过" | "驳回";
}

export default function SourceApplicationPage() {
  const { userInfo } = useAuth();

  // 搜索表单
  const { control, handleSubmit, reset } = useForm<SearchFormValues>({
    defaultValues: {},
  });

  // 新增申请 Modal 状态
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "view">("add");
  const [selectedRecord, setSelectedRecord] = useState<ApplicationItem | null>(
    null
  );

  // 新增申请表单
  const addForm = useForm<{
    applicationContent: string;
  }>({
    resolver: zodResolver(
      z.object({
        applicationContent: z.string().min(1, "请输入申请内容"),
      })
    ),
    defaultValues: {
      applicationContent: "",
    },
  });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["applicationList"],
    queryFn: () => application.getList({ page: 1, page_size: 100 }),
    select: (res) =>
      res.applications.map((item) => ({
        key: item.caid,
        applicationNumber: item.number,
        applicationTime: item.time,
        applicationContent: item.content,
        status:
          item.status === 0 ? "待审核" : item.status === 1 ? "通过" : "驳回",
        reviewer: item.audit_username,
        reviewNote: item.remarks,
      })),
  });

  const addMutation = useMutation({
    mutationFn: application.addNew,
    onSuccess: () => {
      message.success("提交成功");
      setIsModalOpen(false);
      addForm.reset();
      refetch(); // 直接刷新列表
    },
    onError: () => {
      message.error("提交失败，请重试");
    },
  });

  const handleAdd = (values: { applicationContent: string }) => {
    if (!userInfo) {
      message.error("获取用户信息失败，请重新登录");
      return;
    }
    addMutation.mutate({
      content: values.applicationContent,
      username: userInfo.username,
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
      render: (status: ApplicationItem["status"]) => {
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
      render: (_: any, record: ApplicationItem) => (
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
            <Button type="default" danger>
              删除
            </Button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  const onSearch = (values: SearchFormValues) => {
    refetch(); // 可以根据需要加客户端过滤
  };

  const onReset = () => {
    reset();
    refetch();
  };

  return (
    <div>
      <Card className="w-full" style={{ borderColor: "#f0f0f0" }}>
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

      <div className="mt-5">
        <Card
          title={
            <div className="flex justify-between items-center">
              <span>
                <ControlFilled className="mr-1" />
                资源申请管理
              </span>
            </div>
          }
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
            dataSource={data as ApplicationItem[]}
            columns={columns}
            loading={isLoading}
            rowKey="key"
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
                <Button
                  key="submit"
                  type="primary"
                  onClick={addForm.handleSubmit(handleAdd)}
                >
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
          <Form layout="vertical" className="space-y-4">
            <Controller
              name="applicationContent"
              control={addForm.control}
              render={({ field }) => (
                <Form.Item label="申请内容">
                  <Input.TextArea rows={12} {...field} />
                </Form.Item>
              )}
            />
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
