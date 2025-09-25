import { Outlet, useNavigate } from "react-router";
import { Separator } from "@/shadcn/ui/separator";
import { SidebarProvider, SidebarTrigger } from "@/shadcn/ui/sidebar";
import { AppSidebar } from "./app-sidebar";
import BreadCrumb from "./bread-crumb";
import virtualSidebarItems from "./virtual-sidebar-items-data";
import { quitVirtual } from "@/request/virtual";
import { toast } from "sonner";

export default function VirtualLayout() {
  const navigate = useNavigate();

  async function quitVirtualSpaceHandle() {
    try {
      await quitVirtual();
      toast.success("退出虚拟空间成功");
      localStorage.setItem("enter_virtual_flag", "false");
      navigate("/");
    } catch (error) {
      console.error("退出虚拟空间失败:", error);
      toast.error("退出虚拟空间失败");
    }
  }
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "14rem",
          "--sidebar-width-mobile": "14rem",
        } as React.CSSProperties
      }
    >
      <AppSidebar
        sidebarItems={virtualSidebarItems}
        headerTitle={
          <>
          <span>智慧楼宇<span className="text-accent-foreground/60">虚拟教学</span>空间</span>
          </>
        }
        footerText="退出虚拟空间"
        footerOnClick={quitVirtualSpaceHandle}
      />

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
