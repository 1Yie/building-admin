# 项目部署文档

## 1. 环境准备

在开始部署之前，请确保您的服务器或本地环境已经安装了以下软件：

- **Node.js**: 推荐使用 `v20.x` 或更高版本。
- **pnpm**: 作为项目的包管理工具。

## 2. 安装与构建

### 2.1. 安装依赖

首先，克隆项目代码到您的服务器，然后进入项目根目录，使用 `pnpm` 安装所有依赖项：

```bash
pnpm install
```

### 2.2. 环境变量配置

项目通过 `.env` 文件来管理环境变量。您可以根据不同的部署环境创建不同的 `.env` 文件。

- **`.env.development`**: 用于本地开发环境。
- **`.env.production`**: 用于生产环境。

```
VITE_BASE_URL="http://192.168.0.76:9039"

VITE_BASE_URL_HOME="http://192.168.0.76:27000"
```

- `VITE_BASE_URL`: 登录接口地址

- `VITE_BASE_URL_HOME`: 主页接口地址

### 2.3. 本地开发

使用 `pnpm dev` 启动本地开发服务器：

```bash
pnpm dev
```

### 2.4. 构建项目

配置好环境变量后，运行以下命令来构建生产环境的静态文件：

```bash
pnpm build
```

该命令会执行 `vite build`，并将构建产物（HTML, CSS, JavaScript 文件）输出到 `dist` 目录下。

## 3. 部署方案

构建完成后，您可以选择以下任一方案进行部署。

### 方案一：使用 Docker 部署

项目根目录下提供了一个 `Dockerfile` 和 `nginx.conf`，可以方便地将应用容器化部署。

**步骤:**

1.  **构建 Docker 镜像**:

    在项目根目录下运行以下命令：

    ```bash
    docker build -t building-admin .
    ```

    **或：**

    使用阿里云镜像拉取镜像

    ```bash
    docker pull crpi-266p90eq4h6brayr.cn-hangzhou.personal.cr.aliyuncs.com/1yie/building-admin:v1.1.4
    ```

2.  **运行 Docker 容器**:

    ```bash
    docker run -d -p 80:80 \
  -e VITE_BASE_URL=\"http://your_base_url\" \
  -e VITE_BASE_URL_HOME=\"http://your_base_url_home\" \
  --name building-admin-container building-admin
    ```

    这将在后台启动一个容器，并将容器的 80 端口映射到主机的 80 端口。现在，您可以通过服务器的 IP 地址或域名访问该应用。

### 方案二：使用 Nginx 部署

如果您已经有了一个正在运行的 Nginx 服务器，您可以将构建产物部署到 Nginx 中。

**步骤:**

1.  **上传构建产物**:

    将本地的 `dist` 目录下的所有文件上传到您服务器上的指定位置，例如 `/var/www/building-admin`。

2.  **配置 Nginx**:

    在您的 Nginx 配置文件中（例如 `/etc/nginx/sites-available/default`），添加一个新的 `server` 或 `location` 块来托管应用。

    一个简单的 Nginx 配置示例如下：

    ```nginx
    server {
        listen 80;
        server_name yourdomain.com;

        root /var/www/building-admin;
        index index.html;

        location / {
            try_files $uri $uri/ /index.html;
        }
    }
    ```

    **配置说明**:

    - `root`: 指向您上传 `dist` 文件的目录。
    - `try_files`: 这是单页应用（SPA）的关键配置。它确保当用户刷新页面或直接访问非根路径时，Nginx 会返回 `index.html`，由前端路由处理后续逻辑。

3.  **重启 Nginx**:

    保存配置后，检查配置文件的语法并重启 Nginx 服务：

    ```bash
    sudo nginx -t
    sudo systemctl restart nginx
    ```
