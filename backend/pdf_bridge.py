from __future__ import annotations

import json
import logging
import os
import shutil
import subprocess
import tempfile
from pathlib import Path
from typing import Optional

log = logging.getLogger("docugen_mature.pdf_bridge")

OFFLINE_PDF_ROOT_ENV = "DOCUGEN_OFFLINE_PDF_ROOT"
WORKER_PATH = Path(__file__).resolve().with_name("pdf_worker.py")
IMAGE_EXTENSIONS = (".png", ".jpg", ".jpeg", ".bmp", ".webp", ".tif", ".tiff")
DOCX_MEDIA_TYPE = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"


def _resolve_offline_root() -> Optional[Path]:
    raw = os.getenv(OFFLINE_PDF_ROOT_ENV, "").strip()
    if raw:
        candidate = Path(raw)
        if candidate.exists():
            return candidate

    bundled = Path(__file__).resolve().parent / "offline_pdf_bundle"
    if bundled.exists():
        return bundled
    return None


def _resolve_bundle_python(root: Path) -> Optional[Path]:
    for candidate in sorted(root.glob("python*")):
        python_exe = candidate / "python.exe"
        if python_exe.exists():
            return python_exe
    return None


def _resolve_model_dir(root: Path) -> Optional[Path]:
    model_dir = root / "MyProject" / "models"
    return model_dir if model_dir.exists() else None


def _prepare_model_dir(root: Path) -> Optional[Path]:
    source = _resolve_model_dir(root)
    if source is None:
        return None
    if str(source).isascii():
        return source

    cache_dir = Path(__file__).resolve().parent / "_offline_pdf_models"
    sentinel = cache_dir / "ppocr_keys_v1.txt"
    if sentinel.exists():
        return cache_dir

    if cache_dir.exists():
        shutil.rmtree(cache_dir, ignore_errors=True)
    shutil.copytree(source, cache_dir)
    return cache_dir


def _parse_worker_output(raw: str) -> Optional[dict]:
    raw = raw.strip()
    if not raw:
        return None

    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        pass

    for line in reversed(raw.splitlines()):
        candidate = line.strip()
        if not candidate:
            continue
        try:
            return json.loads(candidate)
        except json.JSONDecodeError:
            continue
    return None


def _run_worker(action: str, content: bytes, filename: str, output_suffix: str = "") -> tuple[Optional[dict], Optional[bytes]]:
    suffix = Path(filename or "").suffix.lower()
    if suffix not in {".pdf", *IMAGE_EXTENSIONS}:
        return None, None

    root = _resolve_offline_root()
    if root is None or not WORKER_PATH.exists():
        return None, None

    python_exe = _resolve_bundle_python(root)
    if python_exe is None:
        log.warning("Offline PDF root found but python.exe is missing: %s", root)
        return None, None

    model_dir = _prepare_model_dir(root)
    doc_type = "pdf" if suffix == ".pdf" else "image"
    temp_input_path: Optional[Path] = None
    temp_output_path: Optional[Path] = None

    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as input_handle:
            input_handle.write(content)
            temp_input_path = Path(input_handle.name)

        cmd = [
            str(python_exe),
            str(WORKER_PATH),
            "--action",
            action,
            "--input",
            str(temp_input_path),
            "--type",
            doc_type,
        ]

        if output_suffix:
            with tempfile.NamedTemporaryFile(delete=False, suffix=output_suffix) as output_handle:
                temp_output_path = Path(output_handle.name)
            cmd.extend(["--output", str(temp_output_path)])

        if model_dir is not None:
            cmd.extend(["--model-dir", str(model_dir)])

        env = os.environ.copy()
        env["PYTHONUTF8"] = "1"
        env["PYTHONIOENCODING"] = "utf-8"
        env["DISABLE_MODEL_SOURCE_CHECK"] = "True"

        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            timeout=600,
            env=env,
        )
        payload = _parse_worker_output(result.stdout)
        if result.returncode != 0:
            log.warning(
                "Offline PDF worker failed (code=%s): %s",
                result.returncode,
                (result.stderr or result.stdout).strip(),
            )
            return None, None
        if not payload or not payload.get("ok"):
            log.warning("Offline PDF worker returned invalid payload: %s", payload)
            return None, None

        output_bytes = None
        if temp_output_path is not None and temp_output_path.exists():
            output_bytes = temp_output_path.read_bytes()
        return payload, output_bytes
    except Exception as exc:
        log.warning("Offline PDF bridge failed: %s", exc)
        return None, None
    finally:
        for path in [temp_input_path, temp_output_path]:
            if path is not None:
                try:
                    path.unlink(missing_ok=True)
                except OSError:
                    pass


def extract_with_offline_pdf(content: bytes, filename: str) -> Optional[dict]:
    payload, _ = _run_worker("extract", content, filename)
    return payload


def export_docx_with_offline_pdf(content: bytes, filename: str) -> tuple[Optional[bytes], Optional[str], Optional[dict]]:
    payload, output_bytes = _run_worker("export-docx", content, filename, output_suffix=".docx")
    if not payload or not output_bytes:
        return None, None, None

    stem = Path(filename or "document").stem.strip() or "document"
    download_name = f"{stem}.docx"
    return output_bytes, download_name, payload.get("meta") or {}
