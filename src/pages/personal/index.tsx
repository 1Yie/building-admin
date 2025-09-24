import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Button, Card, Form, Input, Modal } from "antd";
import { jwtDecode } from "jwt-decode";
import { useEffect, useId, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import z from "zod/v4";
import { accountPasswordReset } from "@/request/account";
import type { UserInfo } from "@/request/authority";
import { logout } from "@/request/authority";
import { SkinFilled } from "@ant-design/icons";

const passwordFormSchema = z
  .object({
    "password-old": z.string().min(6, {
      message: "密码至少需要6个字",
    }),
    "password-new": z.string().min(6, {
      message: "密码至少需要6个字",
    }),
    "password-new-confirm": z.string().min(6, {
      message: "密码至少需要6个字",
    }),
  })
  .refine((data) => data["password-new"] === data["password-new-confirm"], {
    message: "两次输入的密码不一致",
    path: ["password-new-confirm"],
  });

export default function PersonalPage() {
  const navigate = useNavigate();

  // 用户信息
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const token = localStorage.getItem("token");
  useEffect(() => {
    if (token) {
      const decoded = jwtDecode(token);
      console.log(decoded);
      setUserInfo(decoded as UserInfo);
    }
  }, [token]);

  // 退出登录
  const { mutate: logoutMutate } = useMutation({
    mutationFn: logout,
  });
  function handleLogout() {
    logoutMutate(undefined, {
      onSuccess: () => {
        localStorage.removeItem("token");
        navigate("/login");
      },
    });
  }

  // 修改密码表单
  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<z.infer<typeof passwordFormSchema>>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      "password-old": "",
      "password-new": "",
      "password-new-confirm": "",
    },
  });

  // 修改密码弹窗
  const [dialogOpen, setDialogOpen] = useState(false);
  const formID = useId();
  function onDialogOpenChange(open: boolean) {
    setDialogOpen(open);
    if (!open) {
      reset();
    }
  }

  // 提交表单
  const { mutate: updatePasswordMutate } = useMutation({
    mutationFn: accountPasswordReset,
  });
  function onSubmit(values: z.infer<typeof passwordFormSchema>) {
    const username = userInfo?.username;
    const { "password-new": newPassword } = values;
    if (!username) {
      return;
    }
    updatePasswordMutate(
      { username, newPassword },
      {
        onSuccess: () => {
          setDialogOpen(false);
          toast.success("修改密码成功");
          reset();
          localStorage.removeItem("token");
          navigate("/login");
        },
      }
    );
  }

  return (
    <div className="p-5 space-y-5">
      <Card
        title={
          <div className="flex justify-between items-center">
            <span>
              <SkinFilled className="mr-1" />
              个人信息
            </span>
          </div>
        }
        style={{ borderColor: "#f0f0f0", marginBottom: "20px" }}
      >
        <div className="space-y-4">
          <div className="flex items-center">
            <span className="font-medium w-20">账号名称：</span>
            <span className="text-gray-700">{userInfo?.remark_name}</span>
          </div>
          <div className="flex items-center">
            <span className="font-medium w-20">角色：</span>
            <div className="flex gap-2">
              {userInfo?.role_list.map((role) => (
                <span
                  key={role}
                  className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm"
                >
                  {role}
                </span>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <Card style={{ borderColor: "#f0f0f0", marginBottom: "20px" }}>
        <div className="flex gap-4">
          <Button type="primary" onClick={() => setDialogOpen(true)}>
            修改密码
          </Button>
          <Button color="danger" variant="solid" onClick={handleLogout}>
            退出登陆
          </Button>
        </div>
      </Card>

      {/* 修改密码弹窗 */}
      <Modal
        className="w-200!"
        centered
        title="修改密码"
        open={dialogOpen}
        onCancel={() => onDialogOpenChange(false)}
        footer={[
          <Button
            key={"cancel"}
            className="cursor-pointer"
            onClick={() => onDialogOpenChange(false)}
          >
            取消
          </Button>,
          <Button
            key={"submit"}
            type="primary"
            htmlType="submit"
            className="cursor-pointer"
            form={formID}
          >
            确定
          </Button>,
        ]}
      >
        <div className="mt-5">
          <Form
            layout="horizontal"
            id={formID}
            onFinish={handleSubmit(onSubmit)}
          >
            <Form.Item
              label="原密码"
              required
              validateStatus={errors["password-old"] ? "error" : ""}
              help={errors["password-old"]?.message}
            >
              <Controller
                name="password-old"
                control={control}
                render={({ field }) => (
                  <Input.Password
                    {...field}
                    allowClear
                    placeholder="请输入原密码"
                  />
                )}
              />
            </Form.Item>
            <Form.Item
              label="新密码"
              validateStatus={errors["password-new"] ? "error" : ""}
              help={errors["password-new"]?.message}
              required
            >
              <Controller
                name="password-new"
                control={control}
                render={({ field }) => (
                  <Input.Password
                    {...field}
                    allowClear
                    placeholder="请输入新密码"
                  />
                )}
              />
            </Form.Item>
            <Form.Item
              label="确认新密码"
              validateStatus={errors["password-new-confirm"] ? "error" : ""}
              help={errors["password-new-confirm"]?.message}
              required
            >
              <Controller
                name="password-new-confirm"
                control={control}
                render={({ field }) => (
                  <Input.Password
                    {...field}
                    allowClear
                    placeholder="确认新密码"
                  />
                )}
              />
            </Form.Item>
          </Form>
        </div>
      </Modal>
    </div>
  );
}
