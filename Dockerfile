# 使用轻量级的 Nginx 镜像作为基础
FROM nginx:alpine

# 设置 Nginx 默认静态文件目录为工作目录
WORKDIR /usr/share/nginx/html

# 清空默认的欢迎页面
RUN rm -rf ./*

# 将当前目录下的所有文件（经过 .dockerignore 过滤）复制到容器中
COPY . .

# 暴露 80 端口
EXPOSE 80

# 启动 Nginx，并保持前台运行
CMD ["nginx", "-g", "daemon off;"]
