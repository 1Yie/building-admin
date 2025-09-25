import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Table, Form, Button, Modal, Select, Input, Card, Spin } from "antd";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { toast } from "sonner";
import z from "zod/v4";
import type {
  AddRegulationParams,
  PropertyListItem,
  TriggerSelectListItem,
} from "@/request/control";
import {
  addRegulation,
  getControlPropertyList,
  getFieldSelectList,
  getManualOperateList,
  getMonitorPropertyList,
  getRegulationDetails,
  getRegulationList,
  getTriggerSelectList,
  updateRegulation,
} from "@/request/control";
import { Badge } from "@/shadcn/ui/badge";
import type { PaginationType } from "@/types";
import { PlusOutlined, ControlFilled } from "@ant-design/icons";

const roleFormSchema = z.object({
  rule_id: z.string().optional(),
  t_sensor_property_id: z.string().min(1, "不能为空"),
  c_sensor_property_id: z.string().min(1, "不能为空"),
  field: z.string().min(1, "不能为空，请先选择触发传感器资产编号"),
  control: z.string().min(1, "不能为空，请先选择被控传感器资产编号"),
  trigger: z.string().min(1, "不能为空"),
  is_used: z.string().min(1, "状态不能为空"),
  value: z.coerce
    .number({ message: "请输入数字" })
    .min(-999.99, { message: "最小值为 -999.99" })
    .max(999.99, { message: "最大值为 999.99" })
    .refine((val) => /^-?\d+(?:\.\d{1,2})?$/.test(val.toString()), {
      message: "最多只能有两位小数",
    }),
});

