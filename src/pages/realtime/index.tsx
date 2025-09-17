import { Tabs } from "antd";
import Realtime from "./real-time";
import PropertyVis from "./property-vis";

import { useAuth } from "@/hooks/use-auth";
// import PropertyVisDemo from "./PropertyVisDemo";

export default function ControlPage() {
  const { permissions, isLoggedIn } = useAuth();

  if (!isLoggedIn) return null;

  const tabItems = [
    permissions.includes("menu_building-实时数据") && {
      key: "1",
      label: "实时数据",
      children: <Realtime />,
    },
    permissions.includes("menu_building-实时数据") && {
      key: "2",
      label: "实时资产",
      children: <PropertyVis />,
    },
    // permissions.includes("menu_building-实时数据") && {
    //   key: "3",
    //   label: "资产详情",
    //   children: <PropertyVisDemo />,
    // },
  ].filter(Boolean);

  return (
    <div className="p-5">
      <Tabs items={tabItems} />
    </div>
  );
}
