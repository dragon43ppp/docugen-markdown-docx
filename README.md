# DocuGen Markdown DOCX

**简体中文** | [English](./README.en.md)

<p align="center">
  <a href="https://github.com/dragon43ppp/docugen-markdown-docx/stargazers"><img src="https://img.shields.io/github/stars/dragon43ppp/docugen-markdown-docx?style=flat-square" alt="GitHub stars" /></a>
  <a href="https://github.com/dragon43ppp/docugen-markdown-docx/blob/main/LICENSE"><img src="https://img.shields.io/github/license/dragon43ppp/docugen-markdown-docx?style=flat-square" alt="License" /></a>
  <a href="https://github.com/dragon43ppp/docugen-markdown-docx/commits/main"><img src="https://img.shields.io/github/last-commit/dragon43ppp/docugen-markdown-docx?style=flat-square" alt="Last commit" /></a>
</p>

<p align="center">
  <img src="docs/assets/github-cover.png" alt="DocuGen Markdown DOCX cover" width="100%" />
</p>

<p align="center">
  <strong>PDF 转 Word</strong> · <strong>Markdown 转 DOCX</strong> · <strong>杂乱文档整理成可交付版本</strong>
</p>

DocuGen Markdown DOCX 是一个可本地运行的文档整理工具。你可以导入 `TXT / Markdown / DOCX / XLSX / PDF / 图片`，在页面中继续整理内容，并导出为 Word 或 Excel。
适合 `PDF 转 Word`、`Markdown 转 DOCX`、AI 文档整理、文档格式统一、招投标材料整理等场景。

## 3 秒看懂用途

- 有一堆格式混乱的 PDF、Word、Markdown、图片文档，想快速整理成统一可交付版本
- AI 大模型产出的是 Markdown 草稿，不能直接拿去公司内部流转或发客户，需要转成正式 Word
- 招投标、响应文件、标书材料需要抽取、清洗、统一排版并导出

这个仓库默认不提供任何线上模型服务。启动后，直接在页面中填写你自己的：

- `API Base URL`
- `API Key`

即可接入 OpenAI 兼容接口。若你希望固定模型，也可以额外填写默认模型名。

## 快速开始

### 1. 克隆仓库

```bash
git clone https://github.com/dragon43ppp/docugen-markdown-docx.git
cd docugen-markdown-docx
```

### 2. 启动项目

方式一：Windows 一键启动

```bat
Start-DocuGen.bat
```

脚本会自动：

- 安装前端依赖
- 创建本地后端虚拟环境 `.backend-venv`
- 安装后端依赖
- 启动后端 `http://127.0.0.1:8001`
- 启动前端 `http://127.0.0.1:9000`

方式二：手动启动

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

PowerShell 等价命令：

```powershell
python -m venv .backend-venv
.\.backend-venv\Scripts\python.exe -m pip install -r backend\requirements.txt
Set-Location backend
..\.backend-venv\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8001 --reload
```

### 3. 首次使用配置

打开页面后，至少填写以下两项即可开始使用：

- `API Base URL`
- `API Key`

可选项：

- `默认模型`
- `标书模型`

这些配置只保存在浏览器本地 `localStorage`，不会写入仓库。

## 核心能力

- 导入 `TXT / Markdown / DOCX / XLSX / PDF / 图片`
- 在页面中继续编辑、预览和整理 Markdown 内容
- `PDF -> Word` 导出中间结果，并允许继续做格式整理
- AI 格式化、智能表格、标书转写
- 导出最终 `DOCX / XLSX`

## 使用场景

- 文档来源很多、格式不规整、文件内容混乱时，可以先导入再统一整理成规范格式
- AI 大模型生成的内容通常是 Markdown，不方便直接在公司内部流转或发给客户时，可以快速整理后导出为 Word 或 Excel
- 招投标、响应文件、标书内容需要清洗、结构化、转写和统一排版时，可以集中处理

## 使用流程

1. 导入 PDF 或其他文档
2. 如果导入的是 PDF，点击 `下载中间 Word`
3. 在页面里继续整理提取结果和格式
4. 导出最终 DOCX 或 Excel

## PDF 转 Word 是否需要大模型

不需要。

`PDF -> Word` 这一步优先走本地离线结构化能力；只有下面这些功能会使用你自己配置的线上接口：

- AI 格式化
- 智能表格
- 标书转写

## 启用离线 PDF 引擎

如果你希望启用更完整的扫描件 OCR、版面分析、表格识别和 `PDF -> DOCX` 能力，可以准备可运行的 `Offline_PDF_Structure` 环境，并设置：

```powershell
$env:DOCUGEN_OFFLINE_PDF_ROOT="D:\BaiduNetdiskDownload\PDF图片表格数据提取\Offline_PDF_Structure"
```

也可以把可运行的离线包放到：

```text
backend/offline_pdf_bundle
```

## 免费格式转换入口

如果你只是想免费使用文档格式转换功能，也可以直接在微信小程序“谈单底牌”中使用。

![谈单底牌小程序码](docs/assets/wechat-mini-program-qr.jpg)

## 安全说明

- 仓库中不包含任何真实 API Key
- 仓库不内置任何默认接口地址
- 前端只会使用你手动填写的 `API Base URL` 和 `API Key`
- 后端默认只允许访问 HTTPS 上游，或本机 HTTP 地址

## FAQ

### 需要我自己提供模型接口吗？

需要。这个仓库默认不提供托管模型服务。你只需要在页面中填写自己的 `API Base URL` 和 `API Key` 即可。

### 可以接 OpenAI、Gemini、Qwen 吗？

可以。只要你的接口兼容 OpenAI 风格调用方式，就可以接入。

### PDF 转 Word 一定要用大模型吗？

不一定。`PDF -> Word` 优先使用本地离线结构化能力；只有 AI 格式化、智能表格、标书转写这类能力才会调用你配置的线上接口。

### 这个项目适合什么团队？

适合经常处理文档整理、客户交付、内部汇报、标书和 AI 草稿转正式文件的小团队或个人。

### 可以直接 `git clone` 到本地启动吗？

可以，仓库首页已经给出直接可用的：

```bash
git clone https://github.com/dragon43ppp/docugen-markdown-docx.git
cd docugen-markdown-docx
```

## License

MIT
