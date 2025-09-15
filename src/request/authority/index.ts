import request from "@/request/index";
import { urls } from "@/request/urls";

export interface UserInfo {
  username: string;
  remark_name: string;
  role_list: string[];
}

export interface UserMenuBuilding {
  menu_building: string[];
}

interface LoginParams {
  username: string;
  password: string;
}

// 登录
export function login(data: LoginParams): Promise<{ token: string }> {
  return request.post(urls.authority.login, data);
}

// 退出
export function logout() {
  return request.post(urls.authority.logout);
}

// token 验证
export function tokenValidate(): Promise<{ isValid: boolean }> {
  return request.post(urls.authority.tokenValidate);
}
