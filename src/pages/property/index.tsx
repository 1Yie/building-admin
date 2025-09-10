import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Table } from "antd";
import { X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";
import type { BindPropertyListItem } from "@/request/property";
import {
	addProperty,
	exportPropertyList,
	getBindPropertyList,
	getPropertyDetails,
	getPropertyList,
	getSensorKindList,
	getSensorTypeList,
	updateProperty,
} from "@/request/property";
import { Badge } from "@/shadcn/ui/badge";
import { Button } from "antd";
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

const searchFormSchema = z.object({
	property_id: z.string().optional(), // 资产编号
	is_used: z.string().optional(), // 资产使用状态
	property_type: z.string().optional(), // 资产类型

	building_name: z.string().optional(), // 楼宇名称
	building_number: z.string().optional(), // 楼栋号

	space_number: z.string().optional(), // 房间号
	space_name: z.string().optional(), // 房间名
	space_type: z.string().optional(), // 房间用途

	terminal_number: z.string().optional(), // 终端编号
	terminal_type: z.string().optional(), // 终端型号

	sensor_kind: z.string().optional(), // 传感器大类
	sensor_type: z.string().optional(), // 传感器小类
});

const buildingFormSchema = z.object({
	property_id: z.string(), // 资产编号
	name: z.string().min(1, "楼栋号不能为空"), // 楼栋号
	number: z.string().optional(), // 楼宇编号
	address: z.string().optional(), // 楼宇地址
	is_used: z.string().min(1, "状态不能为空"), // 楼宇状态
	description: z.string().optional(), // 楼宇描述
});

const spaceFormSchema = z.object({
	property_id: z.string(), // 资产编号
	property_bind_id: z.string().min(1, "绑定楼宇不能为空"), // 绑定楼宇id
	name: z.string().min(1, "房间名不能为空"), // 房间名
	number: z.string().min(1, "房间号不能为空"), // 房间号
	floor: z
		.string()
		.trim()
		.optional()
		.refine((val) => val === undefined || val === "" || /^\d+$/.test(val), {
			message: "请输入整数",
		})
		.transform((val) =>
			val === "" || val === undefined ? undefined : Number(val),
		)
		.refine((val) => val === undefined || val > 0, {
			message: "请输入大于0的整数",
		}),
	type: z.string().optional(), // 房间用途
	ampere: z.string().optional(), // TODO
	is_used: z.string().min(1, "状态不能为空"), // 状态
	description: z.string().optional(), // 描述
});

const terminalFormSchema = z.object({
	property_id: z.string(), // 资产编号
	property_bind_id: z.string().min(1, "绑定空间不能为空"), // 绑定空间id
	number: z.string().min(1, "网关（智能箱）编号不能为空"), // 编号
	type: z.string().min(1, "网关（智能箱）型号不能为空"), // 型号
	is_used: z.string().min(1, "网关（智能箱）状态不能为空"), // 状态
	description: z.string().optional(), // 描述
});

const sensorFormSchema = z.object({
	property_id: z.string(), // 资产编号
	property_bind_id: z.string().min(1, "绑定网关（智能箱）不能为空"), // 绑定终端id
	kind: z.string().min(1, "传感器大类不能为空"), // 大类
	type: z.string().min(1, "传感器小类不能为空"), // 小类
	is_used: z.string().min(1, "传感器状态不能为空"), // 状态
	description: z.string().optional(), // 描述
});

const propertyTypeSelectOptions = [
	{ value: "building", label: "楼宇" },
	{ value: "space", label: "空间" },
	{ value: "terminal", label: "网关（智能箱）" },
	{ value: "sensor", label: "传感器" },
];

const propertyStatusSelectOptions = [
	{ value: "all", label: "全部" },
	{ value: "True", label: "在用" },
	{ value: "False", label: "停用" },
];

const buildingIsUsedSelectOptions = [
	{ value: "true", label: "在用" },
	{ value: "false", label: "停用" },
];

export default function PropertyPage() {
	// 楼宇资产表格
	// 表格列
	const [propertyTitle, setPropertyTitle] = useState("资产名称");
	const columns = useMemo(() => {
		return [
			{
				title: "资产编号",
				dataIndex: "property_id",
				key: "property_id",
				align: "center",
			},
			{
				title: () => propertyTitle,
				dataIndex: "property_name",
				key: "property_name",
				align: "center",
			},
			{
				title: "资产类型",
				dataIndex: "property_type",
				key: "property_type",
				align: "center",
			},
			{
				title: "资产状态",
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
				title: "活跃情况",
				dataIndex: "is_liveness",
				key: "is_liveness",
				align: "center",
				render: (is_liveness: boolean) => {
					return is_liveness ? (
						<Badge className="bg-green-500">在线</Badge>
					) : (
						<Badge className="bg-red-500">离线</Badge>
					);
				},
			},
			{
				title: "楼宇信息",
				dataIndex: "building",
				key: "building",
				align: "center",
			},
			{
				title: "空间信息",
				dataIndex: "space",
				key: "space",
				align: "center",
			},
			{
				title: "网关（智能箱）信息",
				dataIndex: "terminal",
				key: "terminal",
				align: "center",
			},
			{
				title: "传感器信息",
				dataIndex: "sensor",
				key: "sensor",
				align: "center",
			},
			{
				title: "操作",
				dataIndex: "operation",
				key: "operation",
				align: "center",
				render: (_, record: any) => (
					<Button
						variant="link"
						className="text-blue-500 cursor-pointer"
						onClick={() => handleOpenEditDialog(record)}
					>
						编辑
					</Button>
				),
			},
		];
	}, [propertyTitle])

	// 表格分页
	const [pageParams, setPageParams] = useState<PaginationType>({
		current: 1,
		pageSize: 10,
		showSizeChanger: false,
	});
	const [searchValues, setSearchValues] = useState<
		z.infer<typeof searchFormSchema>
	>({});
	function handlePaginationChange(pagination: PaginationType) {
		setPageParams(pagination);
	}

	// 请求表格数据
	const {
		data: propertyData,
		isPending: isLoading,
		refetch,
	} = useQuery({
		queryKey: [
			"propertyList",
			pageParams.current,
			pageParams.pageSize,
			searchValues,
		],
		queryFn: () =>
			getPropertyList({
				page: pageParams.current,
				page_size: pageParams.pageSize,
				...searchValues,
			}),
	});
	// 设置分页
	useEffect(() => {
		if (propertyData?.page?.totalSize && propertyData.page.totalSize > 0) {
			setPageParams((prev) => ({
				...prev,
				total: propertyData.page.totalSize,
			}));
		}
	}, [propertyData]);

	/** 搜索表单 */
	const searchForm = useForm<z.infer<typeof searchFormSchema>>({
		resolver: zodResolver(searchFormSchema),
		defaultValues: {
			property_id: "",
			is_used: "",
			property_type: "",
			building_number: "",
			building_name: "",
			space_number: "",
			space_name: "",
			space_type: "",
			terminal_number: "",
			terminal_type: "",
			sensor_kind: "",
			sensor_type: "",
		},
	});
	// 搜索表单资产类型选择
	const propertyType = searchForm.watch("property_type");

	// 传感器大类、小类选项
	const { data: sensorKindSelectOption } = useQuery({
		queryKey: ["sensorKindList"],
		queryFn: getSensorKindList,
	});
	const { data: sensorTypeSelectOption } = useQuery({
		queryKey: ["sensorTypeList"],
		queryFn: getSensorTypeList,
	});

	// 搜索表单提交
	function onSearchFormSubmit(values: z.infer<typeof searchFormSchema>) {
		setSearchValues(values);
		setPageParams({
			...pageParams,
			current: 1,
		});
		if (values.property_type === "building") {
			setPropertyTitle("楼宇名称（楼栋号）");
		}
		else if (values.property_type === "space") {
			setPropertyTitle("空间名称（房间号）");
		}
		else if (values.property_type === "terminal") {
			setPropertyTitle("网关（智能箱）编号（型号）");
		}
		else if (values.property_type === "sensor") {
			setPropertyTitle("传感器大类（小类）");
		}
		else {
			setPropertyTitle("资产名称");
		}
	}

	// 定义表单
	// 楼宇表单
	const buildingForm = useForm<z.infer<typeof buildingFormSchema>>({
		resolver: zodResolver(buildingFormSchema),
		defaultValues: {
			property_id: "LY9999",
			name: "",
			number: "",
			address: "",
			is_used: "",
			description: "",
		},
	});
	// 空间表单
	const spaceForm = useForm<z.infer<typeof spaceFormSchema>>({
		resolver: zodResolver(spaceFormSchema),
		defaultValues: {
			property_id: "KJ9999",
			property_bind_id: "",
			name: "",
			number: "",
			floor: "",
			type: "",
			ampere: "",
			is_used: "",
			description: "",
		},
	});
	// 终端表单
	const terminalForm = useForm<z.infer<typeof terminalFormSchema>>({
		resolver: zodResolver(terminalFormSchema),
		defaultValues: {
			property_id: "ZD9999",
			property_bind_id: "",
			number: "",
			type: "",
			is_used: "",
			description: "",
		},
	});
	// 传感器表单
	const sensorForm = useForm<z.infer<typeof sensorFormSchema>>({
		resolver: zodResolver(sensorFormSchema),
		defaultValues: {
			property_id: "CGQ9999",
			property_bind_id: "",
			kind: "",
			type: "",
			is_used: "",
			description: "",
		},
	});

	// 弹窗
	const [propertyDialogOpen, setPropertyDialogOpen] = useState(false);
	const [addOrEdit, setAddOrEdit] = useState<"add" | "edit">("add");

	// 绑定资产
	const [addPropertySelectValue, setAddPropertySelectValue] = useState("");
	const [bindPropertySelectOption, setBindPropertySelectOption] = useState<
		BindPropertyListItem[]
	>([]);
	const { mutate: bindPropertyMutate } = useMutation({
		mutationFn: getBindPropertyList,
	});
	function onAddPropertySelectValueChange(value: string) {
		setAddPropertySelectValue(value);
		if (value === "space") {
			bindPropertyMutate(
				{ property_type: "LY" },
				{
					onSuccess: (data) => {
						setBindPropertySelectOption(data);
					},
					onError: (error) => {
						toast.error(error.message);
					},
				},
			);
		}
		if (value === "terminal") {
			bindPropertyMutate(
				{ property_type: "KJ" },
				{
					onSuccess: (data) => {
						setBindPropertySelectOption(data);
					},
					onError: (error) => {
						toast.error(error.message);
					},
				},
			);
		}
		if (value === "sensor") {
			bindPropertyMutate(
				{ property_type: "ZD" },
				{
					onSuccess: (data) => {
						setBindPropertySelectOption(data);
					},
					onError: (error) => {
						toast.error(error.message);
					},
				},
			);
		}
	}

	// 新增资产弹窗
	function handleOpenAddDialog() {
		setAddOrEdit("add");
		setPropertyDialogOpen(true);
	}

	// 编辑资产弹窗
	const { mutate: getPropertyDetailsMutate } = useMutation({
		mutationFn: getPropertyDetails,
	});
	function handleOpenEditDialog(record: any) {
		setAddOrEdit("edit");
		setPropertyDialogOpen(true);
		if (record.property_id.startsWith("LY")) {
			setAddPropertySelectValue("building");
			getPropertyDetailsMutate(record.property_id, {
				onSuccess: (data) => {
					buildingForm.reset(data);
				},
			});
		}
		if (record.property_id.startsWith("KJ")) {
			setAddPropertySelectValue("space");
			onAddPropertySelectValueChange("space");
			getPropertyDetailsMutate(record.property_id, {
				onSuccess: (data) => {
					spaceForm.reset(data);
				},
			});
		}
		if (record.property_id.startsWith("ZD")) {
			setAddPropertySelectValue("terminal");
			onAddPropertySelectValueChange("terminal");
			getPropertyDetailsMutate(record.property_id, {
				onSuccess: (data) => {
					terminalForm.reset(data);
				},
			});
		}
		if (record.property_id.startsWith("CGQ")) {
			setAddPropertySelectValue("sensor");
			onAddPropertySelectValueChange("sensor");
			getPropertyDetailsMutate(record.property_id, {
				onSuccess: (data) => {
					sensorForm.reset(data);
				},
			});
		}
	}

	// 新增资产请求
	const { mutate: addPropertyMutate } = useMutation({
		mutationFn: addProperty,
	});
	// 编辑资产请求
	const { mutate: updatePropertyMutate } = useMutation({
		mutationFn: updateProperty,
	});
	// 新增资产表单提交
	async function onPropertyFormSubmit(values: any) {
		if (addPropertySelectValue === "building") {
			const isValid = await buildingForm.trigger(); // 触发全部字段验证
			if (!isValid) {
				return;
			}
			if (addOrEdit === "add") {
				addPropertyMutate(values, {
					onSuccess: () => {
						setPropertyDialogOpen(false);
						toast.success("新增楼宇成功");
						buildingForm.reset();
						setAddPropertySelectValue("");
						refetch();
					},
					onError: (error) => {
						toast.error(error.message);
					},
				});
			} else {
				updatePropertyMutate(values, {
					onSuccess: () => {
						setPropertyDialogOpen(false);
						toast.success("编辑楼宇成功");
						buildingForm.reset();
						setAddPropertySelectValue("");
						refetch();
					},
					onError: (error) => {
						toast.error(error.message);
					},
				});
			}
		}
		if (addPropertySelectValue === "space") {
			const isValid = await spaceForm.trigger(); // 触发全部字段验证
			if (!isValid) {
				return;
			}
			if (addOrEdit === "add") {
				addPropertyMutate(values, {
					onSuccess: () => {
						setPropertyDialogOpen(false);
						toast.success("新增空间成功");
						spaceForm.reset();
						setAddPropertySelectValue("");
						refetch();
					},
					onError: (error) => {
						toast.error(error.message);
					},
				});
			} else {
				updatePropertyMutate(values, {
					onSuccess: () => {
						setPropertyDialogOpen(false);
						toast.success("编辑空间成功");
						spaceForm.reset();
						setAddPropertySelectValue("");
						refetch();
					},
					onError: (error) => {
						toast.error(error.message);
					},
				});
			}
		}
		if (addPropertySelectValue === "terminal") {
			const isValid = await terminalForm.trigger(); // 触发全部字段验证
			if (!isValid) {
				return;
			}
			if (addOrEdit === "add") {
				addPropertyMutate(values, {
					onSuccess: () => {
						setPropertyDialogOpen(false);
						toast.success("新增终端成功");
						terminalForm.reset();
						setAddPropertySelectValue("");
						refetch();
					},
					onError: (error) => {
						toast.error(error.message);
					},
				});
			} else {
				updatePropertyMutate(values, {
					onSuccess: () => {
						setPropertyDialogOpen(false);
						toast.success("编辑终端成功");
						terminalForm.reset();
						setAddPropertySelectValue("");
						refetch();
					},
					onError: (error) => {
						toast.error(error.message);
					},
				});
			}
		}
		if (addPropertySelectValue === "sensor") {
			const isValid = await sensorForm.trigger(); // 触发全部字段验证
			if (!isValid) {
				return;
			}
			if (addOrEdit === "add") {
				addPropertyMutate(values, {
					onSuccess: () => {
						setPropertyDialogOpen(false);
						toast.success("新增终端成功");
						sensorForm.reset();
						setAddPropertySelectValue("");
						refetch();
					},
					onError: (error) => {
						toast.error(error.message);
					},
				});
			} else {
				updatePropertyMutate(values, {
					onSuccess: () => {
						setPropertyDialogOpen(false);
						toast.success("编辑传感器成功");
						sensorForm.reset();
						setAddPropertySelectValue("");
						refetch();
					},
					onError: (error) => {
						toast.error(error.message);
					},
				});
			}
		}
	}

	// 确定新增资产
	function handleOK() {
		if (!addPropertySelectValue) {
			toast.info("请选择资产类型");
		}
		if (addPropertySelectValue === "building") {
			buildingForm.handleSubmit(onPropertyFormSubmit)();
		}
		if (addPropertySelectValue === "space") {
			spaceForm.handleSubmit(onPropertyFormSubmit)();
		}
		if (addPropertySelectValue === "terminal") {
			terminalForm.handleSubmit(onPropertyFormSubmit)();
		}
		if (addPropertySelectValue === "sensor") {
			sensorForm.handleSubmit(onPropertyFormSubmit)();
		}
	}

	// 关闭弹窗
	function onDialogOpenChange(open: boolean) {
		setPropertyDialogOpen(open);
		if (!open) {
			setAddPropertySelectValue("");
			buildingForm.reset({
				property_id: "LY9999",
				name: "",
				number: "",
				address: "",
				is_used: "",
				description: "",
			});
			spaceForm.reset({
				property_id: "KJ9999",
				property_bind_id: "",
				name: "",
				number: "",
				floor: "",
				type: "",
				ampere: "",
				is_used: "",
				description: "",
			});
			terminalForm.reset({
				property_id: "ZD9999",
				property_bind_id: "",
				number: "",
				type: "",
				is_used: "",
				description: "",
			});
			sensorForm.reset({
				property_id: "CGQ9999",
				property_bind_id: "",
				kind: "",
				type: "",
				is_used: "",
				description: "",
			});
		}
	}

	const { mutate: getBindPropertyListMutate } = useMutation({
		mutationFn: exportPropertyList
	})
	function exportProperty() {
		getBindPropertyListMutate({
			page: 1,
			page_size: 10,
			is_excel: true,
			...searchValues,
		},
			{
				onSuccess: (res) => {
					const blob = new Blob([res.data], { type: 'application/vnd.ms-excel' });
					const url = window.URL.createObjectURL(blob);
					const link = document.createElement('a');
					link.href = url;
					link.download = '资产列表.xlsx';
					link.click();
					window.URL.revokeObjectURL(url);
				},
				onError: (error) => {
					toast.error(error.message);
				}
			}
		)
	}

	return (
		<div className="p-5">
			<Form {...searchForm}>
				<form
					className="space-y-8"
					onSubmit={searchForm.handleSubmit(onSearchFormSubmit)}
				>
					<div className="flex gap-5">
						<FormField
							control={searchForm.control}
							name="property_id"
							render={({ field }) => (
								<FormItem className="flex items-center gap-3">
									<FormLabel>资产编号</FormLabel>
									<div className="flex flex-col">
										<FormControl>
											<Input {...field} className="bg-white" />
										</FormControl>
									</div>
								</FormItem>
							)}
						/>
						<FormField
							control={searchForm.control}
							name="is_used"
							render={({ field }) => (
								<FormItem className="flex items-center gap-3">
									<FormLabel>资产使用状态</FormLabel>
									<div className="flex flex-col">
										<FormControl>
											<Select
												onValueChange={field.onChange}
												value={field.value}
											>
												<FormControl>
													<SelectTrigger className="bg-white w-50">
														<SelectValue placeholder="请选择资产使用状态" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													{propertyStatusSelectOptions.map((option) => (
														<SelectItem key={option.value} value={option.value}>
															{option.label}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</FormControl>
									</div>
								</FormItem>
							)}
						/>
						<FormField
							control={searchForm.control}
							name="property_type"
							render={({ field }) => (
								<FormItem className="flex items-center gap-3">
									<FormLabel>资产类型</FormLabel>
									<div className="flex flex-col">
										<Select onValueChange={field.onChange} value={field.value}>
											<FormControl>
												<SelectTrigger className="bg-white w-50">
													<SelectValue placeholder="请选择资产类型" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{propertyTypeSelectOptions.map((option) => (
													<SelectItem key={option.value} value={option.value}>
														{option.label}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
								</FormItem>
							)}
						/>
						<Button type="primary" htmlType="submit" className="cursor-pointer">
							查询
						</Button>
						<Button
							type="primary"
							htmlType="reset"
							className="cursor-pointer"
							onClick={() => searchForm.reset()}
						>
							清空
						</Button>
						<Button
							type="primary"
							className="cursor-pointer"
							onClick={exportProperty}
						>
							导出
						</Button>
					</div>
					<div>
						{propertyType === "building" && (
							<div className="flex gap-5">
								<FormField
									control={searchForm.control}
									name="building_name"
									render={({ field }) => (
										<FormItem className="flex items-center gap-3">
											<FormLabel>楼宇名称</FormLabel>
											<div className="flex flex-col">
												<FormControl>
													<Input {...field} className="bg-white" />
												</FormControl>
											</div>
										</FormItem>
									)}
								/>
								<FormField
									control={searchForm.control}
									name="building_number"
									render={({ field }) => (
										<FormItem className="flex items-center gap-3">
											<FormLabel>楼栋号</FormLabel>
											<div className="flex flex-col">
												<FormControl>
													<Input {...field} className="bg-white" />
												</FormControl>
											</div>
										</FormItem>
									)}
								/>
							</div>
						)}
						{propertyType === "space" && (
							<div className="flex gap-5">
								<FormField
									control={searchForm.control}
									name="space_name"
									render={({ field }) => (
										<FormItem className="flex items-center gap-3">
											<FormLabel>空间名称</FormLabel>
											<div className="flex flex-col">
												<FormControl>
													<Input {...field} className="bg-white" />
												</FormControl>
											</div>
										</FormItem>
									)}
								/>
								<FormField
									control={searchForm.control}
									name="space_number"
									render={({ field }) => (
										<FormItem className="flex items-center gap-3">
											<FormLabel>房间号</FormLabel>
											<div className="flex flex-col">
												<FormControl>
													<Input {...field} className="bg-white" />
												</FormControl>
											</div>
										</FormItem>
									)}
								/>
								<FormField
									control={searchForm.control}
									name="space_type"
									render={({ field }) => (
										<FormItem className="flex items-center gap-3">
											<FormLabel>房间用途</FormLabel>
											<div className="flex flex-col">
												<FormControl>
													<Input {...field} className="bg-white" />
												</FormControl>
											</div>
										</FormItem>
									)}
								/>
							</div>
						)}
						{propertyType === "terminal" && (
							<div className="flex gap-5">
								<FormField
									control={searchForm.control}
									name="terminal_number"
									render={({ field }) => (
										<FormItem className="flex items-center gap-3">
											<FormLabel>网关（智能箱）编号</FormLabel>
											<div className="flex flex-col">
												<FormControl>
													<Input {...field} className="bg-white" />
												</FormControl>
											</div>
										</FormItem>
									)}
								/>
								<FormField
									control={searchForm.control}
									name="terminal_type"
									render={({ field }) => (
										<FormItem className="flex items-center gap-3">
											<FormLabel>网关（智能箱）型号</FormLabel>
											<div className="flex flex-col">
												<FormControl>
													<Input {...field} className="bg-white" />
												</FormControl>
											</div>
										</FormItem>
									)}
								/>
							</div>
						)}
						{propertyType === "sensor" && (
							<div className="flex gap-5">
								<FormField
									control={searchForm.control}
									name="sensor_kind"
									render={({ field }) => (
										<FormItem className="flex items-center gap-3">
											<FormLabel>传感器大类</FormLabel>
											<div className="flex flex-col">
												<Select
													onValueChange={field.onChange}
													value={field.value}
												>
													<FormControl>
														<SelectTrigger className="bg-white w-50">
															<SelectValue placeholder="请选择传感器大类" />
														</SelectTrigger>
													</FormControl>
													<SelectContent>
														{sensorKindSelectOption?.map((option) => (
															<SelectItem key={option.kind} value={option.kind}>
																{option.name}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
											</div>
										</FormItem>
									)}
								/>
								<FormField
									control={searchForm.control}
									name="sensor_type"
									render={({ field }) => (
										<FormItem className="flex items-center gap-3">
											<FormLabel>传感器小类</FormLabel>
											<div className="flex flex-col">
												<Select
													onValueChange={field.onChange}
													value={field.value}
												>
													<FormControl>
														<SelectTrigger className="bg-white w-50">
															<SelectValue placeholder="请选择传感器小类" />
														</SelectTrigger>
													</FormControl>
													<SelectContent>
														{sensorTypeSelectOption?.map((option) => (
															<SelectItem key={option.type} value={option.type}>
																{option.name}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
											</div>
										</FormItem>
									)}
								/>
							</div>
						)}
					</div>
				</form>
			</Form>
			<div className="mt-5">
				<Button
					type="primary"
					className="cursor-pointer"
					onClick={handleOpenAddDialog}
				>
					新增
				</Button>
			</div>
			<Table
				dataSource={propertyData?.property ?? []}
				columns={columns}
				loading={isLoading}
				pagination={pageParams}
				onChange={handlePaginationChange}
				className="mt-2"
			/>
			<Dialog open={propertyDialogOpen} onOpenChange={onDialogOpenChange}>
				<DialogContent className="max-w-180!" showCloseButton={false}>
					<DialogClose className="top-3 right-3 absolute flex justify-center items-center bg-gray-200 hover:bg-gray-300 p-1 rounded-full cursor-pointer">
						<X className="w-4 h-4" />
					</DialogClose>
					<DialogHeader>
						{addOrEdit === "add" ? (
							<DialogTitle>新增资产</DialogTitle>
						) : (
							<DialogTitle>编辑资产</DialogTitle>
						)}
					</DialogHeader>
					<div className="mt-5">
						<div>
							{addOrEdit === "add" ? (
								<Select
									onValueChange={onAddPropertySelectValueChange}
									value={addPropertySelectValue}
								>
									<SelectTrigger className="w-50">
										<SelectValue placeholder="请先选择资产类" />
									</SelectTrigger>
									<SelectContent>
										{propertyTypeSelectOptions.map((option) => (
											<SelectItem key={option.value} value={option.value}>
												{option.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							) : null}
						</div>
						<div className="mt-10">
							{addPropertySelectValue === "building" && (
								<Form {...buildingForm}>
									<form className="space-y-7">
										<FormField
											control={buildingForm.control}
											name="name"
											render={({ field }) => (
												<FormItem className="relative flex items-center gap-5">
													<FormLabel>楼宇名称</FormLabel>
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
											control={buildingForm.control}
											name="number"
											render={({ field }) => (
												<FormItem className="flex items-center gap-5">
													<FormLabel>楼栋号</FormLabel>
													<div className="flex flex-col">
														<FormControl>
															<Input {...field} className="w-80 h-8" />
														</FormControl>
													</div>
												</FormItem>
											)}
										/>
										<FormField
											control={buildingForm.control}
											name="address"
											render={({ field }) => (
												<FormItem className="flex items-center gap-5">
													<FormLabel>楼宇地址</FormLabel>
													<div className="flex flex-col">
														<FormControl>
															<Input {...field} className="w-80 h-8" />
														</FormControl>
													</div>
												</FormItem>
											)}
										/>
										<FormField
											control={buildingForm.control}
											name="is_used"
											render={({ field }) => (
												<FormItem className="relative flex items-center gap-5">
													<FormLabel>楼宇状态</FormLabel>
													<div className="flex flex-col">
														<Select
															onValueChange={field.onChange}
															value={field.value}
														>
															<FormControl>
																<SelectTrigger className="bg-white w-80">
																	<SelectValue placeholder="请选择楼宇使用状态" />
																</SelectTrigger>
															</FormControl>
															<SelectContent>
																{buildingIsUsedSelectOptions.map((option) => (
																	<SelectItem
																		key={option.value}
																		value={option.value}
																	>
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
										<FormField
											control={buildingForm.control}
											name="description"
											render={({ field }) => (
												<FormItem className="flex items-center gap-5">
													<FormLabel>楼宇描述</FormLabel>
													<div className="flex flex-col">
														<FormControl>
															<Input {...field} className="w-80 h-8" />
														</FormControl>
													</div>
												</FormItem>
											)}
										/>
									</form>
								</Form>
							)}
							{addPropertySelectValue === "space" && (
								<Form {...spaceForm}>
									<form className="space-y-7">
										<FormField
											control={spaceForm.control}
											name="name"
											render={({ field }) => (
												<FormItem className="relative flex items-center gap-5">
													<FormLabel>房间名</FormLabel>
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
											control={spaceForm.control}
											name="number"
											render={({ field }) => (
												<FormItem className="relative flex items-center gap-5">
													<FormLabel>房间号</FormLabel>
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
											control={spaceForm.control}
											name="floor"
											render={({ field }) => (
												<FormItem className="relative flex items-center gap-5">
													<FormLabel>所在楼层</FormLabel>
													<div className="flex flex-col">
														<FormControl>
															<Input
																type="number"
																{...field}
																className="w-80 h-8"
															/>
														</FormControl>
														<FormMessage className="bottom-0 absolute translate-y-full" />
													</div>
												</FormItem>
											)}
										/>
										<FormField
											control={spaceForm.control}
											name="type"
											render={({ field }) => (
												<FormItem className="flex items-center gap-5">
													<FormLabel>房间用途</FormLabel>
													<div className="flex flex-col">
														<FormControl>
															<Input {...field} className="w-80 h-8" />
														</FormControl>
													</div>
												</FormItem>
											)}
										/>
										<FormField
											control={spaceForm.control}
											name="property_bind_id"
											render={({ field }) => (
												<FormItem className="relative flex items-center gap-5">
													<FormLabel>绑定楼宇</FormLabel>
													<div className="flex flex-col">
														<Select
															onValueChange={field.onChange}
															value={field.value}
														>
															<FormControl>
																<SelectTrigger className="bg-white w-80">
																	<SelectValue placeholder="请选择绑定楼宇" />
																</SelectTrigger>
															</FormControl>
															<SelectContent>
																{bindPropertySelectOption.map((option) => (
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
											control={spaceForm.control}
											name="is_used"
											render={({ field }) => (
												<FormItem className="relative flex items-center gap-5">
													<FormLabel>空间状态</FormLabel>
													<div className="flex flex-col">
														<Select
															onValueChange={field.onChange}
															value={field.value}
														>
															<FormControl>
																<SelectTrigger className="bg-white w-80">
																	<SelectValue placeholder="请选择空间使用状态" />
																</SelectTrigger>
															</FormControl>
															<SelectContent>
																{buildingIsUsedSelectOptions.map((option) => (
																	<SelectItem
																		key={option.value}
																		value={option.value}
																	>
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
										<FormField
											control={spaceForm.control}
											name="ampere"
											render={({ field }) => (
												<FormItem className="flex items-center gap-5">
													<FormLabel>电流大小</FormLabel>
													<div className="flex flex-col">
														<FormControl>
															<Input {...field} className="w-80 h-8" />
														</FormControl>
													</div>
												</FormItem>
											)}
										/>
										<FormField
											control={spaceForm.control}
											name="description"
											render={({ field }) => (
												<FormItem className="flex items-center gap-5">
													<FormLabel>空间描述</FormLabel>
													<div className="flex flex-col">
														<FormControl>
															<Input {...field} className="w-80 h-8" />
														</FormControl>
													</div>
												</FormItem>
											)}
										/>
									</form>
								</Form>
							)}
							{addPropertySelectValue === "terminal" && (
								<Form {...terminalForm}>
									<form className="space-y-7">
										<FormField
											control={terminalForm.control}
											name="number"
											render={({ field }) => (
												<FormItem className="relative flex items-center gap-5">
													<FormLabel>网关（智能箱）编号</FormLabel>
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
											control={terminalForm.control}
											name="type"
											render={({ field }) => (
												<FormItem className="relative flex items-center gap-5">
													<FormLabel>网关（智能箱）型号</FormLabel>
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
											control={terminalForm.control}
											name="property_bind_id"
											render={({ field }) => (
												<FormItem className="relative flex items-center gap-5">
													<FormLabel>绑定空间</FormLabel>
													<div className="flex flex-col">
														<Select
															onValueChange={field.onChange}
															value={field.value}
														>
															<FormControl>
																<SelectTrigger className="bg-white w-80">
																	<SelectValue placeholder="请选择绑定空间" />
																</SelectTrigger>
															</FormControl>
															<SelectContent>
																{bindPropertySelectOption.map((option) => (
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
											control={terminalForm.control}
											name="is_used"
											render={({ field }) => (
												<FormItem className="relative flex items-center gap-5">
													<FormLabel>网关（智能箱）状态</FormLabel>
													<div className="flex flex-col">
														<Select
															onValueChange={field.onChange}
															value={field.value}
														>
															<FormControl>
																<SelectTrigger className="bg-white w-80">
																	<SelectValue placeholder="请选择网关（智能箱）状态" />
																</SelectTrigger>
															</FormControl>
															<SelectContent>
																{buildingIsUsedSelectOptions.map((option) => (
																	<SelectItem
																		key={option.value}
																		value={option.value}
																	>
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
										<FormField
											control={terminalForm.control}
											name="description"
											render={({ field }) => (
												<FormItem className="flex items-center gap-5">
													<FormLabel>网关（智能箱）描述</FormLabel>
													<div className="flex flex-col">
														<FormControl>
															<Input {...field} className="w-80 h-8" />
														</FormControl>
													</div>
												</FormItem>
											)}
										/>
									</form>
								</Form>
							)}
							{addPropertySelectValue === "sensor" && (
								<Form {...sensorForm}>
									<form className="space-y-7">
										<FormField
											control={sensorForm.control}
											name="kind"
											render={({ field }) => (
												<FormItem className="relative flex items-center gap-5">
													<FormLabel>传感器大类</FormLabel>
													<div className="flex flex-col">
														<Select
															onValueChange={field.onChange}
															value={field.value}
														>
															<FormControl>
																<SelectTrigger className="bg-white w-80">
																	<SelectValue placeholder="请选择传感器大类" />
																</SelectTrigger>
															</FormControl>
															<SelectContent>
																{sensorKindSelectOption?.map((option) => (
																	<SelectItem
																		key={option.kind}
																		value={option.kind}
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
											control={sensorForm.control}
											name="type"
											render={({ field }) => (
												<FormItem className="relative flex items-center gap-5">
													<FormLabel>传感器小类</FormLabel>
													<div className="flex flex-col">
														<Select
															onValueChange={field.onChange}
															value={field.value}
														>
															<FormControl>
																<SelectTrigger className="bg-white w-80">
																	<SelectValue placeholder="请选择传感器小类" />
																</SelectTrigger>
															</FormControl>
															<SelectContent>
																{sensorTypeSelectOption?.map((option) => (
																	<SelectItem
																		key={option.type}
																		value={option.type}
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
											control={sensorForm.control}
											name="property_bind_id"
											render={({ field }) => (
												<FormItem className="relative flex items-center gap-5">
													<FormLabel>绑定终端</FormLabel>
													<div className="flex flex-col">
														<Select
															onValueChange={field.onChange}
															value={field.value}
														>
															<FormControl>
																<SelectTrigger className="bg-white w-80">
																	<SelectValue placeholder="请选择绑定终端" />
																</SelectTrigger>
															</FormControl>
															<SelectContent>
																{bindPropertySelectOption.map((option) => (
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
											control={sensorForm.control}
											name="is_used"
											render={({ field }) => (
												<FormItem className="relative flex items-center gap-5">
													<FormLabel>传感器状态</FormLabel>
													<div className="flex flex-col">
														<Select
															onValueChange={field.onChange}
															value={field.value}
														>
															<FormControl>
																<SelectTrigger className="bg-white w-80">
																	<SelectValue placeholder="请选择传感器使用状态" />
																</SelectTrigger>
															</FormControl>
															<SelectContent>
																{buildingIsUsedSelectOptions.map((option) => (
																	<SelectItem
																		key={option.value}
																		value={option.value}
																	>
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
										<FormField
											control={sensorForm.control}
											name="description"
											render={({ field }) => (
												<FormItem className="flex items-center gap-5">
													<FormLabel>传感器描述</FormLabel>
													<div className="flex flex-col">
														<FormControl>
															<Input {...field} className="w-80 h-8" />
														</FormControl>
													</div>
												</FormItem>
											)}
										/>
									</form>
								</Form>
							)}
						</div>
					</div>
					<DialogFooter className="mt-10">
						<DialogClose asChild>
							<Button type="default" className="cursor-pointer">
								取消
							</Button>
						</DialogClose>
						<Button type="default" className="cursor-pointer" onClick={handleOK}>
							确定
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
