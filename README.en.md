# DocuGen Open

[简体中文说明](./README.md)

DocuGen Open is a local document cleanup tool for importing TXT, Markdown, Word, Excel, PDF, and image files, refining the extracted content, and exporting the final result as Word or Excel.

This public edition does not ship with any company API, admin account, default key, or internal endpoint. AI features use a bring-your-own-endpoint model, so you can connect your own OpenAI-compatible service such as OpenAI, a Gemini-compatible endpoint, a Qwen-compatible endpoint, or any gateway that supports `/models` and `/chat/completions`.

## Features

- Import `TXT / Markdown / DOCX / XLSX / PDF / images`
- Edit and preview extracted Markdown locally
- Direct `PDF -> Word` intermediate export
- AI formatting, smart tables, and bid-document rewriting
- Export final `DOCX / XLSX`

## Workflow

1. Import a PDF or another file
2. If the source is a PDF, click `Download Intermediate Word`
3. Continue refining the extracted content in the app
4. Export the final DOCX or Excel file

## Does PDF to Word require an LLM?

No.

The `PDF -> Word` path uses a local offline structure engine when available. Your online model endpoint is only used for:

- AI formatting
- Smart tables
- Bid-document rewriting

## Quick Start

### Option 1: Start everything on Windows

```bat
Start-DocuGen.bat
```

The script will:

- install frontend dependencies
- create a local backend virtual environment
- install backend dependencies
- start the backend on `http://127.0.0.1:8001`
- start the frontend on `http://127.0.0.1:9000`

### Option 2: Start manually

Frontend:

```bash
npm install
npm run dev -- --host 127.0.0.1 --port 9000
```

Backend:

```bash
python -m venv .backend-venv
.backend-venv\Scripts\python -m pip install -r backend\requirements.txt
cd backend
..\.backend-venv\Scripts\python -m uvicorn main:app --host 127.0.0.1 --port 8001 --reload
```

## Required runtime config

On first launch, fill in:

- `API Base URL`
- `API Key` (optional)
- `Default model`
- `Bid model` (optional)

The config is stored only in browser `localStorage`.

## Enabling the offline PDF engine

If you want scanned-PDF OCR, layout analysis, table extraction, and direct PDF-to-DOCX export, prepare a runnable `Offline_PDF_Structure` environment and set:

```powershell
$env:DOCUGEN_OFFLINE_PDF_ROOT="D:\path\to\Offline_PDF_Structure"
```

You can also place a runnable bundle at:

```text
backend/offline_pdf_bundle
```

## Security Notes

- No real API key is included in this repository
- No company-internal API or default gateway is included
- The frontend only sends the endpoint config you explicitly enter
- The backend only allows HTTPS upstreams by default, or local HTTP addresses

## Scope of This Open Repository

- Local document import / cleanup / export
- Offline PDF bridge integration
- User-supplied AI endpoint configuration
- No internal account system, default keys, or company-specific release logic

## License

MIT
