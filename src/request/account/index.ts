import request from "@/request";
import type { RoleUser } from "@/request/role";
import { urls } from "@/request/urls";

// 账号表格
interface AccountTableListParams {
  currentPage: number;
  pageSize: number;
  username: string;
}

export interface AccountTableListResponse {
  userInfoList: {
    username: string;
    remarkName: string;
    phone: string;
  }[];
  page: {
    currentPage: number;
    pageSize: number;
    totalSize: number;
  };
}

export type PermissionActionItem = {
  resourceType: string;
  permissionName: string;
  action: string;
  department: string;
};

type PermissionPayload = {
  buildingPermissions?: PermissionActionItem[];
  dataPermissions?: PermissionActionItem[];
  applicationPermissions?: PermissionActionItem[];
  etlPermissions?: PermissionActionItem[];
  tablePermissions?: PermissionActionItem[];
  equipPermissions?: PermissionActionItem[];
  filePermissions?: PermissionActionItem[];
  menuPermissions?: PermissionActionItem[];
};

export function getAccountTableList(
  data: AccountTableListParams
): Promise<AccountTableListResponse> {
  return request({
    url: urls.account.accountTableList,
    method: "POST",
    data,
  });
}

// 用户所属角色
export function getRoleUserList(
  username: string
): Promise<{ roleList: RoleUser[] }> {
  return request({
    url: urls.account.roleUserList,
    method: "POST",
    data: {
      username,
    },
  });
}

// 重置密码
interface AccountPasswordResetParams {
  username: string;
  newPassword: string;
}
export function accountPasswordReset(data: AccountPasswordResetParams) {
  return request.post(urls.account.accountPasswordReset, data);
}

// 删除账号
export function accountDelete(username: string) {
  return request({
    url: urls.account.accountDelete,
    method: "POST",
    data: {
      username,
    },
  });
}

// 创建账号
interface AccountCreateParams {
  username: string;
  password: string;
  remarkName: string;
  phone?: string;
  department?: string;
}
export function accountCreate(data: AccountCreateParams) {
  return request.post(urls.account.accountCreate, {
    ...data,
    department: "test",
  });
}

// 角色列表
export function getRoleList(): Promise<{ roleName: string }[]> {
  return request({
    url: urls.role.roleList,
    method: "POST",
    data: {
      username: "",
    },
  });
}

// 绑定角色
export function accountRoleUpdate({
  username,
  roleNames,
}: {
  username: string;
  roleNames: string[];
}) {
  return request({
    method: "post",
    url: urls.account.accountRoleUpdate,
    data: {
      username,
      roleNames,
    },
  });
}

// 编辑用户
export function accountEdit({
  username,
  remarkName,
  phone,
  auditUser,
}: {
  username: string;
  remarkName: string;
  phone?: string;
  auditUser?: string;
}) {
  return request({
    method: "post",
    url: urls.account.accountEdit,
    data: {
      username,
      remarkName,
      phone,
      auditUser,
    },
  });
}

export function permissionList({
  department,
  username,
}: {
  department?: string;
  username?: string;
}) {
  return request({
    method: "post",
    url: urls.account.accountPermission,
    data: {
      department,
      username,
    },
  });
}

export function accountPermissionUpdate({
  username,
  permissions,
}: {
  username: string;
  permissions: PermissionPayload;
}) {
  return request({
    method: "post",
    url: urls.account.accountPermissionUpdate,
    data: { username, ...permissions },
  });
}
