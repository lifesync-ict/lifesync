def test_supported_scenario_uses_verified_sources_without_unverified_deadlines(client, profile, confirmed_facts):
    response = client.post("/api/v1/actions/evaluate", json={"confirmedFacts": confirmed_facts, "profile": profile})
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "complete"
    assert {item["party"] for item in body["obligations"]} == {"worker", "employer", "institution"}
    by_party = {item["party"]: item for item in body["obligations"]}
    worker_item = by_party["worker"]
    assert worker_item["deadline"] == "2026-09-20"
    assert worker_item["daysRemaining"] is not None
    assert worker_item["urgency"] != "unknown"
    assert worker_item["deadlineLabelKey"] == "workplace_change_application_deadline"
    for party in ("employer", "institution"):
        item = by_party[party]
        assert item["deadline"] is None
        assert item["daysRemaining"] is None
        assert item["urgency"] == "unknown"
        assert item["deadlineLabelKey"] == "official_deadline_check_required"
    verified = [item for item in body["evidence"] if item["verificationStatus"] == "verified"]
    review = [item for item in body["evidence"] if item["verificationStatus"] == "review_required"]
    assert len(verified) == 2
    assert all(item["sourceUrl"].startswith("https://") for item in verified)
    assert all(item["checkedAt"] == "2026-08-25" for item in verified)
    assert len(review) == 1
    assert review[0]["sourceUrl"] is None


def test_unsupported_scenario_requires_review(client, profile, confirmed_facts):
    confirmed_facts["wantsWorkplaceChange"] = False
    body = client.post("/api/v1/actions/evaluate", json={"confirmedFacts": confirmed_facts, "profile": profile}).json()
    assert body["status"] == "review_required"
    assert body["obligations"] == []
