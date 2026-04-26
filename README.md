# LLM API Test Console

> 一个轻量级的 AI API 调试控制台，支持直接在浏览器中发送 cURL 风格的请求，并可视化呈现文本与图像响应。

---

## ✨ 功能特性

- **cURL 直接粘贴执行** — 将标准 `curl` 命令直接粘贴至输入框，一键发送 HTTP 请求
- **快速模板生成** — 内置对话（Chat）与图像（Image）两种 cURL 模板，一键填充
- **智能响应渲染**
  - 对话模型：自动提取 `choices[0].message.content`，以可读格式展示，并附原始 JSON
  - 图像模型：自动识别 `url` / `b64_json` 响应，直接渲染预览图
  - 防止超长 Base64 字符串导致浏览器卡顿（自动截断并提示）
- **UI 参数面板** — 可视化填写 API Key、Endpoint、Model，实时同步至 cURL 命令框
- **多端点支持** — 内置 Pinova 和 Burncloud 端点预设，可灵活切换

---

## 🖥 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | 原生 HTML5 + Vanilla CSS + ES6+ JavaScript |
| 部署 | Docker + Nginx Alpine |

无任何第三方 JS 框架依赖，极致轻量。

---

## 🚀 快速开始

### 方式一：本地直接打开

```bash
git clone https://github.com/4646with/llm_api_test.git
cd llm_api_test
# 用浏览器打开 index.html 即可
```

> ⚠️ 注意：由于浏览器 CORS 限制，部分 API 可能需要通过服务器或 Docker 运行才能正常请求。

### 方式二：Docker 部署（推荐）

```bash
git clone https://github.com/4646with/llm_api_test.git
cd llm_api_test

# 构建并启动容器
docker compose up -d --build

# 默认访问地址（取消 docker-compose.yaml 中的端口注释后）
# http://localhost:8080
```

---

## 📁 项目结构

```
llm_api_test/
├── index.html          # 主页面
├── app.js              # 核心逻辑（cURL 解析 / 请求发送 / 结果渲染）
├── style.css           # 样式
├── Dockerfile          # Docker 镜像构建配置（Nginx Alpine）
├── docker-compose.yaml # 容器编排配置
├── .gitignore
└── .dockerignore
```

---

## ⚙️ 使用说明

1. **填写 API Key**：在顶部面板输入你的 Bearer Token
2. **选择 Endpoint**：从下拉菜单选择 Pinova / Burncloud，或手动输入自定义地址
3. **输入 Model**：填写模型名称（如 `gpt-4o`、`gpt-image-2-pro`）
4. **生成模板 / 粘贴 cURL**：点击「一键生成模板」或直接粘贴自己的 cURL 命令
5. **点击「发送请求」**：等待 API 响应，结果将自动渲染在下方

---

## 📝 License

MIT
