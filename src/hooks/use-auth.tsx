import { useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";

interface UserInfo {
  username: string;
  remark_name: string;
  menu_building?: string[];
}

interface UseAuthResult {
  userInfo: UserInfo | null;
  permissions: string[];
  isLoggedIn: boolean;
}

/**
 * Hook：解析 token，返回用户信息、权限和登录状态
 */
export function useAuth(): UseAuthResult {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setUserInfo(null);
      setPermissions([]);
      setIsLoggedIn(false);
      return;
    }

    try {
      const decoded = jwtDecode<UserInfo>(token);
      setUserInfo(decoded);
      setPermissions((decoded.menu_building || []).map((p) => `menu_building-${p}`));
      setIsLoggedIn(true);
    } catch (err) {
      console.error("解码 token 失败", err);
      setUserInfo(null);
      setPermissions([]);
      setIsLoggedIn(false);
    }
  }, []);

  return { userInfo, permissions, isLoggedIn };
}
