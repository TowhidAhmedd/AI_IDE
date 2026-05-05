import faiss
import numpy as np
from dataclasses import dataclass, field
from .embedder import embed_texts, embed_query

EMBEDDING_DIM = 384  # all-MiniLM-L6-v2 output dim


@dataclass
class Document:
    content: str
    metadata: dict = field(default_factory=dict)


class VectorStore:
    def __init__(self):
        self.index = faiss.IndexFlatIP(EMBEDDING_DIM)  # Inner product (cosine on normalized vecs)
        self.documents: list[Document] = []

    def add_documents(self, docs: list[Document]) -> None:
        if not docs:
            return
        texts = [d.content for d in docs]
        embeddings = embed_texts(texts).astype(np.float32)
        self.index.add(embeddings)
        self.documents.extend(docs)

    def add_document(self, doc: Document) -> None:
        self.add_documents([doc])

    def search(self, query: str, top_k: int = 5) -> list[tuple[Document, float]]:
        if self.index.ntotal == 0:
            return []
        query_vec = embed_query(query).astype(np.float32).reshape(1, -1)
        k = min(top_k, self.index.ntotal)
        scores, indices = self.index.search(query_vec, k)
        results = []
        for score, idx in zip(scores[0], indices[0]):
            if idx >= 0:
                results.append((self.documents[idx], float(score)))
        return results

    def clear(self) -> None:
        self.index.reset()
        self.documents.clear()

    def __len__(self) -> int:
        return self.index.ntotal


# Global singleton store
_store: VectorStore | None = None


def get_vector_store() -> VectorStore:
    global _store
    if _store is None:
        _store = VectorStore()
    return _store
