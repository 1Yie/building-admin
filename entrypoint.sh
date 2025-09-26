#!/bin/sh

# 设置默认值
: "${VITE_BASE_URL:=http://localhost:9039}"
: "${VITE_BASE_URL_HOME:=http://localhost:27000}"

echo "Replacing placeholders with:"
echo "  VITE_BASE_URL=$VITE_BASE_URL"
echo "  VITE_BASE_URL_HOME=$VITE_BASE_URL_HOME"

# 遍历所有静态文件进行替换
find /usr/share/nginx/html -type f \( -name "*.js" -o -name "*.html" \) | while read -r file; do
  sed -i "s|__VITE_BASE_URL__|$VITE_BASE_URL|g" "$file"
  sed -i "s|__VITE_BASE_URL_HOME__|$VITE_BASE_URL_HOME|g" "$file"
done

echo "Placeholder replacement done."

exec "$@"
