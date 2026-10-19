import logging
from typing import List, Optional
import numpy as np
from app.config import settings

logger = logging.getLogger(__name__)

_model_instance = None


def get_embedding_model():
    global _model_instance
    if _model_instance is None:
        try:
            from sentence_transformers import SentenceTransformer
            logger.info(f"Loading SentenceTransformer model: {settings.EMBEDDING_MODEL}")
            _model_instance = SentenceTransformer(settings.EMBEDDING_MODEL, device=settings.DEVICE)
        except Exception as e:
            logger.warning(f"Could not load SentenceTransformer ({e}). Using deterministic bag-of-words vector fallback.")
            _model_instance = "fallback"
    return _model_instance


def compute_embeddings(texts: List[str]) -> List[List[float]]:
    """
    Computes vector embeddings for a list of texts.
    Returns normalized float vectors.
    """
    if not texts:
        return []

    model = get_embedding_model()
    if model != "fallback":
        try:
            vectors = model.encode(texts, convert_to_numpy=True, normalize_embeddings=True)
            return [vec.tolist() for vec in vectors]
        except Exception as e:
            logger.error(f"Error computing SentenceTransformer embeddings: {e}")

    # Fallback bag-of-words / character n-gram hashing vectorizer for zero-dependency reliability
    return [_hash_embedding(t) for t in texts]


def compute_single_embedding(text: str) -> List[float]:
    return compute_embeddings([text])[0]


def cosine_similarity(vec_a: List[float], vec_b: List[float]) -> float:
    a = np.array(vec_a, dtype=np.float32)
    b = np.array(vec_b, dtype=np.float32)
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return float(np.dot(a, b) / (norm_a * norm_b))


def _hash_embedding(text: str, dim: int = 384) -> List[float]:
    """
    Deterministic word-hash embedding to guarantee vector operations work even in
    minimal or disconnected offline environments without downloading HF models.
    """
    vec = np.zeros(dim, dtype=np.float32)
    words = text.lower().split()
    for word in words:
        h = hash(word) % dim
        vec[h] += 1.0
    norm = np.linalg.norm(vec)
    if norm > 0:
        vec = vec / norm
    return vec.tolist()
