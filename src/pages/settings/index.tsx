import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Controller, useForm, type Resolver } from "react-hook-form";
import { toast } from "sonner";
import z from "zod/v4";
import { getTaskInterVal, setTaskInterVal } from "@/request/settings";
import { Button, Card, Input, Form } from "antd";

export default function SettingsPage() {
  // 获取任务间隔
  const {
    data: taskInterVal,
    isError,
    error,
  } = useQuery({
    queryKey: ["getTaskInterVal"],
    queryFn: getTaskInterVal,
  });
  useEffect(() => {
    if (isError) {
      toast.error(error?.message);
    }
  }, [isError, error]);

  // 表单
  const settingsFormSchema = z.object({
    seconds: z.coerce
      .number()
      .int({ message: "请输入整数" })
      .min(1, "请输入大于0的整数"),
  });

  const settingsForm = useForm<z.infer<typeof settingsFormSchema>>({
    resolver: zodResolver(settingsFormSchema) as Resolver<{ seconds: number }>,
    defaultValues: {
      seconds: 300,
    },
  });
  useEffect(() => {
    if (taskInterVal) {
      settingsForm.reset({
        seconds: taskInterVal,
      });
    }
  }, [taskInterVal]);

  // 确认
  function handleOK() {
    settingsForm.handleSubmit(onSubmit)();
  }

  const { mutate: setTaskInterValMutate } = useMutation({
    mutationFn: setTaskInterVal,
  });

  function onSubmit(values: z.infer<typeof settingsFormSchema>) {
    setTaskInterValMutate(values, {
      onSuccess: () => {
        toast.success("设置成功");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });
  }

  return (
    <div className="p-5">
      <Card
        title="任务间隔设置"
        style={{ borderColor: "#f0f0f0", marginBottom: "20px" }}
      >
        <div className="space-y-6">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-gray-700">以</span>
            <Form layout="inline">
              <Controller
                control={settingsForm.control}
                name="seconds"
                render={({ field }) => (
                  <Input style={{ width: 80 }} {...field} />
                )}
              />
            </Form>
            <span className="text-gray-700">
              秒钟为周期，对时间进行切片，在某个周期内数据发生变化视为该周期内的活跃设备
            </span>
          </div>
        </div>
      </Card>
      <Card style={{ borderColor: "#f0f0f0", marginBottom: "20px" }}>
        <Button
          type="primary"
          className="cursor-pointer flex"
          onClick={handleOK}
        >
          保存设置
        </Button>
      </Card>
    </div>
  );
}
