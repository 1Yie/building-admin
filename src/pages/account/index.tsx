import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Popconfirm, Table, Modal } from "antd";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";
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
import { Button, Tag, Tree, Input, Select, Switch, Form } from "antd";
import type { TreeDataNode } from 'antd';
import type { TreeProps } from 'antd';
import {
	// Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/shadcn/ui/form";

import type { PaginationType } from "@/types";

export default function AccountPage() {
	// 转换权限数据格式为Tree组件所需格式
	const transformPermissionData = (data: any): TreeDataNode[] => {
		// 首先检查数据是否存在
		if (!data) {
			console.warn('权限数据为空');
			return [];
		}

		// 确保数据是数组
		const dataArray = Array.isArray(data) ? data : [data];

		// 转换为TreeDataNode格式
		const transformedData = dataArray.map((item: any, index: number) => {
			// 创建基础节点
			const node: TreeDataNode = {
				key: item.key,
				title: item.title,
				children: item.children ? transformPermissionData(item.children) : [],
			};

			// 处理子节点
			if (item.children && Array.isArray(item.children) && item.children.length > 0) {
				node.children = transformPermissionData(item.children);
			}

			return node;
		});

		return transformedData;
	}

	// 楼宇权限相关状态
	const [permissionData, setPermissionData] = useState<TreeDataNode[]>([]);
	const [permissionKeyMap, setPermissionKeyMap] = useState<Record<string, string>>({});
	const [checkedKeys, setCheckedKeys] = useState<string[]>([]);
	const [currentUsername, setCurrentUsername] = useState<string>('');
	const [permissionLoading, setPermissionLoading] = useState<boolean>(false);
	const [permissionError, setPermissionError] = useState<string>('');

	// 获取权限列表
	const { mutate: getPermissionMutate, mutateAsync: getPermissionMutateAsync } = useMutation({
		mutationFn: permissionList,
		onMutate: () => {
			setPermissionLoading(true);
			setPermissionError('');
			setPermissionData([]);
			setPermissionKeyMap({});
			setCheckedKeys([]);
		},
		onSuccess: (data) => {
			const rawData = data?.data || [];
			const transformedData = transformPermissionData(rawData);

			setPermissionData(transformedData);
			setPermissionKeyMap(data?.keyMap || {});

			const checked = data?.check || [];
			setCheckedKeys(checked);
		},
		onError: (error) => {
			setPermissionError('获取权限失败，请重试');
			console.error('获取权限失败:', error);
		},
		onSettled: () => {
			setPermissionLoading(false);
		},
	});

	// 获取权限keyMap和权限树
	function getPermissionKeyMap() {
		getPermissionMutate({ department: "test" });
	}

	// 初始化时获取权限树数据
	useEffect(() => {
		getPermissionKeyMap();
	}, []);

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
								<Tag color="blue" key={roleUser.roleName}>{roleUser.roleName}</Tag>
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
						<Button variant="link" className="cursor-pointer">
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
	const [userRoleMap, setUserRoleMap] = useState<Record<string, RoleUser[]>>({});
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
		resolver: zodResolver(passwordFormSchema),
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

	function handleOpenEditDialog(record: any) {
		setCurrentUsername(record.username);
		// 获取当前用户的楼宇权限
		getPermissionMutate({ department: "test", username: record.username });
		setEditOpen(true);
		editAccountForm.reset({
			username: record.username,
			remarkName: record.remarkName,
			phone: record.phone,
			auditUser: record.auditUser || '',
		});
	}

	const { mutateAsync: updatePermissionsMutate } = useMutation({
		mutationFn: accountPermissionUpdate,
	});

	// 处理权限选择变化
	const onCheck = (checkedKeysValue: TreeProps['checkedKeys']) => {
		setCheckedKeys(checkedKeysValue as string[]);
	};

	// 权限树
	const [expandedKeys, setExpandedKeys] = useState<string[]>(["menu_building"]);
	const [autoExpandParent, setAutoExpandParent] = useState<boolean>(true);

	function onExpand(expandedKeysValue: string[]) {
		setExpandedKeys(expandedKeysValue);
		setAutoExpandParent(false);
	}

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
			},
		);
	}

	// 新增账号
	// 表单
	const accountFormSchema = z.object({
		username: z.string().min(1, "账号名称不能为空"),
		remarkName: z.string().min(1, "账号别名不能为空"),
		password: z.string().min(6, "密码至少需要6个字"),
		phone: z.string().optional(),
		role: z.string().optional(),
	});
	const accountForm = useForm<z.infer<typeof accountFormSchema>>({
		resolver: zodResolver(accountFormSchema),
		defaultValues: {
			username: "",
			remarkName: "",
			password: "",
			phone: "",
			role: "",
		},
	});

	const editAccountFormSchema = z.object({
		username: z.string().min(1, "账号名称不能为空"),
		remarkName: z.string().min(1, "账号别名不能为空"),
		phone: z.string().optional(),
		auditUser: z.string().optional(),
	});
	const editAccountForm = useForm<z.infer<typeof editAccountFormSchema>>({
		resolver: zodResolver(editAccountFormSchema),
		defaultValues: {
			username: "",
			remarkName: "",
			phone: "",
			auditUser: "",
		},
	});
	function onEditSubmit() {
		editAccountForm.handleSubmit(onSubmitForEdit)();
	}


	// 打开Dialog
	const [addOrUpdate, setAddOrUpdate] = useState("add");
	const [editOpen, setEditOpen] = useState(false);
	const [dialogOpen, setDialogOpen] = useState(false);

	function onDialogOpenChange(open: boolean) {
		setDialogOpen(open);
		if (!open) {
			accountForm.reset();
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
	function handleOpenAddDialog() {
		setAddOrUpdate("add");
		setDialogOpen(true);
	}

	// 编辑账号
	const { mutateAsync: accountEditMutate } = useMutation({
		mutationFn: accountEdit,
	});

	// 绑定账号
	const { mutateAsync: accountRoleUpdateMutate } = useMutation({
		mutationFn: accountRoleUpdate,
	});

	// 提交表单
	function handleOK() {
		accountForm.handleSubmit(onSubmit)();

	}

	async function onSubmit(values: z.infer<typeof accountFormSchema>) {
		if (addOrUpdate === "add") {
			await accountCreateMutate(values);
			await accountRoleUpdateMutate({
				username: values.username,
				roleNames: values.role ? [values.role] : [],
			});
			setDialogOpen(false);
			toast.success("新增成功");
			accountForm.reset();
			tableRefetch();
		}
	}

	async function onSubmitForEdit(values: z.infer<typeof editAccountFormSchema>) {
		await accountEditMutate({
			username: values.username,
			remarkName: values.remarkName,
			phone: values.phone,
			auditUser: values.auditUser ?? 'admin',
		});

		// 构建权限数据，与角色管理页面保持一致
		const buildingPermissions = checkedKeys.map((value) => {
			return {
				resourceType: "menu_building",
				permissionName: permissionKeyMap[value],
				department: "test",
			};
		});

		await updatePermissionsMutate({
			username: currentUsername,
			buildingPermissions,
			dataPermissions: [],
			applicationPermissions: [],
			etlPermissions: [],
			tablePermissions: [],
			equipPermissions: [],
			filePermissions: [],
			menuPermissions: [],
		});

		toast.success("修改成功");
		setEditOpen(false);
		tableRefetch();
	}


	return (
		<div className="p-5">
			<div className="mt-5">
				<Button type="primary" className="cursor-pointer" onClick={handleOpenAddDialog}>
					新增
				</Button>
			</div>

			<Table
				dataSource={tableData?.userInfoList}
				columns={columns}
				loading={tablePending}
				pagination={pageParams}
				onChange={handlePaginationChange}
			/>

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
					{/* <Form {...passwordForm}>
						<form className="space-y-7">
							<FormField
								control={passwordForm.control}
								name="username"
								render={({ field }) => (
									<FormItem className="relative flex items-center gap-5">
										<FormLabel>账号名称</FormLabel>
										<div className="flex flex-col">
											<FormControl>
												<Input {...field} type="text" disabled className="w-80 h-8" />
											</FormControl>
											<FormMessage className="bottom-0 absolute translate-y-full" />
										</div>
									</FormItem>
								)}
							/>
							<FormField
								control={passwordForm.control}
								name="password-new"
								render={({ field }) => (
									<FormItem className="relative flex items-center gap-5">
										<FormLabel>新密码</FormLabel>
										<div className="flex flex-col">
											<FormControl>
												<Input
													{...field}
													type="password"
													placeholder="请输入新密码"
													className="w-80 h-8"
												/>
											</FormControl>
											<FormMessage className="bottom-0 absolute translate-y-full" />
										</div>
									</FormItem>
								)}
							/>
							<FormField
								control={passwordForm.control}
								name="password-new-confirm"
								render={({ field }) => (
									<FormItem className="relative flex items-center gap-5">
										<FormLabel>确认新密码</FormLabel>
										<div className="flex flex-col">
											<FormControl>
												<Input
													{...field}
													type="password"
													placeholder="确认新密码"
													className="w-80 h-8"
												/>
											</FormControl>
											<FormMessage className="bottom-0 absolute translate-y-full" />
										</div>
									</FormItem>
								)}
							/>
						</form>
					</Form> */}

					<Form layout="horizontal" className="space-y-7">
						<Controller
							control={passwordForm.control}
							name="username"
							render={({ field }) => (
								<Form.Item
									label="账号名称"
									validateStatus={passwordForm.formState.errors.username?.message ? 'error' : ''}
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
									validateStatus={passwordForm.formState.errors['password-new']?.message ? 'error' : ''}
									help={passwordForm.formState.errors['password-new']?.message}
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
									validateStatus={passwordForm.formState.errors['password-new-confirm']?.message ? 'error' : ''}
									help={passwordForm.formState.errors['password-new-confirm']?.message}
								>
									<Input {...field} type="password" className="w-80 h-8" />
								</Form.Item>
							)}
						/>
					</Form>
				</div>
			</Modal>

			<Modal
				open={editOpen}
				title="编辑"
				onCancel={() => setEditOpen(false)}
				footer={
					<div className="mt-10 flex justify-end gap-4">
						<Button type="default" className="cursor-pointer" onClick={() => setEditOpen(false)}>
							取消
						</Button>
						<Button
							htmlType="button"
							type="primary"
							className="cursor-pointer"
							onClick={onEditSubmit}
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
							control={editAccountForm.control}
							name="username"
							render={({ field }) => (
								<Form.Item
									label="账号编号"
									validateStatus={editAccountForm.formState.errors.username?.message ? 'error' : ''}
									help={editAccountForm.formState.errors.username?.message}
								>
									<Input {...field} type="text" disabled className="w-80 h-8" />
								</Form.Item>
							)}
						/>

						<Controller
							control={editAccountForm.control}
							name="remarkName"
							render={({ field }) => (
								<Form.Item
									label="账号名称"
									validateStatus={editAccountForm.formState.errors.remarkName?.message ? 'error' : ''}
									help={editAccountForm.formState.errors.remarkName?.message}
								>
									<Input {...field} type="text" className="w-80 h-8" />
								</Form.Item>
							)}
						/>

						<Controller
							control={editAccountForm.control}
							name="phone"
							render={({ field }) => (
								<Form.Item
									label="登录手机"
									validateStatus={editAccountForm.formState.errors.phone?.message ? 'error' : ''}
									help={editAccountForm.formState.errors.phone?.message}
								>
									<Input {...field} type="text" className="w-80 h-8" />
								</Form.Item>
							)}
						/>

						<Controller
							control={editAccountForm.control}
							name="roleName"
							render={({ field }) => (
								<Form.Item
									label="所属角色"
									validateStatus={editAccountForm.formState.errors.roleName?.message ? 'error' : ''}
									help={editAccountForm.formState.errors.roleName?.message}
								>
									<Select
										mode="tags"
										placeholder="选择角色"
										onChange={field.onChange}
										style={{ minWidth: 320 }}
									>
										{roleListOption?.map((option) => (
											<Select.Option key={option.roleName} value={option.roleName}>
												{option.roleName}
											</Select.Option>
										))}
									</Select>
								</Form.Item>
							)}
						/>

					</Form>

					{/* <Form {...editAccountForm}>
						<form className="space-y-2">
							<FormField name="username" render={({ field }) => (
								<FormItem className="flex items-center gap-5">
									<FormLabel>账号编号</FormLabel>
									<FormControl>
										<span className="break-words">{field.value}</span>
									</FormControl>
								</FormItem>
							)} />
							<FormField name="remarkName" render={({ field }) => (
								<FormItem className="relative flex items-center gap-5">
									<FormLabel>账号名称</FormLabel>
									<div className="flex flex-col">
										<FormControl>
											<Input {...field} className="w-80 h-8" />
										</FormControl>
										<FormMessage className="bottom-0 absolute translate-y-full" />
									</div>
								</FormItem>
							)} />
							<FormField name="phone" render={({ field }) => (
								<FormItem className="relative flex items-center gap-5">
									<FormLabel>登录手机</FormLabel>
									<div className="flex flex-col">
										<FormControl>
											<Input {...field} className="w-80 h-8" />
										</FormControl>
										<FormMessage className="bottom-0 absolute translate-y-full" />
									</div>
								</FormItem>
							)} />
							<FormField name="roleName" render={({ field }) => (
								<FormItem className="relative flex items-center gap-5">
									<FormLabel>所属角色</FormLabel>
									<div className="flex flex-col">
										<FormControl>
											<Select
												mode="tags"
												placeholder="选择角色"
												onChange={field.onChange}
												style={{ minWidth: 320 }}
											>
												{roleListOption?.map((option) => (
													<Select.Option key={option.roleName} value={option.roleName}>
														{option.roleName}
													</Select.Option>
												))}
											</Select>
										</FormControl>
										<FormMessage className="bottom-0 absolute translate-y-full" />
									</div>
								</FormItem>
							)} />

							<FormField name=""
								render={({ field }) => (
									<FormItem className="flex items-center gap-5 ">
										<FormLabel>
											“教学科研-虚拟教学空间”模块管理权限
										</FormLabel>
										<FormControl>
											<Switch/>
										</FormControl>
									</FormItem>
								)}
							/>

							<FormItem className="relative flex flex-col gap-2 mt-6">
								<FormLabel className="font-medium">楼宇权限</FormLabel>
								<div className="mt-2 p-4 border rounded-lg max-h-96 overflow-auto">
									{permissionLoading ? (
										<div className="text-gray-500 text-center py-10">加载权限中...</div>
									) : permissionError ? (
										<div className="text-red-500 text-center py-10">{permissionError}</div>
									) : (
										<Tree
											checkable
											checkedKeys={checkedKeys}
											expandedKeys={expandedKeys}
											autoExpandParent={autoExpandParent}
											onCheck={onCheck}
											onExpand={onExpand}
											treeData={permissionData}
										/>
									)}
								</div>
							</FormItem>


						</form>

					</Form> */}
				</div>
			</Modal >

			<Modal
				open={dialogOpen}
				title={addOrUpdate === "add" ? "新增账号" : "更新账号"}
				onCancel={() => onDialogOpenChange(false)}
				footer={
					<div className="mt-10 flex justify-end gap-4">
						<Button type="default" className="cursor-pointer" onClick={() => onDialogOpenChange(false)}>
							取消
						</Button>
						<Button
							htmlType="button"
							type="primary"
							className="cursor-pointer"
							onClick={handleOK}
						>
							确定
						</Button>
					</div>
				}
				width={720}
			>
				<div className="mt-5">
					<Form layout="horizontal" className="space-y-7" onFinish={accountForm.handleSubmit(onSubmit)}>
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
									validateStatus={accountForm.formState.errors.phone ? "error" : ""}
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
									label="角色"
									validateStatus={accountForm.formState.errors.role ? "error" : ""}
									help={accountForm.formState.errors.role?.message}
								>
									<Select
										onChange={field.onChange}
										value={field.value}
										placeholder="选择角色"
										style={{ width: 200 }}
									>
										{roleListOption?.map((option) => (
											<Select.Option key={option.roleName} value={option.roleName}>
												{option.roleName}
											</Select.Option>
										))}
									</Select>
								</Form.Item>
							)}
						/>
					</Form>
				</div>
			</Modal>

		</div >
	);
}