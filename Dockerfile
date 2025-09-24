# 构建阶段
FROM node:20-alpine AS build
WORKDIR /app

# 复制依赖文件
COPY package*.json ./

# 安装依赖
RUN npm install --legacy-peer-deps

# 复制源代码
COPY . .

# 构建生产环境
RUN npm run build

# 生产阶段
FROM nginx:alpine
WORKDIR /usr/share/nginx/html

# 复制构建产物
COPY --from=build /app/dist ./

# 复制 nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 复制 entrypoint 脚本
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# 暴露端口
EXPOSE 80

# 使用 entrypoint 替换占位符
ENTRYPOINT ["/entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
