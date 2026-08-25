def test_health_endpoints(client):
    for path in ("/health", "/api/v1/health", "/api/v1/ready"):
        response = client.get(path)
        assert response.status_code == 200
        assert response.json() == {"status": "ok", "service": "lifesync-backend", "version": "0.1.0"}


def test_cors_allows_local_frontend(client):
    response = client.options("/api/v1/facts/analyze", headers={
        "Origin": "http://localhost:5173", "Access-Control-Request-Method": "POST",
    })
    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://localhost:5173"
    assert response.headers["access-control-allow-credentials"] == "true"


def test_validation_error_does_not_expose_traceback(client, profile):
    response = client.post("/api/v1/facts/analyze", json={"text": "", "language": "ko", "profile": profile})
    assert response.status_code == 422
    body = response.json()
    assert set(body["error"]) == {"code", "message", "requestId", "details"}
    assert "traceback" not in response.text.casefold()
