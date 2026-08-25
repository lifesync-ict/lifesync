def test_handoff_contains_no_fabricated_contact_or_personal_information(client, profile, confirmed_facts):
    actions = client.post("/api/v1/actions/evaluate", json={"confirmedFacts": confirmed_facts, "profile": profile}).json()
    response = client.post("/api/v1/handoff/prepare", json={
        "confirmedFacts": confirmed_facts, "profile": profile, "actionGuidance": actions,
        "completedActionIds": [], "selectedEvidenceItemIds": [],
    })
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "needs_review"
    institutions = [body["primaryInstitution"], *body["alternativeInstitutions"]]
    assert {item["type"] for item in institutions} == {"employment_center", "immigration_office", "worker_support_center"}
    for item in institutions:
        assert item["name"] is None
        assert item["jurisdiction"] is None
        assert item["address"] is None
        assert item["phone"] is None
        assert item["sourceUrl"] is None
    assert body["privacyNoticeKey"] == "no_personal_information_included"
    assert "no_submission_or_booking_performed" in body["warnings"]
