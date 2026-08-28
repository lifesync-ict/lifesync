# LifeSync Backend

LifeSync의 사실 후보 분석, 행동 규칙 평가, 기관 인계 자료 생성을 담당하는 FastAPI 애플리케이션입니다.

현재 분석과 규칙은 공모전 시연 범위를 위한 것입니다. 법률 판단, 공식 기한 계산, 실제 접수 또는 기관 연결을 수행하지 않습니다.

## macOS / Linux 실행

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
cp .env.example .env
python -m uvicorn app.main:app --reload --port 8002
```

## Windows PowerShell 실행

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
Copy-Item .env.example .env
python -m uvicorn app.main:app --reload --port 8002
```

- API: <http://127.0.0.1:8002>
- Swagger UI: <http://127.0.0.1:8002/docs>

## 테스트

```bash
python -m pytest
```

## API

- `GET /health`
- `GET /api/v1/health`
- `GET /api/v1/ready`
- `POST /api/v1/facts/analyze`
- `POST /api/v1/facts/confirm`
- `POST /api/v1/actions/evaluate`
- `POST /api/v1/handoff/prepare`

## AI provider

`FactAnalysisProvider` 뒤에서 결정론적 provider와 Gemini provider를 선택할 수 있습니다.

외부 API 없이 실행하는 기본 설정:

```dotenv
AI_PROVIDER=deterministic
AI_API_KEY=
AI_MODEL=
AI_TIMEOUT_SECONDS=20
```

Gemini 설정:

```dotenv
AI_PROVIDER=gemini
AI_API_KEY=your-key
AI_MODEL=gemini-2.5-flash
AI_TIMEOUT_SECONDS=20
```

Gemini 사용 중 시간 초과, 할당량, 네트워크 또는 구조화 응답 검증 오류가 발생하면 결정론적 provider로 대체하며, 응답에는 일반화된 warning code만 포함됩니다. 실제 키는 응답이나 로그에 포함하지 않으며 Git에도 커밋하면 안 됩니다.

`GET /api/v1/ready`는 선택된 provider 이름과 설정 완료 여부만 반환합니다. 사실 분석 결과는 Gemini를 사용하더라도 사용자 확인 전까지 후보 상태이며 법률 판단이나 행정 결정을 생성하지 않습니다.
