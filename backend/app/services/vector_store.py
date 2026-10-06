import os
import pickle
import re
import numpy as np
import faiss
from sentence_transformers import SentenceTransformer
from typing import List, Dict
from app.core.config import get_settings

settings = get_settings()

_model = None


def get_model() -> SentenceTransformer:
    global _model
    if _model is None:
        _model = SentenceTransformer("all-MiniLM-L6-v2")
    return _model


def _index_path() -> str:
    return os.path.join(settings.vector_store_dir, "faiss.index")


def _meta_path() -> str:
    return os.path.join(settings.vector_store_dir, "metadata.pkl")


def _load_store():
    if os.path.exists(_index_path()) and os.path.exists(_meta_path()):
        index = faiss.read_index(_index_path())
        with open(_meta_path(), "rb") as f:
            metadata = pickle.load(f)
        return index, metadata
    return None, []


def _save_store(index, metadata: list):
    os.makedirs(settings.vector_store_dir, exist_ok=True)
    faiss.write_index(index, _index_path())
    with open(_meta_path(), "wb") as f:
        pickle.dump(metadata, f)


def add_document_chunks(
    doc_id: int,
    doc_name: str,
    chunks: List[Dict],
    university_id: int = None,
):
    model = get_model()
    texts = [c["text"] for c in chunks]
    embeddings = model.encode(texts, show_progress_bar=False, normalize_embeddings=True)
    embeddings = np.array(embeddings, dtype="float32")

    index, metadata = _load_store()
    if index is None:
        index = faiss.IndexFlatIP(embeddings.shape[1])

    index.add(embeddings)
    for chunk in chunks:
        metadata.append({
            "doc_id": doc_id,
            "doc_name": doc_name,
            "university_id": university_id,
            "page": chunk["page"],
            "text": chunk["text"],
            "chunk_index": chunk["chunk_index"]
        })

    _save_store(index, metadata)


def remove_document_chunks(doc_id: int):
    index, metadata = _load_store()
    if index is None or not metadata:
        return

    kept_meta = [m for m in metadata if m["doc_id"] != doc_id]
    if not kept_meta:
        if os.path.exists(_index_path()):
            os.remove(_index_path())
        if os.path.exists(_meta_path()):
            os.remove(_meta_path())
        return

    model = get_model()
    embeddings = model.encode([m["text"] for m in kept_meta], show_progress_bar=False, normalize_embeddings=True)
    embeddings = np.array(embeddings, dtype="float32")
    new_index = faiss.IndexFlatIP(embeddings.shape[1])
    new_index.add(embeddings)
    _save_store(new_index, kept_meta)


def search(
    query: str,
    top_k: int = 5,
    university_id: int = None,
    include_global: bool = False,
) -> List[Dict]:
    if university_id is None and not include_global:
        return []

    index, metadata = _load_store()
    if index is None or index.ntotal == 0:
        return []

    model = get_model()
    query_vec = model.encode([query], normalize_embeddings=True)
    query_vec = np.array(query_vec, dtype="float32")

    k = index.ntotal
    scores, indices = index.search(query_vec, k)

    query_text = query.lower().strip()
    query_terms = [term for term in re.findall(r"[a-z0-9]+", query_text) if len(term) > 1]
    ranked = []
    for score, idx in zip(scores[0], indices[0]):
        if idx == -1:
            continue
        meta = metadata[idx].copy()
        if not include_global and meta.get("university_id") != university_id:
            continue
        document_text = meta.get("text", "").lower()
        term_hits = sum(term in document_text for term in query_terms)
        lexical_boost = min(
            0.35,
            (term_hits / len(query_terms)) * 0.35 if query_terms else 0,
        )
        phrase_boost = 0.25 if len(query_text) > 3 and query_text in document_text else 0
        meta["score"] = float(score) + lexical_boost + phrase_boost
        ranked.append(meta)

    ranked.sort(key=lambda item: item["score"], reverse=True)
    return ranked[:top_k]


def find_student_context(
    name: str,
    enrollment_no: str = None,
    university_id: int = None,
    top_k: int = 10,
) -> List[Dict]:
    """Find chunks that explicitly contain the signed-in student's details."""
    if university_id is None:
        return []

    _, metadata = _load_store()
    phrase_terms = [term.strip().lower() for term in (name, enrollment_no) if term and term.strip()]
    name_terms = [term for term in re.findall(r"[a-z0-9]+", name.lower()) if len(term) > 2] if name else []
    if not phrase_terms and not name_terms:
        return []

    matches = []
    for item in metadata:
        if item.get("university_id") != university_id:
            continue
        text = item.get("text", "").lower()
        phrase_match = any(term in text for term in phrase_terms)
        name_match = bool(name_terms) and all(term in text for term in name_terms)
        if phrase_match or name_match:
            match = item.copy()
            match["score"] = 1.0
            matches.append(match)
        if len(matches) == top_k:
            break
    return matches


def find_student_roll_number(
    name: str,
    enrollment_no: str,
    university_id: int = None,
) -> Dict | None:
    """Extract the roll number adjacent to the student's enrollment number."""
    if university_id is None:
        return None

    _, metadata = _load_store()
    enrollment_pattern = None
    if enrollment_no:
        enrollment_pattern = re.compile(
            rf"{re.escape(enrollment_no)}\s+([0-9]+(?:-[A-Za-z]+)?)",
            re.IGNORECASE,
        )
    name_terms = [term for term in re.findall(r"[a-z0-9]+", name.lower()) if len(term) > 2] if name else []
    for item in metadata:
        if item.get("university_id") != university_id:
            continue
        text = item.get("text", "")
        lower_text = text.lower()
        if enrollment_no and enrollment_no.lower() not in lower_text and not all(term in lower_text for term in name_terms):
            continue
        match = enrollment_pattern.search(text) if enrollment_pattern else None
        if not match and name_terms and all(term in lower_text for term in name_terms):
            name_position = max(lower_text.find(term) for term in name_terms if lower_text.find(term) >= 0)
            preceding_text = text[max(0, name_position - 100):name_position]
            match = re.search(r"\b([0-9]+-[A-Za-z]+)\b\s*$", preceding_text)
        if match:
            result = item.copy()
            result["roll_number"] = match.group(1)
            result["score"] = 1.0
            return result
    return None


def find_student_division(
    name: str,
    enrollment_no: str = None,
    university_id: int = None,
) -> Dict | None:
    """Extract a class/division label from the student's document row."""
    if university_id is None:
        return None

    _, metadata = _load_store()
    name_terms = [term for term in re.findall(r"[a-z0-9]+", name.lower()) if len(term) > 2] if name else []
    for item in metadata:
        if item.get("university_id") != university_id:
            continue
        text = item.get("text", "")
        lower_text = text.lower()
        if enrollment_no and enrollment_no.lower() in lower_text:
            anchor = lower_text.find(enrollment_no.lower())
        elif name_terms and all(term in lower_text for term in name_terms):
            anchor = max(lower_text.find(term) for term in name_terms)
        else:
            continue

        preceding_text = text[max(0, anchor - 120):anchor]
        matches = re.findall(r"\b([A-Za-z]+-[A-Za-z0-9]+-\d+)\b", preceding_text)
        if matches:
            result = item.copy()
            result["division"] = matches[-1]
            result["score"] = 1.0
            return result
    return None


def get_total_chunks(university_id: int = None) -> int:
    index, metadata = _load_store()
    if index is None:
        return 0
    if university_id is None:
        return index.ntotal
    return sum(item.get("university_id") == university_id for item in metadata)
