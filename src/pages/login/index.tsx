import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Button, Form, Input } from "antd";
import { Controller, useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { z } from "zod/v4";
import { login } from "@/request/authority";
import { LoadingOutlined } from "@ant-design/icons";

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
    <div className="flex min-h-screen bg-slate-50">
      {/* 左侧信息区域 */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-50 to-indigo-100 relative overflow-hidden">
        <div className="flex flex-col justify-center px-16 py-20 relative z-10">
          <div className="mb-12">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mr-4">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-slate-800">智慧楼宇</h1>
            </div>

            <p className="text-xl text-slate-600 mb-8">能源管理系统</p>

            <div className="space-y-4">
              <div className="flex items-center text-slate-600">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-4"></div>
                <span>实时传感器数据监控</span>
              </div>
              <div className="flex items-center text-slate-600">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-4"></div>
                <span>多楼宇统一管理</span>
              </div>
              <div className="flex items-center text-slate-600">
                <div className="w-2 h-2 bg-orange-500 rounded-full mr-4"></div>
                <span>异常报警与处理</span>
              </div>
            </div>
          </div>
        </div>

        {/* 装饰性传感器图标 */}
        <div className="absolute bottom-10 right-10 opacity-10">
          <div className="grid grid-cols-3 gap-4">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="w-8 h-8 bg-blue-600 rounded-full"></div>
            ))}
          </div>
        </div>
      </div>

      {/* 右侧登录表单 */}
      <div className="flex-1 flex items-center justify-center px-8">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="lg:hidden flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">系统登录</h2>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <Form layout="vertical" onFinish={handleSubmit(onSubmit)}>
              <Form.Item
                label={
                  <span className="text-slate-700 font-medium">用户名</span>
                }
                validateStatus={errors.username ? "error" : ""}
                help={errors.username?.message}
                className="mb-6"
              >
                <Controller
                  name="username"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      size="large"
                      className="rounded-xl border-slate-200 hover:border-blue-400 focus:border-blue-500"
                      placeholder="请输入用户名"
                    />
                  )}
                />
              </Form.Item>

              <Form.Item
                label={<span className="text-slate-700 font-medium">密码</span>}
                validateStatus={errors.password ? "error" : ""}
                help={errors.password?.message}
                className="mb-8"
              >
                <Controller
                  name="password"
                  control={control}
                  render={({ field }) => (
                    <Input.Password
                      {...field}
                      size="large"
                      className="rounded-xl border-slate-200 hover:border-blue-400 focus:border-blue-500"
                      placeholder="请输入密码"
                    />
                  )}
                />
              </Form.Item>

              <Form.Item>
                <Button
                  className="w-full h-12 text-base font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 border-0"
                  loading={isPending}
                  type="primary"
                  htmlType="submit"
                  size="large"
                  icon={
                    isPending ? (
                      <LoadingOutlined
                        style={{ fontSize: 16, color: "#fff" }}
                        spin
                      />
                    ) : undefined
                  }
                >
                  登录
                </Button>
              </Form.Item>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
}
