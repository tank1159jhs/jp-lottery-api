# JP Lottery API

일본 복권 당첨번호 자동 크롤링 및 배포 시스템 (Loto6, Loto7, Mini Loto, Bingo5 등)

## 🎯 기능

- ✅ 매주 자동 크롤링 (GitHub Actions)
- ✅ GitHub Pages로 무료 배포
- ✅ JSON API 형식으로 제공
- ✅ 완전 무료 운영
- ✅ 다중 복권 타입 지원

## 📡 API 엔드포인트

### Loto6 (ロト6)
```
https://YOUR-USERNAME.github.io/jp-lottery-api/data/loto6/latest.json  # 최신 회차
https://YOUR-USERNAME.github.io/jp-lottery-api/data/loto6/2060.json    # 특정 회차
https://YOUR-USERNAME.github.io/jp-lottery-api/data/loto6/all.json     # 전체 목록
```

### Loto7 (ロト7) - Coming Soon
```
https://YOUR-USERNAME.github.io/jp-lottery-api/data/loto7/latest.json
```

### Mini Loto (ミニロト) - Coming Soon
```
https://YOUR-USERNAME.github.io/jp-lottery-api/data/miniloto/latest.json
```

## 📄 JSON 형식

```json
{
  "type": "loto6",
  "round": 2060,
  "date": "2025-12-15",
  "numbers": [2, 8, 22, 28, 32, 39],
  "bonus": 15
}
```

## 🚀 설정 방법

### 1. GitHub 리포지토리 생성
```bash
# 로컬에서
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/loto6-backend.git
git push -u origin main
```

### 2. GitHub Pages 활성화
1. 리포지토리 → Settings → Pages
2. Source: **Deploy from a branch**
3. Branch: **main** / **/root**
4. Save

### 3. 테스트
```bash
npm install
npm run crawl
```

## ⏰ 크롤링 스케줄

- 매주 **월요일** 21:30 JST (추첨 직후)
- 매주 **목요일** 21:30 JST (추첨 직후)
- 수동 실행: GitHub Actions 탭에서 "Run workflow"

## 📱 Flutter 앱 연동

```dart
// lib/data/winning_info_repository.dart
final url = 'https://YOUR-USERNAME.github.io/loto6-backend/data/$round.json';
final response = await http.get(Uri.parse(url));
```

## 🔧 문제 해결

### 크롤링 실패 시
- みずほ銀行 웹사이트 구조 변경 가능성
- `crawl.js`의 CSS 셀렉터 수정 필요
- 실패 시 더미 데이터 자동 생성

### GitHub Actions 실행 안 될 때
- Settings → Actions → General → Workflow permissions
- **Read and write permissions** 선택

## 📝 라이선스

MIT License

## ⚠️ 주의사항

본 크롤러는 교육 목적으로만 사용하세요. 
실제 서비스에 사용 시 저작권 및 이용약관을 확인하세요.
