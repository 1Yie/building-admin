import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Table } from "antd";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod/v4";
import type { BindPropertyListItem } from "@/request/property";
import {
  addProperty,
  exportPropertyList,
  getBindPropertyList,
  getPropertyDetails,
  getPropertyList,
  getSensorKindList,
  getSensorTypeList,
  updateProperty,
} from "@/request/property";
import { Badge } from "@/shadcn/ui/badge";
import { Button, Modal, Form, Input, Select, Card } from "antd";
import type { PaginationType, Property } from "@/types";
import {
  DownloadOutlined,
  PlusOutlined,
  ProfileFilled,
} from "@ant-design/icons";

import { useLocation } from "react-router";

const searchFormSchema = z.object({
  property_id: z.string().optional(), // 资产编号
  is_used: z.string().optional(), // 资产使用状态
  property_type: z.string().optional(), // 资产类型

  building_name: z.string().optional(), // 楼宇名称
  building_number: z.string().optional(), // 楼栋号

  space_number: z.string().optional(), // 房间号
  space_name: z.string().optional(), // 房间名
  space_type: z.string().optional(), // 房间用途
  floor: z.string().optional(), // 楼层

  terminal_number: z.string().optional(), // 终端编号
  terminal_type: z.string().optional(), // 终端型号

  sensor_kind: z.string().optional(), // 传感器大类
  sensor_type: z.string().optional(), // 传感器小类
});

const buildingFormSchema = z.object({
  property_id: z.string(), // 资产编号
  name: z.string().min(1, "楼栋号不能为空"), // 楼栋号
  number: z.string().optional(), // 楼宇编号
  address: z.string().optional(), // 楼宇地址
  is_used: z.string().min(1, "状态不能为空"), // 楼宇状态
  description: z.string().optional(), // 楼宇描述
});

const spaceFormSchema = z.object({
  property_id: z.string(), // 资产编号
  property_bind_id: z.string().min(1, "绑定楼宇不能为空"), // 绑定楼宇id
  name: z.string().min(1, "房间名不能为空"), // 房间名
  number: z.string().min(1, "房间号不能为空"), // 房间号
  floor: z
    .string()
    .trim()
    .optional()
    .refine((val) => val === undefined || val === "" || /^\d+$/.test(val), {
      message: "请输入整数",
    }),
  type: z.string().optional(), // 房间用途
  ampere: z.string().optional(), // TODO
  is_used: z.string().min(1, "状态不能为空"), // 状态
  description: z.string().optional(), // 描述
});

const terminalFormSchema = z.object({
  property_id: z.string(), // 资产编号
  property_bind_id: z.string().min(1, "绑定空间不能为空"), // 绑定空间id
  number: z.string().min(1, "网关（智能箱）编号不能为空"), // 编号
  type: z.string().min(1, "网关（智能箱）型号不能为空"), // 型号
  is_used: z.string().min(1, "网关（智能箱）状态不能为空"), // 状态
  description: z.string().optional(), // 描述
});

const sensorFormSchema = z.object({
  property_id: z.string(), // 资产编号
  property_bind_id: z.string().min(1, "绑定网关（智能箱）不能为空"), // 绑定终端id
  kind: z.string().min(1, "传感器大类不能为空"), // 大类
  type: z.string().min(1, "传感器小类不能为空"), // 小类
  is_used: z.string().min(1, "传感器状态不能为空"), // 状态
  description: z.string().optional(), // 描述
});

const propertyTypeSelectOptions = [
  { value: "building", label: "楼宇" },
  { value: "space", label: "空间" },
  { value: "terminal", label: "网关（智能箱）" },
  { value: "sensor", label: "传感器" },
];

const propertyStatusSelectOptions = [
  { value: "all", label: "全部" },
  { value: "True", label: "在用" },
  { value: "False", label: "停用" },
];

const buildingIsUsedSelectOptions = [
  { value: "true", label: "在用" },
  { value: "false", label: "停用" },
];

