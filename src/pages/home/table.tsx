import { useQuery } from "@tanstack/react-query";
import { getPropertyList } from "@/request/home";
import { Progress } from "@/shadcn/ui/progress";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/shadcn/ui/table";

export function BuildingTable() {
	const { data: propertyList } = useQuery({
		queryKey: ["propertyList"],
		queryFn: getPropertyList,
	});
	return (
		<Table className="h-70 overflow-y-auto text-center">
			<TableHeader>
				<TableRow>
					<TableHead className="text-center">楼宇名称</TableHead>
					<TableHead className="text-center">空间数</TableHead>
					<TableHead className="text-center">设备总数</TableHead>
					<TableHead className="text-center">在线率</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{propertyList?.map((item) => (
					<TableRow key={item.name}>
						<TableCell>{item.name}</TableCell>
						<TableCell>{item.space_count}</TableCell>
						<TableCell>{item.device_count}</TableCell>
						<TableCell className="flex items-center">
							<Progress
								value={item.device_online_rate * 100}
								className="[&>div]:bg-green-500 w-[70%] h-3"
							/>
							<span className="ml-2 w-10 font-medium text-gray-700 text-sm">
								{(item.device_online_rate * 100).toFixed(2)}%
							</span>
						</TableCell>
					</TableRow>
				))}
			</TableBody>
		</Table>
	);
}
