# 项目文档

## 1. 概述

`building-admin` 是一个基于 React 的楼宇管理系统前端应用。它使用 Vite 作为构建工具，TypeScript 提供类型安全，并集成了 Tailwind CSS 和 shadcn/ui 用于快速构建现代化用户界面。

该应用的核心功能是允许用户监控和管理楼宇内的各种传感器设备。它提供了基于角色的访问控制（RBAC），确保不同用户只能访问其权限范围内的功能和数据。

## 2. 项目结构

```
.src
│  App.tsx
│  global.css
│  main.tsx
│  vite-env.d.ts
│
├─assets
│      10楼.png
│      1楼.png
│      2楼.png
│      3楼.png
│      4楼.png
│      5楼.png
│      6楼.png
│      7楼.png
│      8楼.png
│      9楼.png
│      react.svg
│
├─components
│      permission-tree.tsx
│
├─config
│      building-map.ts
│
├─hooks
│      use-auth.tsx
│
├─layout
│      app-sidebar.tsx
│      bread-crumb.tsx
│      index.tsx
│      sidebar-items-data.tsx
│
├─lib
│      get-sensors-by-building.ts
│
├─pages
│  ├─account
│  │      index.tsx
│  │
│  ├─control
│  │      index.tsx
│  │      ManualControl.tsx
│  │      RuleLinkageControl.tsx
│  │
│  ├─error
│  │      403.tsx
│  │      404.tsx
│  │
│  ├─evaluation
│  │      index.tsx
│  │
│  ├─home
│  │      chart-line.tsx
│  │      chart-pie.tsx
│  │      index.tsx
│  │      table.tsx
│  │
│  ├─log
│  │      index.tsx
│  │      LogManagement.tsx
│  │      ThresholdRule.tsx
│  │
│  ├─login
│  │      index.tsx
│  │
│  ├─personal
│  │      index.tsx
│  │
│  ├─property
│  │      index.tsx
│  │
│  ├─realtime
│  │      chart-line.tsx
│  │      index.tsx
│  │      property-vis.tsx
│  │      real-time.tsx
│  │
│  ├─role
│  │      index.tsx
│  │
│  ├─settings
│  │      index.tsx
│  │
│  └─teaching
│          index.tsx
│          source-application.tsx
│          source-review.tsx
│          teaching-space.tsx
│
├─request
│  │  index.ts
│  │  urls.ts
│  │  
│  ├─account
│  │      index.ts
│  │
│  ├─authority
│  │      index.ts
│  │
│  ├─control
│  │      index.ts
│  │
│  ├─home
│  │      index.ts
│  │
│  ├─log
│  │      index.ts
│  │
│  ├─property
│  │      index.ts
│  │
│  ├─realtime
│  │      index.ts
│  │
│  ├─role
│  │      index.ts
│  │
│  ├─settings
│  │      index.ts
│  │
│  └─virtual
│          index.ts
│
├─router
│      index.tsx
│
├─shadcn
│  ├─hooks
│  │      use-mobile.ts
│  │
│  ├─lib
│  │      utils.ts
│  │
│  └─ui
│          badge.tsx
│          breadcrumb.tsx
│          button.tsx
│          calendar.tsx
│          card.tsx
│          chart.tsx
│          dialog.tsx
│          dropdown-menu.tsx
│          form.tsx
│          input.tsx
│          label.tsx
│          my-tree.tsx
│          popover.tsx
│          progress.tsx
│          select.tsx
│          separator.tsx
│          sheet.tsx
│          sidebar.tsx
│          skeleton.tsx
│          sonner.tsx
│          table.tsx
│          tabs.tsx
│          tooltip.tsx
│
└─types
        index.ts
```

- **`public/`**: 存放静态资源。
- **`src/assets/`**: 存放图片、图标等媒体文件。
- **`src/components/`**: 存放可复用的 UI 组件，例如 `permission-tree.tsx` 用于展示权限树。
- **`src/config/`**: 存放应用的配置文件，例如 `building-map.ts` 定义了楼层与图片的映射关系。
- **`src/hooks/`**: 存放自定义的 React Hooks，例如 `use-auth.tsx` 用于处理用户认证和权限。
- **`src/layout/`**: 定义了应用的主体布局，包括侧边栏 (`app-sidebar.tsx`) 和面包屑导航 (`bread-crumb.tsx`)。
- **`src/lib/`**: 存放工具函数，例如 `get-sensors-by-building.ts` 用于获取指定楼宇的传感器数据。
- **`src/pages/`**: 存放各个页面的组件。
- **`src/request/`**: 封装了 `axios`，用于处理应用的 API 请求，包括请求拦截和响应处理。
- **`src/router/`**: 定义了应用的路由配置和权限守卫。
- **`src/shadcn/`**: `shadcn/ui` 自动生成的组件和工具。
- **`src/types/`**: 存放 TypeScript 的类型定义。

