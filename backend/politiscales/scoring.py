"""Port of the Politiscales scoring algorithm.

Reference: https://github.com/Conobi/politiscales
  - app/components/Questions/QuestionsForm.vue (lines 27-83)
  - app/utils/questions-weights.ts
  - app/utils/axes.ts
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Literal, TypedDict

DATA_PATH = Path(__file__).parent / "data" / "questions.json"

AnswerLabel = Literal[
    "strongly_agree",
    "agree",
    "neutral",
    "disagree",
    "strongly_disagree",
    "no_opinion",
]

ANSWER_VALUES: dict[str, float] = {
    "strongly_agree": 1.0,
    "agree": 2 / 3,
    "neutral": 0.0,
    "disagree": -2 / 3,
    "strongly_disagree": -1.0,
}

ANSWER_LABELS: list[str] = [
    "strongly_agree",
    "agree",
    "neutral",
    "disagree",
    "strongly_disagree",
    "no_opinion",
]


class Weight(TypedDict):
    axis: str
    value: int


@dataclass(frozen=True)
class Question:
    id: str
    text: str
    weights_yes: list[Weight]
    weights_no: list[Weight]


@dataclass(frozen=True)
class Dataset:
    questions: list[Question]
    pairs: list[dict]  # [{name, left, right}]
    paired_axes: dict[str, dict]
    unpaired_axes: dict[str, dict]
    badge_thresholds: dict[str, float]


def load_dataset(path: Path | str = DATA_PATH) -> Dataset:
    with open(path, encoding="utf-8") as f:
        raw = json.load(f)
    questions = [
        Question(
            id=q["id"],
            text=q["text"],
            weights_yes=q["weights_yes"],
            weights_no=q["weights_no"],
        )
        for q in raw["questions"]
    ]
    return Dataset(
        questions=questions,
        pairs=raw["axes"]["pairs"],
        paired_axes=raw["axes"]["paired"],
        unpaired_axes=raw["axes"]["unpaired"],
        badge_thresholds=raw["axes"]["badge_thresholds"],
    )


def compute_scores(
    answers: dict[str, str],
    dataset: Dataset,
) -> dict[str, float]:
    """Return {axis: score_percent} for every axis that received any weight.

    Axes that no answered question touched are simply absent from the result.
    `no_opinion` answers are skipped (treated as missing data).

    Faithful port of the JS algorithm — including the quirk that `neutral`
    (value 0) still increments `sum` for the valuesNo axes, which slightly
    deflates them in proportion to how many neutral answers were given.
    """
    weights_by_id = {q.id: q for q in dataset.questions}
    raw: dict[str, dict[str, float]] = {}

    def acc(axis: str) -> dict[str, float]:
        if axis not in raw:
            raw[axis] = {"val": 0.0, "sum": 0.0}
        return raw[axis]

    for qid, label in answers.items():
        if label == "no_opinion":
            continue
        if label not in ANSWER_VALUES:
            # Skip rather than crash — small / non-instruction-tuned models
            # sometimes return free-form labels instead of the enum values.
            continue
        if qid not in weights_by_id:
            # Model hallucinated a question id (typical with weaker models).
            # Skipping is preferable to crashing the whole scoring pass.
            continue
        v = ANSWER_VALUES[label]
        q = weights_by_id[qid]
        if v > 0:
            for w in q.weights_yes:
                s = acc(w["axis"])
                s["val"] += v * w["value"]
                s["sum"] += max(w["value"], 0)
        else:
            for w in q.weights_no:
                s = acc(w["axis"])
                s["val"] -= v * w["value"]  # v <= 0 → addition
                s["sum"] += max(w["value"], 0)

    for pair in dataset.pairs:
        left, right = pair["left"], pair["right"]
        if left not in raw or right not in raw:
            continue
        sl, sr = raw[left], raw[right]
        if sl["sum"] == 0 or sr["sum"] == 0:
            continue
        pl = sl["val"] / sl["sum"] * 100
        pr = sr["val"] / sr["sum"] * 100
        if pl + pr > 100:
            ratio = 100 / (pl + pr)
            sl["val"] *= ratio
            sr["val"] *= ratio

    return {
        axis: s["val"] / s["sum"] * 100
        for axis, s in raw.items()
        if s["sum"] > 0
    }
