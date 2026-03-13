# 핵심광물 수입 현황 대시보드 — 개발 참고 문서

> 버전: v3 | 기준일: 2026-03-14 | 파일: `public/index.html` (6,500+ lines), `api/trade.js`

---

## 1. 서비스 개요

**목적**: 한국의 핵심광물(61종) 수입·수출 현황을 관세청 무역통계 API로 실시간 시각화
**사용자**: 광물 공급망 분석, 리스크 모니터링, 정책 참고용

### 탭 구성
| 탭 | 기능 |
|----|------|
| 📊 현황 개요 | 전체 광물 수입액 카드 뷰 + 연도 선택 |
| ⛏️ 광종별 조회 | 광물 클릭 → 연도별 트렌드, 국가별 비중 차트 |
| 🔢 HS코드별 조회 | HS 코드 직접 입력·선택 → 무역 데이터 |
| 🗺️ 수입지도 | 세계지도에 수입국 시각화 |
| 🔗 밸류체인 | 산업별 공급망 흐름 (반도체·EV배터리·선박·OLED 등) |
| 📋 HS매핑 | 헤더 버튼 → 모달 팝업 (밸류체인+광물DB 전체 HS 매핑) |

---

## 2. 기술 스택

```
- 프레임워크: 없음 (Vanilla JS, 단일 HTML)
- 차트: Chart.js (CDN)
- 지도: D3.js + TopoJSON (CDN)
- 배포: Vercel (정적 사이트 + Serverless Functions)
- API 프록시: /api/trade.js (Vercel Serverless)
- 외부 API: 공공데이터포털 관세청 무역통계
  endpoint: apis.data.go.kr/1220000/nitemtrade/getNitemtradeList
- 폰트: Google Fonts (Noto Sans KR, JetBrains Mono)
```

---

## 3. 파일 구조

```
/
├── public/
│   └── index.html          ← 모든 HTML·CSS·JS 포함 (단일 파일)
├── api/
│   └── trade.js            ← Vercel 서버리스 프록시 (CORS 해결 + XML→JSON)
├── vercel.json             ← 라우팅: /api/* → serverless, /* → public/
└── deploy.sh               ← git push 배포 스크립트
```

### index.html 내부 구조 (섹션별)
```
[1] CSS 변수 & 전역 스타일
[2] Header (제목, 기준연도, CSV 버튼, HS매핑 버튼)
[3] Tab Nav (5개 탭 버튼)
[4] page0: 현황 개요
[5] page1: 광종별 조회
[6] page2: HS코드별 조회
[7] page3: 수입지도
[8] page4: 밸류체인
[9] HS매핑 모달 (페이지 아님, position:fixed 오버레이)
[10] Footer
[11] <script> 블록들 (순서대로):
     - MINERALS 데이터 (61종 정의)
     - INDUSTRY_CHAINS 데이터 (5개 산업 체인)
     - MINERAL_META.js 상수들
     - 현황 개요 로직
     - 광종별 조회 로직
     - HS코드별 조회 로직
     - 수입지도 로직 (D3 + TopoJSON)
     - 밸류체인 렌더링 로직
     - API 호출 (callTradeApi)
     - HS매핑 모달 로직
```

---

## 4. 핵심 데이터 구조

### 4-1. MINERALS 배열 (광물 DB)
```js
{
  ko: '리튬',          // 한국어 이름 (PK - 전 시스템에서 키로 사용)
  en: 'Lithium',
  sym: 'Li',           // 원소기호
  cat: 'battery',      // 분류 (battery/semiconductor/display/etc)
  priority: 'S',       // S=전략필수, A=중요, B=모니터링, C=일반
  risk: 'HIGH',        // 위험도
  hs: ['280525','280429'],     // HS 코드 배열 (HS 2022 기준)
  hsName: ['수산화리튬','탄산리튬'],
  desc: '양극재 Li 원료',
}
```

### 4-2. INDUSTRY_CHAINS 객체 (밸류체인)
```js
{
  semiconductor: {
    label: '반도체 (Semiconductor)', icon: '💾',
    insight: '...',   // 인사이트 텍스트
    stages: [
      {
        label: '기초 원소',        // 단계 이름
        color: '#4A148C',          // 단계 헤더 색상
        nodes: [
          // 광물 참조 노드 (ko로 MINERALS 연결)
          { ko: '실리콘', role: '웨이퍼 기반', stageNote: '...' },

          // 직접 HS 노드 (ko: null)
          { ko: null, label: '반도체 웨이퍼', icon: '💿',
            hs: ['381800'],                    // HS 2022 현행 코드
            hsLegacy: ['280461'],              // HS 2017 이전 코드
            expMode: true,                     // true=수출, false=수입
            desc: '...' },
        ]
      },
    ],
    finalProduct: { label: '글로벌 테크 수요', icon: '🌐', desc: '...' },
  }
}
```

