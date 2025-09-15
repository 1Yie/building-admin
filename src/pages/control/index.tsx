import { Tabs } from "antd";
import ManualControl from "./ManualControl";
import RuleLinkageControl from "./RuleLinkageControl";
import { useAuth } from "@/hooks/use-auth";

export default function ControlPage() {
  const { permissions, isLoggedIn } = useAuth();

  if (!isLoggedIn) return null;

  const tabItems = [
    permissions.includes("menu_building-楼宇管控-规则联动控制") && {
      key: "1",
      label: "规则联动控制",
      children: <RuleLinkageControl />,
    },
    permissions.includes("menu_building-楼宇管控-手动控制") && {
      key: "2",
      label: "手动控制",
      children: <ManualControl />,
    },
  ].filter(Boolean);

  return (
    <div className="p-5">
      <Tabs items={tabItems} />
    </div>
  );
}
