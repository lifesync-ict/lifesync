def test_facts_to_handoff_flow_preserves_supported_scenario(client, profile):
    text = "회사에서 그만 나오라고 했어요. 2026년 8월 20일 서류를 받지 못했어요. 다른 회사로 옮기고 싶어요"
    analyzed = client.post("/api/v1/facts/analyze", json={"text": text, "language": "ko", "profile": profile})
    assert analyzed.status_code == 200
    candidate = analyzed.json()["eventCandidate"]
    assert candidate["eventType"] == "employer_termination_request"
    assert candidate["occurredAt"] == "2026-08-20"
    assert candidate["documentsProvided"] is False
    assert candidate["wantsWorkplaceChange"] is True

    answers = {question["factKey"]: "employer" for question in analyzed.json()["questions"] if question["factKey"] == "actor"}
    confirmed = client.post("/api/v1/facts/confirm", json={
        "sourceText": text, "eventCandidate": candidate, "answers": answers, "confirmedByUser": True,
    })
    assert confirmed.status_code == 200
    facts = confirmed.json()["confirmedFacts"]

    actions = client.post("/api/v1/actions/evaluate", json={"confirmedFacts": facts, "profile": profile})
    assert actions.status_code == 200
    assert actions.json()["status"] == "complete"
    assert actions.json()["obligations"]

    handoff = client.post("/api/v1/handoff/prepare", json={
        "confirmedFacts": facts, "profile": profile, "actionGuidance": actions.json(),
        "completedActionIds": [], "selectedEvidenceItemIds": [],
    })
    assert handoff.status_code == 200
    assert handoff.json()["primaryInstitution"]["name"] is None
    assert handoff.json()["primaryInstitution"]["phone"] is None
