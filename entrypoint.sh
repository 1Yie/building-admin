#!/bin/sh

# 设置默认值
VITE_BASE_URL=${VITE_BASE_URL:-"http://localhost:9039"}
VITE_BASE_URL_HOME=${VITE_BASE_URL_HOME:-"http://localhost:27000"}

# 替换 dist/js 中的占位符
for file in /usr/share/nginx/html/assets/*.js; do
  sed -i "s|__VITE_BASE_URL__|$VITE_BASE_URL|g" "$file"
  sed -i "s|__VITE_BASE_URL_HOME__|$VITE_BASE_URL_HOME|g" "$file"
done

# 启动 nginx
exec "$@"
