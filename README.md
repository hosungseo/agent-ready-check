# agent-ready-check

isitagentready.com의 한국어 복제 스캐너 + 정부 사이트 비교 랭킹 보드.

**🌐 Live: https://agent-ready-check.vercel.app**

Next.js 서버사이드 라우트로 대상 사이트에 요청을 보내 CORS 제약 없이 **19개 표준**을 점검합니다.

## 실행

```bash
pnpm install
pnpm dev      # http://localhost:3030
pnpm rank     # 30개 정부·해외 사이트 스캔 → public/data/rankings.json
pnpm build
```

## 페이지

- `/` — 단일 사이트 스캔. `?url=<target>` 딥링크·링크 복사 지원.
- `/compare` — 최대 8개 사이트를 병렬 스캔해 비교 테이블. 프리셋 3종 제공.
- `/rankings` — 중앙부처 20 + 공공포털 4 + 광역단체 3 + 해외정부 3 = 30개 정적 랭킹. GitHub Actions 주 1회 자동 갱신.

## API

- `GET /api/scan?url=<target>` → `ScanReport` JSON
- `POST /api/compare` `{ "urls": [...] }` → `{ reports: [...] }` (최대 8)
- `GET /og?url=<target>` → 1200×630 PNG (소셜 공유 이미지)

## 점검 항목 (19종 / 143점)

| 카테고리 | 체크 | 배점 |
|---|---|---|
| 검색 가능성 (25) | robots.txt / Sitemap 선언 / sitemap.xml | 10·5·10 |
| 콘텐츠 접근성 (51) | llms.txt / llms-full.txt / 마크다운 협상 / JSON-LD (파싱 유효성) / hreflang / OpenGraph / RSS·Atom | 15·5·10·7·4·5·5 |
| 봇 접근 제어 (15) | AI 봇 규칙(11종 감지) / ai.txt | 10·5 |
| 프로토콜 발견 (38) | mcp.json / ai-plugin.json / OpenAPI / security.txt / API 힌트 | 15·5·8·5·5 |
| 상거래·기타 (14) | x402 힌트 / humans.txt / favicon / manifest.json·webmanifest | 5·3·2·4 |

등급: A(85%+) / B(70%+) / C(55%+) / D(40%+) / F.

## 초기 벤치마크 (2026-04-25)

**중앙부처 상위**
| 순위 | 등급 | 점수 | 사이트 |
|---|---|---|---|
| 1 | C | 89/143 | 기획재정부 |
| 2 | C | 84/143 | 대통령실 |
| 3 | C | 79/143 | 중소벤처기업부 |
| 4 | D | 77/143 | 농림축산식품부 |

**참고: 행정안전부 F 12/143** — 기본 robots/sitemap 밖에 통과 못 함.

**전체 최고점**
- 서울특별시 C 90/143

**해외정부**
- usa.gov F 43/143, gov.uk F 42/143, digital.gov F 36/143 — 국내 중앙부처 상위권과 비슷하거나 오히려 낮음

## 자동화

`.github/workflows/rank.yml`이 매주 월요일 00:00 UTC(KST 09:00)에 `pnpm rank`를 실행해 `public/data/rankings.json`을 자동 갱신 커밋.

## 배포

- **Vercel**: `vercel --prod` (현재 호스팅)
- API route가 Node fetch 사용 → Vercel Serverless Functions로 자동 분배
- GitHub Pages는 불가 (정적만 지원)
