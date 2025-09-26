// AppSidebar.tsx
import { useMutation } from "@tanstack/react-query";
import { jwtDecode } from "jwt-decode";
import { ChevronsUpDown, LogOut, User2, ChevronDown } from "lucide-react";
import { DynamicIcon } from "lucide-react/dynamic";
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import type { UserInfo, UserMenuBuilding } from "@/request/authority";
import { logout, tokenValidate } from "@/request/authority";
import { cn } from "@/shadcn/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shadcn/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/shadcn/ui/sidebar";

interface AppSidebarProps {
  sidebarItems: typeof import("./sidebar-items-data").default;
  headerTitle: React.ReactNode;
  footerText?: string;
  footerOnClick?: () => void;
}

export function AppSidebar({
  sidebarItems,
  headerTitle,
  footerText,
  footerOnClick,
}: AppSidebarProps) {
  const { state } = useSidebar();
  const pathname = useLocation().pathname;
  const navigate = useNavigate();

  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [openMenus, setOpenMenus] = useState<string[]>([]);

  // 检查 token 是否有效
  const { mutate: tokenValidateMutate } = useMutation({
    mutationFn: tokenValidate,
  });

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    tokenValidateMutate(undefined, {
      onSuccess: (data) => {
        if (data?.isValid) {
          const decoded = jwtDecode(token) as UserInfo;
          const decodedMenu = jwtDecode(token) as UserMenuBuilding;
          setUserInfo(decoded);
          console.log("JWT解析: ", decoded);

          const decodedMenuPermissions = (decodedMenu.menu_building || []).map(
            (p) => `menu_building-${p}`
          );
          setUserPermissions(decodedMenuPermissions);
        } else {
          navigate("/login");
        }
      },
      onError: () => navigate("/login"),
    });
  }, []);

  // 展开父菜单
  useEffect(() => {
    const activeParent = sidebarItems.find(
      (item) => item.children && pathname.startsWith(item.path)
    );
    if (activeParent && !openMenus.includes(activeParent.path)) {
      setOpenMenus((prev) => [...prev, activeParent.path]);
    }
  }, [pathname, sidebarItems]);

  // 退出登录
  const { mutate: logoutMutate } = useMutation({ mutationFn: logout });
  function handleLogout() {
    logoutMutate(undefined, {
      onSuccess: () => {
        localStorage.removeItem("token");
        navigate("/login");
      },
    });
  }

  const basePath = pathname.split("/").slice(0, 2).join("/");

  const finalFooterOnClick = footerOnClick || handleLogout;

  // 根据父权限过滤侧边栏
  const filteredSidebarItems = sidebarItems.filter((item) => {
    if (!item.permission) return true;

    const itemParentPermission = item.permission
      .split("-")
      .slice(0, 2)
      .join("-");

    const userParentPermissions = Array.from(
      new Set(userPermissions.map((p) => p.split("-").slice(0, 2).join("-")))
    );

    return userParentPermissions.includes(itemParentPermission);
  });

  return (
    <Sidebar collapsible="icon">
      {/* header */}
      <SidebarHeader className="bg-white">
        <div className="flex justify-center items-center gap-5 h-10">
          <span
            className={cn("font-bold text-lg whitespace-nowrap", {
              hidden: state === "collapsed",
            })}
          >
            {headerTitle}
          </span>
        </div>
      </SidebarHeader>

      {/* content */}
      <SidebarContent className="bg-white">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredSidebarItems.map((item) => {
                const hasChildren = !!item.children?.length;
                const isOpen = openMenus.includes(item.path);
                const isActiveParent =
                  hasChildren &&
                  item.children?.some((sub) => pathname.startsWith(sub.path));

                // 判断子菜单是否高亮
                const isActiveChild = !hasChildren && pathname === item.path;

                const isActive = isActiveParent || isActiveChild;

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      className="cursor-pointer data-[active=true]:bg-blue-200/50 pl-5 h-10 data-[active=true]:text-blue-500 flex justify-between items-center"
                      isActive={isActive}
                      onClick={() => {
                        if (item.element) {
                          navigate(item.path);
                        }
                        if (hasChildren) {
                          setOpenMenus(
                            isOpen
                              ? openMenus.filter((p) => p !== item.path)
                              : [...openMenus, item.path]
                          );
                        }
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <DynamicIcon className="w-4 h-4" name={item.icon} />
                        <span className={state === "collapsed" ? "hidden" : ""}>
                          {item.title}
                        </span>
                      </div>
                      {hasChildren && (
                        <ChevronDown
                          className={cn("h-5 w-5 transition-transform", {
                            "rotate-180": isOpen,
                          })}
                        />
                      )}
                    </SidebarMenuButton>

                    {hasChildren && isOpen && (
                      <SidebarGroupContent>
                        {item.children?.map((sub) => (
                          <SidebarMenuItem key={sub.title}>
                            <SidebarMenuButton
                              asChild
                              className="pl-10 h-8 my-1 data-[active=true]:bg-blue-100/50 data-[active=true]:text-blue-500"
                              isActive={pathname === sub.path}
                            >
                              <Link to={sub.path}>
                                <DynamicIcon name={sub.icon} />
                                <span>{sub.title}</span>
                              </Link>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        ))}
                      </SidebarGroupContent>
                    )}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* footer */}
      <SidebarFooter className="bg-white">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton className="h-10 cursor-pointer">
                  <User2 className="inline mr-5" />
                  <span>{userInfo?.remark_name}</span>
                  <ChevronsUpDown className="inline ml-auto" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="right"
                align="start"
                alignOffset={-80}
                className="w-60"
              >
                <DropdownMenuItem>
                  <div className="flex items-center gap-5">
                    <User2 className="inline" />
                    <div className="font-bold">{userInfo?.remark_name}</div>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <LogOut className="inline mr-2" />
                  <div
                    onClick={footerOnClick || handleLogout}
                    className="w-full cursor-pointer"
                  >
                    {footerText || "退出登录"} {/* 默认文案 */}
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