export default function RuleLinkageControl() {
  const columns = [
    {
      title: "规则编号",
      dataIndex: "rule_id",
      key: "rule_id",
      align: "center" as const,
    },
    {
      title: "触发传感器资产编号",
      dataIndex: "t_sensor_property_id",
      key: "t_sensor_property_id",
      align: "center" as const,
    },
    {
      title: "触发传感器大类",
      dataIndex: "t_kind",
      key: "t_kind",
      align: "center" as const,
    },
    {
      title: "触发传感器小类",
      dataIndex: "t_type",
      key: "t_type",
      align: "center" as const,
    },
    {
      title: "被控传感器资产编号",
      dataIndex: "c_sensor_property_id",
      key: "c_sensor_property_id",
      align: "center" as const,
    },
    {
      title: "被控传感器大类",
      dataIndex: "c_kind",
      key: "c_kind",
      align: "center" as const,
    },
    {
      title: "被控传感器小类",
      dataIndex: "c_type",
      key: "c_type",
      align: "center" as const,
    },
    {
      title: "触发条件",
      dataIndex: "trigger",
      key: "trigger",
      align: "center" as const,
    },
    {
      title: "控制操作",
      dataIndex: "control",
      key: "control",
      align: "center" as const,
    },
    {
      title: "规则使用状态",
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
      dataIndex: "action",
      key: "action",
      align: "center" as const,
      render: (_: any, record: any) => (
        <Button
          type="default"
          className="text-blue-500 cursor-pointer"
          onClick={() => handleOpenUpdateDialog(record)}
        >
          编辑
        </Button>
      ),
    },
  ];

  // 表格分页
  const [pageParams, setPageParams] = useState<PaginationType>({
    current: 1,
    pageSize: 5,
    showSizeChanger: false,
  });
  function handlePaginationChange(pagination: any) {
    setPageParams({
      current: pagination.current || 1,
      pageSize: pagination.pageSize || 5,
      showSizeChanger: false,
    });
  }

  // 请求表格数据
  const {
    data: ruleLinkageList,
    isPending: isLoading,
    refetch,
    isError,
    error,
  } = useQuery({
    queryKey: ["ruleLinkage", pageParams.current, pageParams.pageSize],
    queryFn: () =>
      getRegulationList({
        page: pageParams.current,
        page_size: pageParams.pageSize,
      }),
  });
  useEffect(() => {
    if (isError) {
      toast.error(error.message);
    }
  }, [isError, error]);
  // 设置分页
  useEffect(() => {
    if (
      ruleLinkageList?.page?.totalSize &&
      ruleLinkageList.page.totalSize > 0
    ) {
      setPageParams((prev) => ({
        ...prev,
        total: ruleLinkageList.page.totalSize,
      }));
    }
  }, [ruleLinkageList]);

  // 弹窗
  const [dialogOpen, setDialogOpen] = useState(false);
  const [addOrUpdate, setAddOrUpdate] = useState("add");
  const [isLoadingDialogData, setIsLoadingDialogData] = useState(false);
  const [abortController, setAbortController] =
    useState<AbortController | null>(null);

  // 表单
  const { control, handleSubmit, reset, getValues, setValue } = useForm<any>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: {
      rule_id: "",
      t_sensor_property_id: "",
      c_sensor_property_id: "",
      field: "",
      control: "",
      trigger: "",
      is_used: "",
      value: 0,
    },
  });

  const RoleIsUsedSelectOptions = [
    { value: "true", label: "在用" },
    { value: "false", label: "停用" },
  ];

  const [monitorPropertySelectOption, setMonitorPropertySelectOption] =
    useState<PropertyListItem[]>([]);
  const { mutateAsync: getMonitorPropertyListMutate } = useMutation({
    mutationFn: getMonitorPropertyList,
  });

  const [controlPropertySelectOption, setControlPropertySelectOption] =
    useState<PropertyListItem[]>([]);
  const { mutateAsync: getControlPropertyListMutate } = useMutation({
    mutationFn: getControlPropertyList,
  });

  const [fieldSelectOption, setFieldSelectOption] = useState<
    { type: string; name: string }[]
  >([]);
  const {
    mutate: getFieldSelectListMutate,
    mutateAsync: getFieldSelectListMutateAsync,
  } = useMutation({
    mutationFn: getFieldSelectList,
  });

  const [controlSelectOption, setControlSelectOption] = useState<
    { type: string; name: string }[]
  >([]);
  const {
    mutate: getControlSelectListMutate,
    mutateAsync: getControlSelectListMutateAsync,
  } = useMutation({
    mutationFn: getManualOperateList,
  });

  const [triggerSelectOption, setTriggerSelectOption] = useState<
    TriggerSelectListItem[]
  >([]);
  const { mutateAsync: getTriggerSelectListMutate } = useMutation({
    mutationFn: getTriggerSelectList,
  });

  async function getSelectOption() {
    try {
      const monitorData = await getMonitorPropertyListMutate();
      setMonitorPropertySelectOption(monitorData);

      const controlData = await getControlPropertyListMutate();
      setControlPropertySelectOption(controlData);

      const triggerData = await getTriggerSelectListMutate();
      setTriggerSelectOption(triggerData);
    } catch (error: any) {
      toast.error(error.message);
    }
  }

  function onDialogOpenChange(open: boolean) {
    setDialogOpen(open);
    if (!open) {
      // 取消弹窗时，中止正在进行的数据加载
      if (abortController) {
        abortController.abort();
        setAbortController(null);
      }
      setIsLoadingDialogData(false);
      reset({
        rule_id: "",
        t_sensor_property_id: "",
        c_sensor_property_id: "",
        field: "",
        control: "",
        trigger: "",
        is_used: "",
        value: 0,
      });
    }
  }

  function handleOpenAddDialog() {
    setAddOrUpdate("add");
    setDialogOpen(true);
    getSelectOption();
  }

  const { mutateAsync: getRegulationDetailsMutate } = useMutation({
    mutationFn: getRegulationDetails,
  });
  async function handleOpenUpdateDialog(record: any) {
    setAddOrUpdate("update");
    setDialogOpen(true);
    setIsLoadingDialogData(true);

    // 创建新的AbortController
    const controller = new AbortController();
    setAbortController(controller);

    try {
      await getSelectOption();

      // 检查是否已被取消
      if (controller.signal.aborted) return;

      const fieldRes = await getFieldSelectListMutateAsync(
        record.t_sensor_property_id
      );
      setFieldSelectOption(fieldRes);

      // 检查是否已被取消
      if (controller.signal.aborted) return;

      const controlRes = await getControlSelectListMutateAsync(
        record.c_sensor_property_id
      );
      setControlSelectOption(controlRes);

      // 检查是否已被取消
      if (controller.signal.aborted) return;

      const data = await getRegulationDetailsMutate(record.rule_id);
      reset(data);
    } catch (error: any) {
      // 如果是因为取消导致的错误，不显示错误信息
      if (error.name !== "AbortError") {
        toast.error(error.message);
      }
    } finally {
      // 只有在没有被取消的情况下才重置加载状态
      if (!controller.signal.aborted) {
        setIsLoadingDialogData(false);
        setAbortController(null);
      }
    }
  }

  function handleOK() {
    handleSubmit(onSubmit)();
  }

  const { mutate: addRegulationMutate, isPending: isAddingRegulation } =
    useMutation({
      mutationFn: addRegulation,
    });
  const { mutate: updateRegulationMutate, isPending: isUpdatingRegulation } =
    useMutation({
      mutationFn: updateRegulation,
    });
  function onSubmit(values: any) {
    if (addOrUpdate === "add") {
      addRegulationMutate(values, {
        onSuccess: () => {
          setDialogOpen(false);
          toast.success("新增成功");
          reset();
          refetch();
        },
        onError: (error) => {
          toast.error(error.message);
        },
      });
    } else {
      updateRegulationMutate(values, {
        onSuccess: () => {
          setDialogOpen(false);
          toast.success("更新成功");
          reset();
          refetch();
        },
        onError: (error) => {
          toast.error(error.message);
        },
      });
    }
  }

  function tSensorPropertyIdChange(value: string) {
    setValue("t_sensor_property_id", value);
    setValue("field", "");
    getFieldSelectListMutate(value, {
      onSuccess: (data) => {
        setFieldSelectOption(data);
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });
  }

  function cSensorPropertyIdChange(value: string) {
    setValue("c_sensor_property_id", value);
    setValue("control", "");
    getControlSelectListMutate(value, {
      onSuccess: (data) => {
        setControlSelectOption(data);
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });
  }

  return (
    <div className="">
      <Card
        title={
          <div className="flex justify-between items-center">
            <span>
              <ControlFilled className="mr-1" />
              规则联动控制
            </span>
          </div>
        }
        style={{ borderColor: "#f0f0f0", marginBottom: "20px" }}
        extra={
          <Button
            type="primary"
            className="cursor-pointer"
            onClick={handleOpenAddDialog}
            icon={<PlusOutlined />}
          >
            新增
          </Button>
        }
      >
        <Table
          dataSource={ruleLinkageList?.regulation || []}
          columns={columns}
          pagination={pageParams}
          onChange={handlePaginationChange}
          loading={isLoading}
          rowKey="rule_id"
        />
      </Card>
      <Modal
        open={dialogOpen}
        title={addOrUpdate === "add" ? "新增规则" : "更新规则"}
        onCancel={() => onDialogOpenChange(false)}
        footer={
          <div className="mt-10 flex justify-end gap-4">
            <Button
              type="default"
              className="cursor-pointer"
              onClick={() => onDialogOpenChange(false)}
              disabled={isAddingRegulation || isUpdatingRegulation}
            >
              取消
            </Button>
            <Button
              type="primary"
              htmlType="button"
              className="cursor-pointer"
              onClick={handleOK}
              loading={
                addOrUpdate === "add"
                  ? isAddingRegulation
                  : isUpdatingRegulation
              }
            >
              确定
            </Button>
          </div>
        }
        width={720}
      >
        <div className="mt-5">
          <Spin
            spinning={
              isAddingRegulation || isUpdatingRegulation || isLoadingDialogData
            }
          >
            <Form layout="horizontal" className="space-y-7">
              {addOrUpdate === "update" && (
                <div>
                  <Controller
                    name="rule_id"
                    control={control}
                    render={({ field, fieldState }) => (
                      <Form.Item
                        label="规则编号"
                        validateStatus={fieldState.error ? "error" : ""}
                        help={fieldState.error?.message}
                      >
                        <Input {...field} className="w-80 h-8" disabled />
                      </Form.Item>
                    )}
                  />
                  <Controller
                    name="t_sensor_property_id"
                    control={control}
                    render={({ field, fieldState }) => (
                      <Form.Item
                        label="触发传感器资产编号"
                        validateStatus={fieldState.error ? "error" : ""}
                        help={fieldState.error?.message}
                        required
                      >
                        <Select
                          {...field}
                          showSearch
                          allowClear
                          onChange={(value) => tSensorPropertyIdChange(value)}
                          placeholder="请选择触发传感器资产编号"
                          style={{ width: 320 }}
                          filterOption={(input, option) =>
                            (option?.children as unknown as string)
                              ?.toLowerCase()
                              ?.includes(input.toLowerCase())
                          }
                        >
                          {monitorPropertySelectOption.map((option) => (
                            <Select.Option
                              key={option.property_id}
                              value={option.property_id}
                            >
                              {option.name}
                            </Select.Option>
                          ))}
                        </Select>
                      </Form.Item>
                    )}
                  />

                  <Controller
                    name="c_sensor_property_id"
                    control={control}
                    render={({ field, fieldState }) => (
                      <Form.Item
                        label="被控传感器资产编号"
                        validateStatus={fieldState.error ? "error" : ""}
                        help={fieldState.error?.message}
                        required
                      >
                        <Select
                          {...field}
                          showSearch
                          allowClear
                          onChange={(value) => cSensorPropertyIdChange(value)}
                          placeholder="请选择被控传感器资产编号"
                          style={{ width: 320 }}
                          filterOption={(input, option) =>
                            (option?.children as unknown as string)
                              ?.toLowerCase()
                              ?.includes(input.toLowerCase())
                          }
                          optionFilterProp="children"
                        >
                          {controlPropertySelectOption.map((option) => (
                            <Select.Option
                              key={option.property_id}
                              value={option.property_id}
                            >
                              {option.name}
                            </Select.Option>
                          ))}
                        </Select>
                      </Form.Item>
                    )}
                  />

                  <Controller
                    name="field"
                    control={control}
                    render={({ field, fieldState }) => (
                      <Form.Item
                        label="触发项"
                        validateStatus={fieldState.error ? "error" : ""}
                        help={fieldState.error?.message}
                        required
                      >
                        <Select
                          {...field}
                          style={{ width: 120 }}
                          placeholder="请选择触发项"
                          disabled={!getValues("t_sensor_property_id")}
                        >
                          {fieldSelectOption.map((option) => (
                            <Select.Option
                              key={option.type}
                              value={option.type}
                            >
                              {option.name}
                            </Select.Option>
                          ))}
                        </Select>
                      </Form.Item>
                    )}
                  />

                  <Controller
                    name="control"
                    control={control}
                    render={({ field, fieldState }) => (
                      <Form.Item
                        label="控制操作"
                        validateStatus={fieldState.error ? "error" : ""}
                        help={fieldState.error?.message}
                        required
                      >
                        <Select
                          {...field}
                          style={{ width: 120 }}
                          placeholder="请选择控制操作"
                          disabled={!getValues("c_sensor_property_id")}
                        >
                          {controlSelectOption.map((option) => (
                            <Select.Option
                              key={option.type}
                              value={option.type}
                            >
                              {option.name}
                            </Select.Option>
                          ))}
                        </Select>
                      </Form.Item>
                    )}
                  />

                  <Controller
                    name="trigger"
                    control={control}
                    render={({ field, fieldState }) => (
                      <Form.Item
                        label="触发条件"
                        validateStatus={fieldState.error ? "error" : ""}
                        help={fieldState.error?.message}
                        required
                      >
                        <Select
                          {...field}
                          style={{ width: 120 }}
                          placeholder="请选择触发条件"
                        >
                          {triggerSelectOption.map((option) => (
                            <Select.Option
                              key={option.type}
                              value={option.type}
                            >
                              {option.name}
                            </Select.Option>
                          ))}
                        </Select>
                      </Form.Item>
                    )}
                  />

                  <Controller
                    name="value"
                    control={control}
                    render={({ field, fieldState }) => (
                      <Form.Item
                        label="触发阈值"
                        validateStatus={fieldState.error ? "error" : ""}
                        help={fieldState.error?.message}
                        required
                      >
                        <Input
                          {...field}
                          type="number"
                          placeholder="请输入触发阈值"
                          style={{ width: 120 }}
                          onChange={(e) =>
                            field.onChange(parseFloat(e.target.value) || 0)
                          }
                        />
                      </Form.Item>
                    )}
                  />

                  <Controller
                    name="is_used"
                    control={control}
                    render={({ field, fieldState }) => (
                      <Form.Item
                        label="规则使用状态"
                        validateStatus={fieldState.error ? "error" : ""}
                        help={fieldState.error?.message}
                        required
                      >
                        <Select
                          {...field}
                          style={{ width: 120 }}
                          placeholder="请选择规则使用状态"
                        >
                          {RoleIsUsedSelectOptions.map((option) => (
                            <Select.Option
                              key={option.value}
                              value={option.value}
                            >
                              {option.label}
                            </Select.Option>
                          ))}
                        </Select>
                      </Form.Item>
                    )}
                  />
                </div>
              )}

              {addOrUpdate === "add" && (
                <div>
                  <Controller
                    name="t_sensor_property_id"
                    control={control}
                    render={({ field, fieldState }) => (
                      <Form.Item
                        label="触发传感器资产编号"
                        validateStatus={fieldState.error ? "error" : ""}
                        help={fieldState.error?.message}
                        required
                      >
                        <Select
                          {...field}
                          showSearch
                          allowClear
                          onChange={(value) => tSensorPropertyIdChange(value)}
                          placeholder="请选择触发传感器资产编号"
                          style={{ width: 320 }}
                          filterOption={(input, option) =>
                            (option?.children as unknown as string)
                              ?.toLowerCase()
                              ?.includes(input.toLowerCase())
                          }
                        >
                          {monitorPropertySelectOption.map((option) => (
                            <Select.Option
                              key={option.property_id}
                              value={option.property_id}
                            >
                              {option.name}
                            </Select.Option>
                          ))}
                        </Select>
                      </Form.Item>
                    )}
                  />

                  <Controller
                    name="c_sensor_property_id"
                    control={control}
                    render={({ field, fieldState }) => (
                      <Form.Item
                        label="被控传感器资产编号"
                        validateStatus={fieldState.error ? "error" : ""}
                        help={fieldState.error?.message}
                        required
                      >
                        <Select
                          {...field}
                          showSearch
                          allowClear
                          onChange={(value) => cSensorPropertyIdChange(value)}
                          placeholder="请选择被控传感器资产编号"
                          style={{ width: 320 }}
                          filterOption={(input, option) =>
                            (option?.children as unknown as string)
                              ?.toLowerCase()
                              ?.includes(input.toLowerCase())
                          }
                          optionFilterProp="children"
                        >
                          {controlPropertySelectOption.map((option) => (
                            <Select.Option
                              key={option.property_id}
                              value={option.property_id}
                            >
                              {option.name}
                            </Select.Option>
                          ))}
                        </Select>
                      </Form.Item>
                    )}
                  />

                  <Controller
                    name="field"
                    control={control}
                    render={({ field, fieldState }) => (
                      <Form.Item
                        label="触发项"
                        validateStatus={fieldState.error ? "error" : ""}
                        help={fieldState.error?.message}
                        required
                      >
                        <Select
                          {...field}
                          style={{ width: 120 }}
                          placeholder="请选择触发项"
                          disabled={!getValues("t_sensor_property_id")}
                        >
                          {fieldSelectOption.map((option) => (
                            <Select.Option
                              key={option.type}
                              value={option.type}
                            >
                              {option.name}
                            </Select.Option>
                          ))}
                        </Select>
                      </Form.Item>
                    )}
                  />

                  <Controller
                    name="control"
                    control={control}
                    render={({ field, fieldState }) => (
                      <Form.Item
                        label="控制操作"
                        validateStatus={fieldState.error ? "error" : ""}
                        help={fieldState.error?.message}
                        required
                      >
                        <Select
                          {...field}
                          style={{ width: 120 }}
                          placeholder="请选择控制操作"
                          disabled={!getValues("c_sensor_property_id")}
                        >
                          {controlSelectOption.map((option) => (
                            <Select.Option
                              key={option.type}
                              value={option.type}
                            >
                              {option.name}
                            </Select.Option>
                          ))}
                        </Select>
                      </Form.Item>
                    )}
                  />

                  <Controller
                    name="trigger"
                    control={control}
                    render={({ field, fieldState }) => (
                      <Form.Item
                        label="触发条件"
                        validateStatus={fieldState.error ? "error" : ""}
                        help={fieldState.error?.message}
                        required
                      >
                        <Select
                          {...field}
                          style={{ width: 120 }}
                          placeholder="请选择触发条件"
                        >
                          {triggerSelectOption.map((option) => (
                            <Select.Option
                              key={option.type}
                              value={option.type}
                            >
                              {option.name}
                            </Select.Option>
                          ))}
                        </Select>
                      </Form.Item>
                    )}
                  />

                  <Controller
                    name="value"
                    control={control}
                    render={({ field, fieldState }) => (
                      <Form.Item
                        label="触发阈值"
                        validateStatus={fieldState.error ? "error" : ""}
                        help={fieldState.error?.message}
                        required
                      >
                        <Input
                          {...field}
                          type="number"
                          placeholder="请输入触发阈值"
                          style={{ width: 120 }}
                          onChange={(e) =>
                            field.onChange(parseFloat(e.target.value) || 0)
                          }
                        />
                      </Form.Item>
                    )}
                  />

                  <Controller
                    name="is_used"
                    control={control}
                    render={({ field, fieldState }) => (
                      <Form.Item
                        label="规则使用状态"
                        validateStatus={fieldState.error ? "error" : ""}
                        help={fieldState.error?.message}
                        required
                      >
                        <Select
                          {...field}
                          style={{ width: 120 }}
                          placeholder="请选择规则使用状态"
                        >
                          {RoleIsUsedSelectOptions.map((option) => (
                            <Select.Option
                              key={option.value}
                              value={option.value}
                            >
                              {option.label}
                            </Select.Option>
                          ))}
                        </Select>
                      </Form.Item>
                    )}
                  />
                </div>
              )}
            </Form>
          </Spin>
        </div>
      </Modal>
    </div>
  );
}
