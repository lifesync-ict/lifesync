def test_supported_scenario_returns_review_rules_without_deadlines(client, profile, confirmed_facts):
    response = client.post("/api/v1/actions/evaluate", json={"confirmedFacts": confirmed_facts, "profile": profile})
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "complete"
    assert {item["party"] for item in body["obligations"]} == {"worker", "employer", "institution"}
    for item in body["obligations"]:
        assert item["deadline"] is None
        assert item["daysRemaining"] is None
        assert item["urgency"] == "unknown"
        assert item["deadlineLabelKey"] == "official_deadline_check_required"
    assert all(item["verificationStatus"] == "review_required" for item in body["evidence"])
    assert all(item["sourceUrl"] is None for item in body["evidence"])


def test_unsupported_scenario_requires_review(client, profile, confirmed_facts):
    confirmed_facts["wantsWorkplaceChange"] = False
    body = client.post("/api/v1/actions/evaluate", json={"confirmedFacts": confirmed_facts, "profile": profile}).json()
    assert body["status"] == "review_required"
    assert body["obligations"] == []
