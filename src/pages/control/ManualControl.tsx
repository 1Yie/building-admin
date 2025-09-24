import { useMutation, useQuery } from "@tanstack/react-query";
import { Table, Card, Button, Dropdown } from "antd";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { ManualOperateParams } from "@/request/control";
import { getManualList, manualOperate } from "@/request/control";
import { Badge } from "@/shadcn/ui/badge";
import type { PaginationType } from "@/types";
import { LockKeyholeOpen, LockKeyhole } from "lucide-react";
import { ControlFilled } from "@ant-design/icons";

export default function ManualControl() {
  // 表格列
  const columns = [
    {
      title: "资产编号",
      dataIndex: "property_id",
      key: "property_id",
      align: "center" as const,
    },
    {
      title: "资产名称",
      dataIndex: "property_name",
      key: "property_name",
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
      title: "活跃状态",
      dataIndex: "is_liveness",
      key: "is_liveness",
      align: "center" as const,
      render: (is_liveness: boolean) => {
        return is_liveness ? (
          <Badge className="bg-green-500">在用</Badge>
        ) : (
          <Badge className="bg-red-500">停用</Badge>
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
      title: "操作",
      dataIndex: "operate",
      key: "operate",
      align: "center" as const,
      render: (operate: { name: string; type: string }[], record: any) => {
        return (
          <Dropdown
            menu={{
              items: operate.map((item) => ({
                key: item.name,
                label: (
                  <div
                    className="w-full text-center flex items-center justify-center gap-2"
                    onClick={() =>
                      handleOperate({
                        property_id: record.property_id,
                        control: item.type,
                      })
                    }
                  >
                    {item.type === "open" ? (
                      <LockKeyhole className="w-4 h-4" />
                    ) : (
                      <LockKeyholeOpen className="w-4 h-4" />
                    )}
                    {item.name}
                  </div>
                ),
              })),
            }}
            placement="bottomLeft"
          >
            <Button type="link" className="text-blue-500">
              操作
            </Button>
          </Dropdown>
        );
      },
    },
  ];

  // 表格分页
  const [pageParams, setPageParams] = useState<PaginationType>({
    current: 1,
    pageSize: 5,
    showSizeChanger: false,
  });
  function handlePaginationChange(pagination: PaginationType) {
    setPageParams(pagination);
  }

  // 请求表格数据
  const {
    data: manualList,
    isPending: isLoading,
    refetch,
    isError,
    error,
  } = useQuery({
    queryKey: ["getManualList", pageParams.current, pageParams.pageSize],
    queryFn: () =>
      getManualList({
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
    if (manualList?.page?.totalSize && manualList?.page?.totalSize > 0) {
      setPageParams((prev) => ({
        ...prev,
        total: manualList.page.totalSize,
      }));
    }
  }, [manualList]);

  // 控制
  const { mutate: manualOperateMutate } = useMutation({
    mutationFn: manualOperate,
  });
  function handleOperate({ property_id, control }: ManualOperateParams) {
    manualOperateMutate(
      { property_id, control },
      {
        onSuccess: () => {
          toast.success("操作成功");
          refetch();
        },
        onError: (error) => {
          toast.error(error.message);
        },
      }
    );
  }

  return (
    <div className="">
      <Card
        title={
          <div className="flex justify-between items-center">
            <span>
              <ControlFilled className="mr-1" />
              手动控制
            </span>
          </div>
        }
        style={{ borderColor: "#f0f0f0", marginBottom: "20px" }}
      >
        <Table
          dataSource={manualList?.manual || []}
          columns={columns}
          pagination={pageParams}
          onChange={(pagination) =>
            handlePaginationChange({
              current: pagination.current || 1,
              pageSize: pagination.pageSize || 5,
              showSizeChanger: false,
              total: pageParams.total,
            })
          }
          loading={isLoading}
          rowKey="property_id"
        />
      </Card>
    </div>
  );
}
