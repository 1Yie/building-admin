import { Button, Form, Input, Table, Modal } from "antd";
import { Controller, useForm } from "react-hook-form";
import { useState } from "react";

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

  const [isModalOpen, setIsModalOpen] = useState(false);

  const columns = [
    { title: "空间编号", dataIndex: "teaching-space", key: "teaching-space" },
    { title: "创建时间", dataIndex: "teaching-time", key: "teaching-time" },
    { title: "空间名称", dataIndex: "teaching-name", key: "teaching-name" },
    { title: "所属账号", dataIndex: "teaching-role", key: "teaching-role" },
    {
      title: "操作",
      key: "operation",
      render: (_: any, record: any) => (
        <div className="flex gap-2">
          <Button type="default">查看</Button>
          <Button type="default">删除</Button>
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
    <div className="p-5">
      {/* 搜索表单 */}
      <Form
        layout="inline"
        className="flex gap-2 mb-4"
        onFinish={handleSubmit(onSearch)}
      >
        <Controller
          control={control}
          name="teaching-space"
          render={({ field }) => (
            <Form.Item label="空间编号">
              <Input {...field} />
            </Form.Item>
          )}
        />
        <Controller
          control={control}
          name="teaching-time"
          render={({ field }) => (
            <Form.Item label="创建时间">
              <Input {...field} />
            </Form.Item>
          )}
        />
        <Controller
          control={control}
          name="teaching-name"
          render={({ field }) => (
            <Form.Item label="空间名称">
              <Input {...field} />
            </Form.Item>
          )}
        />
        <Controller
          control={control}
          name="teaching-role"
          render={({ field }) => (
            <Form.Item label="所属账号">
              <Input {...field} />
            </Form.Item>
          )}
        />
        <div className="flex gap-2">
          <Button type="default" htmlType="submit">
            搜索
          </Button>
          <Button type="default" onClick={onReset}>
            重置
          </Button>
        </div>
        <div>
          <Button type="primary" onClick={() => setIsModalOpen(true)}>
            新增
          </Button>
        </div>
      </Form>

      {/* 表格 */}
      <Table className="mt-2" columns={columns} dataSource={dataSource} />

      {/* 新增弹窗 */}
      <Modal
        title="新增教学空间"
        open={isModalOpen}
        onOk={handleAdd}
        onCancel={() => setIsModalOpen(false)}
        footer={[
          <Button key="cancel" onClick={() => setIsModalOpen(false)}>
            取消
          </Button>,
          <Button key="submit" type="primary" htmlType="submit">
            提交
          </Button>,
        ]}
      >
        <Form form={addForm} layout="vertical">
          <Form.Item
            label="空间编号"
            name="teaching-space"
            rules={[{ required: true, message: "请输入空间编号" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="创建时间"
            name="teaching-time"
            rules={[{ required: true, message: "请输入创建时间" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="空间名称"
            name="teaching-name"
            rules={[{ required: true, message: "请输入空间名称" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="所属账号"
            name="teaching-role"
            rules={[{ required: true, message: "请输入所属账号" }]}
          >
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
