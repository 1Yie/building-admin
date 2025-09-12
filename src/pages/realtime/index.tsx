import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Pagination } from "antd";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";
import {
	getBindPropertyList,
	getSensorKindList,
	getSensorTypeList,
} from "@/request/property";
import { getOutlineInfo, getSensorList } from "@/request/realtime";
import { Button, Select, Input, ConfigProvider, Form } from "antd";
import { Card, CardContent } from "@/shadcn/ui/card";

import zhCN from 'antd/locale/zh_CN';
import dayjs from "dayjs";
import "dayjs/locale/zh-cn";

import { Skeleton } from "@/shadcn/ui/skeleton";
import type { PaginationType } from "@/types";
import ChartLine from "./chart-line";
import { Key } from "lucide-react";

export default function RealtimePage() {
	// 数据总揽
	const {
		data: outlineInfo,
		isError: isOutLineInfoError,
		error: outLineInfoError,
	} = useQuery({
		queryKey: ["getOutlineInfo"],
		queryFn: getOutlineInfo,
	});
	useEffect(() => {
		if (isOutLineInfoError) {
			toast.error(outLineInfoError?.message);
		}
	}, [isOutLineInfoError, outLineInfoError]);

	// 折线图数据列表
	const [pageParams, setPageParams] = useState<PaginationType>({
		current: 1,
		pageSize: 4,
	});
	const [searchValues, setSearchValues] = useState<
		z.infer<typeof searchFormSchema>
	>({});
	const { data: sensorList, isError, error, isPending } = useQuery({
		queryKey: ["getSensorList", pageParams, searchValues],
		queryFn: () =>
			getSensorList({
				page: pageParams.current,
				page_size: pageParams.pageSize,
				...searchValues,
			}),
	});
	useEffect(() => {
		if (isError) {
			toast.error(error?.message);
		}
	}, [isError, error]);
	useEffect(() => {
		if (sensorList?.page?.totalSize && sensorList?.page?.totalSize > 0) {
			setPageParams((prev) => ({
				...prev,
				total: sensorList.page.totalSize,
			}));
		}
	}, [sensorList]);

	// 分页
	function onPageChange(current: number, pageSize: number) {
		setPageParams({
			current,
			pageSize,
		});
	}

	// 转换为折线图数据
	const chartDataList =
		sensorList?.property?.map((item) => ({
			data: item.times.map((time, index) => ({
				time,
				value: item.values[index],
			})),
			name: item.name,
			field: item.field,
			property_id: item.property_id,
		})) ?? [];

	// 搜索表单
	const searchFormSchema = z.object({
		time_unit: z.string().optional(), // 统计范围（daily天 / week周 / month月）
		property_id: z.string().optional(), // 资产编号
		property_building_id: z.string().optional(), // 资产编号
		property_space_id: z.string().optional(), // 资产编号
		property_terminal_id: z.string().optional(), // 资产编号
		property_sensor_id: z.string().optional(), // 资产编号
		sensor_kind: z.string().optional(), // 传感器大类
		sensor_type: z.string().optional(), // 传感器小类
	});
	const searchForm = useForm<z.infer<typeof searchFormSchema>>({
		resolver: zodResolver(searchFormSchema),
		defaultValues: {
			time_unit: "",
			property_id: "",
			property_building_id: "",
			property_space_id: "",
			property_terminal_id: "",
			property_sensor_id: "",
			sensor_kind: "",
			sensor_type: "",
		},
	});

	// 全局propertyId
	const [propertyId, setPropertyId] = useState("");

	const timeUnitSelectOption = [
		{ value: "daily", label: "日" },
		{ value: "week", label: "周" },
		{ value: "month", label: "月" },
	];

	const { data: buildingSelectOption } = useQuery({
		queryKey: ["getBindPropertyList"],
		queryFn: () => getBindPropertyList({ property_type: "LY" }),
	});
	const { mutate: getSelectOptionMutate } = useMutation({
		mutationFn: getBindPropertyList,
	});

	const [spaceSelectOption, setSpaceSelectOption] = useState<
		{ property_id: string; name: string }[]
	>([]);
	function onPropertyBuildingIdChange(value: string, field) {
		field.onChange(value);
		setPropertyId(value);
		getSelectOptionMutate(
			{
				property_id: value,
				property_type: "KJ",
			},
			{
				onSuccess: (data) => {
					setSpaceSelectOption(data);
				},
				onError: (error) => {
					toast.error(error.message);
				},
			},
		);
	}

	const [terminalSelectOption, setTerminalSelectOption] = useState<
		{ property_id: string; name: string }[]
	>([]);
	function onPropertySpaceIdChange(value: string, field) {
		field.onChange(value);
		setPropertyId(value);
		getSelectOptionMutate(
			{
				property_id: value,
				property_type: "ZD",
			},
			{
				onSuccess: (data) => {
					setTerminalSelectOption(data);
				},
				onError: (error) => {
					toast.error(error.message);
				},
			},
		);
	}

	const [sensorSelectOption, setSensorSelectOption] = useState<
		{ property_id: string; name: string }[]
	>([]);
	function onPropertyTerminalIdChange(value: string, field) {
		field.onChange(value);
		setPropertyId(value);
		getSelectOptionMutate(
			{
				property_id: value,
				property_type: "CGQ",
			},
			{
				onSuccess: (data) => {
					setSensorSelectOption(data);
				},
				onError: (error) => {
					toast.error(error.message);
				},
			},
		);
	}

	function onPropertySensorIdChange(value: string, field) {
		field.onChange(value);
		setPropertyId(value);
	}

	const { data: sensorKindSelectOption } = useQuery({
		queryKey: ["sensorKindList"],
		queryFn: getSensorKindList,
	});
	const { data: sensorTypeSelectOption } = useQuery({
		queryKey: ["sensorTypeList"],
		queryFn: getSensorTypeList,
	});
	function onSearchFormSubmit(values: z.infer<typeof searchFormSchema>) {
		const { time_unit, sensor_kind, sensor_type } = values;
		setSearchValues({
			property_id: propertyId,
			time_unit,
			sensor_kind,
			sensor_type,
		});
		setPageParams({
			...pageParams,
			current: 1,
		});
	}

	// 重置表单
	function resetForm() {
		searchForm.reset();
		setPropertyId("");
		setSpaceSelectOption([]);
		setTerminalSelectOption([]);
		setSensorSelectOption([]);
	}

	return (
		<div className="p-5">
			<div className="gap-5 grid grid-cols-6">
				<Card className="border-gray-100/50 w-full h-30">
					<CardContent className="h-full">
						<div className="flex flex-col justify-center items-center gap-2 h-full">
							<div>{outlineInfo?.building_count}</div>
							<div>楼宇数</div>
						</div>
					</CardContent>
				</Card>
				<Card className="border-gray-100/50 w-full h-30">
					<CardContent className="h-full">
						<div className="flex flex-col justify-center items-center gap-2 h-full">
							<div>{outlineInfo?.space_count}</div>
							<div>空间数</div>
						</div>
					</CardContent>
				</Card>
				<Card className="border-gray-100/50 w-full h-30">
					<CardContent className="h-full">
						<div className="flex flex-col justify-center items-center gap-2 h-full">
							<div>{outlineInfo?.terminal_count}</div>
							<div>终端数</div>
						</div>
					</CardContent>
				</Card>
				<Card className="border-gray-100/50 w-full h-30">
					<CardContent className="h-full">
						<div className="flex flex-col justify-center items-center gap-2 h-full">
							<div>{outlineInfo?.sensor_count}</div>
							<div>设备数</div>
						</div>
					</CardContent>
				</Card>
				<Card className="border-gray-100/50 w-full h-30">
					<CardContent className="h-full">
						<div className="flex flex-col justify-center items-center gap-2 h-full">
							<div>{outlineInfo?.online_count}</div>
							<div>在线设备</div>
						</div>
					</CardContent>
				</Card>
				<Card className="border-gray-100/50 w-full h-30">
					<CardContent className="h-full">
						<div className="flex flex-col justify-center items-center gap-2 h-full">
							<div>{outlineInfo?.liveness_count}</div>
							<div>活跃设备</div>
						</div>
					</CardContent>
				</Card>
			</div>
			<div className="mt-10">
				<Form layout="inline" className="flex gap-2">
					<Controller
						control={searchForm.control}
						name="time_unit"
						render={({ field }) => (
							<Form.Item label="统计范围">
								<div className="flex flex-col">
									<Select style={{ width: 120 }} onChange={field.onChange} value={field.value}
										options={timeUnitSelectOption.map((item) => ({
											value: item.value,
										}))}
									/>
								</div>
							</Form.Item>
						)}
					/>

					<Controller
						control={searchForm.control}
						name="property_building_id"
						render={({ field }) => (
							<Form.Item label="楼宇">
								<div className="flex flex-col">
									<Select style={{ width: 120 }} onChange={(value) => onPropertyBuildingIdChange(value, field)} value={field.value}
										options={buildingSelectOption?.map((item) => ({
											Key: item.property_id,
											value: item.property_id,
										}))}
									/>
								</div>
							</Form.Item>
						)}
					/>

					<Controller
						control={searchForm.control}
						name="property_space_id"
						render={({ field }) => (
							<Form.Item label="空间">
								<div className="flex flex-col">
									<Select style={{ width: 120 }} onChange={(value) =>
										onPropertySpaceIdChange(value, field)
									} value={field.value}
										options={spaceSelectOption?.map((item) => ({
											Key: item.property_id,
											value: item.property_id,
										}))}
									/>
								</div>
							</Form.Item>
						)}
					/>

					<Controller
						control={searchForm.control}
						name="property_terminal_id"
						render={({ field }) => (
							<Form.Item label="网关（智能箱）">
								<div className="flex flex-col">
									<Select style={{ width: 120 }} onChange={(value) =>
										onPropertyTerminalIdChange(value, field)
									} value={field.value}
										options={terminalSelectOption?.map((item) => ({
											Key: item.property_id,
											value: item.property_id,
										}))}
									/>
								</div>
							</Form.Item>
						)}
					/>

					<Controller
						control={searchForm.control}
						name="property_sensor_id"
						render={({ field }) => (
							<Form.Item label="传感器">
								<div className="flex flex-col">
									<Select style={{ width: 120 }} onChange={(value) =>
										onPropertySensorIdChange(value, field)
									} value={field.value}
										options={sensorSelectOption?.map((item) => ({
											Key: item.property_id,
											value: item.property_id,
										}))}
									/>
								</div>
							</Form.Item>
						)}
					/>

					<Controller
						control={searchForm.control}
						name="sensor_kind"
						render={({ field }) => (
							<Form.Item label="传感器大类">
								<div className="flex flex-col">
									<Select style={{ width: 120 }} onChange={field.onChange}
										value={field.value}
										options={sensorKindSelectOption?.map((item) => ({
											Key: item.kind,
											value: item.kind,
										}))}
									/>
								</div>
							</Form.Item>
						)}
					/>

					<Controller
						control={searchForm.control}
						name="sensor_type"
						render={({ field }) => (
							<Form.Item label="传感器小类">
								<div className="flex flex-col">
									<Select style={{ width: 120 }} onChange={field.onChange}
										value={field.value}
										options={sensorTypeSelectOption?.map((item) => ({
											Key: item.type,
											value: item.type,
										}))}
									/>
								</div>
							</Form.Item>
						)}
					/>

					<div className="flex gap-2">
						<Button
							type="primary"
							htmlType="submit"
							className="cursor-pointer"
							onClick={searchForm.handleSubmit(onSearchFormSubmit)}
						>
							查询
						</Button>
						<Button
							type="default"
							htmlType="reset"
							className="cursor-pointer"
							onClick={resetForm}
						>
							清空
						</Button>
					</div>
				</Form>
			</div>
			<div className="mt-5">
				{
					isPending ? (
						<div>
							<Skeleton className="rounded-xl w-full h-40" />
						</div>
					) : (
						chartDataList.length > 0 ? (
							<div className="gap-5 grid grid-cols-2">
								{chartDataList.map((chartData) => (
									<ChartLine
										key={chartData.name}
										chartData={chartData.data}
										name={chartData.name}
										field={chartData.field}
									/>
								))}
							</div>
						) : (
							<div>
								<h1>无数据</h1>
							</div>
						)
					)
				}
			</div>
			<div className="mt-5">
				<ConfigProvider locale={zhCN}>
					<Pagination
						current={pageParams.current}
						pageSize={pageParams.pageSize}
						total={pageParams.total}
						showSizeChanger={false}
						onChange={onPageChange}
						showQuickJumper={true}
					/>
				</ConfigProvider>
			</div>
		</div>
	);
}
