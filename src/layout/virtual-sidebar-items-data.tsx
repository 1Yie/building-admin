import { DynamicIcon } from "lucide-react/dynamic";
import VirtualHome from "@/pages/virtual/home";
import VirtualLog from "@/pages/virtual/log";
import VirtualRealtime from "@/pages/virtual/realtime";
import VirtualControlPage from "@/pages/virtual/control";

interface SidebarItem {
  title: string;
  path: string;
  icon: Parameters<typeof DynamicIcon>[0]["name"];
  element?: React.ReactNode;
  permission?: string;
  children?: SidebarItem[];
}

const virtualSidebarItems: SidebarItem[] = [
  {
    title: "首页",
    path: "/virtual",
    icon: "house",
    element: <VirtualHome />,
  },
  {
    title: "楼宇管控",
    path: "/virtual/control",
    icon: "building-2",
    element: <VirtualControlPage />,
  },
  {
    title: "实时数据",
    path: "/virtual/realtime",
    icon: "chart-line",
    element: <VirtualRealtime />,
  },
  {
    title: "日志管理",
    path: "/virtual/log",
    icon: "file-text",
    element: <VirtualLog />,
  },
];

export default virtualSidebarItems;
