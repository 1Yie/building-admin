import type { RouteObject } from "react-router";
import { createBrowserRouter, Navigate } from "react-router";
import Layout from "@/layout";
import sidebarItems from "@/layout/sidebar-items-data";
import Login from "@/pages/login";
import Error403 from "@/pages/error/403";
import Error404 from "@/pages/error/404";

import { jwtDecode } from "jwt-decode";

// Token中的用户信息结构
interface TokenUserInfo {
  menu_building?: string[];
  authority?: string[];
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

// 根据 sidebarItems 构建子路由
const sidebarRoutes: RouteObject[] = sidebarItems.map((item) => ({
  path: item.path,
  element: (
    <AuthRoute element={item.element} permission={item.permission} />
  ),
  handle: { title: item.title },
}));

// 完整路由
const routes: RouteObject[] = [
  {
    path: "/login",
    element: <Login />,
  },
  {
    element: <Layout />,
    children: [...sidebarRoutes],
  },
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