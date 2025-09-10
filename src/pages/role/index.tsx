import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { TreeDataNode } from "antd";
import { Button, Form, Input, Modal, Popconfirm, Table, Tag, Tree } from "antd";
import { X } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";
import type { RoleTableResponse, RoleUser } from "@/request/role";
import {
	addRole,
	deleteRole,
	getRolePermission,
	getRoleTableList,
	updateRole,
	updateRolePermission,
} from "@/request/role";
import type { PaginationType } from "@/types";

const roleFormSchema = z.object({
	roleName: z.string().min(1, "不能为空"),
	description: z.string().min(1, "不能为空"),
});

export default function RolePage() {
	// 定义表格列
	const columns = [
		{
			title: "角色名称",
			dataIndex: "roleName",
			key: "roleName",
			align: "center",
		},
		{
			title: "角色描述",
			dataIndex: "description",
			key: "description",
			align: "center",
		},
		{
			title: "角色权限",
			dataIndex: "permission",
			key: "permission",
			align: "center",
			width: 600,
			textWrap: 'word-break',
			ellipsis: true,
			render: (_: any, record: RoleUser) => {
				const rolePermissionList = rolePermissionMap[record.roleName];
				if (rolePermissionList) {
					return (
						<div className="flex gap-2">
							{rolePermissionList.map((rolePermission: string) => (
								<Tag color="blue" key={rolePermission}>{roleKeyMap[rolePermission]}</Tag>
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
			render: (_: any, record: RoleUser) => (
				<div className="space-x-2">
					<Button
						variant="link"
						className="text-blue-500 cursor-pointer"
						onClick={() => handleOpenUpdateDialog(record)}
					>
						编辑
					</Button>
					<Popconfirm
						title="确定删除这个角色吗?"
						onConfirm={() => handleDelete(record.roleName)}
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

	// 表格请求
	const {
		isPending,
		isRefetching,
		data: roleTableList,
		refetch,
	} = useQuery({
		queryKey: ["roleTableList", pageParams],
		queryFn: () =>
			getRoleTableList({
				currentPage: pageParams.current,
				pageSize: pageParams.pageSize,
				roleName: "",
			}),
	});
	// 设置分页
	useEffect(() => {
		if (isRefetching && roleTableList) {
			setPageParams({
				...pageParams,
				total: roleTableList.roleList.total,
			});
			getRolePermissionMap(roleTableList);
		}
		if (!isRefetching && roleTableList) {
			setPageParams({
				...pageParams,
				total: roleTableList.roleList.total,
			});
			getRolePermissionMap(roleTableList);
			getRolePermissionKeyMap();
		}
	}, [roleTableList, isRefetching]);

	// 角色权限
	const { mutate: roleUserMutate, mutateAsync: roleUserMutateAsync } =
		useMutation({
			mutationFn: getRolePermission,
		});

	// 获取权限keyMap和权限树
	// 权限的keyMap
	const [roleKeyMap, setRoleKeyMap] = useState<Record<string, string>>({});
	// 表单权限树
	const [rolePermissionTreeData, setRolePermissionTreeData] = useState<
		TreeDataNode[]
	>([]);
	function getRolePermissionKeyMap() {
		roleUserMutate("", {
			onSuccess: (res) => {
				setRoleKeyMap(res.keyMap);
				setRolePermissionTreeData(res?.data[0]?.children as TreeDataNode[]);
			},
		});
	}

	// 表格每一行的角色权限
	const [rolePermissionMap, setRolePermissionMap] = useState<
		Record<string, string[]>
	>({});
	async function getRolePermissionMap(tableData: RoleTableResponse) {
		const newMap: Record<string, string[]> = {};
		const recordsMap = tableData.roleList.records;
		const promises = recordsMap.map(async (record) => {
			const roleName = record.roleName;
			if (!newMap[roleName]) {
				const res = await roleUserMutateAsync(roleName);
				newMap[roleName] = res.check;
			}
		});
		await Promise.all(promises);
		setRolePermissionMap(newMap);
	}

	// 删除角色
	const { mutate: deleteRoleMutate } = useMutation({
		mutationFn: deleteRole,
	});
	function handleDelete(roleName: string) {
		deleteRoleMutate(roleName, {
			onSuccess: () => {
				toast.success("删除成功");
				refetch();
			},
		});
	}

	// 弹窗
	const [dialogFlag, setDialogFlag] = useState<"add" | "edit">("add");
	const [dialogOpen, setDialogOpen] = useState(false);
	const formID = useId();

	// 关闭弹窗时清空表单
	function onDialogOpenChange(open: boolean) {
		setDialogOpen(open);
		if (!open) {
			reset({
				roleName: "",
				description: "",
			});
			setCheckedKeys([]);
		}
	}

	// 表单
	const {
		handleSubmit,
		control,
		formState: { errors },
		reset,
	} = useForm<z.infer<typeof roleFormSchema>>({
		resolver: zodResolver(roleFormSchema),
		defaultValues: {
			roleName: "",
			description: "",
		},
	});

	// 新增角色
	const { mutateAsync: addRoleMutate } = useMutation({
		mutationFn: addRole,
	});
	// 更新角色
	const { mutateAsync: updateRoleMutate } = useMutation({
		mutationFn: updateRole,
	});

	// 新增弹窗
	function handleOpenAddDialog() {
		setDialogFlag("add");
		setDialogOpen(true);
	}

	// 编辑弹窗
	function handleOpenUpdateDialog(record: RoleUser) {
		setDialogFlag("edit");
		setDialogOpen(true);
		reset(record);
		setCheckedKeys(rolePermissionMap[record.roleName]);
	}

	// 更新角色权限
	const { mutateAsync: updateRolePermissionMutate } = useMutation({
		mutationFn: updateRolePermission,
	});

	// 提交表单
	async function onSubmit(values: z.infer<typeof roleFormSchema>) {
		const buildingMenuPermissions = checkedKeys.map((value) => {
			return {
				resourceType: "menu_building",
				permissionName: roleKeyMap[value],
				department: "test",
			};
		});

		if (dialogFlag === "add") {
			await addRoleMutate(values);
			await updateRolePermissionMutate({
				roleName: values.roleName,
				buildingMenuPermissions,
				dataPermissions: [],
				applicationPermissions: [],
				etlPermissions: [],
				tablePermissions: [],
				equipPermissions: [],
				filePermissions: [],
				menuPermissions: [],
			});
			setDialogOpen(false);
			toast.success("新增成功");
			reset();
			refetch();
		}
		else {
			await updateRoleMutate(values);
			await updateRolePermissionMutate({
				roleName: values.roleName,
				buildingMenuPermissions,
				dataPermissions: [],
				applicationPermissions: [],
				etlPermissions: [],
				tablePermissions: [],
				equipPermissions: [],
				filePermissions: [],
				menuPermissions: [],
			});
			setDialogOpen(false);
			toast.success("更新成功");
			reset();
			refetch();
		}
	}

	// 权限树
	const [expandedKeys, setExpandedKeys] = useState<string[]>(["menu_building"]);
	const [autoExpandParent, setAutoExpandParent] = useState<boolean>(true);

	function onExpand(expandedKeysValue: string[]) {
		setExpandedKeys(expandedKeysValue);
		setAutoExpandParent(false);
	}
	const [checkedKeys, setCheckedKeys] = useState<string[]>([]);
	function onCheck(checkedKeysValue: string[]) {
		setCheckedKeys(checkedKeysValue);
	}

	return (
		<div className="p-5">
			<div className="mt-5">
				<Button
					type="primary"
					onClick={handleOpenAddDialog}
				>
					新增
				</Button>
			</div>

			<Table
				columns={columns}
				dataSource={roleTableList?.roleList.records}
				loading={isPending}
				pagination={pageParams}
				onChange={handlePaginationChange}
			/>

			<Modal
				className="w-200!"
				centered
				title={dialogFlag === "add" ? "新增角色" : "编辑角色"}
				open={dialogOpen}
				onCancel={() => onDialogOpenChange(false)}
				footer={[
					<Button
						key={"cancel"}
						onClick={() => onDialogOpenChange(false)}
					>
						取消
					</Button>,
					<Button
						key={"submit"}
						type="primary"
						htmlType="submit"
						form={formID}
					>
						确定
					</Button>,
				]}
			>
				<div className="mt-5">
					<Form
						layout="horizontal"
						id={formID}
						onFinish={handleSubmit(onSubmit)}
					>
						<Form.Item
							label="角色名称"
							required
							validateStatus={errors.roleName ? "error" : ""}
							help={errors.roleName?.message}
						>
							<Controller
								name="roleName"
								control={control}
								render={({ field }) => (
									<Input {...field} allowClear placeholder="请输入角色名称" />
								)}
							/>
						</Form.Item>
						<Form.Item
							label="角色描述"
							required
							validateStatus={errors.description ? "error" : ""}
							help={errors.description?.message}
						>
							<Controller
								name="description"
								control={control}
								render={({ field }) => (
									<Input {...field} allowClear placeholder="请输入角色描述" />
								)}
							/>
						</Form.Item>
					</Form>
					<div>
						<div>角色权限：</div>
						<div className="mt-2">
							<Tree
								checkable
								treeData={rolePermissionTreeData}
								onExpand={onExpand}
								expandedKeys={expandedKeys}
								autoExpandParent={autoExpandParent}
								checkedKeys={checkedKeys}
								onCheck={onCheck}
							/>
						</div>
					</div>
				</div>
			</Modal>
		</div>
	);
}
