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
import { useState } from "react";
import { PlusOutlined } from "@ant-design/icons";

export function TeachingSpacePage() {
  // 搜索表单
  const { control, handleSubmit, reset } = useForm({
    defaultValues: {
      "teaching-space": "",
      "teaching-time": "",
      "teaching-name": "",
      "teaching-role": "",
    },
  });

  // 新增表单
  const [addForm] = Form.useForm();

  // 模拟表格数据
  const [dataSource, setDataSource] = useState([
    {
      key: "1",
      "teaching-space": "TS001",
      "teaching-time": "2025-09-16",
      "teaching-name": "一号教学空间",
      "teaching-role": "管理员",
    },
    {
      key: "2",
      "teaching-space": "TS002",
      "teaching-time": "2025-09-17",
      "teaching-name": "二号教学空间",
      "teaching-role": "老师",
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

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "view">("add");
  const [selectedRecord, setSelectedRecord] = useState<any>(null);

  const columns = [
    {
      title: "空间编号",
      dataIndex: "teaching-space",
      key: "teaching-space",
      align: "center" as const,
    },
    {
      title: "创建时间",
      dataIndex: "teaching-time",
      key: "teaching-time",
      align: "center" as const,
    },
    {
      title: "空间名称",
      dataIndex: "teaching-name",
      key: "teaching-name",
      align: "center" as const,
    },
    {
      title: "所属账号",
      dataIndex: "teaching-role",
      key: "teaching-role",
      align: "center" as const,
    },
    {
      title: "操作",
      key: "operation",
      align: "center" as const,
      render: (_: any, record: any) => (
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

  // 搜索
  const onSearch = (values: any) => {
    console.log("搜索条件:", values);
    const filtered = dataSource.filter((item) =>
      Object.keys(values).every(
        (key) =>
          !values[key] ||
          (item as any)[key].toLowerCase().includes(values[key].toLowerCase())
      )
    );
    setDataSource(filtered);
  };

  const onReset = () => {
    reset();
    setDataSource([
      {
        key: "1",
        "teaching-space": "TS001",
        "teaching-time": "2025-09-16",
        "teaching-name": "一号教学空间",
        "teaching-role": "管理员",
      },
      {
        key: "2",
        "teaching-space": "TS002",
        "teaching-time": "2025-09-17",
        "teaching-name": "二号教学空间",
        "teaching-role": "老师",
      },
    ]);
  };

  // 弹窗提交
  const handleAdd = () => {
    addForm.validateFields().then((values) => {
      const newItem = {
        key: (dataSource.length + 1).toString(),
        ...values,
      };
      setDataSource([...dataSource, newItem]);
      setIsModalOpen(false);
      addForm.resetFields();
    });
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
          className="flex gap-2"
          onFinish={handleSubmit(onSearch)}
        >
          <Controller
            control={control}
            name="teaching-space"
            render={({ field }) => (
              <Form.Item label="空间编号">
                <Input placeholder="请输入空间编号" {...field} />
              </Form.Item>
            )}
          />
          <Controller
            control={control}
            name="teaching-time"
            render={({ field }) => (
              <Form.Item label="创建时间">
                <Input placeholder="请输入创建时间" {...field} />
              </Form.Item>
            )}
          />
          <Controller
            control={control}
            name="teaching-name"
            render={({ field }) => (
              <Form.Item label="空间名称">
                <Input placeholder="请输入空间名称" {...field} />
              </Form.Item>
            )}
          />
          <Controller
            control={control}
            name="teaching-role"
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
        title="教学空间管理"
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
          onChange={(pagination) => {
            onPageChange(pagination.current || 1, pagination.pageSize || 10);
          }}
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
              label="空间编号"
              name="teaching-space"
              rules={[{ required: true, message: "请输入空间编号" }]}
            >
              <Input placeholder="请输入空间编号" />
            </Form.Item>
            <Form.Item
              label="空间名称"
              name="teaching-name"
              rules={[{ required: true, message: "请输入空间名称" }]}
            >
              <Input placeholder="请输入空间名称" />
            </Form.Item>
            <Form.Item
              label="所属账号"
              name="teaching-role"
              rules={[{ required: true, message: "请输入所属账号" }]}
            >
              <Select
                placeholder="请选择所属账号"
                options={[
                  { label: "管理员", value: "管理员" },
                  { label: "老师", value: "老师" },
                  { label: "学生", value: "学生" },
                ]}
              />
            </Form.Item>
          </Form>
        ) : (
          selectedRecord && (
            <div className="mt-5">
              <div className="space-y-3">
                <div className="flex">
                  <span className="font-medium w-20">空间编号:</span>
                  <span>{selectedRecord["teaching-space"]}</span>
                </div>
                <div className="flex">
                  <span className="font-medium w-20">创建时间:</span>
                  <span>{selectedRecord["teaching-time"]}</span>
                </div>
                <div className="flex">
                  <span className="font-medium w-20">空间名称:</span>
                  <span>{selectedRecord["teaching-name"]}</span>
                </div>
                <div className="flex">
                  <span className="font-medium w-20">所属账号:</span>
                  <span>{selectedRecord["teaching-role"]}</span>
                </div>
              </div>
              <div className="flex flex-row gap-2 mt-6">
                <Button type="primary">日志管理</Button>
                <Button type="primary">楼宇管控</Button>
                <Button type="primary">实时数据</Button>
              </div>
            </div>
          )
        )}
      </Modal>
    </div>
  );
}
