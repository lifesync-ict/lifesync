# LifeSync

외국인 근로자가 사업장 변경과 관련된 상황을 쉬운 언어로 정리하고, 확인해야 할 사실·다음 행동·문의 기관을 단계별로 준비할 수 있도록 돕는 다국어 행정 지원 서비스입니다.

## 주요 흐름

1. 사용자가 현재 상황을 자연어로 입력합니다.
2. 문장에서 사실 후보를 추출하고 부족한 정보만 추가로 확인합니다.
3. 확인한 사실을 바탕으로 해야 할 일과 준비 서류를 정리합니다.
4. 문의할 기관 후보와 기관에 물어볼 질문을 안내합니다.
5. 선택한 내용을 일반 텍스트로 복사하거나 PDF로 저장합니다.

## 주요 기능

- 한국어, 영어, 베트남어, 네팔어 지원
- 언어별 날짜 입력 순서와 문구 제공
- 결정론적 분석 또는 Gemini 기반 사실 후보 분석
- 사용자 확인 전에는 분석 결과를 후보 상태로 유지
- E-9 제조업 합성 프로필을 이용한 사업장 변경 시연 흐름
- 해야 할 일, 필요 서류, 기관 문의 질문 정리
- 기관 인계용 요약의 텍스트 복사 및 PDF 저장
- 현재 세션만 초기화하고 선택 언어는 유지
- 이름, 외국인등록번호, 전화번호 없이 이용하는 흐름

## 서비스 범위

현재 버전은 공모전 시연용 MVP입니다. 법률 판단, 행정 결정, 공식 기한 계산, 실제 민원 접수·전송·예약을 수행하지 않습니다. 표시되는 절차와 기관 정보는 실제 이용 전에 각 기관의 공식 채널에서 다시 확인해야 합니다.

## 기술 스택

- Frontend: React 19, TypeScript, Vite, React Router
- Backend: FastAPI, Pydantic, Uvicorn
- AI provider: Deterministic provider(기본값), Google Gemini(선택)
- Test: Node test runner, ESLint, Pytest

## 프로젝트 구조

```text
lifesync/
├── frontend/             # React 웹 애플리케이션
│   ├── src/pages/        # 상황 입력, 사실 확인, 행동 안내, 기관 인계
│   ├── src/features/     # 단계별 상태·번역·출력 로직
│   └── tests/            # 프론트 핵심 정책 테스트
├── backend/              # FastAPI 애플리케이션
│   ├── app/api/          # API 라우트
│   ├── app/services/     # 사실 분석, 규칙 평가, 기관 인계
│   ├── app/data/         # 시연 규칙과 기관 데이터
│   └── tests/            # API와 서비스 테스트
└── railway.json          # Railway 백엔드 배포 설정
```

## 로컬 실행

### 1. 백엔드

Python 3.11 이상을 권장합니다.

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
cp .env.example .env
python -m uvicorn app.main:app --reload --port 8002
```

- API: <http://127.0.0.1:8002>
- Swagger UI: <http://127.0.0.1:8002/docs>

### 2. 프론트엔드

새 터미널에서 실행합니다.

```bash
cd frontend
npm ci
npm run dev
```

브라우저에서 <http://localhost:5173>으로 접속합니다. `frontend/.env`의 `VITE_API_BASE_URL`과 백엔드 포트가 같아야 합니다.

## 환경 변수

기본 설정은 외부 네트워크가 필요 없는 결정론적 분석을 사용합니다.

```dotenv
AI_PROVIDER=deterministic
AI_API_KEY=
AI_MODEL=
AI_TIMEOUT_SECONDS=20
```

Gemini를 사용하려면 `backend/.env`를 다음과 같이 설정합니다. API 키가 없는 경우 기본 결정론적 설정을 유지하면 됩니다.

```dotenv
AI_PROVIDER=gemini
AI_API_KEY=your-key
AI_MODEL=gemini-2.5-flash
AI_TIMEOUT_SECONDS=20
```

Gemini 요청이 시간 초과, 할당량, 네트워크 또는 응답 검증 오류로 실패하면 결정론적 provider로 대체됩니다. 실제 API 키는 Git에 커밋하지 마세요.

## 테스트 및 검증

프론트엔드:

```bash
cd frontend
npm run lint
npm test
npm run build
```

백엔드:

```bash
cd backend
source .venv/bin/activate
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

세부 요청·응답 형식은 백엔드 실행 후 Swagger UI에서 확인할 수 있습니다.
