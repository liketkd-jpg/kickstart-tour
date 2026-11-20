# KICKSTART UP 원정

태권도 시범단 해외 원정용 웹 앱 — 일정·방문지 체크, 모임 공지와 확인 현황, 인원 점검.

- 지도자: 이메일 로그인(대회 접수 홈페이지 계정 그대로), 원정 만들기, 초대 번호·QR로 단원 초대
- 단원: 링크를 열고 초대 번호와 이름만 넣으면 참가 (로그인 필요 없음)
- 휴대폰 홈 화면에 설치해 앱처럼 쓸 수 있습니다

## 설정

1. 대회 접수용 Supabase 프로젝트 → SQL Editor에서 `supabase-setup.sql` 실행 (표 이름이 모두 `tour_`로 시작해 대회 자료와 섞이지 않음)
2. `config.js`에 Project URL과 공개용(publishable/anon) 키
3. GitHub 저장소 Settings → Pages → Branch `main` / `/ (root)` 저장
