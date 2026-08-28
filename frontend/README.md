# LifeSync Frontend

LifeSync의 사용자 화면을 담당하는 React + TypeScript 애플리케이션입니다.

## 화면 흐름

- `/`: 언어 선택과 서비스 시작
- `/situation`: 상황 입력
- `/confirm`: 사실 후보와 추가 질문 확인
- `/actions`: 해야 할 일과 준비 서류 확인
- `/handoff`: 기관 후보와 인계 요약 확인·복사·PDF 저장

## 실행

```bash
npm ci
npm run dev
```

기본 접속 주소는 <http://localhost:5173>입니다.

백엔드 주소는 `.env`에서 설정합니다.

```dotenv
VITE_API_BASE_URL=http://127.0.0.1:8002
```

## 명령어

```bash
npm run dev      # 개발 서버
npm run lint     # ESLint 검사
npm test         # 핵심 정책 테스트
npm run build    # TypeScript 검사와 프로덕션 빌드
npm run preview  # 빌드 결과 미리보기
```

## 구현 참고

- 지원 언어: 한국어, 영어, 베트남어, 네팔어
- 브라우저 저장소에는 현재 단계의 입력·확인 상태와 선택 언어가 저장됩니다.
- 날짜 입력은 언어에 따라 순서를 바꾸지만 API에는 `YYYY-MM-DD` 형식으로 전달합니다.
- PDF 생성 기능은 필요할 때 `html2pdf.js`를 지연 로드합니다.
- 기관 인계 화면은 실제 전송·접수 기능이 아닌 문의 준비용입니다.
