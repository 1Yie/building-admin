import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Table } from "antd";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";
import type {
	AddRegulationParams,
	PropertyListItem,
	TriggerSelectListItem,
} from "@/request/control";
import {
	addRegulation,
	getControlPropertyList,
	getFieldSelectList,
	getManualOperateList,
	getMonitorPropertyList,
	getRegulationDetails,
	getRegulationList,
	getTriggerSelectList,
	updateRegulation,
} from "@/request/control";
import { Badge } from "@/shadcn/ui/badge";

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
import { Button, Modal } from "antd";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/shadcn/ui/select";
import type { PaginationType } from "@/types";

const roleFormSchema = z.object({
	rule_id: z.string().optional(),
	t_sensor_property_id: z.string().min(1, "不能为空"),
	c_sensor_property_id: z.string().min(1, "不能为空"),
	field: z.string().min(1, "不能为空，请先选择t_sensor_property_id"),
	control: z.string().min(1, "不能为空，请先选择c_sensor_property_id"),
	trigger: z.string().min(1, "不能为空"),
	is_used: z.string().min(1, "状态不能为空"),
	value: z.coerce
		.number({ message: "请输入数字" })
		.min(-999.99, { message: "最小值为 -999.99" })
		.max(999.99, { message: "最大值为 999.99" })
		.refine((val) => /^-?\d+(?:\.\d{1,2})?$/.test(val.toString()), {
			message: "最多只能有两位小数",
		}),
});

