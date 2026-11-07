"""Trained prompt-injection classifier: scores untrusted text (an email, a web page, a tool result) before an agent acts.

Until now SwarmGuard caught injections by what the agent *did* afterwards (SG-012, the live tripwire). This looks at the
text itself. It is a linear model (logistic regression over hashed word and character n-grams) trained on public,
openly licensed injection datasets plus indirect-injection examples in our own workspace's style
(`scripts/train_injection_classifier.py`). No extra packages: scoring is a dictionary lookup per feature, well under a
millisecond per document, and the weights ship as one JSON file.

It is a signal, not a verdict: a linear model can be evaded by paraphrase, which is why the behaviour-based rules stay.
Measured accuracy, including on datasets it never saw, is in docs/injection-classifier.md.
"""
from __future__ import annotations

import json
import math
import re
import zlib
from functools import lru_cache
from pathlib import Path

MODEL_PATH = Path(__file__).with_name("data") / "injection_model.json"
BUCKETS = 1 << 20
MAX_CHARS = 4000
WORD = re.compile(r"[a-z0-9_:/.\-']+")


def _h(feature: str) -> int:
    return zlib.crc32(feature.encode("utf-8")) & (BUCKETS - 1)  # stable across processes (unlike hash())


def features(text: str) -> dict[int, float]:
    """Hashed word 1-2 grams and character 4-grams, L2-normalised presence weights."""
    t = " ".join((text or "").lower().split())[:MAX_CHARS]
    words = WORD.findall(t)
    feats: set[int] = {_h("w:" + w) for w in words}
    feats |= {_h(f"b:{a} {b}") for a, b in zip(words, words[1:])}
    padded = f" {t} "
    feats |= {_h("c:" + padded[i:i + 4]) for i in range(len(padded) - 3)}
    if not feats:
        return {}
    v = 1.0 / math.sqrt(len(feats))
    return {f: v for f in feats}


@lru_cache(maxsize=1)
def load(path: str | None = None) -> dict:
    data = json.loads(Path(path or MODEL_PATH).read_text(encoding="utf-8"))
    data["w"] = {int(k): v for k, v in data["weights"].items()}
    return data


def score(text: str, model: dict | None = None) -> float:
    """Probability (0..1) that the text contains a prompt injection."""
    m = model or load()
    z = m["bias"] + sum(m["w"].get(f, 0.0) * v for f, v in features(text).items())
    return 1.0 / (1.0 + math.exp(-max(-30.0, min(30.0, z))))


@lru_cache(maxsize=4096)
def cached_score(text: str) -> float:
    return score(text)


def threshold() -> float:
    return float(load().get("threshold", 0.5))


def available() -> bool:
    return MODEL_PATH.exists()
