def test_handoff_exposes_only_verified_institution_contact_details(client, profile, confirmed_facts):
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
        assert item["name"] is not None
        assert item["phone"] is not None
    by_type = {item["type"]: item for item in institutions}
    for institution_type in ("employment_center", "immigration_office"):
        assert by_type[institution_type]["sourceUrl"].startswith("https://")
    assert by_type["worker_support_center"]["sourceUrl"] is None
    assert body["privacyNoticeKey"] == "no_personal_information_included"
    assert "no_submission_or_booking_performed" in body["warnings"]
