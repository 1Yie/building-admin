import { Tabs } from "antd";
import { TeachingSpacePage } from "./teaching-space";
import SourceApplicationPage from "./source-application";
import SourceReviewPage from "./source-review";
import { useAuth } from "@/hooks/use-auth";

export default function TeachingPage() {
  const { permissions, isLoggedIn } = useAuth();

  if (!isLoggedIn) return null;

  const tabItems = [
    permissions.includes("menu_building-教学科研-虚拟教学空间") && {
      key: "1",
      label: "虚拟教学空间",
      children: <TeachingSpacePage />,
    },
    permissions.includes("menu_building-教学科研-源码申请") && {
      key: "2",
      label: "源码申请",
      children: <SourceApplicationPage />,
    },
    permissions.includes("menu_building-教学科研-源码审核") && {
      key: "3",
      label: "源码审核",
      children: <SourceReviewPage />,
    },
  ].filter(Boolean);

  return (
    <div className="p-5">
      <Tabs items={tabItems} />
    </div>
  );
}
