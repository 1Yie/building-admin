# 1. 使用 Node 镜像作为构建环境
FROM node:20-alpine AS build

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 package-lock.json / yarn.lock
COPY package*.json ./

# 安装依赖
RUN npm install

# 复制源代码
COPY . .

# 构建生产环境静态文件
RUN npm install --legacy-peer-deps

# 2. 使用 Nginx 作为生产环境服务器
FROM nginx:alpine

# 复制构建好的静态文件到 nginx 默认目录
COPY --from=build /app/dist /usr/share/nginx/html

# 复制自定义 nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 暴露 80 端口
EXPOSE 80

# 启动 nginx
CMD ["nginx", "-g", "daemon off;"]