export default function PropertyMain() {
  const location = useLocation();

  // 路径跳转打开弹窗
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("add") === "true") {
      handleOpenAddDialog(); // 打开弹窗，addOrEdit = "add"
    }
  }, [location.search]);
  // 楼宇资产表格
  // 表格列
  const [propertyTitle, setPropertyTitle] = useState("资产名称");
  const columns = useMemo(() => {
    return [
      {
        title: "资产编号",
        dataIndex: "property_id",
        key: "property_id",
        align: "center" as const,
      },
      {
        title: () => propertyTitle,
        dataIndex: "property_name",
        key: "property_name",
        align: "center" as const,
      },
      {
        title: "资产类型",
        dataIndex: "property_type",
        key: "property_type",
        align: "center" as const,
      },
      {
        title: "资产状态",
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
        title: "活跃情况",
        dataIndex: "is_liveness",
        key: "is_liveness",
        align: "center" as const,
        render: (is_liveness: boolean) => {
          return is_liveness ? (
            <Badge className="bg-green-500">在线</Badge>
          ) : (
            <Badge className="bg-red-500">离线</Badge>
          );
        },
      },
      {
        title: "楼宇信息",
        dataIndex: "building",
        key: "building",
        align: "center" as const,
      },
      {
        title: "空间信息",
        dataIndex: "space",
        key: "space",
        align: "center" as const,
      },
      {
        title: "网关（智能箱）信息",
        dataIndex: "terminal",
        key: "terminal",
        align: "center" as const,
      },
      {
        title: "传感器信息",
        dataIndex: "sensor",
        key: "sensor",
        align: "center" as const,
      },
      {
        title: "操作",
        dataIndex: "operation",
        key: "operation",
        align: "center" as const,
        render: (_: any, record: any) => (
          <Button
            variant="link"
            className="text-blue-500 cursor-pointer"
            onClick={() => handleOpenEditDialog(record)}
          >
            编辑
          </Button>
        ),
      },
    ];
  }, [propertyTitle]);

  // 表格分页
  const [pageParams, setPageParams] = useState<PaginationType>({
    current: 1,
    pageSize: 10,
    showSizeChanger: false,
  });
  const [searchValues, setSearchValues] = useState<
    z.infer<typeof searchFormSchema>
  >({});
  function handlePaginationChange(pagination: PaginationType) {
    setPageParams(pagination);
  }

  // 请求表格数据
  const {
    data: propertyData,
    isPending: isLoading,
    refetch,
  } = useQuery({
    queryKey: [
      "propertyList",
      pageParams.current,
      pageParams.pageSize,
      searchValues,
    ],
    queryFn: () =>
      getPropertyList({
        page: pageParams.current,
        page_size: pageParams.pageSize,
        ...searchValues,
      }),
  });
  // 设置分页
  useEffect(() => {
    if (propertyData?.page?.totalSize && propertyData.page.totalSize > 0) {
      setPageParams((prev) => ({
        ...prev,
        total: propertyData.page.totalSize,
      }));
    }
  }, [propertyData]);

  /** 搜索表单 */
  const searchForm = useForm<z.infer<typeof searchFormSchema>>({
    resolver: zodResolver(searchFormSchema),
    defaultValues: {
      property_id: "",
      is_used: "",
      property_type: "",
      building_number: "",
      building_name: "",
      space_number: "",
      space_name: "",
      space_type: "",
      terminal_number: "",
      terminal_type: "",
      sensor_kind: "",
      sensor_type: "",
    },
  });
  // 搜索表单资产类型选择
  const propertyType = searchForm.watch("property_type");

  // 传感器大类、小类选项
  const { data: sensorKindSelectOption } = useQuery({
    queryKey: ["sensorKindList"],
    queryFn: getSensorKindList,
  });
  const { data: sensorTypeSelectOption } = useQuery({
    queryKey: ["sensorTypeList"],
    queryFn: getSensorTypeList,
  });

  // 搜索表单提交
  function onSearchFormSubmit(values: z.infer<typeof searchFormSchema>) {
    setSearchValues(values);
    setPageParams({
      ...pageParams,
      current: 1,
    });
    if (values.property_type === "building") {
      setPropertyTitle("楼宇名称（楼栋号）");
    } else if (values.property_type === "space") {
      setPropertyTitle("空间名称（房间号）");
    } else if (values.property_type === "terminal") {
      setPropertyTitle("网关（智能箱）编号（型号）");
    } else if (values.property_type === "sensor") {
      setPropertyTitle("传感器大类（小类）");
    } else {
      setPropertyTitle("资产名称");
    }
  }

  // 定义表单
  // 楼宇表单
  const buildingForm = useForm<z.infer<typeof buildingFormSchema>>({
    resolver: zodResolver(buildingFormSchema),
    defaultValues: {
      property_id: "LY9999",
      name: "",
      number: "",
      address: "",
      is_used: "",
      description: "",
    },
  });
  // 空间表单
  const spaceForm = useForm<z.infer<typeof spaceFormSchema>>({
    resolver: zodResolver(spaceFormSchema),
    defaultValues: {
      property_id: "KJ9999",
      property_bind_id: "",
      name: "",
      number: "",
      floor: undefined,
      type: "",
      ampere: "",
      is_used: "",
      description: "",
    },
  });
  // 终端表单
  const terminalForm = useForm<z.infer<typeof terminalFormSchema>>({
    resolver: zodResolver(terminalFormSchema),
    defaultValues: {
      property_id: "ZD9999",
      property_bind_id: "",
      number: "",
      type: "",
      is_used: "",
      description: "",
    },
  });
  // 传感器表单
  const sensorForm = useForm<z.infer<typeof sensorFormSchema>>({
    resolver: zodResolver(sensorFormSchema),
    defaultValues: {
      property_id: "CGQ9999",
      property_bind_id: "",
      kind: "",
      type: "",
      is_used: "",
      description: "",
    },
  });

  // 弹窗
  const [propertyDialogOpen, setPropertyDialogOpen] = useState(false);
  const [addOrEdit, setAddOrEdit] = useState<"add" | "edit">("add");

  // 绑定资产
  const [addPropertySelectValue, setAddPropertySelectValue] = useState("");
  const [bindPropertySelectOption, setBindPropertySelectOption] = useState<
    BindPropertyListItem[]
  >([]);
  const { mutate: bindPropertyMutate } = useMutation({
    mutationFn: getBindPropertyList,
  });
  function onAddPropertySelectValueChange(value: string) {
    setAddPropertySelectValue(value);
    if (value === "space") {
      bindPropertyMutate(
        { property_type: "LY" },
        {
          onSuccess: (data) => {
            setBindPropertySelectOption(data);
          },
          onError: (error) => {
            toast.error(error.message);
          },
        }
      );
    }
    if (value === "terminal") {
      bindPropertyMutate(
        { property_type: "KJ" },
        {
          onSuccess: (data) => {
            setBindPropertySelectOption(data);
          },
          onError: (error) => {
            toast.error(error.message);
          },
        }
      );
    }
    if (value === "sensor") {
      bindPropertyMutate(
        { property_type: "ZD" },
        {
          onSuccess: (data) => {
            setBindPropertySelectOption(data);
          },
          onError: (error) => {
            toast.error(error.message);
          },
        }
      );
    }
  }

  // 新增资产弹窗
  function handleOpenAddDialog() {
    setAddOrEdit("add");
    setPropertyDialogOpen(true);
  }

  // 编辑资产弹窗
  const { mutate: getPropertyDetailsMutate } = useMutation<
    Property,
    any,
    string
  >({
    mutationFn: getPropertyDetails,
  });
  function handleOpenEditDialog(record: any) {
    setAddOrEdit("edit");
    setPropertyDialogOpen(true);
    if (record.property_id.startsWith("LY")) {
      setAddPropertySelectValue("building");
      getPropertyDetailsMutate(record.property_id, {
        onSuccess: (data) => {
          buildingForm.reset(data);
        },
      });
    }
    if (record.property_id.startsWith("KJ")) {
      setAddPropertySelectValue("space");
      onAddPropertySelectValueChange("space");
      getPropertyDetailsMutate(record.property_id, {
        onSuccess: (data) => {
          spaceForm.reset(data);
        },
      });
    }
    if (record.property_id.startsWith("ZD")) {
      setAddPropertySelectValue("terminal");
      onAddPropertySelectValueChange("terminal");
      getPropertyDetailsMutate(record.property_id, {
        onSuccess: (data) => {
          terminalForm.reset(data);
        },
      });
    }
    if (record.property_id.startsWith("CGQ")) {
      setAddPropertySelectValue("sensor");
      onAddPropertySelectValueChange("sensor");
      getPropertyDetailsMutate(record.property_id, {
        onSuccess: (data) => {
          sensorForm.reset(data);
        },
      });
    }
  }

  // 新增资产请求
  const { mutate: addPropertyMutate } = useMutation({
    mutationFn: addProperty,
  });
  // 编辑资产请求
  const { mutate: updatePropertyMutate } = useMutation({
    mutationFn: updateProperty,
  });
  // 新增资产表单提交
  async function onPropertyFormSubmit(values: any) {
    if (addPropertySelectValue === "building") {
      const isValid = await buildingForm.trigger(); // 触发全部字段验证
      if (!isValid) {
        return;
      }
      // 转换 floor 为整数，如果为空或非数字则设为 undefined
      const transformedValues = {
        ...values,
        floor:
          values.floor && /^\d+$/.test(values.floor)
            ? parseInt(values.floor, 10)
            : undefined,
      };

      if (addOrEdit === "add") {
        addPropertyMutate(transformedValues, {
          onSuccess: () => {
            setPropertyDialogOpen(false);
            toast.success("新增楼宇成功");
            buildingForm.reset();
            setAddPropertySelectValue("");
            refetch();
          },
          onError: (error) => {
            toast.error(error.message);
          },
        });
      } else {
        updatePropertyMutate(transformedValues, {
          onSuccess: () => {
            setPropertyDialogOpen(false);
            toast.success("编辑楼宇成功");
            buildingForm.reset();
            setAddPropertySelectValue("");
            refetch();
          },
          onError: (error) => {
            toast.error(error.message);
          },
        });
      }
    }
    if (addPropertySelectValue === "space") {
      const isValid = await spaceForm.trigger(); // 触发全部字段验证
      if (!isValid) {
        return;
      }
      if (addOrEdit === "add") {
        addPropertyMutate(values, {
          onSuccess: () => {
            setPropertyDialogOpen(false);
            toast.success("新增空间成功");
            spaceForm.reset();
            setAddPropertySelectValue("");
            refetch();
          },
          onError: (error) => {
            toast.error(error.message);
          },
        });
      } else {
        updatePropertyMutate(values, {
          onSuccess: () => {
            setPropertyDialogOpen(false);
            toast.success("编辑空间成功");
            spaceForm.reset();
            setAddPropertySelectValue("");
            refetch();
          },
          onError: (error) => {
            toast.error(error.message);
          },
        });
      }
    }
    if (addPropertySelectValue === "terminal") {
      const isValid = await terminalForm.trigger(); // 触发全部字段验证
      if (!isValid) {
        return;
      }
      if (addOrEdit === "add") {
        addPropertyMutate(values, {
          onSuccess: () => {
            setPropertyDialogOpen(false);
            toast.success("新增终端成功");
            terminalForm.reset();
            setAddPropertySelectValue("");
            refetch();
          },
          onError: (error) => {
            toast.error(error.message);
          },
        });
      } else {
        updatePropertyMutate(values, {
          onSuccess: () => {
            setPropertyDialogOpen(false);
            toast.success("编辑终端成功");
            terminalForm.reset();
            setAddPropertySelectValue("");
            refetch();
          },
          onError: (error) => {
            toast.error(error.message);
          },
        });
      }
    }
    if (addPropertySelectValue === "sensor") {
      const isValid = await sensorForm.trigger(); // 触发全部字段验证
      if (!isValid) {
        return;
      }
      if (addOrEdit === "add") {
        addPropertyMutate(values, {
          onSuccess: () => {
            setPropertyDialogOpen(false);
            toast.success("新增传感器成功");
            sensorForm.reset();
            setAddPropertySelectValue("");
            refetch();
          },
          onError: (error: any) => {
            const msg =
              error.response?.data?.message || error.message || "请求失败";
            toast.error(msg);
          },
        });
      } else {
        updatePropertyMutate(values, {
          onSuccess: () => {
            setPropertyDialogOpen(false);
            toast.success("编辑传感器成功");
            sensorForm.reset();
            setAddPropertySelectValue("");
            refetch();
          },
          onError: (error) => {
            toast.error(error.message);
          },
        });
      }
    }
  }

  // 确定新增资产
  function handleOK() {
    if (!addPropertySelectValue) {
      toast.info("请选择资产类型");
      return;
    }

    switch (addPropertySelectValue) {
      case "building":
        return buildingForm.handleSubmit(onPropertyFormSubmit)();
      case "space":
        return spaceForm.handleSubmit(onPropertyFormSubmit)();
      case "terminal":
        return terminalForm.handleSubmit(onPropertyFormSubmit)();
      case "sensor":
        return sensorForm.handleSubmit(onPropertyFormSubmit)();
      default:
        toast.error("未知的资产类型");
    }
  }

  // 关闭弹窗
  function onDialogOpenChange(open: boolean) {
    setPropertyDialogOpen(open);
    if (!open) {
      setAddPropertySelectValue("");
      buildingForm.reset({
        property_id: "LY9999",
        name: "",
        number: "",
        address: "",
        is_used: "",
        description: "",
      });
      spaceForm.reset({
        property_id: "KJ9999",
        property_bind_id: "",
        name: "",
        number: "",
        floor: "",
        type: "",
        ampere: "",
        is_used: "",
        description: "",
      });
      terminalForm.reset({
        property_id: "ZD9999",
        property_bind_id: "",
        number: "",
        type: "",
        is_used: "",
        description: "",
      });
      sensorForm.reset({
        property_id: "CGQ9999",
        property_bind_id: "",
        kind: "",
        type: "",
        is_used: "",
        description: "",
      });
    }
  }

  const { mutate: getBindPropertyListMutate } = useMutation({
    mutationFn: exportPropertyList,
  });
  function exportProperty() {
    getBindPropertyListMutate(
      {
        page: 1,
        page_size: 10,
        is_excel: true,
        ...searchValues,
      },
      {
        onSuccess: (res) => {
          const blob = new Blob([res.data], {
            type: "application/vnd.ms-excel",
          });
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = "资产列表.xlsx";
          link.click();
          window.URL.revokeObjectURL(url);
        },
        onError: (error) => {
          toast.error(error.message);
        },
      }
    );
  }

  return (
    <div className="p-5">
      <Card
        className="flex"
        style={{ borderColor: "#f0f0f0", marginBottom: "20px" }}
      >
        <Form
          layout="inline"
          onFinish={searchForm.handleSubmit(onSearchFormSubmit)}
          className="flex gap-2 flex-wrap"
        >
          <Controller
            control={searchForm.control}
            name="property_id"
            render={({ field }) => (
              <Form.Item
                label="资产编号"
                validateStatus={
                  searchForm.formState.errors["property_id"]?.message
                    ? "error"
                    : ""
                }
                help={searchForm.formState.errors["property_id"]?.message}
              >
                <Input
                  placeholder="请输入资产编号"
                  {...field}
                  className="bg-white"
                />
              </Form.Item>
            )}
          />

          <Controller
            control={searchForm.control}
            name="is_used"
            render={({ field }) => (
              <Form.Item
                label="资产使用状态"
                validateStatus={
                  searchForm.formState.errors["is_used"]?.message ? "error" : ""
                }
                help={searchForm.formState.errors["is_used"]?.message}
              >
                <Select
                  onChange={field.onChange}
                  value={field.value || undefined}
                  options={propertyStatusSelectOptions}
                  style={{ width: 120 }}
                  placeholder="请选择资产使用状态"
                ></Select>
              </Form.Item>
            )}
          />

          <Controller
            control={searchForm.control}
            name="property_type"
            render={({ field }) => (
              <Form.Item
                label="资产类型"
                validateStatus={
                  searchForm.formState.errors["property_type"]?.message
                    ? "error"
                    : ""
                }
                help={searchForm.formState.errors["property_type"]?.message}
              >
                <Select
                  onChange={field.onChange}
                  options={propertyTypeSelectOptions}
                  value={field.value || undefined}
                  placeholder="请选择资产类型"
                  style={{ width: 120 }}
                ></Select>
              </Form.Item>
            )}
          />

          <div className="w-full flex gap-2 flex-wrap">
            {propertyType === "building" && (
              <>
                <Controller
                  control={searchForm.control}
                  name="building_name"
                  render={({ field }) => (
                    <Form.Item label="楼宇名称">
                      <Input {...field} placeholder="请输入楼宇名称"></Input>
                    </Form.Item>
                  )}
                />

                <Controller
                  control={searchForm.control}
                  name="building_number"
                  render={({ field }) => (
                    <Form.Item label="楼栋号">
                      <Input {...field} placeholder="请输入楼栋号"></Input>
                    </Form.Item>
                  )}
                />
              </>
            )}

            {propertyType === "space" && (
              <>
                <Controller
                  control={searchForm.control}
                  name="space_name"
                  render={({ field }) => (
                    <Form.Item label="空间名称">
                      <Input {...field} placeholder="请输入空间名称"></Input>
                    </Form.Item>
                  )}
                />

                <Controller
                  control={searchForm.control}
                  name="space_type"
                  render={({ field }) => (
                    <Form.Item label="房间用途">
                      <Input {...field} placeholder="请输入空间用途"></Input>
                    </Form.Item>
                  )}
                />
              </>
            )}

            {propertyType === "terminal" && (
              <>
                <Controller
                  control={searchForm.control}
                  name="terminal_number"
                  render={({ field }) => (
                    <Form.Item label="网关（智能箱）编号">
                      <Input
                        {...field}
                        placeholder="请输入网关（智能箱）编号"
                      ></Input>
                    </Form.Item>
                  )}
                />
                <Controller
                  control={searchForm.control}
                  name="terminal_type"
                  render={({ field }) => (
                    <Form.Item label="网关（智能箱）型号">
                      <Input
                        {...field}
                        placeholder="请输入网关（智能箱）型号"
                      ></Input>
                    </Form.Item>
                  )}
                />
              </>
            )}

            {propertyType === "sensor" && (
              <>
                <Controller
                  control={searchForm.control}
                  name="sensor_kind"
                  render={({ field }) => (
                    <Form.Item
                      label="传感器大类"
                      validateStatus={
                        searchForm.formState.errors["sensor_kind"]?.message
                          ? "error"
                          : ""
                      }
                      help={searchForm.formState.errors["sensor_kind"]?.message}
                    >
                      <Select
                        onChange={(value) => {
                          field.onChange(value);
                          // 选择传感器大类时，自动设置资产类型为传感器
                          if (value) {
                            searchForm.setValue("property_type", "sensor");
                          }
                        }}
                        options={
                          sensorKindSelectOption?.map((option) => ({
                            value: option.kind,
                            label: option.name,
                          })) || []
                        }
                        value={field.value || undefined}
                        style={{ width: 120 }}
                        placeholder="请选择传感器大类"
                      ></Select>
                    </Form.Item>
                  )}
                />
              </>
            )}
          </div>

          <div className="flex gap-2">
            <Button type="primary" htmlType="submit" className="cursor-pointer">
              查询
            </Button>
            <Button
              type="default"
              htmlType="reset"
              className="cursor-pointer"
              onClick={() => searchForm.reset()}
            >
              清空
            </Button>
            <Button
              type="default"
              className="cursor-pointer"
              onClick={exportProperty}
              icon={<DownloadOutlined />}
            >
              导出
            </Button>
          </div>
        </Form>
      </Card>
      <Card
        title={
          <div className="flex justify-between items-center">
            <span>
              <ProfileFilled className="mr-1" />
              资产列表
            </span>
          </div>
        }
        style={{ borderColor: "#f0f0f0" }}
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
          dataSource={propertyData?.property ?? []}
          columns={columns}
          loading={isLoading}
          pagination={pageParams}
          onChange={(pagination) =>
            handlePaginationChange({
              current: pagination.current || 1,
              pageSize: pagination.pageSize || 10,
              total: pagination.total,
              showSizeChanger: false,
            })
          }
        />
      </Card>

      <Modal
        open={propertyDialogOpen}
        onCancel={() => onDialogOpenChange(false)}
        title={addOrEdit === "add" ? "新增资产" : "编辑资产"}
        width={720}
        centered
        footer={[
          <Button key="cancel" onClick={() => onDialogOpenChange(false)}>
            取消
          </Button>,
          <Button key="ok" type="primary" onClick={handleOK}>
            确定
          </Button>,
        ]}
      >
        <div className="mt-5">
          <div>
            {addOrEdit === "add" ? (
              <Form.Item required label="资产类型">
                <Select
                  onChange={onAddPropertySelectValueChange}
                  value={addPropertySelectValue}
                  placeholder="请先选择资产类型"
                  style={{ width: 200 }}
                >
                  {propertyTypeSelectOptions.map((option) => (
                    <Select.Option key={option.value} value={option.value}>
                      {option.label}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            ) : null}
          </div>
          <div className="mt-10">
            {addPropertySelectValue === "building" && (
              <Form layout="horizontal" className="space-y-7">
                <Controller
                  control={buildingForm.control}
                  name="name"
                  render={({ field }) => (
                    <Form.Item label="楼宇名称" required>
                      <Input {...field} className="w-80 h-8" />
                    </Form.Item>
                  )}
                />
                <Controller
                  control={buildingForm.control}
                  name="number"
                  render={({ field }) => (
                    <Form.Item label="楼栋号">
                      <Input {...field} className="w-80 h-8" />
                    </Form.Item>
                  )}
                />
                <Controller
                  control={buildingForm.control}
                  name="address"
                  render={({ field }) => (
                    <Form.Item label="楼宇地址">
                      <Input {...field} className="w-80 h-8" />
                    </Form.Item>
                  )}
                />
                <Controller
                  control={buildingForm.control}
                  name="is_used"
                  render={({ field }) => (
                    <Form.Item label="楼宇状态" required>
                      <Select
                        style={{ width: 320 }}
                        onChange={field.onChange}
                        value={field.value}
                        options={buildingIsUsedSelectOptions.map((item) => ({
                          value: item.value,
                          label: item.label,
                        }))}
                      />
                    </Form.Item>
                  )}
                />
                <Controller
                  control={buildingForm.control}
                  name="description"
                  render={({ field }) => (
                    <Form.Item label="楼宇描述">
                      <Input {...field} className="w-80 h-8" />
                    </Form.Item>
                  )}
                />
              </Form>
            )}
            {addPropertySelectValue === "space" && (
              <Form layout="horizontal" className="space-y-7">
                <Controller
                  control={spaceForm.control}
                  name="name"
                  render={({ field }) => (
                    <Form.Item label="空间名称" required>
                      <Input {...field} className="w-80 h-8" />
                    </Form.Item>
                  )}
                />

                <Controller
                  control={spaceForm.control}
                  name="number"
                  render={({ field }) => (
                    <Form.Item label="房间号" required>
                      <Input {...field} className="w-80 h-8" />
                    </Form.Item>
                  )}
                />

                <Controller
                  control={spaceForm.control}
                  name="property_bind_id"
                  render={({ field }) => (
                    <Form.Item label="绑定楼宇" required>
                      <div className="flex flex-col">
                        <Select
                          onChange={field.onChange}
                          value={field.value}
                          placeholder="请选择绑定楼宇"
                          options={
                            bindPropertySelectOption?.map((option) => ({
                              value: option.property_id,
                              label: option.property_id,
                            })) || []
                          }
                          style={{ width: 320 }}
                        />
                      </div>
                    </Form.Item>
                  )}
                />

                <Controller
                  control={spaceForm.control}
                  name="floor"
                  render={({ field }) => (
                    <Form.Item label="楼层" required>
                      <Input {...field} className="w-80 h-8" />
                    </Form.Item>
                  )}
                />

                <Controller
                  control={spaceForm.control}
                  name="type"
                  render={({ field }) => (
                    <Form.Item label="房间用途">
                      <Input {...field} className="w-80 h-8" />
                    </Form.Item>
                  )}
                />

                <Controller
                  control={spaceForm.control}
                  name="ampere"
                  render={({ field }) => (
                    <Form.Item label="安培">
                      <Input {...field} className="w-80 h-8" />
                    </Form.Item>
                  )}
                />

                <Controller
                  control={spaceForm.control}
                  name="is_used"
                  render={({ field }) => (
                    <Form.Item label="空间状态" required>
                      <Select
                        style={{ width: 320 }}
                        onChange={field.onChange}
                        value={field.value}
                        options={buildingIsUsedSelectOptions.map((item) => ({
                          value: item.value,
                          label: item.label,
                        }))}
                      />
                    </Form.Item>
                  )}
                />

                <Controller
                  control={spaceForm.control}
                  name="description"
                  render={({ field }) => (
                    <Form.Item label="空间描述">
                      <Input {...field} className="w-80 h-8" />
                    </Form.Item>
                  )}
                />
              </Form>
            )}
            {addPropertySelectValue === "terminal" && (
              <Form layout="horizontal" className="space-y-7">
                <Controller
                  control={terminalForm.control}
                  name="number"
                  render={({ field }) => (
                    <Form.Item label="网关（智能箱）编号" required>
                      <Input {...field} className="w-80 h-8" />
                    </Form.Item>
                  )}
                />
                <Controller
                  control={terminalForm.control}
                  name="type"
                  render={({ field }) => (
                    <Form.Item label="网关（智能箱）型号" required>
                      <Input {...field} className="w-80 h-8" />
                    </Form.Item>
                  )}
                />
                <Controller
                  control={terminalForm.control}
                  name="property_bind_id"
                  render={({ field }) => (
                    <Form.Item label="绑定空间" required>
                      <div className="flex flex-col">
                        <Select
                          onChange={field.onChange}
                          value={field.value}
                          placeholder="请选择绑定空间"
                          options={
                            bindPropertySelectOption?.map((option) => ({
                              value: option.property_id,
                              label: option.property_id,
                            })) || []
                          }
                          style={{ width: 320 }}
                        />
                      </div>
                    </Form.Item>
                  )}
                />
                <Controller
                  control={terminalForm.control}
                  name="is_used"
                  render={({ field }) => (
                    <Form.Item label="网关（智能箱）状态" required>
                      <Select
                        style={{ width: 320 }}
                        onChange={field.onChange}
                        value={field.value}
                        options={buildingIsUsedSelectOptions.map((item) => ({
                          value: item.value,
                          label: item.label,
                        }))}
                      />
                    </Form.Item>
                  )}
                />
                <Controller
                  control={terminalForm.control}
                  name="description"
                  render={({ field }) => (
                    <Form.Item label="网关（智能箱）描述">
                      <Input {...field} className="w-80 h-8" />
                    </Form.Item>
                  )}
                />
              </Form>
            )}
            {addPropertySelectValue === "sensor" && (
              <Form layout="horizontal" className="space-y-7">
                <Controller
                  control={sensorForm.control}
                  name="kind"
                  render={({ field }) => (
                    <Form.Item label="传感器大类" required>
                      <div className="flex flex-col">
                        <Select
                          onChange={field.onChange}
                          value={field.value}
                          placeholder="请选择传感器大类"
                          options={
                            sensorKindSelectOption?.map((option) => ({
                              value: option.kind,
                              label: option.name,
                            })) || []
                          }
                          style={{ width: 320 }}
                        />
                      </div>
                    </Form.Item>
                  )}
                />
                <Controller
                  control={sensorForm.control}
                  name="type"
                  render={({ field }) => (
                    <Form.Item label="传感器小类" required>
                      <div className="flex flex-col">
                        <Select
                          onChange={field.onChange}
                          value={field.value}
                          placeholder="请选择传感器小类"
                          options={
                            sensorTypeSelectOption?.map((option) => ({
                              value: option.type,
                              label: option.name,
                            })) || []
                          }
                          style={{ width: 320 }}
                        />
                      </div>
                    </Form.Item>
                  )}
                />

                <Controller
                  control={sensorForm.control}
                  name="property_bind_id"
                  render={({ field }) => (
                    <Form.Item label="绑定终端" required>
                      <div className="flex flex-col">
                        <Select
                          onChange={field.onChange}
                          value={field.value}
                          placeholder="请选择资产绑定"
                          options={
                            bindPropertySelectOption?.map((option) => ({
                              value: option.property_id,
                              label: option.property_id,
                            })) || []
                          }
                          style={{ width: 320 }}
                        />
                      </div>
                    </Form.Item>
                  )}
                />

                <Controller
                  control={sensorForm.control}
                  name="is_used"
                  render={({ field }) => (
                    <Form.Item label="传感器状态" required>
                      <Select
                        style={{ width: 320 }}
                        onChange={field.onChange}
                        value={field.value}
                        options={buildingIsUsedSelectOptions.map((item) => ({
                          value: item.value,
                          label: item.label,
                        }))}
                      />
                    </Form.Item>
                  )}
                />

                <Controller
                  control={sensorForm.control}
                  name="description"
                  render={({ field }) => (
                    <Form.Item label="传感器描述">
                      <Input {...field} className="w-80 h-8" />
                    </Form.Item>
                  )}
                />
              </Form>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
