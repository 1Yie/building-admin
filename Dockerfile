# 1. 构建阶段
FROM node:20-alpine AS build
WORKDIR /app

# 复制依赖文件
COPY package*.json ./

# 安装依赖，忽略 peerDependencies
RUN npm install --legacy-peer-deps

# 复制源代码
COPY . .

# 构建生产环境
RUN npm run build

# 2. 生产阶段
FROM nginx:alpine
# 复制静态文件
COPY --from=build /app/dist /usr/share/nginx/html

# 复制自定义 nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 暴露端口
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
