# DocuGen AI Open

一个可本地运行的 AI 文档格式化工具。

它适合把 Markdown、纯文本、聊天记录、会议笔记、表格数据、标书内容整理成结构清晰的 Markdown，并导出为 Word / Excel。

## 功能

- AI 格式化：整理标题、段落、列表、表格结构
- 智能表格：把文本中的结构化信息转成 Markdown 表格
- 标书转写：长文档分段处理，适合技术方案/标书整理
- 文件导入：支持 `.txt` `.md` `.docx` `.xlsx` `.pdf`
- 文档导出：支持导出 `.docx` 和 `.xlsx`
- 本地配置：用户自己填写 `API Base URL + API Key(可选) + Model`
- 兼容 OpenAI 风格接口：`/models`、`/chat/completions`

## 适用模型服务

理论上兼容大多数 OpenAI 风格网关，例如：

- OpenAI 兼容中转服务
- DeepSeek 兼容网关
- 阿里云百炼兼容网关
- 硅基流动/OpenRouter/One API 一类兼容服务
- 自建兼容 OpenAI 协议的模型代理

只要你的服务支持：

- `GET {baseUrl}/models`
- `POST {baseUrl}/chat/completions`

即可使用。

## 项目结构

- `App.tsx`：主界面
- `components/`：前端组件
- `services/`：前端调用与导出逻辑
- `backend/main.py`：本地后端代理与文件解析

## 本地启动

### 1. 启动前端

要求：Node.js 18+

```bash
npm install
npm run dev
```

默认前端地址：`http://127.0.0.1:5173`

### 2. 启动后端

要求：Python 3.11+

```bash
pip install -r backend/requirements.txt
uvicorn backend.main:app --reload --port 8001
```

默认后端地址：`http://127.0.0.1:8001`

### 3. 首次使用配置

打开页面后，填写：

- `API Base URL`：例如 `https://api.openai.com/v1`
- `API Key`：可选；如果你的兼容网关或本地代理不需要鉴权，可以留空
- `默认模型`：例如 `gpt-4o-mini`、`deepseek-chat`
- `标书模型`：可选

配置仅保存在当前浏览器 localStorage，并在调用时发送给本地后端代理。

## 使用流程

1. 粘贴文本或导入文件
2. 选择模型
3. 点击 `AI 格式化` / `智能表格` / `标书转写`
4. 检查结果
5. 导出 DOCX 或 Excel

## 安全与限制

- 为避免滥用，本地后端代理默认只允许请求 `HTTPS` 上游地址，或 `http://127.0.0.1` / `http://localhost` 这类本机地址
- 前端开发默认允许从 `http://127.0.0.1:5173` / `http://localhost:5173` 访问本地后端
- 如需支持其他内网 HTTP 网关或其他前端来源，请按你的部署环境自行调整 `backend/main.py`

## PDF 说明

PDF 解析依赖系统安装的 `pdftotext` 命令行工具，不包含在 Python requirements 中。

如果你的机器没有安装它，PDF 上传会返回提示，但其他文件类型仍可正常使用。

## 开源版说明

这个版本做了以下改造：

- 去掉登录、注册、管理员、用户历史隔离等内部平台逻辑
- 去掉硬编码 API Key、公司地址、公司说明文案
- 改为单用户本地配置模式
- 保留核心导入、分段处理、导出能力

## 注意事项

- AI 可能产生幻觉或格式偏差，请人工复核结果
- 标书/长文档场景更容易出现细节偏差，务必人工校验
- 请不要上传敏感数据，或先做脱敏处理

## 后续可选工作

你可以继续扩展：

- 增加本地历史记录
- 增加 `.env.example`
- 增加 Docker 启动方式
- 接入更多文件解析能力
- 增加 GitHub Actions 自动构建

## License

可根据你的发布需求补充，例如 MIT。
