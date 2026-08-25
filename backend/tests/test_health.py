def test_health_endpoints(client):
    for path in ("/health", "/api/v1/health"):
        response = client.get(path)
        assert response.status_code == 200
        assert response.json() == {"status": "ok", "service": "lifesync-backend", "version": "0.1.0"}

    ready = client.get("/api/v1/ready")
    assert ready.status_code == 200
    assert ready.json()["providerConfigured"] is True
    assert ready.json()["provider"] in {"deterministic", "gemini"}
    assert "key" not in ready.text.casefold()


def test_cors_allows_local_frontend(client, cors_origin):
    response = client.options("/api/v1/facts/analyze", headers={
        "Origin": cors_origin, "Access-Control-Request-Method": "POST",
    })
    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == cors_origin
    assert response.headers["access-control-allow-credentials"] == "true"


def test_cors_does_not_allow_unknown_origin(client):
    response = client.options("/api/v1/facts/analyze", headers={
        "Origin": "https://not-allowed.example", "Access-Control-Request-Method": "POST",
    })
    assert response.status_code == 400
    assert "access-control-allow-origin" not in response.headers


def test_validation_error_does_not_expose_traceback(client, profile):
    response = client.post("/api/v1/facts/analyze", json={"text": "", "language": "ko", "profile": profile})
    assert response.status_code == 422
    body = response.json()
    assert set(body["error"]) == {"code", "message", "requestId", "details"}
    assert "traceback" not in response.text.casefold()


def test_ready_rejects_missing_gemini_configuration(client, monkeypatch):
    from app.core.config import Settings

    monkeypatch.setattr(client.app.state, "settings", Settings(_env_file=None, ai_provider="gemini", ai_api_key="", ai_model="gemini-2.5-flash"))
    response = client.get("/api/v1/ready")
    assert response.status_code == 503
    assert response.json()["error"]["code"] == "http_error"
    assert "key" not in response.text.casefold()
