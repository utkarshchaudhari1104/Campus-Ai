from pypdf import PdfReader
from typing import List, Dict

_ocr_engine = None


class OCRUnavailableError(RuntimeError):
    pass


def _ocr_pdf_pages(filepath: str, page_indices: List[int]) -> Dict[int, str]:
    global _ocr_engine

    try:
        import fitz
        import numpy as np
        from rapidocr_onnxruntime import RapidOCR
    except ImportError as exc:
        raise OCRUnavailableError(
            "Automatic OCR is unavailable. Install the backend requirements and restart the server."
        ) from exc

    if _ocr_engine is None:
        _ocr_engine = RapidOCR()

    extracted = {}
    with fitz.open(filepath) as document:
        for page_index in page_indices:
            pixmap = document[page_index].get_pixmap(dpi=200, alpha=False)
            image = np.frombuffer(pixmap.samples, dtype=np.uint8).reshape(
                pixmap.height, pixmap.width, pixmap.n
            )
            if pixmap.n == 4:
                image = image[:, :, :3]
            image = image[:, :, ::-1].copy()
            result, _ = _ocr_engine(image)
            lines = [item[1].strip() for item in (result or []) if len(item) > 1 and item[1].strip()]
            extracted[page_index + 1] = " ".join(lines)

    return extracted


def extract_text_from_pdf(filepath: str) -> List[Dict]:
    """Extract text from each page of a PDF. Returns list of {page, text}."""
    reader = PdfReader(filepath)
    pages = []
    pages_to_ocr = []
    for i, page in enumerate(reader.pages):
        text = page.extract_text() or ""
        text = text.strip()
        if text:
            pages.append({"page": i + 1, "text": text})
        else:
            pages_to_ocr.append(i)

    if pages_to_ocr:
        ocr_text = _ocr_pdf_pages(filepath, pages_to_ocr)
        pages.extend(
            {"page": page_number, "text": text}
            for page_number, text in ocr_text.items()
            if text
        )

    pages.sort(key=lambda page: page["page"])
    return pages


def chunk_text(pages: List[Dict], chunk_size: int = 500, overlap: int = 50) -> List[Dict]:
    """
    Split page text into overlapping chunks.
    Each chunk carries: {text, page, chunk_index}
    """
    chunks = []
    chunk_index = 0
    for page_data in pages:
        text = page_data["text"]
        page_num = page_data["page"]
        words = text.split()
        start = 0
        while start < len(words):
            end = start + chunk_size
            chunk_words = words[start:end]
            chunk_text = " ".join(chunk_words)
            if len(chunk_text.strip()) > 30:  # skip tiny chunks
                chunks.append({
                    "text": chunk_text,
                    "page": page_num,
                    "chunk_index": chunk_index
                })
                chunk_index += 1
            start += chunk_size - overlap
    return chunks
