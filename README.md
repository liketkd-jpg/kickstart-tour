# KICKSTART UP 원정

태권도 시범단 해외 원정용 웹 앱 — 일정·방문지 체크, 모임 공지와 확인 현황, 인원 점검.

- 지도자: 이메일 로그인(대회 접수 홈페이지 계정 그대로), 원정 만들기, 초대 번호·QR로 단원 초대
- 단원: 링크를 열고 초대 번호와 이름만 넣으면 참가 (로그인 필요 없음)
- 휴대폰 홈 화면에 설치해 앱처럼 쓸 수 있습니다

## 설정

1. 대회 접수용 Supabase 프로젝트 → SQL Editor에서 `supabase-setup.sql` 실행 (표 이름이 모두 `tour_`로 시작해 대회 자료와 섞이지 않음)
2. `config.js`에 Project URL과 공개용(publishable/anon) 키
3. GitHub 저장소 Settings → Pages → Branch `main` / `/ (root)` 저장

## AI 해설 자동 만들기 (구글 제미나이, 무료 사용량 안)

1. https://aistudio.google.com/apikey 에서 구글 계정으로 들어가 **Create API key** → 열쇠 복사
2. Supabase → Edge Functions → Secrets 에 `GEMINI_API_KEY` = 복사한 열쇠
3. Supabase → Edge Functions → Deploy a new function → Via Editor → 이름 `tour-guide-ai`, 내용은 `supabase/functions/tour-guide-ai/index.ts`
4. 앱 → 가이드 → 해설 만들기 → 구글 지도 링크 붙여 넣기 → 「AI 해설 만들기」
