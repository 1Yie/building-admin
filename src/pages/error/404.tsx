import { Ban } from "lucide-react";
import { Button } from "antd";
import { useNavigate } from "react-router";

export default function Error404() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center gap-2 justify-center h-screen bg-gray-100">
      <div className="flex flex-col items-center gap-2 mb-8">
        <Ban className="w-16 h-16 text-red-500 mb-1" />
        <h1 className="text-4xl font-bold">页面不存在</h1>
      </div>
      <p className="text-center mb-3">您访问的页面不存在</p>
      <Button type="dashed" onClick={() => navigate("/")}>
        返回首页
      </Button>
    </div>
  );
}