## 3. 核心模块与功能

### 3.1. 路由与权限控制

路由系统在 `src/router/index.tsx` 中定义，使用 `react-router`。

- **权限守卫 (`AuthRoute`)**: 这是一个核心的路由守卫组件，它从 JWT Token 中解析出用户的菜单和操作权限，并与路由所需的权限进行比对。如果用户没有权限，则重定向到 403 页面。
- **动态路由**: 侧边栏的路由是根据 `src/layout/sidebar-items-data.tsx` 中的配置动态生成的。

### 3.2. 布局

应用的主体布局在 `src/layout/index.tsx` 中定义，它包含：

- **`AppSidebar`**: 侧边栏组件，展示了可导航的页面链接。
- **`BreadCrumb`**: 面包屑导航，显示当前页面的路径。
- **`Outlet`**: `react-router` 的组件，用于渲染当前匹配的子路由。

### 3.3. API 请求

API 请求的核心逻辑封装在 `src/request/index.ts` 中。

- **`axios` 实例**: 创建了一个 `axios` 实例，并配置了 `baseURL` 和 `timeout`。
- **请求拦截器**: 在每个请求发送前，从 `localStorage` 中获取 JWT Token，并将其添加到 `Authorization` 请求头中。
- **响应拦截器**:
    - 对成功的响应进行预处理，只返回业务数据 (`result` 或 `data` 字段)。
    - 对业务错误（例如 `code` 不为 "00000"）和网络错误进行统一的错误处理，并使用 `sonner` 弹出 `toast` 提示。
    - 特别处理了 Token 失效的情况 (`code === "A0001"`)。

### 3.4. 认证与状态

- **认证**: 用户的认证状态通过存储在 `localStorage` 中的 JWT Token 来维持。`use-auth.tsx` Hook 提供了获取和管理 Token 的方法。
- **权限状态**: 用户的权限信息（菜单和操作权限）在 `src/router/index.tsx` 的 `getUserPermissions` 函数中从 Token 中解码得到。

### 3.5. 核心页面与功能

- **`pages/property/`**: 这是核心的功能模块之一，用于展示楼宇的资产和传感器信息。
    - **`property-vis.tsx`**: 该组件负责获取并可视化展示指定空间（例如某个楼层）的传感器数据。它会根据楼层ID获取对应的平面图，并在图上渲染传感器信息。
    - **数据获取**: 通过调用 `getSensorDataForSpace` 函数并行获取多个终端的传感器数据，并进行聚合。
    - **错误处理**: 对请求取消（`AbortError`）和普通请求错误进行了区分处理，确保在取消请求时不会弹出错误提示。

## 4. UI 组件

项目使用了 `shadcn/ui` 组件库，并通过 `tailwind.css` 进行样式定制。`shadcn/ui` 的组件是高度可定制的，可以直接修改其源代码。

- **`permission-tree.tsx`**: 一个自定义的权限树组件，用于在角色管理等页面中展示和编辑权限。

## 5. 数据流

1.  **登录**: 用户在 `pages/login` 页面输入凭据，请求认证成功后，后端返回 JWT Token，前端将其存储在 `localStorage` 中。
2.  **路由导航**: 用户点击侧边栏链接，`react-router` 匹配到对应的路由。
3.  **权限校验**: `AuthRoute` 守卫从 Token 中解析权限，判断用户是否有权访问该页面。
4.  **页面渲染**: 如果有权限，则渲染对应的页面组件。
5.  **数据获取**: 页面组件（例如 `property-vis.tsx`）调用封装在 `src/request/` 下的 API 函数来获取数据。
6.  **API 请求**: `axios` 拦截器自动附加 Token，并处理响应。
7.  **数据展示**: 组件获取到数据后，更新其状态并重新渲染，将数据展示给用户。

## 6. 总结

`building-admin` 是一个结构清晰、功能完善的楼宇管理系统前端。它通过模块化的方式组织代码，实现了基于角色的权限控制、统一的 API 请求处理和现代化的 UI。该文档旨在帮助开发者快速理解项目的设计和实现，并在此基础上进行后续的开发和维护。