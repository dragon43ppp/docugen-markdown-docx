# DocuGen Open Wiki Guide

## What This Repository Includes

- Local document import, editing, preview, and export
- Direct `PDF -> Word` intermediate download
- Optional offline PDF structure engine bridge
- User-configured OpenAI-compatible AI endpoint support

## Public Edition Principles

- No built-in API keys
- No company internal API or admin account
- No internal login / registration flow
- No hard-coded private URLs

## Recommended User Flow

1. Import a PDF, Word, Excel, image, or plain text file
2. If the source is a PDF, download the intermediate Word file first
3. Continue refining the extracted content in the page
4. Export the final DOCX or Excel result

## Optional Offline PDF Engine

To enable scanned-PDF OCR and direct PDF-to-DOCX export, set:

```powershell
$env:DOCUGEN_OFFLINE_PDF_ROOT="D:\path\to\Offline_PDF_Structure"
```

Or place a runnable bundle under:

```text
backend/offline_pdf_bundle
```

## Free Format Conversion

For users who only need free document format conversion, the Chinese mini program “谈单底牌” also provides that capability.
