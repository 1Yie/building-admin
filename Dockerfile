# 构建阶段
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
<<<<<<< HEAD

# 安装依赖
=======
>>>>>>> dev
RUN npm install --legacy-peer-deps
COPY . .

<<<<<<< HEAD
# 定义两个构建参数
ARG VITE_BASE_URL
ARG VITE_BASE_URL_HOME

# 设置环境变量，让 vite build 能识别
ENV VITE_BASE_URL=$VITE_BASE_URL
ENV VITE_BASE_URL_HOME=$VITE_BASE_URL_HOME

# 构建生产环境
=======
# 构建时注入占位符，而不是实际地址
ENV VITE_BASE_URL="__VITE_BASE_URL__"
ENV VITE_BASE_URL_HOME="__VITE_BASE_URL_HOME__"

>>>>>>> dev
RUN npm run build

# 生产阶段
FROM nginx:alpine
WORKDIR /usr/share/nginx/html

<<<<<<< HEAD
# 复制构建产物
COPY --from=build /app/dist ./

# 复制 nginx 配置
=======
COPY --from=build /app/dist ./
>>>>>>> dev
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

<<<<<<< HEAD
# 复制 entrypoint 脚本
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# 暴露端口
EXPOSE 80

# 使用 entrypoint 替换占位符
=======
EXPOSE 80

>>>>>>> dev
ENTRYPOINT ["/entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
