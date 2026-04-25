# 项目上下文: llm_api_test

## 项目简介
这是一个基于 HTML/JS/CSS 的静态网页应用，主要功能是提供一个高效的 cURL 测试控制台，用于调用 AI APIs。

## 核心技术栈
- **前端**: 原生 HTML, JavaScript (ES6+), Vanilla CSS
- **部署**: Docker (Nginx:alpine)

## 目录结构
- `index.html`: 主页面结构
- `app.js`: 核心逻辑，包括 cURL 解析、API 调用请求和结果渲染
- `style.css`: 页面样式
- `Dockerfile`: 用于构建 Docker 镜像的配置文件

## 部署情况
当前支持通过 Docker 进行容器化部署，使用 Nginx 作为静态资源服务器。
