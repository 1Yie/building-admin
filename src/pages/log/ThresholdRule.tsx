import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Table } from "antd";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";
import { getFieldSelectList } from "@/request/control";
import {
  addThresholdRule,
  getThresholdRuleDetails,
  getThresholdRuleList,
  updateThresholdRule,
} from "@/request/log";
import { getBindPropertyList } from "@/request/property";
import { Badge } from "@/shadcn/ui/badge";
import { Button, Modal, Input, Select } from "antd";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shadcn/ui/form";
import {
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shadcn/ui/select";
import type { PaginationType } from "@/types";

export default function ThresholdRule() {
  const columns = [
    {
      title: "规则编号",
      dataIndex: "rule_id",
      key: "rule_id",
      align: "center",
    },
    {
      title: "资产ID",
      dataIndex: "property_id",
      key: "property_id",
      align: "center",
    },
    {
      title: "传感器大类",
      dataIndex: "sensor_kind",
      key: "sensor_kind",
      align: "center",
    },
    {
      title: "传感器小类",
      dataIndex: "sensor_type",
      key: "sensor_type",
      align: "center",
    },
    {
      title: "最大值",
      dataIndex: "max",
      key: "max",
      align: "center",
    },
    {
      title: "最小值",
      dataIndex: "min",
      key: "min",
      align: "center",
    },
    {
      title: "使用状态",
      dataIndex: "is_used",
      key: "is_used",
      align: "center",
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
      align: "center",
      render: (_, record: any) => (
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
  const { data: thresholdRuleList, isPending, refetch } = useQuery({
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
    setDialogOpen(true);
  }

  const { mutate: getThresholdRuleDetailsMutate } = useMutation({
    mutationFn: getThresholdRuleDetails
  })
  function handleOpenEditDialog(record: any) {
    setAddOrUpdate("edit");
    setDialogOpen(true);
    getThresholdRuleDetailsMutate(record.rule_id, {
      onSuccess: (data) => {
        thresholdRuleForm.reset(data);
      },
    })
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
    resolver: zodResolver(thresholdRuleFormSchema),
    defaultValues: {
      rule_id: "",
      sensor_property_id: "",
      field: "",
      max: "",
      min: "",
      is_used: "",
    },
  });

  const { data: sensorPropertySelectOption } = useQuery({
    queryKey: ["getSensorPropertySelectOption"],
    queryFn: () => getBindPropertyList({ property_type: "CGQ" }),
  });
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
          setDialogOpen(false);
          refetch();
        },
      });
    } else {
      updateThresholdRuleMutate(data, {
        onSuccess: () => {
          toast.success("编辑成功");
          setDialogOpen(false);
          refetch();
        }
      })
    }
  }

  return (
    <div className="p-5">
      <div>
        <Button
          type="primary"
          className="cursor-pointer"
          onClick={handleOpenAddDialog}
        >
          新增
        </Button>
      </div>
      <div className="mt-5">
        <Table
          columns={columns}
          dataSource={thresholdRuleList?.thresholed}
          pagination={{
            current: pageParams.current,
            pageSize: pageParams.pageSize,
            total: pageParams.total,
            onChange: onPageChange,
          }}
          loading={isPending}
        />
      </div>

      <Modal
        open={dialogOpen}
        title={addOrUpdate === "add" ? "新增规则" : "更新规则"}
        onCancel={() => setDialogOpen(false)}
        footer={
          <div className="flex justify-end gap-4">
            <Button type="default" onClick={() => setDialogOpen(false)}>
              取消
            </Button>
            <Button type="primary" onClick={handleOK}>
              确定
            </Button>
          </div>
        }
        width={720}
        centered
      >
        <div className="mt-5">
          <Form {...thresholdRuleForm}>
            <form className="space-y-7">
              {addOrUpdate === "edit" && (
                <FormField
                  control={thresholdRuleForm.control}
                  name="rule_id"
                  render={({ field }) => (
                    <FormItem className="relative flex items-center gap-5">
                      <FormLabel>规则ID</FormLabel>
                      <div className="flex flex-col">
                        <FormControl>
                          <Input {...field} className="w-80 h-8" disabled />
                        </FormControl>
                        <FormMessage className="bottom-0 absolute translate-y-full" />
                      </div>
                    </FormItem>
                  )}
                />
              )}
              <FormField
                control={thresholdRuleForm.control}
                name="sensor_property_id"
                render={({ field }) => (
                  <FormItem className="relative flex items-center gap-5">
                    <FormLabel>传感器ID</FormLabel>
                    <div className="flex flex-col">
                      <Select
                        onChange={field.onChange}
                        value={field.value}
                        placeholder="传感器ID"
                        style={{ width: 200 }}
                      >
                        {sensorPropertySelectOption?.map((option) => (
                          <Select.Option
                            key={option.property_id}
                            value={option.property_id}
                          >
                            {option.name}
                          </Select.Option>
                        ))}
                      </Select>
                    </div>
                  </FormItem>
                )}
              />
              <FormField
                control={thresholdRuleForm.control}
                name="field"
                render={({ field }) => (
                  <FormItem className="relative flex items-center gap-5">
                    <FormLabel>传感器字段</FormLabel>
                    <div className="flex flex-col">
                      <Select onChange={field.onChange} value={field.value} placeholder="传感器字段" style={{ width: 200 }}>
                        {fieldSelectOption?.map((option) => (
                          <Select.Option key={option.type} value={option.type}>
                            {option.name}
                          </Select.Option>
                        ))}
                      </Select>
                    </div>
                  </FormItem>
                )}
              />
              <FormField
                control={thresholdRuleForm.control}
                name="is_used"
                render={({ field }) => (
                  <FormItem className="relative flex items-center gap-5">
                    <FormLabel>使用状态</FormLabel>
                    <div className="flex flex-col">
                      <Select onChange={field.onChange} value={field.value} placeholder="使用状态" style={{ width: 200 }}>
                        {isUsedSelectOption?.map((option) => (
                          <Select.Option key={option.value} value={option.value}>
                            {option.label}
                          </Select.Option>
                        ))}
                      </Select>
                    </div>
                  </FormItem>
                )}
              />
              <FormField
                control={thresholdRuleForm.control}
                name="max"
                render={({ field }) => (
                  <FormItem className="relative flex items-center gap-5">
                    <FormLabel>触发上线</FormLabel>
                    <div className="flex flex-col">
                      <FormControl>
                        <Input {...field} type="number" className="w-80 h-8" />
                      </FormControl>
                      <FormMessage className="bottom-0 absolute translate-y-full" />
                    </div>
                  </FormItem>
                )}
              />
              <FormField
                control={thresholdRuleForm.control}
                name="min"
                render={({ field }) => (
                  <FormItem className="relative flex items-center gap-5">
                    <FormLabel>触发下线</FormLabel>
                    <div className="flex flex-col">
                      <FormControl>
                        <Input {...field} type="number" className="w-80 h-8" />
                      </FormControl>
                      <FormMessage className="bottom-0 absolute translate-y-full" />
                    </div>
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </div>
      </Modal>  

    </div>
  );
}
