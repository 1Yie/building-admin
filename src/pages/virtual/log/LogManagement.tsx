import { zodResolver } from "@hookform/resolvers/zod";

import { useQuery } from "@tanstack/react-query";
import {
  Table,
  Button,
  Select,
  DatePicker,
  ConfigProvider,
  Form,
  Card,
} from "antd";
import zhCN from "antd/locale/zh_CN";
import dayjs from "dayjs";
import "dayjs/locale/zh-cn";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import z from "zod/v4";
import { getLogList, getLogTypeList } from "@/request/virtual";
import { ExclamationCircleFilled } from "@ant-design/icons";

import type { PaginationType } from "@/types";

export default function LogManagement() {
  const columns = [
    {
      title: "时间",
      dataIndex: "time",
      key: "time",
      align: "center" as const,
    },
    {
      title: "操作人",
      dataIndex: "operator",
      key: "operator",
      align: "center" as const,
    },
    {
      title: "操作类型",
      dataIndex: "type",
      key: "type",
      align: "center" as const,
    },
    {
      title: "操作内容",
      dataIndex: "content",
      key: "content",
      align: "center" as const,
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
  const [searchValues, setSearchValues] = useState<
    z.infer<typeof searchFormSchema>
  >({});

  // 表格
  const { data: logList, isPending } = useQuery({
    queryKey: ["getLogList", pageParams, searchValues],
    queryFn: () =>
      getLogList({
        page: pageParams.current,
        page_size: pageParams.pageSize,
        ...searchValues,
      }),
  });

  useEffect(() => {
    if (logList?.page?.totalSize && logList?.page?.totalSize > 0) {
      setPageParams((prev) => ({
        ...prev,
        total: logList.page.totalSize,
      }));
    }
  }, [logList]);

  // 搜索表单
  const searchFormSchema = z.object({
    time: z.string().optional(),
    operator: z.string().optional(), // 操作人
    log_type: z.string().optional(), // 日志类型
  });
  const searchForm = useForm<z.infer<typeof searchFormSchema>>({
    resolver: zodResolver(searchFormSchema),
    defaultValues: {
      time: "",
      operator: "", // 操作人
      log_type: "", // 日志类型
    },
  });

  const { data: logTypeSelectOption } = useQuery({
    queryKey: ["getLogTypeList"],
    queryFn: getLogTypeList,
  });
  const operateSelectOption = [
    {
      name: "system",
      value: "system",
    },
  ];

  function onSearchFormSubmit(values: z.infer<typeof searchFormSchema>) {
    setSearchValues(values);
    setPageParams({
      ...pageParams,
      current: 1,
    });
  }

  return (
    <div className="">
      <Card
        style={{
          borderColor: "#f0f0f0",
          marginBottom: "20px",
        }}
      >
        <Form
          layout="inline"
          className="space-y-7"
          onFinish={searchForm.handleSubmit(onSearchFormSubmit)}
        >
          <Controller
            control={searchForm.control}
            name="time"
            render={({ field }) => (
              <Form.Item label="时间">
                <div className="flex flex-col">
                  <ConfigProvider locale={zhCN}>
                    <DatePicker
                      value={field.value ? dayjs(field.value) : undefined}
                      onChange={(date) => {
                        field.onChange(date ? date.format("YYYY-MM-DD") : "");
                      }}
                      disabledDate={(current) => {
                        return (
                          current > dayjs() || current < dayjs("1900-01-01")
                        );
                      }}
                      placeholder="请选择日期"
                      style={{ width: 240 }}
                      format="YYYY-MM-DD"
                    />
                  </ConfigProvider>
                </div>
              </Form.Item>
            )}
          />

          <Controller
            control={searchForm.control}
            name="log_type"
            render={({ field }) => (
              <Form.Item label="日志类型">
                <div className="flex flex-col">
                  <Select
                    onChange={field.onChange}
                    value={field.value || undefined}
                    placeholder="请选择日志类型"
                    style={{ width: 180 }}
                  >
                    {logTypeSelectOption?.map((option) => (
                      <Select.Option key={option.type} value={option.type}>
                        {option.name}
                      </Select.Option>
                    ))}
                  </Select>
                </div>
              </Form.Item>
            )}
          />

          <Controller
            control={searchForm.control}
            name="operator"
            render={({ field }) => (
              <Form.Item label="操作人">
                <div className="flex flex-col">
                  <Select
                    onChange={field.onChange}
                    value={field.value || undefined}
                    placeholder="请选择操作人"
                    style={{ width: 180 }}
                  >
                    {operateSelectOption?.map((option) => (
                      <Select.Option key={option.value} value={option.value}>
                        {option.name}
                      </Select.Option>
                    ))}
                  </Select>
                </div>
              </Form.Item>
            )}
          />

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
          </div>
        </Form>
      </Card>

      <Card
        title={
          <div className="flex justify-between items-center">
            <span>
              <ExclamationCircleFilled className="mr-1" />
              日志管理
            </span>
          </div>
        }
        style={{
          borderColor: "#f0f0f0",
        }}
      >
        <Table
          columns={columns}
          dataSource={logList?.log}
          pagination={{
            current: pageParams.current,
            pageSize: pageParams.pageSize,
            total: pageParams.total,
            showSizeChanger: false,
            onChange: onPageChange,
          }}
          loading={isPending}
        />
      </Card>
    </div>
  );
}
