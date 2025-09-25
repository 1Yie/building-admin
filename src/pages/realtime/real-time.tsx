import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Pagination, Skeleton } from "antd";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod/v4";
import {
  getBindPropertyList,
  getSensorKindList,
  getSensorTypeList,
} from "@/request/property";
import { getOutlineInfo, getSensorList } from "@/request/realtime";
import { Button, Select, Form, Card, Spin, Empty } from "antd";

import {
  CircleX,
  Building,
  Home,
  Router,
  Cpu,
  Wifi,
  Activity,
} from "lucide-react";
import type { PaginationType } from "@/types";
import ChartLine from "./chart-line";

export default function RealtimePage() {
  // 数据总揽
  const {
    data: outlineInfo,
    isError: isOutLineInfoError,
    error: outLineInfoError,
  } = useQuery({
    queryKey: ["getOutlineInfo"],
    queryFn: getOutlineInfo,
  });
  useEffect(() => {
    if (isOutLineInfoError) {
      toast.error(outLineInfoError?.message);
    }
  }, [isOutLineInfoError, outLineInfoError]);

  // 折线图数据列表
  const [pageParams, setPageParams] = useState<PaginationType>({
    current: 1,
    pageSize: 4,
  });
  const [searchValues, setSearchValues] = useState<
    z.infer<typeof searchFormSchema>
  >({});
  const {
    data: sensorList,
    isError,
    error,
    isPending,
  } = useQuery({
    queryKey: ["getSensorList", pageParams, searchValues],
    queryFn: () =>
      getSensorList({
        page: pageParams.current,
        page_size: pageParams.pageSize,
        ...searchValues,
      }),
  });
  useEffect(() => {
    if (isError) {
      toast.error(error?.message);
    }
  }, [isError, error]);
  useEffect(() => {
    if (sensorList?.page?.totalSize && sensorList?.page?.totalSize > 0) {
      setPageParams((prev) => ({
        ...prev,
        total: sensorList.page.totalSize,
      }));
    }
  }, [sensorList]);

  // 分页
  function onPageChange(current: number, pageSize: number) {
    setPageParams({
      current,
      pageSize,
    });
  }

  // 转换为折线图数据
  const chartDataList =
    sensorList?.property?.map((item) => ({
      data: item.times.map((time, index) => ({
        time,
        value: item.values[index],
      })),
      name: item.name,
      field: item.field,
      property_id: item.property_id,
    })) ?? [];

  // 搜索表单
  const searchFormSchema = z.object({
    time_unit: z.string().optional(), // 统计范围（daily天 / week周 / month月）
    property_id: z.string().optional(), // 资产编号
    property_building_id: z.string().optional(), // 资产编号
    property_space_id: z.string().optional(), // 资产编号
    property_terminal_id: z.string().optional(), // 资产编号
    property_sensor_id: z.string().optional(), // 资产编号
    sensor_kind: z.string().optional(), // 传感器大类
    sensor_type: z.string().optional(), // 传感器小类
  });
  const searchForm = useForm<z.infer<typeof searchFormSchema>>({
    resolver: zodResolver(searchFormSchema),
    defaultValues: {
      time_unit: "",
      property_id: "",
      property_building_id: "",
      property_space_id: "",
      property_terminal_id: "",
      property_sensor_id: "",
      sensor_kind: "",
      sensor_type: "",
    },
  });

  // 全局propertyId
  const [propertyId, setPropertyId] = useState("");

  const timeUnitSelectOption = [
    { value: "daily", label: "日" },
    { value: "week", label: "周" },
    { value: "month", label: "月" },
  ];

  const { data: buildingSelectOption } = useQuery({
    queryKey: ["getBindPropertyList"],
    queryFn: () => getBindPropertyList({ property_type: "LY" }),
  });
  const { mutate: getSelectOptionMutate } = useMutation({
    mutationFn: getBindPropertyList,
  });

  const [spaceSelectOption, setSpaceSelectOption] = useState<
    { property_id: string; name: string }[]
  >([]);
  function onPropertyBuildingIdChange(
    value: string,
    field: { onChange: (value: string) => void }
  ) {
    field.onChange(value);
    setPropertyId(value);
    getSelectOptionMutate(
      {
        property_id: value,
        property_type: "KJ",
      },
      {
        onSuccess: (data) => {
          setSpaceSelectOption(data);
        },
        onError: (error) => {
          toast.error(error.message);
        },
      }
    );
  }

  const [terminalSelectOption, setTerminalSelectOption] = useState<
    { property_id: string; name: string }[]
  >([]);
  function onPropertySpaceIdChange(
    value: string,
    field: { onChange: (value: string) => void }
  ) {
    field.onChange(value);
    setPropertyId(value);
    getSelectOptionMutate(
      {
        property_id: value,
        property_type: "ZD",
      },
      {
        onSuccess: (data) => {
          setTerminalSelectOption(data);
        },
        onError: (error) => {
          toast.error(error.message);
        },
      }
    );
  }

  const [sensorSelectOption, setSensorSelectOption] = useState<
    { property_id: string; name: string }[]
  >([]);
  function onPropertyTerminalIdChange(
    value: string,
    field: { onChange: (value: string) => void }
  ) {
    field.onChange(value);
    setPropertyId(value);
    getSelectOptionMutate(
      {
        property_id: value,
        property_type: "CGQ",
      },
      {
        onSuccess: (data) => {
          setSensorSelectOption(data);
        },
        onError: (error) => {
          toast.error(error.message);
        },
      }
    );
  }

  function onPropertySensorIdChange(
    value: string,
    field: { onChange: (value: string) => void }
  ) {
    field.onChange(value);
    setPropertyId(value);
  }

  const { data: sensorKindSelectOption } = useQuery({
    queryKey: ["sensorKindList"],
    queryFn: getSensorKindList,
  });
  const { data: sensorTypeSelectOption } = useQuery({
    queryKey: ["sensorTypeList"],
    queryFn: getSensorTypeList,
  });
  function onSearchFormSubmit(values: z.infer<typeof searchFormSchema>) {
    const { time_unit, sensor_kind, sensor_type } = values;
    setSearchValues({
      property_id: propertyId,
      time_unit,
      sensor_kind,
      sensor_type,
    });
    setPageParams({
      ...pageParams,
      current: 1,
    });
  }

  // 重置表单
  function resetForm() {
    searchForm.reset();
    setPropertyId("");
    setSpaceSelectOption([]);
    setTerminalSelectOption([]);
    setSensorSelectOption([]);
  }

  return (
    <div className="">
      <div className="gap-5 grid grid-cols-6">
        <Card className="w-full" style={{ borderColor: "#f0f0f0" }}>
          <div className="flex flex-col justify-center items-center gap-2 h-full">
            <Building className="w-8 h-8 text-blue-500" />
            <div className="text-2xl font-bold">
              {outlineInfo?.building_count ?? (
                <Skeleton.Button active size="small" style={{ width: 10 }} />
              )}
            </div>
            <div className="text-gray-600">楼宇数</div>
          </div>
        </Card>
        <Card className="w-full" style={{ borderColor: "#f0f0f0" }}>
          <div className="flex flex-col justify-center items-center gap-2 h-full">
            <Home className="w-8 h-8 text-green-500" />
            <div className="text-2xl font-bold">
              {outlineInfo?.space_count ?? (
                <Skeleton.Button active size="small" style={{ width: 10 }} />
              )}
            </div>
            <div className="text-gray-600">空间数</div>
          </div>
        </Card>
        <Card className="w-full" style={{ borderColor: "#f0f0f0" }}>
          <div className="flex flex-col justify-center items-center gap-2 h-full">
            <Router className="w-8 h-8 text-purple-500" />
            <div className="text-2xl font-bold">
              {outlineInfo?.terminal_count ?? (
                <Skeleton.Button active size="small" style={{ width: 10 }} />
              )}
            </div>
            <div className="text-gray-600">终端数</div>
          </div>
        </Card>
        <Card className="w-full" style={{ borderColor: "#f0f0f0" }}>
          <div className="flex flex-col justify-center items-center gap-2 h-full">
            <Cpu className="w-8 h-8 text-orange-500" />
            <div className="text-2xl font-bold">
              {outlineInfo?.sensor_count ?? (
                <Skeleton.Button active size="small" style={{ width: 10 }} />
              )}
            </div>
            <div className="text-gray-600">设备数</div>
          </div>
        </Card>
        <Card className="w-full" style={{ borderColor: "#f0f0f0" }}>
          <div className="flex flex-col justify-center items-center gap-2 h-full">
            <Wifi className="w-8 h-8 text-green-600" />
            <div className="text-2xl font-bold">
              {outlineInfo?.online_count ?? (
                <Skeleton.Button active size="small" style={{ width: 10 }} />
              )}
            </div>
            <div className="text-gray-600">在线设备</div>
          </div>
        </Card>
        <Card className="w-full" style={{ borderColor: "#f0f0f0" }}>
          <div className="flex flex-col justify-center items-center gap-2 h-full">
            <Activity className="w-8 h-8 text-red-500" />
            <div className="text-2xl font-bold">
              {outlineInfo?.liveness_count ?? (
                <Skeleton.Button active size="small" style={{ width: 10 }} />
              )}
            </div>
            <div className="text-gray-600">活跃设备</div>
          </div>
        </Card>
      </div>
      <div className="mt-5">
        <Card className="w-full" style={{ borderColor: "#f0f0f0" }}>
          <Form layout="inline" className="flex flex-wrap gap-4">
            <Controller
              control={searchForm.control}
              name="time_unit"
              render={({ field }) => (
                <Form.Item label="统计范围" className="mb-4">
                  <Select
                    style={{ width: 140 }}
                    onChange={field.onChange}
                    value={field.value || undefined}
                    placeholder="请选择统计范围"
                    options={timeUnitSelectOption.map((item) => ({
                      label: item.label,
                      value: item.value,
                    }))}
                  />
                </Form.Item>
              )}
            />

            <Controller
              control={searchForm.control}
              name="property_building_id"
              render={({ field }) => (
                <Form.Item label="楼宇" className="mb-4">
                  <Select
                    style={{ width: 140 }}
                    onChange={(value) =>
                      onPropertyBuildingIdChange(value, field)
                    }
                    value={field.value || undefined}
                    placeholder="请选择楼宇"
                    options={buildingSelectOption?.map((item) => ({
                      Key: item.property_id,
                      value: item.property_id,
                    }))}
                  />
                </Form.Item>
              )}
            />

            <Controller
              control={searchForm.control}
              name="property_space_id"
              render={({ field }) => (
                <Form.Item label="空间" className="mb-4">
                  <Select
                    style={{ width: 140 }}
                    onChange={(value) => onPropertySpaceIdChange(value, field)}
                    value={field.value || undefined}
                    placeholder="请选择空间"
                    options={spaceSelectOption?.map((item) => ({
                      Key: item.property_id,
                      value: item.property_id,
                    }))}
                  />
                </Form.Item>
              )}
            />

            <Controller
              control={searchForm.control}
              name="property_terminal_id"
              render={({ field }) => (
                <Form.Item label="网关（智能箱）" className="mb-4">
                  <Select
                    style={{ width: 160 }}
                    onChange={(value) =>
                      onPropertyTerminalIdChange(value, field)
                    }
                    value={field.value || undefined}
                    placeholder="请选择网关（智能箱）"
                    options={terminalSelectOption?.map((item) => ({
                      Key: item.property_id,
                      value: item.property_id,
                    }))}
                  />
                </Form.Item>
              )}
            />

            <Controller
              control={searchForm.control}
              name="property_sensor_id"
              render={({ field }) => (
                <Form.Item label="传感器" className="mb-4">
                  <Select
                    style={{ width: 140 }}
                    onChange={(value) => onPropertySensorIdChange(value, field)}
                    value={field.value || undefined}
                    placeholder="请选择传感器"
                    options={sensorSelectOption?.map((item) => ({
                      Key: item.property_id,
                      value: item.property_id,
                    }))}
                  />
                </Form.Item>
              )}
            />

            <Controller
              control={searchForm.control}
              name="sensor_kind"
              render={({ field }) => (
                <Form.Item label="传感器大类" className="mb-4">
                  <Select
                    style={{ width: 140 }}
                    onChange={field.onChange}
                    value={field.value || undefined}
                    placeholder="请选择传感器大类"
                    options={sensorKindSelectOption?.map((item) => ({
                      Key: item.kind,
                      value: item.kind,
                      label: item.name,
                    }))}
                  />
                </Form.Item>
              )}
            />

            <Controller
              control={searchForm.control}
              name="sensor_type"
              render={({ field }) => (
                <Form.Item label="传感器小类" className="mb-4">
                  <Select
                    style={{ width: 140 }}
                    onChange={field.onChange}
                    value={field.value || undefined}
                    placeholder="请选择传感器小类"
                  >
                    {sensorTypeSelectOption?.map((item) => (
                      <Select.Option key={item.type} value={item.type}>
                        {item.name}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              )}
            />

            <div className="flex gap-3 mb-4">
              <Button
                type="primary"
                htmlType="submit"
                className="cursor-pointer px-6"
                onClick={searchForm.handleSubmit(onSearchFormSubmit)}
              >
                查询
              </Button>
              <Button
                type="default"
                htmlType="reset"
                className="cursor-pointer px-6"
                onClick={resetForm}
              >
                清空
              </Button>
            </div>
          </Form>
        </Card>
      </div>
      <div className="mt-5">
        {isPending ? (
          <div className="flex h-40 w-full items-center justify-center">
            <Spin size="large" />
          </div>
        ) : chartDataList.length > 0 ? (
          <div className="gap-5 grid grid-cols-2">
            {chartDataList.map((chartData) => (
              <ChartLine
                key={chartData.name}
                chartData={chartData.data}
                name={chartData.name}
                field={chartData.field}
              />
            ))}
          </div>
        ) : (
          <div className="flex h-40 w-full items-center justify-center">
            <Empty description="暂无数据" />
          </div>
        )}
      </div>
      <div className="mt-5">
        <Pagination
          align="end"
          current={pageParams.current}
          pageSize={pageParams.pageSize}
          total={pageParams.total}
          showSizeChanger={false}
          onChange={onPageChange}
          showQuickJumper={true}
        />
      </div>
    </div>
  );
}
