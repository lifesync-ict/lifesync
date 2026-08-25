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

`FactAnalysisProvider` 프로토콜 뒤에 결정론적 Provider와 Gemini Provider를 선택해서 연결할 수 있습니다.

```dotenv
AI_PROVIDER=gemini
AI_API_KEY=your-key
AI_MODEL=gemini-2.5-flash
AI_TIMEOUT_SECONDS=20
```

`AI_PROVIDER=deterministic`이면 외부 네트워크를 사용하지 않습니다. Gemini 사용 중 timeout, quota, 네트워크 또는 구조화 응답 검증 오류가 발생하면 결정론적 Provider로 fallback하며 응답에는 일반화된 warning code만 포함됩니다. 실제 키는 응답이나 로그에 포함하지 않습니다.

`GET /api/v1/ready`는 선택된 Provider 이름과 설정 완료 여부만 반환하며 키 값은 반환하지 않습니다. 사실 분석 결과는 Gemini를 사용하더라도 사용자 확인 전 후보 상태이고, 법률 판단·공식 기한·행정 결정을 생성하지 않습니다.
