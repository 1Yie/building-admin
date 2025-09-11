import { Tabs } from "antd";
import { TeachingSpacePage } from "./teaching-space";
import VirtualTeachingSpacePage from "./virtual-teaching-space";

export default function TeachingPage() {
	return (
		<div className="p-5">
			<Tabs
				items={[
					{
						key: "1",
						label: "虚拟教学空间",
						children: <TeachingSpacePage />,
					},
					{
						key: "2",
						label: "源码申请",
						children: <VirtualTeachingSpacePage />,
					},
					{
						key: "3",
						label: "源码审核",
						children: <VirtualTeachingSpacePage />,
					},
					{
						key: "4",
						label: "日志管理",
						children: <VirtualTeachingSpacePage />,
					},
					{
						key: "5",
						label: "楼宇管控",
						children: <VirtualTeachingSpacePage />,
					},
					{
						key: "6",
						label: "实时数据",
						children: <VirtualTeachingSpacePage />,
					},
				]}
			></Tabs>
		</div>
	);
}
