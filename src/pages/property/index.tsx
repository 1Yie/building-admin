import { Tabs } from "antd";
import PropertyMain from "./PropertyMain";
import PropertyVis from "./PropertyVis";

import { useAuth } from "@/hooks/use-auth";

export default function PropertyPage() {
  const { permissions, isLoggedIn } = useAuth();

  if (!isLoggedIn) return null;

  const tabItems = [
    permissions.includes("menu_building-楼宇资产") && {
      key: "1",
      label: "资产列表",
      children: <PropertyMain />,
    },

    permissions.includes("menu_building-楼宇资产") && {
      key: "2",
      label: "资产可视化",
      children: <PropertyVis />,
    },
  ].filter(Boolean);

  return (
    <div className="p-5">
      <Tabs items={tabItems} />
    </div>
  );
}
