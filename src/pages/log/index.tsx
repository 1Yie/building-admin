import { Tabs } from "antd";
import LogManagement from "./LogManagement";
import ThresholdRule from "./ThresholdRule";
import { useAuth } from "@/hooks/use-auth";

export default function LogPage() {
  const { permissions, isLoggedIn } = useAuth();

  if (!isLoggedIn) return null;

  const tabItems = [
    permissions.includes("menu_building-日志管理-日志列表") && {
      key: "1",
      label: "日志管理",
      children: <LogManagement />,
    },
    permissions.includes("menu_building-日志管理-预警规则") && {
      key: "2",
      label: "预警规则",
      children: <ThresholdRule />,
    },
  ].filter(Boolean);

  return (
    <div className="p-5">
      <Tabs items={tabItems} />
    </div>
  );
}
