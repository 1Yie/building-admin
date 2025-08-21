import { zodResolver } from "@hookform/resolvers/zod";
import { PopoverTrigger } from "@radix-ui/react-popover";
import { useQuery } from "@tanstack/react-query";
import { Table } from "antd";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import dayjs from "dayjs";
import { CalendarIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";
import { getLogList, getLogTypeList } from "@/request/log";
import { cn } from "@/shadcn/lib/utils";
import { Button } from "@/shadcn/ui/button";
import { Calendar } from "@/shadcn/ui/calendar";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
} from "@/shadcn/ui/form";
import { Input } from "@/shadcn/ui/input";
import { Popover, PopoverContent } from "@/shadcn/ui/popover";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/shadcn/ui/select";
import type { PaginationType } from "@/types";

export default function LogPage() {
	const columns = [
		{
			title: "时间",
			dataIndex: "time",
			key: "time",
			align: "center",
		},
		{
			title: "操作人",
			dataIndex: "operator",
			key: "operator",
			align: "center",
		},
		{
			title: "操作类型",
			dataIndex: "type",
			key: "type",
			align: "center",
		},
		{
			title: "操作内容",
			dataIndex: "content",
			key: "content",
			align: "center",
		},
	];

	// 分页
	const [pageParams, setPageParams] = useState<PaginationType>({
		current: 1,
		pageSize: 10,
	});
	function onPageChange(current: number, pageSize: number) {
		setPageParams({
			current,
			pageSize,
		});
	}
	const [searchValues, setSearchValues] = useState<
		z.infer<typeof searchFormSchema>
	>({});

	// 表格
	const {
		data: logList,
		isError,
		error,
		isPending,
	} = useQuery({
		queryKey: ["getLogList", pageParams, searchValues],
		queryFn: () =>
			getLogList({
				page: pageParams.current,
				page_size: pageParams.pageSize,
				...searchValues
			}),
	});

	useEffect(() => {
		if (isError) {
			toast.error(error?.message);
		}
	}, [isError, error]);

	useEffect(() => {
		if (logList?.page?.totalSize && logList?.page?.totalSize > 0) {
			setPageParams((prev) => ({
				...prev,
				total: logList.page.totalSize,
			}));
		}
	}, [logList]);

	// 搜索表单
	const searchFormSchema = z.object({
		time: z.preprocess((val) => {
			if (val === "" || val === null)
				return undefined
			if (val instanceof Date)
				return val
			return undefined
		}, z.date().optional()), // optional 支持 undefined
		operator: z.string().optional(), // 操作人
		log_type: z.string().optional(), // 日志类型
	});
	const searchForm = useForm<z.infer<typeof searchFormSchema>>({
		resolver: zodResolver(searchFormSchema),
		defaultValues: {
			time: "",
			operator: "", // 操作人
			log_type: "", // 日志类型
		},
	});

	const { data: logTypeSelectOption } = useQuery({
		queryKey: ["getLogTypeList"],
		queryFn: getLogTypeList,
	});
	const operateSelectOption = [
		{
			name: "system",
			value: "system",
		},
	];

	function onSearchFormSubmit(values: z.infer<typeof searchFormSchema>) {
		setSearchValues({
			time: dayjs(values.time).format("YYYY-MM-DD"),
			operator: values.operator,
			log_type: values.log_type,
		})
	}

	function onResetForm() {
		searchForm.reset();
		setSearchValues({});
	}

	return (
		<div className="p-5">
			<div>
				<Form {...searchForm}>
					<form className="space-y-8">
						<div className="flex gap-5">
							<FormField
								control={searchForm.control}
								name="time"
								render={({ field }) => (
									<FormItem className="flex items-center gap-3">
										<FormLabel>时间</FormLabel>
										<div className="flex flex-col">
											<Popover>
												<PopoverTrigger asChild>
													<FormControl>
														<Button
															variant={"outline"}
															className={cn(
																"pl-3 w-[240px] font-normal text-left cursor-pointer",
																!field.value && "text-muted-foreground",
															)}
														>
															{field.value ? (
																format(field.value, "PPP", { locale: zhCN })
															) : (
																<span>请选择日期</span>
															)}
															<CalendarIcon className="opacity-50 ml-auto w-4 h-4" />
														</Button>
													</FormControl>
												</PopoverTrigger>
												<PopoverContent className="p-0 w-auto" align="start">
													<Calendar
														mode="single"
														selected={field.value}
														onSelect={field.onChange}
														disabled={(date) =>
															date > new Date() || date < new Date("1900-01-01")
														}
														captionLayout="dropdown"
														locale={zhCN}
													/>
												</PopoverContent>
											</Popover>
										</div>
									</FormItem>
								)}
							/>
							<FormField
								control={searchForm.control}
								name="log_type"
								render={({ field }) => (
									<FormItem className="flex items-center gap-3">
										<FormLabel>日志类型</FormLabel>
										<div className="flex flex-col">
											<Select
												onValueChange={field.onChange}
												value={field.value}
											>
												<FormControl>
													<SelectTrigger className="bg-white w-50 cursor-pointer">
														<SelectValue placeholder="日志类型" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													{logTypeSelectOption?.map((option) => (
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
							<FormField
								control={searchForm.control}
								name="operator"
								render={({ field }) => (
									<FormItem className="flex items-center gap-3">
										<FormLabel>操作人</FormLabel>
										<div className="flex flex-col">
											<Select
												onValueChange={field.onChange}
												value={field.value}
											>
												<FormControl>
													<SelectTrigger className="bg-white w-50 cursor-pointer">
														<SelectValue placeholder="操作人" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													{operateSelectOption?.map((option) => (
														<SelectItem key={option.value} value={option.value}>
															{option.name}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</div>
									</FormItem>
								)}
							/>
							<Button
								type="button"
								className="cursor-pointer"
								onClick={searchForm.handleSubmit(onSearchFormSubmit)}
							>
								查询
							</Button>
							<Button
								type="button"
								className="cursor-pointer"
								onClick={onResetForm}
							>
								清空
							</Button>
						</div>
					</form>
				</Form>
			</div>
			<div className="mt-5">
				<Table
					columns={columns}
					dataSource={logList?.log}
					pagination={{
						current: pageParams.current,
						pageSize: pageParams.pageSize,
						total: pageParams.total,
						onChange: onPageChange,
					}}
					loading={isPending}
				/>
			</div>
		</div>
	);
}
