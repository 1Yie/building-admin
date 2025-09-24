# 1. 构建阶段
FROM node:20-alpine AS build
WORKDIR /app

# 复制依赖文件
COPY package*.json ./

# 安装依赖（忽略 peerDependencies 报错）
RUN npm install --legacy-peer-deps

# 复制源代码
COPY . .

# 定义两个构建参数
ARG VITE_BASE_URL
ARG VITE_BASE_URL_HOME

# 设置环境变量，让 vite build 能识别
ENV VITE_BASE_URL=$VITE_BASE_URL
ENV VITE_BASE_URL_HOME=$VITE_BASE_URL_HOME

# 构建生产环境
RUN npm run build

# 2. 生产阶段
FROM nginx:alpine
WORKDIR /usr/share/nginx/html

# 复制静态文件
COPY --from=build /app/dist ./

# 复制自定义 nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
