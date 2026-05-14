# Palmon Tool — Web Edition

데스크톱 PyQt 앱과 동일한 로직을 그대로 JavaScript 로 옮긴 **정적 웹사이트** 입니다. 서버 없이 GitHub Pages / Vercel / Netlify 같은 무료 호스팅에 올릴 수 있어요.

## 폴더 구성

```
palmon_tool_web/
  index.html       메인 페이지 (모든 탭 포함)
  style.css        다크 테마 CSS
  app.js           UI + 계산 로직 전체
  palmonDB.json    게임 데이터 (건물 cost/time, 버프, 상자, 가속권)
  README.md        이 파일
```

## 로컬에서 미리보기

브라우저가 `file://` 로 JSON 을 읽지 못해서 곧장 `index.html` 을 더블클릭하면 안 됩니다. 폴더에서 다음 명령으로 임시 서버를 띄워주세요:

```bash
# macOS / Linux
python3 -m http.server 8080

# 그 다음 브라우저에서
# http://localhost:8080
```

## GitHub Pages 에 배포하기 (5분)

### 1) GitHub 저장소 만들기

1. https://github.com/new
2. Repository name 에 `palmon-tool` (또는 원하는 이름) 입력
3. **Public** 선택 (Pages 는 Pro 없이는 public 필수)
4. **Add a README file** 체크 (선택)
5. `Create repository`

### 2) 파일 업로드

가장 간단한 방법은 GitHub 웹사이트에서 드래그앤드롭:

1. 만든 저장소 페이지에서 **Add file → Upload files**
2. `palmon_tool_web/` 안의 **파일들을 (폴더가 아니라) 전부** 끌어다 놓기
   - `index.html`, `style.css`, `app.js`, `palmonDB.json`
3. 페이지 아래에 `Commit changes` 클릭

### 3) Pages 활성화

1. 저장소 페이지에서 **Settings** 탭
2. 왼쪽 사이드바 **Pages**
3. *Source* 항목에서:
   - Branch: `main` (또는 `master`)
   - Folder: `/ (root)`
4. **Save**
5. 1~2분 후 페이지 위쪽에 사이트 URL 이 표시됩니다.
   예: `https://yourname.github.io/palmon-tool/`

이제 그 URL 을 누구한테든 공유하면 끝.

### (선택) 커스텀 도메인 연결

도메인이 있다면:
1. 저장소의 **Settings → Pages → Custom domain** 에 도메인 입력
2. 도메인 등록업체의 DNS 에서 다음 CNAME 추가
   ```
   yourdomain.com → yourname.github.io
   ```

## Vercel / Netlify 에 올리기 (선택)

GitHub Pages 대신 더 빠른 호스팅:

- **Vercel**: https://vercel.com → "New Project" → GitHub repo 선택 → Deploy
- **Netlify**: https://app.netlify.com → 폴더를 끌어서 업로드만 하면 끝

둘 다 무료에 자동 SSL 까지 켜집니다.

## 기능

데스크톱 버전과 동일합니다:

- **레벨 / 버프** — 5개 건물 현재 레벨, VIP / 연구 / 길드 / 시즌1 / 직위 / 관리자 / 결제 / LV6 점령 / 작업파견 가속, 자원 감소 버프
- **보유 자원 / 상자 / 가속권** — 골드/목재/강철 + SR/SSR/UR 상자 + 5종 가속권
- **걸작 구슬** — 보유량 → 완성 가능 무기 수
- **팰몬 진화** — 승급 정수 + 진화 정수 (초기화 환급 포함) → 완성 가능 인원
- **팰몬 XP / 자원 합산** — 자원별 상자 보유량 → 캠프 레벨별 합산 + LV30 비교
- **결과** — 위 모두 종합. 카드형 다크 UI.

상단 [설정 저장] 버튼은 다운로드 + 브라우저 localStorage 에도 저장합니다. 같은 브라우저에서 다시 열면 자동 복원됩니다. 다른 기기에서 쓰려면 다운로드된 JSON 을 [설정 불러오기] 로 올리면 됩니다.

## 데이터 업데이트

게임 패치로 건물 cost/time 이 바뀌면 `palmonDB.json` 만 새것으로 교체하면 됩니다. 코드를 건드릴 필요 없어요.

## 문제 해결

- **브라우저에서 로컬 파일로 열었더니 빈 화면** → CORS 때문입니다. 위의 "로컬에서 미리보기" 섹션 참고 (`python3 -m http.server`).
- **GitHub Pages URL 이 404** → Pages 활성화 후 1~2분 기다리세요. Branch 설정도 다시 확인.
- **계산 결과가 데스크톱 버전과 다름** → `palmonDB.json` 파일 버전이 다를 수 있습니다. 데스크톱 폴더의 같은 파일을 복사해서 덮어쓰기.