export default function RuleLinkageControl() {
	const columns = [
		{
			title: "规则编号",
			dataIndex: "rule_id",
			key: "rule_id",
			align: "center",
		},
		{
			title: "触发传感器资产编号",
			dataIndex: "t_sensor_property_id",
			key: "t_sensor_property_id",
			align: "center",
		},
		{
			title: "触发传感器大类",
			dataIndex: "t_kind",
			key: "t_kind",
			align: "center",
		},
		{
			title: "触发传感器小类",
			dataIndex: "t_type",
			key: "t_type",
			align: "center",
		},
		{
			title: "被控传感器资产编号",
			dataIndex: "c_sensor_property_id",
			key: "c_sensor_property_id",
			align: "center",
		},
		{
			title: "被控传感器大类",
			dataIndex: "c_kind",
			key: "c_kind",
			align: "center",
		},
		{
			title: "被控传感器小类",
			dataIndex: "c_type",
			key: "c_type",
			align: "center",
		},
		{
			title: "触发条件",
			dataIndex: "trigger",
			key: "trigger",
			align: "center",
		},
		{
			title: "控制操作",
			dataIndex: "control",
			key: "control",
			align: "center",
		},
		{
			title: "规则使用状态",
			dataIndex: "is_used",
			key: "is_used",
			align: "center",
			render: (is_used: boolean) => {
				return is_used ? (
					<Badge className="bg-green-500">在用</Badge>
				) : (
					<Badge className="bg-red-500">停用</Badge>
				);
			},
		},
		{
			title: "操作",
			dataIndex: "action",
			key: "action",
			align: "center",
			render: (_, record: any) => (
				<Button
					variant="link"
					className="text-blue-500 cursor-pointer"
					onClick={() => handleOpenUpdateDialog(record)}
				>
					编辑
				</Button>
			),
		},
	];

	// 表格分页
	const [pageParams, setPageParams] = useState<PaginationType>({
		current: 1,
		pageSize: 5,
		showSizeChanger: false,
	});
	function handlePaginationChange(pagination: PaginationType) {
		setPageParams(pagination);
	}

	// 请求表格数据
	const {
		data: ruleLinkageList,
		isPending: isLoading,
		refetch,
		isError,
		error,
	} = useQuery({
		queryKey: ["ruleLinkage", pageParams.current, pageParams.pageSize],
		queryFn: () =>
			getRegulationList({
				page: pageParams.current,
				page_size: pageParams.pageSize,
			}),
	});
	useEffect(() => {
		if (isError) {
			toast.error(error.message);
		}
	}, [isError, error]);
	// 设置分页
	useEffect(() => {
		if (ruleLinkageList?.page?.totalSize && ruleLinkageList.page.totalSize > 0) {
			setPageParams((prev) => ({
				...prev,
				total: ruleLinkageList.page.totalSize,
			}));
		}
	}, [ruleLinkageList]);

	// 弹窗
	const [dialogOpen, setDialogOpen] = useState(false);
	const [addOrUpdate, setAddOrUpdate] = useState("add");

	// 表单
	const roleForm = useForm<z.infer<typeof roleFormSchema>>({
		resolver: zodResolver(roleFormSchema),
		defaultValues: {
			rule_id: "",
			t_sensor_property_id: "",
			c_sensor_property_id: "",
			field: "",
			control: "",
			trigger: "",
			is_used: "",
			value: "",
		},
	});

	const RoleIsUsedSelectOptions = [
		{ value: "true", label: "在用" },
		{ value: "false", label: "停用" },
	];


	const [monitorPropertySelectOption, setMonitorPropertySelectOption] =
		useState<PropertyListItem[]>([]);
	const { mutateAsync: getMonitorPropertyListMutate } = useMutation({
		mutationFn: getMonitorPropertyList,
	});

	const [controlPropertySelectOption, setControlPropertySelectOption] =
		useState<PropertyListItem[]>([]);
	const { mutateAsync: getControlPropertyListMutate } = useMutation({
		mutationFn: getControlPropertyList,
	});

	const [fieldSelectOption, setFieldSelectOption] = useState<
		{ type: string; name: string }[]
	>([]);
	const {
		mutate: getFieldSelectListMutate,
		mutateAsync: getFieldSelectListMutateAsync,
	} = useMutation({
		mutationFn: getFieldSelectList,
	});

	const [controlSelectOption, setControlSelectOption] = useState<
		{ type: string; name: string }[]
	>([]);
	const {
		mutate: getControlSelectListMutate,
		mutateAsync: getControlSelectListMutateAsync,
	} = useMutation({
		mutationFn: getManualOperateList,
	});

	const [triggerSelectOption, setTriggerSelectOption] = useState<
		TriggerSelectListItem[]
	>([]);
	const { mutateAsync: getTriggerSelectListMutate } = useMutation({
		mutationFn: getTriggerSelectList,
	});

	async function getSelectOption() {
		try {
			const monitorData = await getMonitorPropertyListMutate();
			setMonitorPropertySelectOption(monitorData);

			const controlData = await getControlPropertyListMutate();
			setControlPropertySelectOption(controlData);

			const triggerData = await getTriggerSelectListMutate();
			setTriggerSelectOption(triggerData);
		} catch (error: any) {
			toast.error(error.message);
		}
	}

	function onDialogOpenChange(open: boolean) {
		setDialogOpen(open);
		if (!open) {
			roleForm.reset({
				rule_id: "",
				t_sensor_property_id: "",
				c_sensor_property_id: "",
				field: "",
				control: "",
				trigger: "",
				is_used: "",
				value: "",
			});
		}
	}

	function handleOpenAddDialog() {
		setAddOrUpdate("add");
		setDialogOpen(true);
		getSelectOption();
	}

	const { mutateAsync: getRegulationDetailsMutate } = useMutation({
		mutationFn: getRegulationDetails,
	});
	async function handleOpenUpdateDialog(record: any) {
		setAddOrUpdate("update");
		setDialogOpen(true);
		await getSelectOption();
		const fieldRes = await getFieldSelectListMutateAsync(
			record.t_sensor_property_id,
		);
		setFieldSelectOption(fieldRes);

		const controlRes = await getControlSelectListMutateAsync(
			record.c_sensor_property_id,
		);
		setControlSelectOption(controlRes);

		const data = await getRegulationDetailsMutate(record.rule_id);
		roleForm.reset(data);
	}

	function handleOK() {
		roleForm.handleSubmit(onSubmit)();
	}

	const { mutate: addRegulationMutate } = useMutation({
		mutationFn: addRegulation,
	});
	const { mutate: updateRegulationMutate } = useMutation({
		mutationFn: updateRegulation,
	});
	function onSubmit(values: AddRegulationParams) {
		if (addOrUpdate === "add") {
			addRegulationMutate(values, {
				onSuccess: () => {
					setDialogOpen(false);
					toast.success("新增成功");
					roleForm.reset();
					refetch();
				},
				onError: (error) => {
					toast.error(error.message);
				},
			});
		} else {
			updateRegulationMutate(values, {
				onSuccess: () => {
					setDialogOpen(false);
					toast.success("新增成功");
					roleForm.reset();
					refetch();
				},
				onError: (error) => {
					toast.error(error.message);
				},
			});
		}
	}

	function tSensorPropertyIdChange(value: string, field) {
		field.onChange(value);
		getFieldSelectListMutate(value, {
			onSuccess: (data) => {
				setFieldSelectOption(data);
			},
			onError: (error) => {
				toast.error(error.message);
			},
		});
	}
	function cSensorPropertyIdChange(value: string, field) {
		field.onChange(value);
		getControlSelectListMutate(value, {
			onSuccess: (data) => {
				setControlSelectOption(data);
			},
			onError: (error) => {
				toast.error(error.message);
			},
		});
	}

	return (
		<div>
			<div>
				<Button
					type="primary"
					className="cursor-pointer"
					onClick={handleOpenAddDialog}
				>
					新增
				</Button>
			</div>
			<Table
				dataSource={ruleLinkageList?.regulation || []}
				columns={columns}
				pagination={pageParams}
				onChange={handlePaginationChange}
				loading={isLoading}
				className="mt-2"
			/>
			<Modal
				open={dialogOpen}
				title={addOrUpdate === "add" ? "新增规则" : "更新规则"}
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
							type="primary"
							htmlType="button"
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
					<Form {...roleForm}>
						<form className="space-y-7">
							{addOrUpdate === "update" ? (
								<FormField
									control={roleForm.control}
									name="rule_id"
									render={({ field }) => (
										<FormItem className="relative flex items-center gap-5">
											<FormLabel>规则编号</FormLabel>
											<div className="flex flex-col">
												<FormControl>
													<Input {...field} className="w-80 h-8" />
												</FormControl>
												<FormMessage className="bottom-0 absolute translate-y-full" />
											</div>
										</FormItem>
									)}
								/>
							) : null}

							<FormField
								control={roleForm.control}
								name="t_sensor_property_id"
								render={({ field }) => (
									<FormItem className="relative flex items-center gap-5">
										<FormLabel>触发传感器资产编号</FormLabel>
										<div className="flex flex-col">
											<Select
												onValueChange={(value) => tSensorPropertyIdChange(value, field)}
												value={field.value}
											>
												<FormControl>
													<SelectTrigger className="bg-white w-80">
														<SelectValue placeholder="请选择触发传感器资产编号" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													{monitorPropertySelectOption.map((option) => (
														<SelectItem
															key={option.property_id}
															value={option.property_id}
														>
															{option.name}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
											<FormMessage className="bottom-0 absolute translate-y-full" />
										</div>
									</FormItem>
								)}
							/>

							<FormField
								control={roleForm.control}
								name="c_sensor_property_id"
								render={({ field }) => (
									<FormItem className="relative flex items-center gap-5">
										<FormLabel>被控传感器资产编号</FormLabel>
										<div className="flex flex-col">
											<Select
												onValueChange={(value) => cSensorPropertyIdChange(value, field)}
												value={field.value}
											>
												<FormControl>
													<SelectTrigger className="bg-white w-80">
														<SelectValue placeholder="请选择被控传感器资产编号" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													{controlPropertySelectOption.map((option) => (
														<SelectItem
															key={option.property_id}
															value={option.property_id}
														>
															{option.name}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
											<FormMessage className="bottom-0 absolute translate-y-full" />
										</div>
									</FormItem>
								)}
							/>

							<FormField
								control={roleForm.control}
								name="field"
								render={({ field }) => (
									<FormItem className="relative flex items-center gap-5">
										<FormLabel>触发项</FormLabel>
										<div className="flex flex-col">
											<Select onValueChange={field.onChange} value={field.value}>
												<FormControl>
													<SelectTrigger className="bg-white w-80">
														<SelectValue placeholder="请选择触发项" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													{fieldSelectOption.map((option) => (
														<SelectItem key={option.type} value={option.type}>
															{option.name}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
											<FormMessage className="bottom-0 absolute translate-y-full" />
										</div>
									</FormItem>
								)}
							/>

							<FormField
								control={roleForm.control}
								name="control"
								render={({ field }) => (
									<FormItem className="relative flex items-center gap-5">
										<FormLabel>控制操作</FormLabel>
										<div className="flex flex-col">
											<Select onValueChange={field.onChange} value={field.value}>
												<FormControl>
													<SelectTrigger className="bg-white w-80">
														<SelectValue placeholder="请选择控制操作" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													{controlSelectOption.map((option) => (
														<SelectItem key={option.type} value={option.type}>
															{option.name}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
											<FormMessage className="bottom-0 absolute translate-y-full" />
										</div>
									</FormItem>
								)}
							/>

							<FormField
								control={roleForm.control}
								name="trigger"
								render={({ field }) => (
									<FormItem className="relative flex items-center gap-5">
										<FormLabel>触发条件</FormLabel>
										<div className="flex flex-col">
											<Select onValueChange={field.onChange} value={field.value}>
												<FormControl>
													<SelectTrigger className="bg-white w-80">
														<SelectValue placeholder="请选择触发条件" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													{triggerSelectOption.map((option) => (
														<SelectItem key={option.type} value={option.type}>
															{option.name}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
											<FormMessage className="bottom-0 absolute translate-y-full" />
										</div>
									</FormItem>
								)}
							/>

							<FormField
								control={roleForm.control}
								name="value"
								render={({ field }) => (
									<FormItem className="relative flex items-center gap-5">
										<FormLabel>触发阈值</FormLabel>
										<div className="flex flex-col">
											<FormControl>
												<Input
													{...field}
													type="number"
													placeholder="请输入触发阈值"
													className="w-80 h-8"
												/>
											</FormControl>
											<FormMessage className="bottom-0 absolute translate-y-full" />
										</div>
									</FormItem>
								)}
							/>

							<FormField
								control={roleForm.control}
								name="is_used"
								render={({ field }) => (
									<FormItem className="relative flex items-center gap-5">
										<FormLabel>规则使用状态</FormLabel>
										<div className="flex flex-col">
											<Select onValueChange={field.onChange} value={field.value}>
												<FormControl>
													<SelectTrigger className="bg-white w-80">
														<SelectValue placeholder="请选择规则使用状态" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													{RoleIsUsedSelectOptions.map((option) => (
														<SelectItem key={option.value} value={option.value}>
															{option.label}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
											<FormMessage className="bottom-0 absolute translate-y-full" />
										</div>
									</FormItem>
								)}
							/>
						</form>
					</Form>
				</div>
			</Modal>

		</div>
	);
}
