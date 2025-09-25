import { useEffect, useState, useRef } from "react";
import type { RouteObject } from "react-router";
import { createBrowserRouter, Navigate } from "react-router";
import Layout from "@/layout";
import VirtualLayout from "@/layout/virtual-layout";
import sidebarItems from "@/layout/sidebar-items-data";
import virtualSidebarItems from "@/layout/virtual-sidebar-items-data";
import Login from "@/pages/login";
import Error403 from "@/pages/error/403";
import Error404 from "@/pages/error/404";

import { Modal } from "antd";

import { jwtDecode } from "jwt-decode";

// Token中的用户信息结构
interface TokenUserInfo {
  menu_building?: string[];
  authority?: string[];
}

interface VirtualAuthRouteProps {
  children: React.ReactNode;
}

// 从token获取权限并转换格式
function getUserPermissions(): string[] {
  try {
    const token = localStorage.getItem("token");
    if (!token) return [];

    const decoded = jwtDecode<TokenUserInfo>(token);

    const menuPermissions = (decoded.menu_building || []).map(
      (p) => `menu_building-${p}`
    );
    const authorityPermissions = (decoded.authority || []).map(
      (p) => `authority-${p}`
    );

    return [...menuPermissions, ...authorityPermissions];
  } catch (error) {
    console.error("获取权限失败:", error);
    return [];
  }
}

// 虚拟教学空间权限路由守卫
export function VirtualAuthRoute({ children }: VirtualAuthRouteProps) {
  const [canEnter, setCanEnter] = useState<boolean | null>(null);
  const modalShown = useRef(false);

  useEffect(() => {
    const enterFlag = localStorage.getItem("enter_virtual_flag");

    if (enterFlag === "true") {
      setCanEnter(true);
    } else if (!modalShown.current) {
      modalShown.current = true;
      Modal.warning({
        title: "虚拟空间访问受限",
        content:
          "当前账号暂无可用虚拟空间，请联系上级管理员创建您的虚拟教学空间",
        okText: "我知道了",
        onOk: () => setCanEnter(false),
        maskClosable: false,
      });
    }
  }, []);

  if (canEnter === null) return null;
  if (!canEnter) return <Navigate to="/" replace />;

  return <>{children}</>;
}

// 权限路由守卫
function AuthRoute({
  element,
  permission,
}: {
  element: React.ReactNode;
  permission?: string;
}) {
  if (!permission) return <>{element}</>; // 不需要权限

  const userPermissions = getUserPermissions();

  // 支持多层匹配：完全匹配或前缀匹配
  const hasPermission = userPermissions.some(
    (p) => p === permission || p.startsWith(permission)
  );

  if (hasPermission) return <>{element}</>;
  return <Navigate to="/403" replace />;
}

function buildRoutes(items: any[]): RouteObject[] {
  return items.flatMap((item) => {
    const route = item.element
      ? [
          {
            path: item.path || undefined, // 空字符串不要当作 path
            index: item.path === "" ? true : undefined, // 如果是首页，则设 index
            element: (
              <AuthRoute element={item.element} permission={item.permission} />
            ),
            handle: { title: item.title },
          },
        ]
      : [];

    const childRoutes = item.children ? buildRoutes(item.children) : [];
    return [...route, ...childRoutes];
  });
}

const sidebarRoutes: RouteObject[] = buildRoutes(sidebarItems);
const virtualSidebarRoutes: RouteObject[] = buildRoutes(virtualSidebarItems);

const routes: RouteObject[] = [
  {
    path: "/login",
    element: <Login />,
  },
  {
    element: <Layout />,
    children: [...sidebarRoutes],
  },
  // {
  //   path: "/virtual",
  //   element: (
  //     <VirtualAuthRoute>
  //       <VirtualLayout />
  //     </VirtualAuthRoute>
  //   ),
  //   children: [...virtualSidebarRoutes],
  // },
  {
    path: "/403",
    element: <Error403 />,
  },
  {
    path: "*",
    element: <Error404 />,
  },
];

const router = createBrowserRouter(routes);
export default router;
