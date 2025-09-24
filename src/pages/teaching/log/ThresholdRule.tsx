import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Controller, useForm, type Resolver } from "react-hook-form";
import { toast } from "sonner";
import z from "zod/v4";
import { getFieldSelectList } from "@/request/control";
import {
  addThresholdRule,
  getThresholdRuleDetails,
  getThresholdRuleList,
  updateThresholdRule,
} from "@/request/log";
import { getBindPropertyList } from "@/request/property";
import { Badge } from "@/shadcn/ui/badge";
import { Table, Button, Modal, Input, Select, Form, Card } from "antd";
import { ControlFilled } from "@ant-design/icons";

import type { PaginationType, ThresholdRule } from "@/types";

export default function ThresholdRule() {
  const columns = [
    {
      title: "规则编号",
      dataIndex: "rule_id",
      key: "rule_id",
      align: "center" as const,
    },
    {
      title: "资产ID",
      dataIndex: "property_id",
      key: "property_id",
      align: "center" as const,
    },
    {
      title: "传感器大类",
      dataIndex: "sensor_kind",
      key: "sensor_kind",
      align: "center" as const,
    },
    {
      title: "传感器小类",
      dataIndex: "sensor_type",
      key: "sensor_type",
      align: "center" as const,
    },
    {
      title: "最大值",
      dataIndex: "max",
      key: "max",
      align: "center" as const,
    },
    {
      title: "最小值",
      dataIndex: "min",
      key: "min",
      align: "center" as const,
    },
    {
      title: "使用状态",
      dataIndex: "is_used",
      key: "is_used",
      align: "center" as const,
      render: (is_used: boolean) => {
        return is_used ? (
          <Badge className="bg-green-500">在用</Badge>
        ) : (
          <Badge className="bg-red-500">停用</Badge>
        );
      },
    },
    {
      title: "操作",
      dataIndex: "operation",
      key: "operation",
      align: "center" as const,
      render: (_: any, record: any) => (
        <Button
          variant="link"
          type="default"
          className="text-blue-500 cursor-pointer"
          onClick={() => handleOpenEditDialog(record)}
        >
          编辑
        </Button>
      ),
    },
  ];

  // 分页
  const [pageParams, setPageParams] = useState<PaginationType>({
    current: 1,
    pageSize: 10,
  });
  function onPageChange(current: number, pageSize: number) {
    setPageParams({
      current,
      pageSize,
    });
  }

  // 表格
  const {
    data: thresholdRuleList,
    isPending,
    refetch,
  } = useQuery({
    queryKey: ["getThresholdRuleList", pageParams],
    queryFn: () =>
      getThresholdRuleList({
        page: pageParams.current,
        page_size: pageParams.pageSize,
      }),
  });

  useEffect(() => {
    if (
      thresholdRuleList?.page?.totalSize &&
      thresholdRuleList?.page?.totalSize > 0
    ) {
      setPageParams((prev) => ({
        ...prev,
        total: thresholdRuleList.page.totalSize,
      }));
    }
  }, [thresholdRuleList]);

  // 打开Dialog
  const [addOrUpdate, setAddOrUpdate] = useState("add");
  const [dialogOpen, setDialogOpen] = useState(false);

  function onDialogOpenChange(open: boolean) {
    setDialogOpen(open);
    if (!open) {
      thresholdRuleForm.reset();
    }
  }

  function handleOpenAddDialog() {
    setAddOrUpdate("add");
    thresholdRuleForm.reset({
      rule_id: "",
      sensor_property_id: "",
      field: "",
      max: undefined,
      min: undefined,
      is_used: "",
    });
    setDialogOpen(true);
  }

  const { mutate: getThresholdRuleDetailsMutate } = useMutation<
    ThresholdRule,
    any,
    string
  >({
    mutationFn: getThresholdRuleDetails,
  });
  function handleOpenEditDialog(record: ThresholdRule) {
    setAddOrUpdate("edit");
    thresholdRuleForm.reset();
    setDialogOpen(true);
    getThresholdRuleDetailsMutate(record.rule_id, {
      onSuccess: (data) => {
        thresholdRuleForm.reset(data);
      },
    });
  }

  const thresholdRuleFormSchema = z.object({
    rule_id: z.string().optional(),
    sensor_property_id: z.string().min(1, "不能为空"),
    field: z.string().min(1, "不能为空"),
    max: z.coerce.number({ message: "请输入数字" }),
    min: z.coerce.number({ message: "请输入数字" }),
    is_used: z.string().min(1, "状态不能为空"),
  });
  const thresholdRuleForm = useForm<z.infer<typeof thresholdRuleFormSchema>>({
    resolver: zodResolver(thresholdRuleFormSchema) as Resolver<
      z.infer<typeof thresholdRuleFormSchema>
    >,
    defaultValues: {
      rule_id: "",
      sensor_property_id: "",
      field: "",
      max: undefined,
      min: undefined,
      is_used: "",
    },
  });

  const { data: sensorPropertySelectOption } = useQuery({
    queryKey: ["getSensorPropertySelectOption"],
    queryFn: () => getBindPropertyList({ property_type: "CGQ" }),
  });

  console.log("sensorPropertySelectOption", sensorPropertySelectOption);
  const sensorPropertyId = thresholdRuleForm.watch("sensor_property_id");
  const { data: fieldSelectOption } = useQuery({
    queryKey: ["getFieldSelectList", sensorPropertyId],
    queryFn: () => getFieldSelectList(sensorPropertyId),
    enabled: !!sensorPropertyId,
  });

  const isUsedSelectOption = [
    { value: "true", label: "在用" },
    { value: "false", label: "停用" },
  ];

  function handleOK() {
    thresholdRuleForm.handleSubmit(onSubmit)();
  }

  const { mutate: addThresholdRuleMutate } = useMutation({
    mutationFn: addThresholdRule,
  });
  const { mutate: updateThresholdRuleMutate } = useMutation({
    mutationFn: updateThresholdRule,
  });
  function onSubmit(data: z.infer<typeof thresholdRuleFormSchema>) {
    if (addOrUpdate === "add") {
      addThresholdRuleMutate(data, {
        onSuccess: () => {
          toast.success("新增成功");
          thresholdRuleForm.reset();
          setDialogOpen(false);
          refetch();
        },
        onError: (error: any) => {
          toast.error(error.message);
        },
      });
    } else {
      updateThresholdRuleMutate(
        { ...data, rule_id: data.rule_id! },
        {
          onSuccess: () => {
            toast.success("编辑成功");
            thresholdRuleForm.reset();
            setDialogOpen(false);
            refetch();
          },
          onError: (error: any) => {
            toast.error(error.message);
          },
        }
      );
    }
  }

  return (
    <div className="">
      <Card
        title={
          <div className="flex justify-between items-center">
            <span>
              <ControlFilled className="mr-1" />
              阈值规则管理
            </span>
          </div>
        }
        extra={
          <Button type="primary" onClick={handleOpenAddDialog}>
            新增
          </Button>
        }
        style={{
          borderColor: "#f0f0f0",
          marginBottom: "20px",
        }}
      >
        <Table
          columns={columns}
          pagination={pageParams}
          onChange={(pagination) =>
            onPageChange(pagination.current || 1, pagination.pageSize || 10)
          }
          dataSource={thresholdRuleList?.thresholed}
          loading={isPending}
          rowKey="rule_id"
        />
      </Card>

      <Modal
        open={dialogOpen}
        title={addOrUpdate === "add" ? "新增规则" : "更新规则"}
        onCancel={() => {
          thresholdRuleForm.reset({
            rule_id: "",
            sensor_property_id: "",
            field: "",
            max: undefined,
            min: undefined,
            is_used: "",
          });
          setDialogOpen(false);
        }}
        footer={
          <div className="flex justify-end gap-4">
            <Button
              type="default"
              onClick={() => {
                thresholdRuleForm.reset();
                setDialogOpen(false);
              }}
            >
              取消
            </Button>
            <Button type="primary" onClick={handleOK}>
              确定
            </Button>
          </div>
        }
        width={720}
        centered
        destroyOnClose
        maskClosable={false}
      >
        <div className="mt-5">
          <Form
            layout="horizontal"
            className="space-y-7"
            style={{ marginTop: "20px" }}
          >
            {addOrUpdate === "edit" && (
              <Controller
                control={thresholdRuleForm.control}
                name="rule_id"
                render={({ field }) => (
                  <Form.Item label="规则ID">
                    <Input style={{ width: 320 }} {...field} disabled />
                  </Form.Item>
                )}
              />
            )}
            <Controller
              control={thresholdRuleForm.control}
              name="sensor_property_id"
              render={({ field }) => (
                <Form.Item label="传感器ID">
                  <Select
                    style={{ width: "100%" }}
                    onChange={field.onChange}
                    value={field.value || undefined}
                    placeholder="请选择传感器ID"
                    showSearch
                    optionFilterProp="children" // 按显示文字搜索
                    filterOption={(input, option) =>
                      (option?.children as unknown as string)
                        .toLowerCase()
                        .includes(input.toLowerCase())
                    }
                  >
                    {sensorPropertySelectOption?.map((item, index) => (
                      <Select.Option
                        key={`${item.property_id}-${index}`}
                        value={item.property_id}
                      >
                        {item.name}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              )}
            />

            <Controller
              control={thresholdRuleForm.control}
              name="field"
              render={({ field }) => (
                <Form.Item label="传感器字段">
                  <Select
                    {...field}
                    value={field.value || undefined}
                    style={{ width: 320 }}
                    onChange={field.onChange}
                    placeholder="请选择传感器字段"
                  >
                    {fieldSelectOption?.map((item) => (
                      <Select.Option key={item.type} value={item.name}>
                        {item.name}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              )}
            />

            <Controller
              control={thresholdRuleForm.control}
              name="is_used"
              render={({ field }) => (
                <Form.Item label="使用状态">
                  <Select
                    {...field}
                    value={field.value || undefined}
                    onChange={field.onChange}
                    placeholder="使用状态"
                    style={{ width: 200 }}
                  >
                    {isUsedSelectOption.map((item) => (
                      <Select.Option key={item.value} value={item.value}>
                        {item.label}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              )}
            />

            <Controller
              control={thresholdRuleForm.control}
              name="max"
              render={({ field }) => (
                <Form.Item label="触发上线">
                  <Input
                    style={{ width: 320 }}
                    {...field}
                    placeholder="请输入触发上线"
                  />
                </Form.Item>
              )}
            />

            <Controller
              control={thresholdRuleForm.control}
              name="min"
              render={({ field }) => (
                <Form.Item label="触发下线">
                  <Input
                    style={{ width: 320 }}
                    {...field}
                    placeholder="请输入触发下线"
                  />
                </Form.Item>
              )}
            />
          </Form>
        </div>
      </Modal>
    </div>
  );
}
