import { Outlet } from "react-router";
import { Separator } from "@/shadcn/ui/separator";
import { SidebarProvider, SidebarTrigger } from "@/shadcn/ui/sidebar";
import { AppSidebar } from "./app-sidebar";
import BreadCrumb from "./bread-crumb";
import sidebarItems from "./sidebar-items-data";

export default function Layout() {
	return (
		<SidebarProvider
			style={
				{
					"--sidebar-width": "14rem",
					"--sidebar-width-mobile": "14rem",
				} as React.CSSProperties
			}
		>
			<AppSidebar sidebarItems={sidebarItems} headerTitle="智慧楼宇能源管理系统" />
			<main className="flex flex-col bg-gray-100/50 w-full h-screen">
				<div className="flex items-center gap-4 mt-5 ml-5 shrink-0">
					<SidebarTrigger />
					<Separator orientation="vertical" className="h-4!" />
					<BreadCrumb />
				</div>
				<div className="flex-1 overflow-auto">
					<Outlet />
				</div>
			</main>
		</SidebarProvider>
	);
}
