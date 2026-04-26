"""Sanity tests for the ported scoring algorithm."""

from politiscales import compute_scores, load_dataset


def test_dataset_loads():
    ds = load_dataset()
    assert len(ds.questions) == 117
    assert len(ds.pairs) == 10
    assert "communism" in ds.paired_axes
    assert "anarchism" in ds.unpaired_axes


def test_single_strongly_agree_communism():
    ds = load_dataset()
    scores = compute_scores(
        {"communism_wealth_ownership": "strongly_agree"}, ds
    )
    # valuesYes = [{axis: communism, value: 3}] → val=3, sum=3 → 100%
    assert scores["communism"] == 100.0
    # capitalism never touched
    assert "capitalism" not in scores


def test_single_strongly_disagree_communism_question():
    ds = load_dataset()
    scores = compute_scores(
        {"communism_wealth_ownership": "strongly_disagree"}, ds
    )
    # valuesNo = [{axis: capitalism, value: 3}] → val=3, sum=3 → 100%
    assert scores["capitalism"] == 100.0
    assert "communism" not in scores


def test_neutral_only():
    """Neutral on a question still adds to valuesNo sum but val stays 0,
    so the corresponding axis ends up at 0%."""
    ds = load_dataset()
    scores = compute_scores(
        {"communism_wealth_ownership": "neutral"}, ds
    )
    assert scores["capitalism"] == 0.0
    assert "communism" not in scores


def test_pair_renormalization():
    """If both sides of a pair would exceed 100%, they are scaled down so
    they sum to exactly 100%."""
    ds = load_dataset()
    # Answer strongly_agree to 1 communism question AND strongly_disagree to
    # 1 capitalism question. Both push toward 'communism' AND 'capitalism'
    # respectively in different ways — actually let's pick questions where
    # answering opposite ways pushes both axes high.
    # communism_wealth_ownership: yes→communism, no→capitalism
    # capitalism_profit_economy:  yes→capitalism, no→communism
    # If we strongly_agree to communism_wealth_ownership AND strongly_agree
    # to capitalism_profit_economy, we get 100% on both → must renormalize
    # to 50/50.
    scores = compute_scores(
        {
            "communism_wealth_ownership": "strongly_agree",
            "capitalism_profit_economy": "strongly_agree",
        },
        ds,
    )
    assert abs(scores["communism"] + scores["capitalism"] - 100.0) < 1e-9
    assert abs(scores["communism"] - 50.0) < 1e-9
    assert abs(scores["capitalism"] - 50.0) < 1e-9


def test_no_opinion_is_ignored():
    ds = load_dataset()
    scores = compute_scores(
        {
            "communism_wealth_ownership": "no_opinion",
            "communism_public_health": "strongly_agree",
        },
        ds,
    )
    assert scores["communism"] == 100.0
    assert "capitalism" not in scores


def test_full_test_runs_without_error():
    """Answer every question with 'agree' — should produce a result for
    every axis touched (23 axes), no exception."""
    ds = load_dataset()
    answers = {q.id: "agree" for q in ds.questions}
    scores = compute_scores(answers, ds)
    # 23 axes are referenced by questions (4 are computed-only and stay absent)
    assert len(scores) == 23
    # All scores between 0 and 100
    for axis, s in scores.items():
        assert 0 <= s <= 100, f"{axis} = {s}"
