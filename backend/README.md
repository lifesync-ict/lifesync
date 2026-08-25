# LifeSync Backend

LifeSync의 첫 번째 FastAPI Vertical Slice입니다. 현재 분석, 규칙, 기관 데이터는 모두 결정론적 시연용이며 법률 판단, 공식 기한 계산, 실제 접수 또는 기관 연결을 수행하지 않습니다.

## Windows PowerShell에서 실행

가상환경을 만듭니다.

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
```

의존성을 설치합니다.

```powershell
python -m pip install -r requirements.txt
```

`.env.example`을 `.env`로 복사한 뒤 필요한 개발 설정만 변경합니다. 실제 API 키가 생기더라도 Git에 추가하지 마세요.

```powershell
Copy-Item .env.example .env
```

서버를 실행합니다.

```powershell
python -m uvicorn app.main:app --reload --port 8000
```

테스트를 실행합니다.

```powershell
python -m pytest
```

Swagger UI: <http://localhost:8000/docs>

## API

- `GET /health`
- `GET /api/v1/health`
- `GET /api/v1/ready`
- `POST /api/v1/facts/analyze`
- `POST /api/v1/facts/confirm`
- `POST /api/v1/actions/evaluate`
- `POST /api/v1/handoff/prepare`

`FactAnalysisProvider` 프로토콜 뒤에 현재 `DeterministicFactAnalysisProvider`가 연결되어 있습니다. 향후 외부 AI provider로 교체할 수 있지만, 현재는 네트워크나 API 키를 사용하지 않습니다.
