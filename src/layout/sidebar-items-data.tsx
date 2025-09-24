import Account from "@/pages/account";
import Control from "@/pages/control";
import Home from "@/pages/home";
import Log from "@/pages/log";
import Personal from "@/pages/personal";
import Property from "@/pages/property";
import Realtime from "@/pages/realtime";
import Role from "@/pages/role";
import Settings from "@/pages/settings";
import Teaching from "@/pages/teaching";
import Evaluation from "@/pages/evaluation";

const sidebarItems = [
  {
    title: "首页",
    path: "/",
    icon: "house",
    element: <Home />,
    permission: "menu_building-首页",
  },
  {
    title: "楼宇资产",
    path: "/property",
    icon: "building",
    element: <Property />,
    permission: "menu_building-楼宇资产",
  },
  {
    title: "楼宇管控",
    path: "/control",
    icon: "building-2",
    element: <Control />,
    permission: "menu_building-楼宇管控",
  },
  {
    title: "实时数据",
    path: "/realtime",
    icon: "chart-line",
    element: <Realtime />,
    permission: "menu_building-实时数据",
  },
  {
    title: "日志管理",
    path: "/log",
    icon: "file-text",
    element: <Log />,
    permission: "menu_building-日志管理",
  },
  {
    title: "教学科研",
    path: "/teaching",
    icon: "graduation-cap",
    element: <Teaching />,
    permission: "menu_building-教学科研",
  },
  {
    title: "智能评估",
    path: "/evaluation",
    icon: "key-square",
    element: <Evaluation />,
    permission: "menu_building-智能评估",
  },
  {
    title: "角色管理",
    path: "/role",
    icon: "users",
    element: <Role />,
    permission: "menu_building-角色管理",
  },
  {
    title: "账号管理",
    path: "/account",
    icon: "user-round",
    element: <Account />,
    permission: "menu_building-账号管理",
  },
  {
    title: "个人中心",
    path: "/personal",
    icon: "user",
    element: <Personal />,
  },
  {
    title: "系统设置",
    path: "/settings",
    icon: "settings",
    element: <Settings />,
    permission: "menu_building-系统设置",
  },
];

export default sidebarItems;
