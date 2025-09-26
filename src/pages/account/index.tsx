import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Popconfirm, Table, Modal, Card } from "antd";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import z, { check } from "zod/v4";
import type { AccountTableListResponse } from "@/request/account";
import {
  accountCreate,
  accountDelete,
  accountEdit,
  accountPasswordReset,
  accountPermissionUpdate,
  accountRoleUpdate,
  getAccountTableList,
  getRoleList,
  getRoleUserList,
  permissionList,
} from "@/request/account";
import type { RoleUser } from "@/request/role";
import { Button, Tag, Input, Select, Switch, Form, Spin } from "antd";
import { PermissionTree } from "@/components/permission-tree";
import type { TreeDataNode } from "antd";

import type { PaginationType } from "@/types";
import type { PermissionResponse } from "@/components/permission-tree";
import { PlusOutlined, IdcardFilled  } from "@ant-design/icons";
import type { ColumnType } from "antd/es/table";
import { useAuth } from "@/hooks/use-auth";

export default function AccountPage() {
  const { userInfo, logout } = useAuth();
  // 转换权限数据格式为Tree组件所需格式
  const transformPermissionData = (data: any): TreeDataNode[] => {
    if (!data) return [];
    const dataArray = Array.isArray(data) ? data : [data];

    return dataArray.map((item: any) => ({
      key: item.key,
      title: item.title,
      children: Array.isArray(item.children)
        ? transformPermissionData(item.children)
        : [],
    }));
  };

  // 楼宇权限相关状态
  const [permissionData, setPermissionData] = useState<TreeDataNode[]>([]);
  const [permissionKeyMap, setPermissionKeyMap] = useState<
    Record<string, string>
  >({});
  const [checkedKeys, setCheckedKeys] = useState<string[]>([]);
  const [currentUsername, setCurrentUsername] = useState<string>("");
  const [permissionLoading, setPermissionLoading] = useState<boolean>(false);
  const [permissionError, setPermissionError] = useState<string>("");

  // 获取权限列表
  const { mutate: getPermissionMutate, mutateAsync: getPermissionMutateAsync } =
    useMutation({
      mutationFn: permissionList,
      onMutate: () => {
        setPermissionLoading(true);
        setPermissionError("");
        setPermissionData([]);
        setPermissionKeyMap({});
        setCheckedKeys([]);
      },
      onSuccess: (data) => {
        const rawData = data?.data || [];
        const transformedData = transformPermissionData(rawData);

        setPermissionData(transformedData);
        setPermissionKeyMap(data?.data?.keyMap || {});

        const checked = data?.data?.result?.check || [];
        setCheckedKeys(checked);
      },
      onError: (error) => {
        setPermissionError("获取权限失败，请重试");
        console.error("获取权限失败:", error);
      },
      onSettled: () => {
        setPermissionLoading(false);
      },
    });

  // 获取权限keyMap和权限树
  // function getPermissionKeyMap() {
  //   getPermissionMutate({ department: "" });
  // }

  // 初始化时获取权限树数据
  // useEffect(() => {
  //   getPermissionKeyMap();
  // }, []);

  // 表格列
  const columns = [
    {
      title: "账号名称",
      dataIndex: "username",
      key: "username",
      align: "center",
    },
    {
      title: "账号别名",
      dataIndex: "remarkName",
      key: "remarkName",
      align: "center",
    },
    {
      title: "所属角色",
      dataIndex: "role",
      key: "role",
      align: "center",
      render: (_: any, record: any) => {
        const roleUserList = userRoleMap[record.username];
        if (roleUserList) {
          return (
            <div className="flex gap-2">
              {roleUserList.map((roleUser: RoleUser) => (
                <Tag color="blue" key={roleUser.roleName}>
                  {roleUser.roleName}
                </Tag>
              ))}
            </div>
          );
        } else {
          return "";
        }
      },
    },
    {
      title: "操作",
      key: "action",
      align: "center",
      render: (_: any, record: any) => (
        <div className="space-x-2">
          <Button
            variant="link"
            onClick={() => handleOpenResetPasswordDialog(record.username)}
            className="text-blue-500 cursor-pointer"
          >
            重置密码
          </Button>
          <Button
            variant="link"
            className="text-blue-500 cursor-pointer"
            onClick={() => handleOpenEditDialog(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除这个角色吗?"
            onConfirm={() => handleDelete(record.username)}
            okText="确定"
            cancelText="取消"
          >
            <Button variant="link" className="cursor-pointer" danger>
              删除
            </Button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  // 分页
  const [pageParams, setPageParams] = useState<PaginationType>({
    current: 1,
    pageSize: 10,
    showSizeChanger: false,
  });
  function handlePaginationChange(pagination: PaginationType) {
    setPageParams(pagination);
  }

  // 分页onChange处理函数
  const onPageChange = (page: number, pageSize: number) => {
    setPageParams({
      ...pageParams,
      current: page,
      pageSize: pageSize,
    });
  };

  // 初始请求表格数据
  const {
    isPending: tablePending,
    data: tableData,
    refetch: tableRefetch,
  } = useQuery({
    queryKey: ["accountTableList", pageParams?.current, pageParams?.pageSize],
    queryFn: () =>
      getAccountTableList({
        currentPage: pageParams.current,
        pageSize: pageParams.pageSize,
        username: "",
      }),
  });
  useEffect(() => {
    if (tableData) {
      setPageParams({
        ...pageParams,
        total: tableData.page.totalSize,
      });
      getUserRoleMap(tableData);
    }
  }, [tableData]);

  // 获取用户角色列表
  const { mutateAsync: roleUserMutateAsync } = useMutation({
    mutationFn: (username: string) => getRoleUserList(username),
  });
  // 账号角色
  const [userRoleMap, setUserRoleMap] = useState<Record<string, RoleUser[]>>(
    {}
  );
  async function getUserRoleMap(tableData: AccountTableListResponse) {
    const newMap: Record<string, RoleUser[]> = {};
    const promises = tableData.userInfoList.map(async (userInfo) => {
      const username = userInfo.username;
      if (!newMap[username]) {
        const res = await roleUserMutateAsync(username);
        newMap[username] = res.roleList;
      }
    });
    await Promise.all(promises);
    setUserRoleMap(newMap);
  }

  // 删除角色
  const { mutate: deleteAccountMutate } = useMutation({
    mutationFn: accountDelete,
  });
  function handleDelete(roleName: string) {
    deleteAccountMutate(roleName, {
      onSuccess: () => {
        toast.success("删除成功");
        tableRefetch();
      },
    });
  }

  // 重置密码
  const passwordFormSchema = z
    .object({
      username: z.string(),
      "password-new": z.string().min(6, {
        message: "密码至少需要6个字",
      }),
      "password-new-confirm": z.string().min(6, {
        message: "密码至少需要6个字",
      }),
    })
    .refine((data) => data["password-new"] === data["password-new-confirm"], {
      message: "两次输入的密码不一致",
      path: ["password-new-confirm"],
    });
  const passwordForm = useForm<z.infer<typeof passwordFormSchema>>({
    resolver: zodResolver(passwordFormSchema as any),
    defaultValues: {
      username: "",
      "password-new": "",
      "password-new-confirm": "",
    },
  });

  function handleOpenResetPasswordDialog(username: string) {
    passwordForm.setValue("username", username);
    setPasswordDialogOpen(true);
  }

  const { mutateAsync: updatePermissionsMutate } = useMutation({
    mutationFn: accountPermissionUpdate,
  });

  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  function handleResetPassword() {
    passwordForm.handleSubmit(onResetPasswordSubmit)();
  }

  const { mutate: updatePasswordMutate } = useMutation({
    mutationFn: accountPasswordReset,
  });
  function onResetPasswordSubmit(values: z.infer<typeof passwordFormSchema>) {
    const { "password-new": newPassword, username } = values;
    updatePasswordMutate(
      { username, newPassword },
      {
        onSuccess: () => {
          setPasswordDialogOpen(false);
          toast.success("修改密码成功");
          passwordForm.reset();
        },
      }
    );
  }

  // 新增账号
  // 表单
  const accountFormSchema = z.object({
    username: z.string().min(1, "账号名称不能为空"),
    remarkName: z.string().min(1, "账号别名不能为空"),
    password: z.string().min(6, "密码至少需要6个字"),
    phone: z.string().optional(),
    auditUser: z.string().optional(),
    role: z.array(z.string()).optional(),
    department: z.string().optional(),
    buildingPermissions: z
      .object({
        checkedKeys: z.array(z.string()),
        checkedActions: z.record(z.string(), z.array(z.string())),
      })
      .optional(),
  });
  const accountForm = useForm<z.infer<typeof accountFormSchema>>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: {
      username: "",
      remarkName: "",
      password: "",
      phone: "",
      auditUser: "",
      department: "",
      role: [],
      buildingPermissions: {
        checkedKeys: [],
        checkedActions: {},
      },
    },
  });

  const editAccountFormSchema = z.object({
    username: z.string().min(1, "账号名称不能为空"),
    remarkName: z.string().min(1, "账号别名不能为空"),
    phone: z.string().optional(),
    auditUser: z.string().optional(),
    role: z.array(z.string()).optional(),
    department: z.string().optional(),
    buildingPermissions: z
      .object({
        checkedKeys: z.array(z.string()),
        checkedActions: z.record(z.string(), z.array(z.string())),
      })
      .optional(),
  });
  const editAccountForm = useForm<z.infer<typeof editAccountFormSchema>>({
    resolver: zodResolver(editAccountFormSchema),
    defaultValues: {
      username: "",
      remarkName: "",
      phone: "",
      auditUser: "",
      role: [],
      department: "",
      buildingPermissions: {
        checkedKeys: [],
        checkedActions: {},
      },
    },
  });
  // 打开Dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [addOrUpdate, setAddOrUpdate] = useState<"add" | "update">("add");

  function onDialogOpenChange(open: boolean) {
    setDialogOpen(open);
    if (!open) {
      accountForm.reset();
    }
  }

  // 初始化楼宇权限
  async function initBuildingPermissions(
    department: string,
    username: string
  ): Promise<{
    checkedKeys: string[];
    checkedActions: Record<string, string[]>;
  }> {
    try {
      const res = (await getPermissionMutateAsync({
        department,
        username,
      })) as unknown as PermissionResponse;

      console.log("res:", res);

      const checkedKeys: string[] = res.check || [];
      const checkedActions: Record<string, string[]> = {};

      Object.entries(res.actionMap || {}).forEach(([key, actionStr]) => {
        checkedActions[key] = String(actionStr).split(",");
      });

      console.log("checkedKeys:", checkedKeys);
      console.log("checkedActions:", checkedActions);

      return { checkedKeys, checkedActions };
    } catch (err) {
      console.error("获取楼宇权限失败", err);
      toast.error("获取楼宇权限失败");
      return { checkedKeys: [], checkedActions: {} };
    }
  }

  // 角色列表
  const { data: roleListOption } = useQuery({
    queryKey: ["getRoleList"],
    queryFn: getRoleList,
  });

  // 新增账号
  const { mutateAsync: accountCreateMutate } = useMutation({
    mutationFn: accountCreate,
  });
  async function handleOpenAddDialog() {
    setAddOrUpdate("add");
    setDialogOpen(true);
    accountForm.reset(); // 清空表单

    const { checkedKeys, checkedActions } = await initBuildingPermissions(
      "test", // TODO: 写死测试
      "admin"
    );

    accountForm.setValue("buildingPermissions", {
      checkedKeys,
      checkedActions,
    });
  }

  // 编辑账号
  const { mutateAsync: accountEditMutate } = useMutation({
    mutationFn: accountEdit,
  });
  async function handleOpenEditDialog(record: any) {
    setAddOrUpdate("update");
    setDialogOpen(true);
    setCurrentUsername(record.username);

    // 回填基础信息
    const resRole = await getRoleUserList(record.username);
    const roleNames = resRole.roleList.map((r) => r.roleName);

    editAccountForm.reset({
      username: record.username,
      remarkName: record.remarkName,
      phone: record.phone,
      auditUser: record.auditUser || "",
      role: roleNames,
    });

    accountForm.setValue("role", roleNames);

    // 初始化楼宇权限
    const { checkedKeys, checkedActions } = await initBuildingPermissions(
      "test", // TODO: 写死测试
      record.username
    );

    editAccountForm.setValue("buildingPermissions", {
      checkedKeys,
      checkedActions,
    });

    // 请求权限树数据
    getPermissionMutate({ department: "test", username: record.username });
  }

  // 绑定账号
  const { mutateAsync: accountRoleUpdateMutate } = useMutation({
    mutationFn: accountRoleUpdate,
  });

  //   // 提交表单
  //   function handleOK() {
  //     accountForm.handleSubmit(onSubmit)();
  //   }

  const handleSubmitCommon = async <
    T extends
      | z.infer<typeof accountFormSchema>
      | z.infer<typeof editAccountFormSchema>
  >(
    values: T,
    isEdit: boolean
  ) => {
    try {
      const username = isEdit ? currentUsername : values.username;

      // 创建或更新账号信息
      if (!isEdit) {
        const { username, remarkName, password, phone, department } =
          values as z.infer<typeof accountFormSchema>;
        await accountCreateMutate({
          username,
          remarkName,
          password,
          phone,
          department,
        });
      } else {
        await accountEditMutate({
          username: values.username,
          remarkName: values.remarkName,
          phone: values.phone,
          auditUser: values.auditUser,
        });
      }

      // 更新账号角色
      await accountRoleUpdateMutate({
        username,
        roleNames: values.role ?? [],
      });

      // 生成 buildingPermissions，供后端接口使用
      const buildingPermissionsRaw: Record<string, string[]> =
        (values as any).buildingPermissions?.checkedActions || {};

      const buildingPermissions = Object.entries(buildingPermissionsRaw)
        .filter(([_, actions]) => actions.length > 0)
        .map(([key, actions]) => {
          let resourceType:
            | "building"
            | "building_space"
            | "building_space_gateway"
            | "building_space_gateway_sensor" = "building";

          if (key.startsWith("building-KJ")) resourceType = "building_space";
          else if (key.startsWith("building-ZD"))
            resourceType = "building_space_gateway";
          else if (key.startsWith("building-CGQ"))
            resourceType = "building_space_gateway_sensor";

          // 去掉 building- 前缀
          const permissionName = key.split("-")[1];

          return {
            resourceType,
            permissionName,
            action: actions.join(","),
            department: "test",
          };
        });

      console.log("提交 buildingPermissions:", buildingPermissions);
      // 调用权限更新接口
      await updatePermissionsMutate({
        username,
        permissions: {
          buildingPermissions,
          dataPermissions: [],
          applicationPermissions: [],
          etlPermissions: [],
          tablePermissions: [],
          equipPermissions: [],
          filePermissions: [],
          menuPermissions: [],
        },
      });

      // 刷新表格
      await tableRefetch();
      if (tableData?.userInfoList) {
        await getUserRoleMap(tableData);
      }

      // 提示成功并关闭弹窗
      toast.success(isEdit ? "修改成功" : "新增成功");
      if (isEdit && userInfo?.username === username) {
        Modal.confirm({
          title: "权限更新",
          content: "您的账号权限已更新，请重新登录。",
          okText: "重新登录",
          cancelText: "取消",
          onOk: () => {
            logout();
          },
        });
      }
      setDialogOpen(false);
      accountForm.reset();
    } catch (err) {
      console.error("提交失败", err);
      toast.error("操作失败，请重试");
    }
  };

  return (
    <div className="p-5 space-y-5">
      <Card
        title={
          <div className="flex justify-between items-center">
            <span>
              <IdcardFilled className="mr-1" />
              账号管理
            </span>
          </div>
        }
        style={{ borderColor: "#f0f0f0", marginBottom: "20px" }}
        extra={
          <Button
            type="primary"
            className="cursor-pointer"
            onClick={handleOpenAddDialog}
            icon={<PlusOutlined />}
          >
            新增
          </Button>
        }
      >
        <Table
          dataSource={tableData?.userInfoList.filter(
            (user) => user.username !== userInfo?.username
          )}
          columns={
            columns as ColumnType<{
              username: string;
              remarkName: string;
              phone: string;
              role?: string;
              auditUser?: string;
            }>[]
          }
          loading={tablePending}
          onChange={(pagination) =>
            onPageChange(pagination.current || 1, pagination.pageSize || 10)
          }
        />
      </Card>

      <Modal
        open={passwordDialogOpen}
        title="修改密码"
        onCancel={() => setPasswordDialogOpen(false)}
        footer={
          <div className="mt-10 flex justify-end gap-4">
            <Button
              type="default"
              className="cursor-pointer"
              onClick={() => setPasswordDialogOpen(false)}
            >
              取消
            </Button>
            <Button
              htmlType="button"
              type="primary"
              className="cursor-pointer"
              onClick={handleResetPassword}
            >
              确定
            </Button>
          </div>
        }
        width={720}
      >
        <div className="mt-5">
          <Form layout="horizontal" className="space-y-7">
            <Controller
              control={passwordForm.control}
              name="username"
              render={({ field }) => (
                <Form.Item
                  label="账号名称"
                  validateStatus={
                    passwordForm.formState.errors.username?.message
                      ? "error"
                      : ""
                  }
                  help={passwordForm.formState.errors.username?.message}
                >
                  <Input {...field} type="text" disabled className="w-80 h-8" />
                </Form.Item>
              )}
            />

            <Controller
              control={passwordForm.control}
              name="password-new"
              render={({ field }) => (
                <Form.Item
                  label="新密码"
                  required
                  validateStatus={
                    passwordForm.formState.errors["password-new"]?.message
                      ? "error"
                      : ""
                  }
                  help={passwordForm.formState.errors["password-new"]?.message}
                >
                  <Input {...field} type="password" className="w-80 h-8" />
                </Form.Item>
              )}
            />

            <Controller
              control={passwordForm.control}
              name="password-new-confirm"
              render={({ field }) => (
                <Form.Item
                  label="确认新密码"
                  required
                  validateStatus={
                    passwordForm.formState.errors["password-new-confirm"]
                      ?.message
                      ? "error"
                      : ""
                  }
                  help={
                    passwordForm.formState.errors["password-new-confirm"]
                      ?.message
                  }
                >
                  <Input {...field} type="password" className="w-80 h-8" />
                </Form.Item>
              )}
            />
          </Form>
        </div>
      </Modal>

      <Modal
        open={dialogOpen}
        title={addOrUpdate === "add" ? "新增账号" : "更新账号"}
        onCancel={() => onDialogOpenChange(false)}
        footer={
          <div className="mt-10 flex justify-end gap-4">
            <Button
              type="default"
              className="cursor-pointer"
              onClick={() => onDialogOpenChange(false)}
            >
              取消
            </Button>
            <Button
              htmlType="button"
              type="primary"
              className="cursor-pointer"
              onClick={
                addOrUpdate === "add"
                  ? accountForm.handleSubmit((values) =>
                      handleSubmitCommon(values, false)
                    )
                  : editAccountForm.handleSubmit((values) =>
                      handleSubmitCommon(values, true)
                    )
              }
            >
              确定
            </Button>
          </div>
        }
        width={720}
      >
        <div className="mt-5">
          {addOrUpdate === "add" && (
            <Form
              layout="horizontal"
              className="space-y-7"
              onFinish={accountForm.handleSubmit((values) =>
                handleSubmitCommon(values, false)
              )}
            >
              <Controller
                control={accountForm.control}
                name="username"
                render={({ field, fieldState }) => (
                  <Form.Item
                    label="账号名称"
                    required
                    validateStatus={fieldState.error ? "error" : ""}
                    help={fieldState.error?.message}
                  >
                    <Input {...field} className="w-80 h-8" />
                  </Form.Item>
                )}
              />
              <Controller
                control={accountForm.control}
                name="remarkName"
                render={({ field, fieldState }) => (
                  <Form.Item
                    label="账号别名"
                    required
                    validateStatus={fieldState.error ? "error" : ""}
                    help={fieldState.error?.message}
                  >
                    <Input {...field} className="w-80 h-8" />
                  </Form.Item>
                )}
              />
              <Controller
                control={accountForm.control}
                name="password"
                render={({ field, fieldState }) => (
                  <Form.Item
                    label="密码"
                    required
                    validateStatus={fieldState.error ? "error" : ""}
                    help={fieldState.error?.message}
                  >
                    <Input.Password {...field} className="w-80 h-8" />
                  </Form.Item>
                )}
              />
              <Controller
                control={accountForm.control}
                name="phone"
                render={({ field }) => (
                  <Form.Item
                    label="手机号"
                    validateStatus={
                      accountForm.formState.errors.phone ? "error" : ""
                    }
                    help={accountForm.formState.errors.phone?.message}
                  >
                    <Input {...field} className="w-80 h-8" />
                  </Form.Item>
                )}
              />
              <Controller
                control={accountForm.control}
                name="role"
                render={({ field }) => (
                  <Form.Item
                    label="所属角色"
                    validateStatus={
                      accountForm.formState.errors.role ? "error" : ""
                    }
                    help={accountForm.formState.errors.role?.message}
                  >
                    <Select
                      onChange={field.onChange}
                      value={field.value}
                      placeholder="选择角色"
                      mode="multiple"
                    >
                      {roleListOption?.map((option) => (
                        <Select.Option
                          key={option.roleName}
                          value={option.roleName}
                        >
                          {option.roleName}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                )}
              />
              <Controller
                control={accountForm.control}
                name="auditUser"
                render={({ field }) => (
                  <Form.Item label="教学科研“上级管理/审核人员">
                    <Input {...field} className="w-80 h-8" />
                  </Form.Item>
                )}
              />
              <Controller
                control={accountForm.control}
                name="buildingPermissions.checkedKeys"
                render={({ field }) => (
                  <>
                    <Form.Item label="“教学科研-虚拟教学空间”模块管理权限">
                      <Switch />
                    </Form.Item>

                    <p className="text-sm text-gray-600">
                      有这个权限的账号才可在“教学科研-虚拟教学空间”创建虚拟空间
                    </p>
                  </>
                )}
              />{" "}
              <Controller
                control={accountForm.control}
                name="buildingPermissions"
                render={({ field }) => (
                  <>
                    <p className="text-sm text-gray-600 m-0">
                      点击对应名称可展开管理权限面板
                    </p>
                    <Form.Item label="楼宇权限">
                      <Spin spinning={permissionLoading}>
                        <PermissionTree
                          checkable
                          checkedKeys={field.value?.checkedKeys || []}
                          checkedActions={field.value?.checkedActions || {}}
                          onChange={(value) => {
                            const mergedActions = {
                              ...field.value?.checkedActions,
                              ...value.checkedActions,
                            };

                            field.onChange({
                              ...field.value,
                              checkedKeys: value.checkedKeys,
                              checkedActions: mergedActions,
                            });
                          }}
                          treeData={permissionData}
                          expand={false}
                        />
                      </Spin>
                    </Form.Item>
                  </>
                )}
              />
            </Form>
          )}

          {addOrUpdate === "update" && (
            <Form
              layout="horizontal"
              className="space-y-7"
              onFinish={editAccountForm.handleSubmit((values) =>
                handleSubmitCommon(values, true)
              )}
            >
              <Controller
                control={editAccountForm.control}
                name="username"
                render={({ field, fieldState }) => (
                  <Form.Item
                    label="账号名称"
                    required
                    validateStatus={fieldState.error ? "error" : ""}
                    help={fieldState.error?.message}
                  >
                    <Input disabled {...field} className="w-80 h-8" />
                  </Form.Item>
                )}
              />

              <Controller
                control={editAccountForm.control}
                name="remarkName"
                render={({ field, fieldState }) => (
                  <Form.Item
                    label="账号别名"
                    required
                    validateStatus={fieldState.error ? "error" : ""}
                    help={fieldState.error?.message}
                  >
                    <Input {...field} className="w-80 h-8" />
                  </Form.Item>
                )}
              />
              <Controller
                control={editAccountForm.control}
                name="phone"
                render={({ field }) => (
                  <Form.Item label="手机号">
                    <Input {...field} className="w-80 h-8" />
                  </Form.Item>
                )}
              />

              <Controller
                control={editAccountForm.control}
                name="role"
                render={({ field }) => (
                  <Form.Item
                    label="所属角色"
                    validateStatus={
                      editAccountForm.formState.errors.role ? "error" : ""
                    }
                    help={editAccountForm.formState.errors.role?.message}
                  >
                    <Select
                      onChange={field.onChange}
                      value={field.value}
                      placeholder="选择角色"
                      mode="multiple"
                    >
                      {roleListOption?.map((option) => (
                        <Select.Option
                          key={option.roleName}
                          value={option.roleName}
                        >
                          {option.roleName}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                )}
              />

              <Controller
                control={editAccountForm.control}
                name="auditUser"
                render={({ field }) => (
                  <Form.Item label="”教学科研“上级管理/审核人员">
                    <Input {...field} className="w-80 h-8" />
                  </Form.Item>
                )}
              />

              <Controller
                control={editAccountForm.control}
                name="buildingPermissions.checkedKeys"
                render={({ field }) => (
                  <>
                    <Form.Item label="“教学科研-虚拟教学空间”模块管理权限">
                      <Switch />
                    </Form.Item>
                    <p className="text-sm text-gray-600">
                      有这个权限的账号才可在“教学科研-虚拟教学空间”创建虚拟空间
                    </p>
                  </>
                )}
              />

              <Controller
                control={editAccountForm.control}
                name="buildingPermissions"
                render={({ field }) => (
                  <>
                    <p className="text-sm text-gray-600 m-0">
                      点击对应名称可展开管理权限面板
                    </p>
                    <Form.Item label="楼宇权限">
                      <Spin spinning={permissionLoading}>
                        <PermissionTree
                          checkable
                          checkedKeys={field.value?.checkedKeys || []}
                          checkedActions={field.value?.checkedActions || {}}
                          onChange={(value) => {
                            // 合并之前的 checkedActions 和当前返回的 checkedActions
                            const mergedActions = {
                              ...field.value?.checkedActions,
                              ...value.checkedActions,
                            };

                            field.onChange({
                              ...field.value,
                              checkedKeys: value.checkedKeys,
                              checkedActions: mergedActions,
                            });
                          }}
                          treeData={permissionData}
                          expand={false}
                        />
                      </Spin>
                    </Form.Item>
                  </>
                )}
              />
            </Form>
          )}
        </div>
      </Modal>
    </div>
  );
}