### 4-3. HS 코드 버전 관리
```js
// resolveHs(node, year) — 연도별 자동 코드 전환
// WCO 개정주기: HS2012 → HS2017(2017.1.1) → HS2022(2022.1.1)
function resolveHs(node, year) {
  if (parseInt(year) < 2022 && node.hsLegacy?.length) return node.hsLegacy;
  return node.hs || [];
}

// 주요 변경 코드:
// 851712 (전체 휴대폰, HS2017) → 851713(스마트폰) + 851714(기타, HS2022)
// 870390 (기타 승용차) → 870370/870360(BEV), 870340/870350(HEV, HS2022)
// 901380 (기타 광학장치) → 852412(OLED 패널, HS2022 신설)
```

---

## 5. API 연동

### 관세청 API 파라미터
```
strtYymm: 시작월 (YYYYMM)
endYymm:  종료월 (YYYYMM)
hsSgn:    HS 코드 (2~10자리)
cntyCd:   국가 코드 (alpha-2, ex: CN)
impExpDivCd: IMP(수입) / EXP(수출)
```

### 응답 구조 (trade.js 정규화 후)
```js
{
  response: {
    body: {
      items: { item: [...] },  // 국가별 합산 (기본)
      detail: [...],            // 월별 × 국가별 raw 행
    }
  }
}
// 각 item 필드:
// cntyCd: ISO-3 국가코드 (CHN, JPN, ...)
// cntyNm: 국가명 (한국어, 관세청 제공)
// impAmt: 수입금액 (천 달러 단위)
// expAmt: 수출금액
// impWgt: 수입중량 (kg)
```

### callTradeApi 호출 패턴
```js
// 기본 (국가별 합산, 연간)
callTradeApi({ hsCd: '280525', period: '2024' })

// 수출 데이터
callTradeApi({ hsCd: '854232', period: '2024', impExpDivCd: 'EXP' })

// 상세 행 (월별)
callTradeApi({ hsCd: '280525', strtYr: '2020', endYr: '2024' }, { detail: true })
```

---

## 6. 주의사항 (Important Caveats)

### HS 코드
- **반드시** 실제 관세청 품목분류표 기준으로 검증
- 6자리 코드 기준 (관세청 API는 6자리로 조회)
- 잘못된 코드 예시: 854234(비존재), 870380(구분류)
- HS 2022 이후 신설 코드는 과거 데이터가 없음 → `hsLegacy` 필수

### API 제한
- Rate limit: 60 req/min per IP (trade.js 서버사이드)
- Vercel serverless cold start: 첫 요청 1~3초 지연
- 관세청 API timeout: 15초 설정 (느릴 때 있음)
- 데이터 최신: 보통 2개월 전까지 제공 (ex: 3월에 조회하면 1월까지)

### 파일 크기
- index.html 6,500+ lines → 너무 크면 편집 어려움
- 새 기능 추가 시 기존 패턴 재사용 우선
- 새 산업 체인은 INDUSTRY_CHAINS에 객체 추가만으로 탭 자동 생성

### 밸류체인 노드 타입 구분
```
node.ko 있음 + node.hs 없음  → 광물 참조 노드 (MINERALS에서 HS 조회)
node.ko 없음 + node.hs 있음  → 직접 HS 노드 (완성품/소재)
node.ko 없음 + node.hs 없음  → 표시 전용 (finalProduct 등)
```

### 차트 중복 인스턴스
```js
// 차트 재렌더링 전 반드시 파괴
if (window._someChart) { window._someChart.destroy(); }
window._someChart = new Chart(ctx, config);
```

---

## 7. AI 작업 프롬프트 템플릿

### 신규 기능 추가 시
```
이 프로젝트는 단일 HTML 파일(public/index.html, 6500줄+)로 구성된
한국 핵심광물 수입 현황 대시보드입니다.

기술스택: Vanilla JS, Chart.js, D3.js, Vercel Serverless API
API: 관세청 무역통계 (/api/trade.js 프록시)
주요 데이터: MINERALS 배열(61종), INDUSTRY_CHAINS 객체(5개 산업)

[원하는 기능을 구체적으로 설명]

주의사항:
- HS 코드는 HS 2022 기준, 이전 코드는 hsLegacy 필드 사용
- 추가 API 호출은 최소화 (기존 callTradeApi 재사용)
- 새 탭 불필요 시 모달/패널 방식 선호
```

### 버그 수정 시
```
핵심광물 대시보드 public/index.html에서 다음 문제가 있습니다:
[문제 설명]

관련 함수: [함수명]
재현 방법: [단계]
예상 동작: [기대값]
실제 동작: [현상]
```

### HS 코드 검증 요청 시
```
다음 HS 코드들이 올바른지 검토해주세요.
기준: HS 2022 (6자리), 관세청 품목분류표
[코드 목록과 품목명]
```

---

## 8. 배포

```bash
# Vercel 자동 배포 (git push main 시 트리거)
git add -A && git commit -m "..." && git push

# 환경변수 (Vercel 대시보드 설정 필수)
DATA_GO_KR_API_KEY=<공공데이터포털 발급 키>
```

---

## 9. 향후 개선 고려 사항

- [ ] 파일 분리 (MINERALS 데이터를 별도 JS로)
- [ ] 서비스워커 캐싱 (API 응답 캐시로 속도 개선)
- [ ] 모바일 반응형 강화 (밸류체인 가로 스크롤)
- [ ] 양극재 HS 코드 재검토 (282590 → 검증 필요)
- [ ] HS 2027 개정 대비 (다음 WCO 개정 예정)
