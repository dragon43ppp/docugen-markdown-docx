# DocuGen Open

[English README](./README.en.md)

DocuGen Open 是一个可本地运行的文档整理工具，适合把 TXT、Markdown、Word、Excel、PDF、图片中的内容导入后继续整理，并导出为 Word 或 Excel。

这个公开版不内置任何公司 API、管理员账号、默认密钥或内部地址。AI 能力采用自带接口配置模式，你可以接入自己的 OpenAI 兼容服务，例如 OpenAI、Gemini 兼容端点、Qwen 兼容端点，或其他兼容 `/models` 和 `/chat/completions` 的网关。

## 核心能力

- 导入 `TXT / Markdown / DOCX / XLSX / PDF / 图片`
- 在页面中继续编辑、预览和整理 Markdown 内容
- `PDF -> Word` 直出中间结果，并允许继续做格式整理
- AI 格式化、智能表格、标书转写
- 导出最终 `DOCX / XLSX`

## 处理流程

1. 导入 PDF 或其他文件
2. 如果导入的是 PDF，点击“下载中间 Word”
3. 继续在页面里整理提取出的内容
4. 导出最终 DOCX 或 Excel

## PDF 转 Word 是否需要大模型

不需要。

公开版里的 `PDF -> Word` 能力优先使用本地离线结构化引擎，不依赖大模型。只有下面这些能力会调用你自己配置的线上模型接口：

- AI 格式化
- 智能表格
- 标书转写

## 免费格式转换入口

如果你只是想免费使用文档格式转换功能，也可以直接在微信小程序“谈单底牌”中使用。

![谈单底牌小程序码](docs/assets/wechat-mini-program-qr.jpg)

## 快速开始

### 方式一：直接启动

Windows 下可以直接运行：

```bat
Start-DocuGen.bat
```

脚本会：

- 安装前端依赖
- 创建本地后端虚拟环境 `.backend-venv`
- 安装后端依赖
- 启动后端 `http://127.0.0.1:8001`
- 启动前端 `http://127.0.0.1:9000`

### 方式二：手动启动

前端：

```bash
npm install
npm run dev -- --host 127.0.0.1 --port 9000
```

后端：

```bash
python -m venv .backend-venv
.backend-venv\Scripts\python -m pip install -r backend\requirements.txt
cd backend
..\.backend-venv\Scripts\python -m uvicorn main:app --host 127.0.0.1 --port 8001 --reload
```

如果你是在 PowerShell 中启动，等价命令是：

```powershell
python -m venv .backend-venv
.\.backend-venv\Scripts\python.exe -m pip install -r backend\requirements.txt
Set-Location backend
..\.backend-venv\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8001 --reload
```

## 首次使用时需要配置什么

打开页面后，填写以下内容即可：

- `API Base URL`
- `API Key`，可选
- `默认模型`
- `标书模型`，可选

这些配置仅保存在浏览器本地 `localStorage` 中，不会随仓库发布。

## 启用 PDF -> Word 离线引擎

如果你希望使用更完整的 PDF / 图片结构化能力，请准备 `Offline_PDF_Structure` 环境，并设置环境变量：

```powershell
$env:DOCUGEN_OFFLINE_PDF_ROOT="D:\BaiduNetdiskDownload\PDF图片表格数据提取\Offline_PDF_Structure"
```

也可以把可运行的离线包放到：

```text
backend/offline_pdf_bundle
```

离线引擎主要用于：

- 扫描版 PDF OCR
- 图片文字识别
- 版面分析
- 表格识别
- `PDF -> DOCX` 直接导出

## 安全说明

- 仓库中不包含任何真实 API Key
- 公开版不包含任何公司内部 API 或默认网关
- 前端只把你手动填写的配置发送给本地后端
- 后端默认只允许访问 HTTPS 上游，或本机 HTTP 地址

## 适用场景

- 把 PDF 转成 Word，再继续整理格式
- 把网文、会议纪要、聊天记录整理成规范文档
- 把表格类内容整理成 Markdown 表格或 Excel
- 把已有 Word / Excel 内容重新梳理后再导出

## 开源范围说明

这个仓库聚焦于公开可运行的本地版本：

- 保留文档导入、整理、导出能力
- 保留离线 PDF 结构化桥接能力
- 保留自定义 AI 接口配置
- 移除了内部版相关的账号体系、默认密钥、公司 API 和专用发布逻辑

## License

MIT
