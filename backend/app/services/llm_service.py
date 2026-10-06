from app.core.config import get_settings

settings = get_settings()


def _api_key_missing() -> bool:
    if settings.llm_provider == "groq":
        return not settings.groq_api_key or settings.groq_api_key.startswith("your_")
    return not settings.openai_api_key or settings.openai_api_key.startswith("your_")


def _get_client():
    from openai import OpenAI
    if settings.llm_provider == "groq":
        return OpenAI(api_key=settings.groq_api_key, base_url="https://api.groq.com/openai/v1")
    return OpenAI(api_key=settings.openai_api_key)


def _get_model() -> str:
    if settings.llm_provider == "groq":
        return "llama3-8b-8192"
    return settings.llm_model


def _build_messages(query: str, context_chunks: list, conversation_history: list) -> list:
    context_text = ""
    for i, chunk in enumerate(context_chunks, 1):
        context_text += f"\n[Source {i}: {chunk['doc_name']}, Page {chunk['page']}]\n{chunk['text']}\n"

    system_prompt = f"""You are CampusAI, an intelligent university assistant.
Answer student questions ONLY using the university documents provided below.

RULES:
1. Answer ONLY from the provided context. Do NOT make up information.
2. If the answer is not directly supported by the context, say exactly: "No answer found in the university documents."
3. Always cite the source document name and page number.
4. Be clear and concise. Use bullet points for lists.
5. Prefer the most specific matching passage over general passages.
6. Never combine facts from different students or different documents unless the context explicitly connects them.
7. Do not use general knowledge, training data, or assumptions outside the provided context.

UNIVERSITY DOCUMENTS:
{context_text}
"""
    messages = [{"role": "system", "content": system_prompt}]
    for msg in conversation_history[-6:]:
        messages.append({"role": msg["role"], "content": msg["content"]})
    messages.append({"role": "user", "content": query})
    return messages


def _extractive_answer(query: str, context_chunks: list) -> str:
    """Return raw text from matched chunks when no LLM is configured."""
    query_terms = [term for term in query.lower().split() if len(term) > 2]
    ranked_chunks = sorted(
        context_chunks,
        key=lambda chunk: sum(term in chunk["text"].lower() for term in query_terms),
        reverse=True,
    )
    parts = []
    seen = set()
    for chunk in ranked_chunks:
        key = (chunk["doc_name"], chunk["page"])
        if key in seen:
            continue
        seen.add(key)
        text = " ".join(chunk["text"].split())
        if len(text) > 500:
            text = text[:500].rsplit(" ", 1)[0] + "..."
        parts.append(f"{text}\n\n(Source: {chunk['doc_name']}, Page {chunk['page']})")
        if len(parts) == 1:
            break
    return "Here is what I found in the university documents:\n\n" + "\n\n---\n\n".join(parts)


def get_llm_response(query: str, context_chunks: list, conversation_history: list) -> str:
    """
    Try LLM first. If no API key is configured, fall back to extractive answer
    directly from the matched document chunks — never show an error to the student.
    """
    if not context_chunks:
        return "I could not find this information in the university documents. Please contact the university office directly."

    # No API key → use extractive fallback (still useful, no error shown)
    if _api_key_missing():
        return _extractive_answer(query, context_chunks)

    try:
        client = _get_client()
        response = client.chat.completions.create(
            model=_get_model(),
            messages=_build_messages(query, context_chunks, conversation_history),
            temperature=0.2,
            max_tokens=1024
        )
        return response.choices[0].message.content
    except Exception:
        # Any LLM error → fall back to extractive answer from docs
        return _extractive_answer(query, context_chunks)
