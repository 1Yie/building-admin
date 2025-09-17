
import type { RouteObject } from "react-router";
import { createBrowserRouter } from "react-router";
import Layout from "@/layout";
import sidebarItems from "@/layout/sidebar-items-data";
import Login from "@/pages/login";



const sidebarRoutes: RouteObject[] = sidebarItems.map((item) => ({
	path: item.path,
	element: item.element,
	handle: { title: item.title },
}));


const routes: RouteObject[] = [
	{
		path: "/login",
		element: <Login />,
	},
	{
		element: <Layout />,
		children: [...sidebarRoutes],
	},
	{
		path: "*",
		element: <div>404 Not Found</div>,
	},
];

const router = createBrowserRouter(routes);
export default router;
