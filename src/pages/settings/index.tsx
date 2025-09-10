import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";
import { getTaskInterVal, setTaskInterVal } from "@/request/settings";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormMessage,
} from "@/shadcn/ui/form";
import { Button, Input } from "antd";

export default function SettingsPage() {
	// 获取任务间隔
	const {
		data: taskInterVal,
		isError,
		error,
	} = useQuery({
		queryKey: ["getTaskInterVal"],
		queryFn: getTaskInterVal,
	});
	useEffect(() => {
		if (isError) {
			toast.error(error?.message);
		}
	}, [isError, error]);

	// 表单
	const settingsFormSchema = z.object({
		seconds: z.coerce
			.number()
			.int({ message: "请输入整数" })
			.min(1, "请输入大于0的整数"),
	});
	
	const settingsForm = useForm<z.infer<typeof settingsFormSchema>>({
		resolver: zodResolver(settingsFormSchema),
		defaultValues: {
			seconds: 300,
		},
	});
	useEffect(() => {
		if (taskInterVal) {
			settingsForm.reset({
				seconds: taskInterVal,
			});
		}
	}, [taskInterVal]);

	// 确认
	function handleOK() {
		settingsForm.handleSubmit(onSubmit)();
	}

	const { mutate: setTaskInterValMutate } = useMutation({
		mutationFn: setTaskInterVal,
	});

	function onSubmit(values: z.infer<typeof settingsFormSchema>) {
		setTaskInterValMutate(values, {
			onSuccess: () => {
				toast.success("设置成功");
			},
			onError: (error) => {
				toast.error(error.message);
			},
		});
	}

	return (
		<div className="p-5">
			<div className="flex items-center gap-2">
				<span>以</span>
				<Form {...settingsForm}>
					<form className="space-y-8">
						<FormField
							control={settingsForm.control}
							name="seconds"
							render={({ field }) => (
								<FormItem className="relative flex items-center">
									<div className="flex flex-col">
										<FormControl>
											<Input {...field} type="number" />
										</FormControl>
										<FormMessage className="bottom-0 absolute translate-y-full" />
									</div>
								</FormItem>
							)}
						/>
					</form>
				</Form>
				<span>
					秒钟为周期，对时间进行切片，在某个周期内数据发生变化视为该周期内的活跃设备
				</span>
			</div>
			<div className="mt-5">
				<Button type="primary" className="cursor-pointer" onClick={handleOK}>
					保存
				</Button>
			</div>
		</div>
	);
}
