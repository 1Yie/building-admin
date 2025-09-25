import {
  Button,
  Form,
  Input,
  Table,
  Modal,
  Popconfirm,
  Select,
  Card,
} from "antd";
import { Controller, useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import { PlusOutlined, ControlFilled } from "@ant-design/icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  searchTeachingSpace,
  createTeachingSpace,
  deleteTeachingSpace,
} from "@/request/teaching";
import { z } from "zod/v4";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Link } from "react-router";

const teachingSpaceSchema = z.object({
  number: z.string().optional(),
  name: z.string().min(1, "空间名称不能为空"),
  count: z.string().min(1, "所属账号不能为空"),
});

type TeachingSpaceForm = z.infer<typeof teachingSpaceSchema>;

export function TeachingSpacePage() {
  const queryClient = useQueryClient();

  // 搜索 form
  const { control, handleSubmit, reset } = useForm({
    defaultValues: {
      number: "",
      name: "",
      count: "",
    },
  });

  // 编辑/新增 form
  const {
    control: addControl,
    handleSubmit: handleAddSubmit,
    reset: addReset,
    formState: { errors: addErrors },
  } = useForm<TeachingSpaceForm>({
    resolver: zodResolver(teachingSpaceSchema),
    defaultValues: { number: "" },
  });

  // 分页
  const [searchParams, setSearchParams] = useState({
    page: 1,
    page_size: 10,
    number: "",
    name: "",
    count: "",
  });

  const {
    data: teachingData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["teachingSpaces", searchParams],
    queryFn: () => searchTeachingSpace(searchParams),
  });

  const dataSource = teachingData?.rooms || [];
  console.log(dataSource);
  const pagination = {
    current: teachingData?.pageNum || 1,
    pageSize: teachingData?.pageSize || 10,
    total: teachingData?.totalSize || 0,
  };

  const { mutate: createMutate, isPending: isCreating } = useMutation({
    mutationFn: createTeachingSpace,
    onSuccess: () => {
      toast.success("新增成功");
      queryClient.invalidateQueries({ queryKey: ["teachingSpaces"] });
      setIsModalOpen(false);
    },
    onError: (err: any) => {
      console.log(err);
    },
  });

  const deleteMutate = useMutation({
    mutationFn: deleteTeachingSpace,
    onSuccess: () => {
      toast.success("删除成功");
      queryClient.invalidateQueries({ queryKey: ["teachingSpaces"] });
      setDeletingKey(null); // 清除 loading
    },
    onError: (err: any) => {
      console.error(err);
      setDeletingKey(null); // 清除 loading
    },
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "view">("add");
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);

  useEffect(() => {
    if (isModalOpen && modalMode === "add") {
      addReset({ number: "", name: "", count: "" });
    }
  }, [isModalOpen, modalMode, addReset]);

  const columns = [
    {
      title: "空间编号",
      dataIndex: "number",
      key: "number",
      align: "center" as const,
    },
    {
      title: "创建时间",
      dataIndex: "time",
      key: "time",
      align: "center" as const,
    },
    {
      title: "空间名称",
      dataIndex: "name",
      key: "name",
      align: "center" as const,
    },
    {
      title: "所属账号",
      dataIndex: "owning_count",
      key: "count",
      align: "center" as const,
    },
    {
      title: "操作",
      key: "operation",
      align: "center" as const,
      render: (_: any, record: any) => (
        <div className="flex justify-center gap-2">
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
          <Popconfirm
            title="确定删除吗？"
            okText="确定"
            cancelText="取消"
            onConfirm={() => {
              setDeletingKey(record.number); // 设置当前删除行 key
              deleteMutate.mutate({ number: record.number });
            }}
          >
            <Button
              type="default"
              danger
              loading={deletingKey === record.number}
            >
              删除
            </Button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  // 搜索
  const onSearch = (values: any) => {
    setSearchParams({ ...searchParams, ...values, page: 1 });
  };

  const onReset = () => {
    reset();
    setSearchParams({
      page: 1,
      page_size: 10,
      number: "",
      name: "",
      count: "",
    });
  };

  const onPageChange = (current: number, pageSize: number) => {
    setSearchParams({ ...searchParams, page: current, page_size: pageSize });
  };

  // 弹窗提交
  const handleAdd = (values: TeachingSpaceForm) => {
    createMutate({ ...values, number: "" });
  };

  return (
    <div className="">
      {/* 搜索表单 */}
      <Card
        style={{
          borderColor: "#f0f0f0",
          marginBottom: "20px",
        }}
      >
        <Form
          layout="inline"
          className="flex flex-wrap gap-2"
          onFinish={handleSubmit(onSearch)}
        >
          <Controller
            control={control}
            name="number"
            render={({ field }) => (
              <Form.Item label="空间编号">
                <Input placeholder="请输入空间编号" {...field} />
              </Form.Item>
            )}
          />
          <Controller
            control={control}
            name="name"
            render={({ field }) => (
              <Form.Item label="空间名称">
                <Input placeholder="请输入空间名称" {...field} />
              </Form.Item>
            )}
          />
          <Controller
            control={control}
            name="count"
            render={({ field }) => (
              <Form.Item label="所属账号">
                <Input placeholder="请输入所属账号" {...field} />
              </Form.Item>
            )}
          />
          <div className="flex gap-2">
            <Button type="primary" htmlType="submit">
              搜索
            </Button>
            <Button type="default" onClick={onReset}>
              重置
            </Button>
          </div>
        </Form>
      </Card>

      {/* 表格 */}
      <Card
        title={
          <div className="flex justify-between items-center">
            <span>
              <ControlFilled className="mr-1" />
              教学空间管理
            </span>
          </div>
        }
        extra={
          <Button
            type="primary"
            onClick={() => {
              setModalMode("add");
              setIsModalOpen(true);
            }}
            icon={<PlusOutlined />}
          >
            创建
          </Button>
        }
        style={{
          borderColor: "#f0f0f0",
          marginBottom: "20px",
        }}
      >
        <Table
          columns={columns}
          dataSource={dataSource}
          loading={isLoading}
          pagination={{
            ...pagination,
            onChange: onPageChange,
          }}
          rowKey="number"
        />
      </Card>

      {/* 新增/查看弹窗 */}
      <Modal
        title={modalMode === "add" ? "新增教学空间" : "查看教学空间"}
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
                  loading={isCreating}
                  onClick={handleAddSubmit(handleAdd)}
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
          <Form
            layout="horizontal"
            className="space-y-7 mt-5"
            onFinish={handleAddSubmit(handleAdd)}
          >
            <Controller
              name="name"
              control={addControl}
              render={({ field }) => (
                <Form.Item
                  label="空间名称"
                  validateStatus={addErrors.name ? "error" : ""}
                  help={addErrors.name?.message}
                >
                  <Input {...field} placeholder="请输入空间名称" />
                </Form.Item>
              )}
            />
            <Controller
              name="count"
              control={addControl}
              render={({ field }) => (
                <Form.Item
                  label="所属账号"
                  validateStatus={addErrors.count ? "error" : ""}
                  help={addErrors.count?.message}
                >
                  <Select
                    {...field}
                    placeholder="请选择所属账号"
                    options={[
                      { label: "管理员", value: "管理员" },
                      { label: "老师", value: "老师" },
                      { label: "学生", value: "学生" },
                    ]}
                  />
                </Form.Item>
              )}
            />
          </Form>
        ) : (
          selectedRecord && (
            <div className="mt-5">
              <div className="space-y-3">
                <div className="flex">
                  <span className="font-medium w-24">空间编号:</span>
                  <span>{selectedRecord.number}</span>
                </div>
                <div className="flex">
                  <span className="font-medium w-24">创建时间:</span>
                  <span>{selectedRecord.time}</span>
                </div>
                <div className="flex">
                  <span className="font-medium w-24">空间名称:</span>
                  <span>{selectedRecord.name}</span>
                </div>
                <div className="flex">
                  <span className="font-medium w-24">所属账号:</span>
                  <span>{selectedRecord.owning_count}</span>
                </div>
              </div>
              <div className="flex flex-row gap-2 mt-6">
                <Button type="primary">日志管理</Button>
                <Button type="primary">楼宇管控</Button>
                <Button type="primary">
                  <Link
                    to="/teaching/virtual/realtime"
                    className="flex items-center"
                  >
                    实时数据
                  </Link>
                </Button>
              </div>
            </div>
          )
        )}
      </Modal>
    </div>
  );
}
