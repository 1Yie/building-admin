import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Button, Form, Input } from "antd";
import { Controller, useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { z } from "zod/v4";
import { login } from "@/request/authority";

const formSchema = z.object({
  username: z.string().min(2, {
    message: "用户名至少需要2个字",
  }),
  password: z.string().min(6, {
    message: "密码至少需要6个字",
  }),
});

export default function LoginPage() {
  const navigate = useNavigate();

  // 登录接口
  const { mutate, isPending } = useMutation({
    mutationFn: login,
  });

  // 登录表单
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // 提交表单
  function onSubmit(values: z.infer<typeof formSchema>) {
    mutate(values, {
      onSuccess: (data) => {
        localStorage.setItem("token", data.token);
        navigate("/");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });
  }

  return (
    <div className="flex justify-center items-center bg-gray-100 min-h-screen">
      <div className="space-y-8 bg-white shadow-md p-8 rounded-lg w-full max-w-md">
        <div className="text-center">
          <h1 className="font-bold text-3xl">登录</h1>
        </div>
        <Form layout="vertical" onFinish={handleSubmit(onSubmit)}>
          {/* 用户名 */}
          <Form.Item
            label="用户名"
            required
            validateStatus={errors.username ? "error" : ""}
            help={errors.username?.message}
          >
            <Controller
              name="username"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  className="text-base!"
                  allowClear
                  placeholder="请输入用户名"
                />
              )}
            />
          </Form.Item>

          {/* 密码 */}
          <Form.Item
            label="密码"
            required
            validateStatus={errors.password ? "error" : ""}
            help={errors.password?.message}
          >
            <Controller
              name="password"
              control={control}
              render={({ field }) => (
                <Input.Password
                  {...field}
                  className="text-base!"
                  allowClear
                  placeholder="请输入密码"
                />
              )}
            />
          </Form.Item>

          <Form.Item>
            <Button
              className="mt-5 w-full h-9! text-base!"
              loading={isPending}
              type="primary"
              htmlType="submit"
            >
              登录
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
}
