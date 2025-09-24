import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { logout } from "@/request/authority";
import { Button } from "antd";
import { ShieldBan } from "lucide-react";

export default function Error403() {
  const navigate = useNavigate();

  const { mutate: logoutMutate, isPending } = useMutation({
    mutationFn: logout,
  });

  function handleLogout() {
    logoutMutate(undefined, {
      onSuccess: () => {
        localStorage.removeItem("token");
        navigate("/login");
      },
      onError: (error) => {
        console.error("退出登录失败:", error);
        localStorage.removeItem("token");
        navigate("/login");
      },
    });
  }

  return (
    <div className="flex flex-col items-center gap-2 justify-center h-screen bg-gray-100">
      <div className="flex flex-col items-center gap-2 mb-8">
        <ShieldBan className="w-16 h-16 text-red-500 mb-1" />
        <h1 className="text-4xl font-bold">权限不足</h1>
      </div>
      <p className="text-center mb-3">您没有访问此页面的权限</p>
      <Button type="dashed" onClick={() => navigate("/")}>
        返回首页
      </Button>
      <p className="text-sm py-1 p-0 m-0 text-gray-600">或者</p>
      <Button type="dashed" loading={isPending} onClick={handleLogout}>
        {isPending ? "正在退出..." : "退出登录"}
      </Button>
    </div>
  );
}
