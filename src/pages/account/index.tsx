import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Popconfirm, Table } from "antd";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";
import type { AccountTableListResponse } from "@/request/account";
import {
	accountCreate,
	accountDelete,
	accountPasswordReset,
	accountRoleUpdate,
	getAccountTableList,
	getRoleList,
	getRoleUserList,
} from "@/request/account";
import type { RoleUser } from "@/request/role";
import { Badge } from "@/shadcn/ui/badge";
import { Button, Tag } from "antd";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/shadcn/ui/dialog";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/shadcn/ui/form";
import { Input } from "@/shadcn/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/shadcn/ui/select";
import type { PaginationType } from "@/types";

export default function AccountPage() {

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
								<Tag color="blue"  key={roleUser.roleName}>{roleUser.roleName}</Tag>
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

	// 打开Dialog
	const [addOrUpdate, setAddOrUpdate] = useState("add");
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

			<Dialog
				open={passwordDialogOpen}
				onOpenChange={(open) => setPasswordDialogOpen(open)}
			>
				<DialogContent className="max-w-180!" showCloseButton={false}>
					<DialogClose className="top-3 right-3 absolute flex justify-center items-center bg-gray-200 hover:bg-gray-300 p-1 rounded-full cursor-pointer">
						<X className="w-4 h-4" />
					</DialogClose>
					<DialogHeader>
						<DialogTitle>修改密码</DialogTitle>
					</DialogHeader>
					<div className="mt-5">
						<Form {...passwordForm}>
							<form className="space-y-7">
								<FormField
									control={passwordForm.control}
									name="username"
									render={({ field }) => (
										<FormItem className="relative flex items-center gap-5">
											<FormLabel>账号名称</FormLabel>
											<div className="flex flex-col">
												<FormControl>
													<Input
														{...field}
														type="text"
														disabled
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
						</Form>
					</div>
					<DialogFooter className="mt-10">
						<DialogClose asChild>
							<Button variant="outline" className="cursor-pointer">
								取消
							</Button>
						</DialogClose>
						<Button
							type="button"
							className="cursor-pointer"
							onClick={handleResetPassword}
						>
							确定
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Dialog open={dialogOpen} onOpenChange={onDialogOpenChange}>
				<DialogContent className="max-w-180!" showCloseButton={false}>
					<DialogClose className="top-3 right-3 absolute flex justify-center items-center bg-gray-200 hover:bg-gray-300 p-1 rounded-full cursor-pointer">
						<X className="w-4 h-4" />
					</DialogClose>
					<DialogHeader>
						{addOrUpdate === "add" ? (
							<DialogTitle>新增账号</DialogTitle>
						) : (
							<DialogTitle>更新账号</DialogTitle>
						)}
					</DialogHeader>
					<div className="mt-5">
						<Form {...accountForm}>
							<form className="space-y-7">
								<FormField
									control={accountForm.control}
									name="username"
									render={({ field }) => (
										<FormItem className="relative flex items-center gap-5">
											<FormLabel>账号名称</FormLabel>
											<div className="flex flex-col">
												<FormControl>
													<Input {...field} className="w-80 h-8" />
												</FormControl>
												<FormMessage className="bottom-0 absolute translate-y-full" />
											</div>
										</FormItem>
									)}
								/>
								<FormField
									control={accountForm.control}
									name="remarkName"
									render={({ field }) => (
										<FormItem className="relative flex items-center gap-5">
											<FormLabel>账号别名</FormLabel>
											<div className="flex flex-col">
												<FormControl>
													<Input {...field} className="w-80 h-8" />
												</FormControl>
												<FormMessage className="bottom-0 absolute translate-y-full" />
											</div>
										</FormItem>
									)}
								/>
								<FormField
									control={accountForm.control}
									name="password"
									render={({ field }) => (
										<FormItem className="relative flex items-center gap-5">
											<FormLabel>密码</FormLabel>
											<div className="flex flex-col">
												<FormControl>
													<Input {...field} className="w-80 h-8" />
												</FormControl>
												<FormMessage className="bottom-0 absolute translate-y-full" />
											</div>
										</FormItem>
									)}
								/>
								<FormField
									control={accountForm.control}
									name="phone"
									render={({ field }) => (
										<FormItem className="relative flex items-center gap-5">
											<FormLabel>手机号</FormLabel>
											<div className="flex flex-col">
												<FormControl>
													<Input {...field} className="w-80 h-8" />
												</FormControl>
												<FormMessage className="bottom-0 absolute translate-y-full" />
											</div>
										</FormItem>
									)}
								/>
								<FormField
									control={accountForm.control}
									name="role"
									render={({ field }) => (
										<FormItem className="relative flex items-center gap-5">
											<FormLabel>角色</FormLabel>
											<div className="flex flex-col">
												<Select
													onValueChange={field.onChange}
													value={field.value}
												>
													<FormControl>
														<SelectTrigger className="bg-white w-50 cursor-pointer">
															<SelectValue placeholder="选择角色" />
														</SelectTrigger>
													</FormControl>
													<SelectContent>
														{roleListOption?.map((option) => (
															<SelectItem
																key={option.roleName}
																value={option.roleName}
															>
																{option.roleName}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
											</div>
										</FormItem>
									)}
								/>
							</form>
						</Form>
					</div>
					<DialogFooter className="mt-10">
						<DialogClose asChild>
							<Button variant="outline" className="cursor-pointer">
								取消
							</Button>
						</DialogClose>
						<Button type="button" className="cursor-pointer" onClick={handleOK}>
							确定
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}