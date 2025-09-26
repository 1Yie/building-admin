import { useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";

interface UserInfo {
  username: string;
  remark_name: string;
  menu_building?: string[];
  building?: {
    building?: {
      read: string[];
      update: string[];
    };
    sensor?: {
      control: string[];
      read: string[];
      update: string[];
    };
    space?: {
      read: string[];
      update: string[];
    };
    terminal?: {
      read: string[];
      update: string[];
    };
  };
  device?: string;
  role_list?: string[];
  is_manager?: number;
}

interface UseAuthResult {
  userInfo: UserInfo | null;
  permissions: string[];
  isLoggedIn: boolean;
  logout: () => void;
  // 具体权限访问器
  buildingPermissions: {
    read: string[];
    update: string[];
  };
  sensorPermissions: {
    control: string[];
    read: string[];
    update: string[];
  };
  spacePermissions: {
    read: string[];
    update: string[];
  };
  terminalPermissions: {
    read: string[];
    update: string[];
  };
  // 权限检查方法
  hasPermission: (type: 'building' | 'sensor' | 'space' | 'terminal', action: 'read' | 'update' | 'control', id: string) => boolean;
  hasBuildingAccess: (buildingId: string) => boolean;
  hasSensorAccess: (sensorId: string, action?: 'read' | 'update' | 'control') => boolean;
  hasSpaceAccess: (spaceId: string, action?: 'read' | 'update') => boolean;
  hasTerminalAccess: (terminalId: string, action?: 'read' | 'update') => boolean;
  // 获取所有权限ID的方法
  getAllSensorIds: () => string[];
  getAllSpaceIds: () => string[];
  getAllTerminalIds: () => string[];
  getAllBuildingIds: () => string[];
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

  const logout = () => {
    localStorage.removeItem("token");
    setUserInfo(null);
    setPermissions([]);
    setIsLoggedIn(false);
    window.location.href = "/login";
  };

// 构建具体权限访问器
   const buildingPermissions = {
     read: userInfo?.building?.building?.read || [],
     update: userInfo?.building?.building?.update || []
   };
   
   const sensorPermissions = {
     control: userInfo?.building?.sensor?.control || [],
     read: userInfo?.building?.sensor?.read || [],
     update: userInfo?.building?.sensor?.update || []
   };
   
   const spacePermissions = {
     read: userInfo?.building?.space?.read || [],
     update: userInfo?.building?.space?.update || []
   };
   
   const terminalPermissions = {
     read: userInfo?.building?.terminal?.read || [],
     update: userInfo?.building?.terminal?.update || []
   };

  // 权限检查方法
  const hasPermission = (
    type: 'building' | 'sensor' | 'space' | 'terminal', 
    action: 'read' | 'update' | 'control', 
    id: string
  ): boolean => {
    if (!userInfo) return false;
    
    switch (type) {
      case 'building':
        return action === 'control' ? false : (userInfo.building?.building?.[action] || []).includes(id);
      case 'sensor':
        return (userInfo.building?.sensor?.[action] || []).includes(id);
      case 'space':
        return action === 'control' ? false : (userInfo.building?.space?.[action] || []).includes(id);
      case 'terminal':
        return action === 'control' ? false : (userInfo.building?.terminal?.[action] || []).includes(id);
      default:
        return false;
    }
  };

  // 便捷的权限检查方法
  const hasBuildingAccess = (buildingId: string): boolean => {
    return buildingPermissions.read.includes(buildingId) || buildingPermissions.update.includes(buildingId);
  };

  const hasSensorAccess = (sensorId: string, action: 'read' | 'update' | 'control' = 'read'): boolean => {
    return hasPermission('sensor', action, sensorId);
  };

  const hasSpaceAccess = (spaceId: string, action: 'read' | 'update' = 'read'): boolean => {
    return hasPermission('space', action, spaceId);
  };

  const hasTerminalAccess = (terminalId: string, action: 'read' | 'update' = 'read'): boolean => {
    return hasPermission('terminal', action, terminalId);
  };

  // 获取所有权限ID的方法
  const getAllSensorIds = (): string[] => {
    const allIds = new Set<string>();
    sensorPermissions.control.forEach(id => allIds.add(id));
    sensorPermissions.read.forEach(id => allIds.add(id));
    sensorPermissions.update.forEach(id => allIds.add(id));
    return Array.from(allIds);
  };

  const getAllSpaceIds = (): string[] => {
    const allIds = new Set<string>();
    spacePermissions.read.forEach(id => allIds.add(id));
    spacePermissions.update.forEach(id => allIds.add(id));
    return Array.from(allIds);
  };

  const getAllTerminalIds = (): string[] => {
    const allIds = new Set<string>();
    terminalPermissions.read.forEach(id => allIds.add(id));
    terminalPermissions.update.forEach(id => allIds.add(id));
    return Array.from(allIds);
  };

  const getAllBuildingIds = (): string[] => {
    const allIds = new Set<string>();
    buildingPermissions.read.forEach(id => allIds.add(id));
    buildingPermissions.update.forEach(id => allIds.add(id));
    return Array.from(allIds);
  };

  return { 
    userInfo, 
    permissions, 
    isLoggedIn,
    buildingPermissions,
    sensorPermissions,
    spacePermissions,
    terminalPermissions,
    hasPermission,
    hasBuildingAccess,
    hasSensorAccess,
    hasSpaceAccess,
    hasTerminalAccess,
    getAllSensorIds,
    getAllSpaceIds,
    getAllTerminalIds,
    getAllBuildingIds,
    logout,
  };
}
