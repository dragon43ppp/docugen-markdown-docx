"""DocuGen AI open-source local backend."""
from __future__ import annotations

import io
import json
import logging
import re
from urllib.parse import urlparse
from typing import List, Optional

import httpx
from fastapi import FastAPI, File, Form, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, field_validator

log = logging.getLogger("docugen")
ALLOWED_LOCAL_HOSTS = {"127.0.0.1", "localhost", "::1"}

app = FastAPI(title="DocuGen AI Backend", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5173", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

CHUNK_LIMIT = 4000
BID_CHUNK_LIMIT = 12000
MAX_FILE_SIZE = 10 * 1024 * 1024
BID_MAX_FILE_SIZE = 50 * 1024 * 1024


class LocalAIConfig(BaseModel):
    apiBaseUrl: str
    apiKey: str = ""
    model: str
    bidModel: Optional[str] = None

    @field_validator("apiBaseUrl")
    @classmethod
    def normalize_base_url(cls, value: str) -> str:
        value = value.strip().rstrip("/")
        if not value:
            raise ValueError("API Base URL 不能为空")

        parsed = urlparse(value)
        if parsed.scheme != "https":
            if parsed.scheme != "http" or parsed.hostname not in ALLOWED_LOCAL_HOSTS:
                raise ValueError("API Base URL 仅支持 HTTPS，或本机 HTTP 地址")

        if not parsed.netloc:
            raise ValueError("API Base URL 格式无效")
        return value

    @field_validator("model")
    @classmethod
    def require_model(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("配置项不能为空")
        return value

    @field_validator("apiKey")
    @classmethod
    def normalize_api_key(cls, value: str) -> str:
        return value.strip()

    @field_validator("bidModel")
    @classmethod
    def normalize_bid_model(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        value = value.strip()
        return value or None


class ChatRequest(BaseModel):
    prompt: str
    model: Optional[str] = None
    config: LocalAIConfig


class ChunkProcessRequest(BaseModel):
    text: str
    mode: str = "format"
    model: Optional[str] = None
    config: LocalAIConfig


async def _call_ai(prompt: str, model: str, config: LocalAIConfig) -> str:
    headers = {
        "Content-Type": "application/json",
    }
    if config.apiKey:
        headers["Authorization"] = f"Bearer {config.apiKey}"
    payload = {
        "model": model,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.3,
    }
    async with httpx.AsyncClient(timeout=180.0) as client:
        resp = await client.post(
            f"{config.apiBaseUrl}/chat/completions",
            json=payload,
            headers=headers,
        )
        resp.raise_for_status()
        data = resp.json()
        return (
            data.get("choices", [{}])[0]
            .get("message", {})
            .get("content", "")
            .strip()
        )


def _build_format_prompt(text: str, part_info: str = "") -> str:
    return f"""你是一名专业的文档格式化专家。请将以下输入内容转换为结构清晰、格式规范的 Markdown 文档。

核心原则：**绝对不要修改、删减、改写或添加任何原始文本内容**，只调整格式和结构。

详细规则：
1. 自动识别输入格式（Markdown、纯文本、微信聊天记录、零散笔记、会议记录等任意格式）并整理。
2. 标题层级严格正确：
   - 文档主标题用 # （一级标题）
   - 大的章节标题用 ## （二级标题）
   - 子章节用 ### （三级标题）
   - 根据内容的逻辑层次关系判断标题级别，不要把所有标题都设为同一级别
   - 如果原文有"一、二、三"或"第一章、第二章"等编号，对应设为 ## 级别
   - 如果原文有"1. 2. 3."或"(一)(二)"等子编号，对应设为 ### 级别
3. 不要省略内容，不要补充内容。
4. 表格数据用 Markdown 表格格式化，确保管道符（|）对齐正确。
5. 列表项用 - 或 1. 格式化，保持原有的层次结构。
6. 保留所有原始信息，一个字都不能丢。
7. 只返回 Markdown 内容，不要包含 ```markdown 代码块包裹，不要加说明文字。
{part_info}
输入内容：
{text}"""


def _build_table_prompt(text: str, part_info: str = "") -> str:
    return f"""你是一名专业的文档格式化专家。分析以下文本，将其中适合表格化的数据转换为 Markdown 表格。

核心原则：**绝对不要修改原始文本内容**，只调整格式。

详细规则：
1. 识别其中的结构化信息（如分类、参数、规格、对比数据等）。
2. 将结构化信息转换为 Markdown 表格，使用合理的列标题。
3. 非表格的叙述性文本保持原样，放在表格外部。
4. 单元格内多行内容必须用 "<br>" 表示换行。
5. 确保不丢失任何信息。
6. 返回完整的 Markdown 文档（叙述文本 + 表格）。
7. 只返回 Markdown 内容，不要包含代码块包裹或说明文字。
{part_info}
输入文本：
{text}"""


def _build_bid_prompt(text: str, part_info: str = "") -> str:
    return f"""你是一名专业的标书文档格式化专家。请将以下标书内容转换为格式规范的 Markdown 文档。

【绝对禁令】
1. 绝对不要修改、删减、改写、省略或添加任何原始文本内容。
2. 绝对不要用“……”、“（略）”、“（同上）”等方式省略内容。
3. 不要总结、概括或精简任何段落。
4. 每一个字、每一个数字、每一个标点都必须原样保留。

【格式化规则】
1. 根据原文编号设置标题层级。
2. 表格数据用 Markdown 表格格式化，保持所有单元格内容完整。
3. 列表项用 - 或 1. 格式化，保持层次。
4. 段落间用空行分隔。
5. 只返回 Markdown 内容，不要包含代码块或说明文字。
{part_info}
输入内容：
{text}"""


def _split_into_chunks(text: str, limit: int = CHUNK_LIMIT) -> List[str]:
    paragraphs = re.split(r"\n\s*\n", text)
    chunks: List[str] = []
    current = ""

    for para in paragraphs:
        if len(current) + len(para) + 2 > limit and current:
            chunks.append(current)
            current = para
        else:
            current = f"{current}\n\n{para}" if current else para

    if current:
        chunks.append(current)

    final: List[str] = []
    for chunk in chunks:
        if len(chunk) <= limit:
            final.append(chunk)
            continue
        lines = chunk.split("\n")
        buf = ""
        for line in lines:
            if len(buf) + len(line) + 1 > limit and buf:
                final.append(buf)
                buf = line
            else:
                buf = f"{buf}\n{line}" if buf else line
        if buf:
            final.append(buf)

    return final if final else [text]


def _safe_upstream_error(exc: httpx.HTTPStatusError) -> str:
    status_code = exc.response.status_code if exc.response is not None else 502
    return f"上游模型服务返回错误（HTTP {status_code}）"


def _readable_file_size(uploaded_size: int, size_limit: int) -> Optional[JSONResponse]:
    if uploaded_size > size_limit:
        limit_mb = size_limit // (1024 * 1024)
        return JSONResponse(status_code=413, content={"error": f"文件超过 {limit_mb}MB 限制"})
    return None


def _parse_config_json(raw: str) -> LocalAIConfig:
    try:
        return LocalAIConfig.model_validate(json.loads(raw))
    except Exception as exc:
        raise ValueError(f"配置无效: {exc}") from exc


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/api/models")
async def list_models(config: LocalAIConfig):
    headers = {"Authorization": f"Bearer {config.apiKey}"} if config.apiKey else {}
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.get(
                f"{config.apiBaseUrl}/models",
                headers=headers,
            )
            resp.raise_for_status()
            data = resp.json()
    except Exception as exc:
        return {
            "error": f"模型探测失败: {str(exc)}",
            "models": [{"id": config.model, "name": config.model}],
            "default": config.model,
        }

    items = []
    for item in data.get("data", []):
        if isinstance(item, dict) and item.get("id"):
            model_id = item["id"]
            items.append({"id": model_id, "name": model_id})

    if not items:
        items = [{"id": config.model, "name": config.model}]

    return {"models": items, "default": config.model}


@app.post("/api/ai/chat")
async def ai_chat(req: ChatRequest):
    model = req.model or req.config.model
    try:
        text = await _call_ai(req.prompt, model, req.config)
        return {"text": text, "model": model}
    except httpx.HTTPStatusError as exc:
        return JSONResponse(status_code=exc.response.status_code, content={"error": _safe_upstream_error(exc)})
    except Exception as exc:
        return JSONResponse(status_code=500, content={"error": f"AI 调用异常: {str(exc)}"})


@app.post("/api/ai/chunk-process")
async def chunk_process(req: ChunkProcessRequest):
    text = req.text
    is_bid = req.mode == "bid"
    model = req.config.bidModel if is_bid and req.config.bidModel else (req.model or req.config.model)
    chunk_limit = BID_CHUNK_LIMIT if is_bid else CHUNK_LIMIT
    build_prompt = _build_bid_prompt if is_bid else (_build_format_prompt if req.mode == "format" else _build_table_prompt)

    if len(text) <= chunk_limit:
        try:
            result = await _call_ai(build_prompt(text), model, req.config)
            return {"text": result, "chunks_processed": 1, "model": model}
        except httpx.HTTPStatusError as exc:
            return JSONResponse(status_code=exc.response.status_code, content={"error": _safe_upstream_error(exc)})
        except Exception as exc:
            return JSONResponse(status_code=500, content={"error": str(exc)})

    chunks = _split_into_chunks(text, limit=chunk_limit)
    total = len(chunks)
    results: List[str] = []

    for i, chunk in enumerate(chunks, 1):
        part_info = (
            f"\n注意：这是完整文档的第 {i}/{total} 部分，请保持与前后部分一致的格式风格。不要添加总结或开头语。\n"
            if not is_bid
            else f"\n【重要】这是完整标书的第 {i}/{total} 部分。必须保持前后格式一致，不要省略任何内容。\n"
        )
        try:
            result = await _call_ai(build_prompt(chunk, part_info), model, req.config)
            results.append(result)
        except Exception as exc:
            log.warning("第 %d/%d 段处理失败: %s，保留原文", i, total, exc)
            results.append(chunk)

    return {"text": "\n\n".join(results), "chunks_processed": total, "model": model}


@app.post("/api/upload")
async def upload_file(
    file: UploadFile = File(...),
    config: str = Form(...),
    bid: bool = False,
):
    try:
        _parse_config_json(config)
    except ValueError as exc:
        return JSONResponse(status_code=400, content={"error": str(exc)})

    size_limit = BID_MAX_FILE_SIZE if bid else MAX_FILE_SIZE
    content = await file.read(size_limit + 1)
    size_error = _readable_file_size(len(content), size_limit)
    if size_error:
        return size_error

    filename = (file.filename or "").lower()
    text = ""

    if filename.endswith(".docx"):
        try:
            from docx import Document as DocxDocument
            doc = DocxDocument(io.BytesIO(content))
            parts: list[str] = []
            for para in doc.paragraphs:
                parts.append(para.text)
            for table in doc.tables:
                rows = []
                for row in table.rows:
                    cells = [cell.text.strip() for cell in row.cells]
                    rows.append(" | ".join(cells))
                if rows:
                    header = rows[0]
                    sep = " | ".join(["---"] * len(table.rows[0].cells))
                    table_md = "\n".join([header, sep] + rows[1:])
                    parts.append("\n" + table_md + "\n")
            text = "\n".join(parts)
        except Exception as exc:
            return JSONResponse(status_code=400, content={"error": f"Word 文件解析失败: {str(exc)}"})
    elif filename.endswith(".doc"):
        return JSONResponse(status_code=400, content={"error": "暂不支持 .doc 格式，请另存为 .docx 后重试"})
    elif filename.endswith((".xlsx", ".xls")):
        try:
            from openpyxl import load_workbook
            wb = load_workbook(io.BytesIO(content), read_only=True, data_only=True)
            parts = []
            for ws in wb.worksheets:
                parts.append(f"## {ws.title}\n")
                rows_data: list[list[str]] = []
                for row in ws.iter_rows(values_only=True):
                    cells = [str(c) if c is not None else "" for c in row]
                    if any(c for c in cells):
                        rows_data.append(cells)
                if rows_data:
                    header = " | ".join(rows_data[0])
                    sep = " | ".join(["---"] * len(rows_data[0]))
                    body = "\n".join(" | ".join(r) for r in rows_data[1:])
                    parts.append(f"{header}\n{sep}\n{body}\n")
            wb.close()
            text = "\n".join(parts)
        except Exception as exc:
            return JSONResponse(status_code=400, content={"error": f"Excel 文件解析失败: {str(exc)}"})
    elif filename.endswith(".pdf"):
        try:
            import subprocess
            result = subprocess.run(
                ["pdftotext", "-layout", "-", "-"],
                input=content,
                capture_output=True,
                timeout=30,
            )
            if result.returncode == 0:
                text = result.stdout.decode("utf-8", errors="replace")
            else:
                return JSONResponse(status_code=400, content={"error": "PDF 解析失败，服务器未安装 pdftotext"})
        except FileNotFoundError:
            return JSONResponse(status_code=400, content={"error": "PDF 解析暂不可用（缺少 pdftotext 工具）"})
        except Exception as exc:
            return JSONResponse(status_code=400, content={"error": f"PDF 解析失败: {str(exc)}"})
    else:
        for encoding in ["utf-8-sig", "utf-8", "gbk", "gb2312", "gb18030", "latin-1"]:
            try:
                text = content.decode(encoding)
                break
            except (UnicodeDecodeError, LookupError):
                continue

    if not text:
        return JSONResponse(status_code=400, content={"error": "无法识别文件内容或编码"})

    return {"text": text, "filename": file.filename or "", "chars": len(text)}
