/**
 * KOMIR 핵심광물 메타데이터 v2
 * 한국 33대 핵심광물 + 희토류 12개 개별원소 세분화
 * 최종수정: 2026-03
 *
 * 변경사항 (v1 → v2):
 *  - 희토류(REE) → LREE 6종 + HREE 6종 개별원소로 세분화
 *  - 니오브 → 니오븀 (Niobium) 표기 수정
 *  - 플루오르석 → 플루오라이트 (Fluorspar) 표기 수정
 *  - 미국 기준 60종 메타데이터 추가 (US_MINERAL_META)
 *
 * 사용법:
 *   const meta = MINERAL_META["neodymium"];
 *   meta.hsCodes      // ["2805","2846"]
 *   meta.industries   // ["NdFeB 영구자석","전기차 구동모터",...]
 *   meta.riskLevel    // "매우높음"
 */

// ─────────────────────────────────────────────────────────────
// 1. 한국 기준 핵심광물 메타데이터
//    key: 광물 ID (영문 camelCase)
// ─────────────────────────────────────────────────────────────
const MINERAL_META = {

  /* ── 배터리 소재 ── */
  lithium: {
    nameKr: "리튬", nameEn: "Lithium", symbol: "Li",
    group: "배터리 소재",
    hsCodes: ["2530", "2836", "2825", "2804"],
    hsLabels: { "2530": "리튬광(스포듀민)", "2836": "탄산리튬", "2825": "수산화리튬", "2804": "염화리튬" },
    industries: ["이차전지", "전기차(EV)", "ESS", "LFP배터리"],
    riskLevel: "매우높음",
    color: "1565C0", icon: "🔋",
    korea33: true, usgsFlag: true
  },
  nickel: {
    nameKr: "니켈", nameEn: "Nickel", symbol: "Ni",
    group: "배터리 소재",
    hsCodes: ["2604", "7501", "7502", "3824"],
    hsLabels: { "2604": "니켈광", "7501": "니켈마트/스피스", "7502": "정제니켈", "3824": "황산니켈" },
    industries: ["이차전지 양극재", "전기차(EV)", "스테인리스강", "도금"],
    riskLevel: "높음",
    color: "1976D2", icon: "🔋",
    korea33: true, usgsFlag: true
  },
  cobalt: {
    nameKr: "코발트", nameEn: "Cobalt", symbol: "Co",
    group: "배터리 소재",
    hsCodes: ["2605", "8105"],
    hsLabels: { "2605": "코발트광", "8105": "코발트·제품" },
    industries: ["이차전지 양극재(NCM·NCA)", "전기차(EV)", "초내열합금"],
    riskLevel: "매우높음",
    color: "0D47A1", icon: "🔋",
    korea33: true, usgsFlag: true
  },
  manganese: {
    nameKr: "망간", nameEn: "Manganese", symbol: "Mn",
    group: "배터리 소재",
    hsCodes: ["2602", "2820", "7202"],
    hsLabels: { "2602": "망간광", "2820": "산화망간", "7202": "망간 합금철" },
    industries: ["이차전지 양극재(LMO·LNMO)", "철강", "건전지"],
    riskLevel: "중간",
    color: "1A237E", icon: "🔋",
    korea33: true, usgsFlag: true
  },
  graphite: {
    nameKr: "흑연", nameEn: "Graphite", symbol: "C",
    group: "배터리 소재",
    hsCodes: ["2504", "3801"],
    hsLabels: { "2504": "천연흑연", "3801": "인조흑연" },
    industries: ["이차전지 음극재", "전기차(EV)", "연료전지"],
    riskLevel: "매우높음",
    color: "263238", icon: "🔋",
    korea33: true, usgsFlag: true,
    exportRestriction: "중국 2023년 12월 수출허가제 시행"
  },

  /* ── 희토류-경(LREE) ── */
  neodymium: {
    nameKr: "네오디뮴", nameEn: "Neodymium", symbol: "Nd",
    group: "희토류-경(LREE)",
    hsCodes: ["2805", "2846"],
    hsLabels: { "2805": "희토류 금속(Nd)", "2846": "희토류 화합물(NdFeB용)" },
    industries: ["NdFeB 영구자석", "전기차 구동모터", "풍력발전기", "산업용 모터"],
    riskLevel: "매우높음",
    color: "6A1B9A", icon: "🧲",
    korea33: true, usgsFlag: true,
    keyUse: "NdFeB 영구자석 핵심 원소 (Nd₂Fe₁₄B)"
  },
  praseodymium: {
    nameKr: "프라세오디뮴", nameEn: "Praseodymium", symbol: "Pr",
    group: "희토류-경(LREE)",
    hsCodes: ["2805", "2846"],
    hsLabels: { "2805": "희토류 금속(Pr)", "2846": "희토류 화합물" },
    industries: ["NdFeB 영구자석(Pr-Nd 혼합)", "세라믹 안료", "특수유리"],
    riskLevel: "높음",
    color: "7B1FA2", icon: "🧲",
    korea33: true, usgsFlag: true,
    keyUse: "Nd와 혼합사용(PrNd) — 고온 보자력 향상"
  },
  lanthanum: {
    nameKr: "란타넘", nameEn: "Lanthanum", symbol: "La",
    group: "희토류-경(LREE)",
    hsCodes: ["2805", "2846"],
    hsLabels: { "2805": "희토류 금속(La)", "2846": "란타넘 화합물" },
    industries: ["NiMH 배터리", "FCC 촉매", "광학유리"],
    riskLevel: "중간",
    color: "8E24AA", icon: "🔬",
    korea33: true, usgsFlag: false
  },
  cerium: {
    nameKr: "세륨", nameEn: "Cerium", symbol: "Ce",
    group: "희토류-경(LREE)",
    hsCodes: ["2805", "2846"],
    hsLabels: { "2805": "희토류 금속(Ce)", "2846": "세륨 화합물(2846.10)" },
    industries: ["연마재(산화세륨)", "자동차 촉매변환기", "형광체"],
    riskLevel: "중간",
    color: "9C27B0", icon: "✨",
    korea33: false, usgsFlag: false,
    note: "HS 2846.10은 세륨 화합물 전용 소호"
  },
  samarium: {
    nameKr: "사마륨", nameEn: "Samarium", symbol: "Sm",
    group: "희토류-경(LREE)",
    hsCodes: ["2805", "2846"],
    hsLabels: { "2805": "희토류 금속(Sm)", "2846": "희토류 화합물" },
    industries: ["SmCo 영구자석(고온용)", "방사선 치료", "군사용 유도무기"],
    riskLevel: "높음",
    color: "AB47BC", icon: "🧲",
    korea33: false, usgsFlag: false,
    keyUse: "SmCo5 / Sm₂Co₁₇ 고온 영구자석 — 항공우주·방산 특화"
  },
  europium: {
    nameKr: "유로퓸", nameEn: "Europium", symbol: "Eu",
    group: "희토류-경(LREE)",
    hsCodes: ["2805", "2846"],
    hsLabels: { "2805": "희토류 금속(Eu)", "2846": "희토류 화합물" },
    industries: ["형광체(적색/청색)", "OLED·LED", "위조방지 형광"],
    riskLevel: "중간",
    color: "BA68C8", icon: "💡",
    korea33: false, usgsFlag: false
  },

  /* ── 희토류-중(HREE) ── */
  dysprosium: {
    nameKr: "디스프로슘", nameEn: "Dysprosium", symbol: "Dy",
    group: "희토류-중(HREE)",
    hsCodes: ["2805", "2846"],
    hsLabels: { "2805": "희토류 금속(Dy)", "2846": "희토류 화합물" },
    industries: ["NdFeB 고온안정화 첨가제", "전기차 구동모터", "풍력발전기"],
    riskLevel: "매우높음",
    color: "4527A0", icon: "⚡",
    korea33: true, usgsFlag: true,
    keyUse: "Nd2Fe14B에 2~4% 첨가 → 고온 보자력 유지"
  },
  terbium: {
    nameKr: "테르븀", nameEn: "Terbium", symbol: "Tb",
    group: "희토류-중(HREE)",
    hsCodes: ["2805", "2846"],
    hsLabels: { "2805": "희토류 금속(Tb)", "2846": "희토류 화합물" },
    industries: ["NdFeB 영구자석(Dy 대체)", "녹색 형광체", "자기변형소자"],
    riskLevel: "매우높음",
    color: "512DA8", icon: "⚡",
    korea33: true, usgsFlag: true
  },
  yttrium: {
    nameKr: "이트륨", nameEn: "Yttrium", symbol: "Y",
    group: "희토류-중(HREE)",
    hsCodes: ["2805", "2846"],
    hsLabels: { "2805": "이트륨 금속", "2846": "이트륨 화합물" },
    industries: ["YAG 레이저", "안정화 지르코니아(YSZ)", "적색 형광체", "고온 초전도체"],
    riskLevel: "높음",
    color: "5E35B1", icon: "🔴",
    korea33: true, usgsFlag: true
  },
  gadolinium: {
    nameKr: "가돌리늄", nameEn: "Gadolinium", symbol: "Gd",
    group: "희토류-중(HREE)",
    hsCodes: ["2805", "2846"],
    hsLabels: { "2805": "희토류 금속(Gd)", "2846": "희토류 화합물" },
    industries: ["MRI 조영제", "방사선 차폐재", "자기냉각 소재"],
    riskLevel: "중간",
    color: "673AB7", icon: "🏥",
    korea33: false, usgsFlag: false
  },
  erbium: {
    nameKr: "어븀", nameEn: "Erbium", symbol: "Er",
    group: "희토류-중(HREE)",
    hsCodes: ["2805", "2846"],
    hsLabels: { "2805": "희토류 금속(Er)", "2846": "희토류 화합물" },
    industries: ["광섬유 증폭기(EDFA)", "레이저(Er:YAG)", "핑크색 유리 착색"],
    riskLevel: "중간",
    color: "7986CB", icon: "📡",
    korea33: false, usgsFlag: false
  },
  scandium: {
    nameKr: "스칸듐", nameEn: "Scandium", symbol: "Sc",
    group: "희토류-중(HREE)",
    hsCodes: ["2805", "2846", "7616"],
    hsLabels: { "2805": "스칸듐 금속", "2846": "스칸듐 산화물", "7616": "Al-Sc 합금" },
    industries: ["Al-Sc 고강도 경량합금", "SOFC(고체산화물 연료전지)", "항공우주 구조재"],
    riskLevel: "높음",
    color: "3F51B5", icon: "✈️",
    korea33: false, usgsFlag: true
  },

  /* ── 방산·항공우주 ── */
  tungsten: {
    nameKr: "텅스텐", nameEn: "Tungsten", symbol: "W",
    group: "방산·항공우주",
    hsCodes: ["2611", "8101"],
    hsLabels: { "2611": "텅스텐광(회중석·흑중석)", "8101": "텅스텐 및 제품" },
    industries: ["절삭공구(초경합금)", "방산(관통자)", "조명(필라멘트)"],
    riskLevel: "높음",
    color: "E65100", icon: "⚔️",
    korea33: true, usgsFlag: true
  },
  molybdenum: {
    nameKr: "몰리브덴", nameEn: "Molybdenum", symbol: "Mo",
    group: "방산·항공우주",
    hsCodes: ["2613", "8102"],
    hsLabels: { "2613": "몰리브덴광", "8102": "몰리브덴 및 제품" },
    industries: ["고강도 특수강", "촉매(탈황)", "방산 장갑재"],
    riskLevel: "중간",
    color: "EF6C00", icon: "🏗️",
    korea33: true, usgsFlag: true
  },
  titanium: {
    nameKr: "티타늄", nameEn: "Titanium", symbol: "Ti",
    group: "방산·항공우주",
    hsCodes: ["2614", "8108"],
    hsLabels: { "2614": "티타늄광(루타일·일메나이트)", "8108": "티타늄 및 제품" },
    industries: ["항공기 기체", "방산 장갑판", "의료 임플란트", "화학 반응기"],
    riskLevel: "중간",
    color: "F57C00", icon: "✈️",
    korea33: true, usgsFlag: true
  },
  vanadium: {
    nameKr: "바나듐", nameEn: "Vanadium", symbol: "V",
    group: "방산·항공우주",
    hsCodes: ["2615", "8112"],
    hsLabels: { "2615": "바나듐광·티타늄광", "8112": "바나듐 및 제품" },
    industries: ["고강도 구조강", "VRFB(바나듐 레독스 흐름전지)", "항공우주 합금"],
    riskLevel: "중간",
    color: "FF8F00", icon: "⚡",
    korea33: true, usgsFlag: true
  },
  niobium: {
    nameKr: "니오븀", nameEn: "Niobium", symbol: "Nb",
    group: "방산·항공우주",
    hsCodes: ["2615", "8112"],
    hsLabels: { "2615": "콜럼바이트-탄탈라이트광", "8112": "니오븀·탄탈 및 제품" },
    industries: ["HSLA 철강(미세합금)", "초전도 자석(MRI·입자가속기)", "핵연료 피복관"],
    riskLevel: "높음",
    color: "FFA000", icon: "🏗️",
    korea33: true, usgsFlag: true
  },
  tantalum: {
    nameKr: "탄탈", nameEn: "Tantalum", symbol: "Ta",
    group: "방산·항공우주",
    hsCodes: ["2615", "8103"],
    hsLabels: { "2615": "콜럼바이트-탄탈라이트광", "8103": "탄탈 및 제품" },
    industries: ["전자기기 커패시터", "의료기기(임플란트)", "슈퍼합금(항공 터빈)"],
    riskLevel: "높음",
    color: "FFB300", icon: "💾",
    korea33: true, usgsFlag: true
  },

  /* ── 반도체·디스플레이 ── */
  indium: {
    nameKr: "인듐", nameEn: "Indium", symbol: "In",
    group: "반도체·디스플레이",
    hsCodes: ["8112"],
    hsLabels: { "8112": "인듐(ITO 타깃)" },
    industries: ["ITO 투명전극(OLED·LCD)", "박막 태양전지(CIGS)", "반도체 솔더"],
    riskLevel: "높음",
    color: "1B5E20", icon: "📱",
    korea33: true, usgsFlag: true
  },
  gallium: {
    nameKr: "갈륨", nameEn: "Gallium", symbol: "Ga",
    group: "반도체·디스플레이",
    hsCodes: ["2804", "8112"],
    hsLabels: { "2804": "갈륨 원소", "8112": "갈륨 화합물(GaAs·GaN)" },
    industries: ["GaAs/GaN 반도체", "5G RF 칩", "청색 LED", "태양전지"],
    riskLevel: "매우높음",
    color: "2E7D32", icon: "💻",
    korea33: true, usgsFlag: true,
    exportRestriction: "중국 2023년 8월 수출허가제 시행"
  },
  germanium: {
    nameKr: "게르마늄", nameEn: "Germanium", symbol: "Ge",
    group: "반도체·디스플레이",
    hsCodes: ["2804", "8112"],
    hsLabels: { "2804": "게르마늄 원소", "8112": "게르마늄 제품" },
    industries: ["광섬유(GeO₂)", "적외선 광학(야간투시)", "PV 태양전지(3접합)"],
    riskLevel: "매우높음",
    color: "388E3C", icon: "🔭",
    korea33: true, usgsFlag: true,
    exportRestriction: "중국 2023년 8월 수출허가제 시행"
  },
  antimony: {
    nameKr: "안티몬", nameEn: "Antimony", symbol: "Sb",
    group: "반도체·디스플레이",
    hsCodes: ["2617", "8110"],
    hsLabels: { "2617": "안티몬광", "8110": "안티몬 및 제품" },
    industries: ["반도체 도핑", "방염제(ATO)", "방산(납-안티몬 합금)"],
    riskLevel: "매우높음",
    color: "43A047", icon: "🔥",
    korea33: true, usgsFlag: true,
    exportRestriction: "중국 2024년 9월 수출허가제 시행"
  },
  tellurium: {
    nameKr: "텔루륨", nameEn: "Tellurium", symbol: "Te",
    group: "반도체·디스플레이",
    hsCodes: ["2804", "8112"],
    hsLabels: { "2804": "텔루륨 원소", "8112": "텔루륨 화합물(CdTe)" },
    industries: ["CdTe 박막 태양전지", "열전소자(BiTe)", "페이즈 체인지 메모리"],
    riskLevel: "높음",
    color: "4CAF50", icon: "☀️",
    korea33: true, usgsFlag: true
  },
  hafnium: {
    nameKr: "하프늄", nameEn: "Hafnium", symbol: "Hf",
    group: "반도체·디스플레이",
    hsCodes: ["2612", "8112"],
    hsLabels: { "2612": "지르코늄·하프늄광", "8112": "하프늄 및 제품" },
    industries: ["반도체 게이트 산화막(HfO₂)", "초내열 합금 코팅", "핵연료 제어봉"],
    riskLevel: "높음",
    color: "66BB6A", icon: "💻",
    korea33: true, usgsFlag: true
  },
  bismuth: {
    nameKr: "비스무트", nameEn: "Bismuth", symbol: "Bi",
    group: "반도체·디스플레이",
    hsCodes: ["2617", "8106"],
    hsLabels: { "2617": "비스무트광", "8106": "비스무트 및 제품" },
    industries: ["의약품(위장약 Bi₂O₃)", "무연납땜 합금", "열전소자"],
    riskLevel: "중간",
    color: "81C784", icon: "💊",
    korea33: false, usgsFlag: true
  },

  /* ── 에너지전환 ── */
  platinum: {
    nameKr: "백금(Pt)", nameEn: "Platinum", symbol: "Pt",
    group: "에너지전환",
    hsCodes: ["7110"],
    hsLabels: { "7110": "백금족 금속(PGM)" },
    industries: ["수소 연료전지(PEM 전극촉매)", "자동차 촉매변환기(가솔린)", "산업 촉매"],
    riskLevel: "높음",
    color: "880E4F", icon: "♻️",
    korea33: true, usgsFlag: true
  },
  palladium: {
    nameKr: "팔라듐(Pd)", nameEn: "Palladium", symbol: "Pd",
    group: "에너지전환",
    hsCodes: ["7110"],
    hsLabels: { "7110": "백금족 금속(Pd)" },
    industries: ["자동차 촉매변환기(디젤)", "전자부품(MLCC 전극)", "수소 정제막"],
    riskLevel: "높음",
    color: "AD1457", icon: "🚗",
    korea33: true, usgsFlag: false
  },
  rhodium: {
    nameKr: "로듐(Rh)", nameEn: "Rhodium", symbol: "Rh",
    group: "에너지전환",
    hsCodes: ["7110"],
    hsLabels: { "7110": "백금족 금속(Rh)" },
    industries: ["자동차 삼원촉매(Three-Way Catalyst)", "화학 공정 촉매"],
    riskLevel: "높음",
    color: "C2185B", icon: "🔵",
    korea33: false, usgsFlag: false
  },
  uranium: {
    nameKr: "우라늄", nameEn: "Uranium", symbol: "U",
    group: "에너지전환",
    hsCodes: ["2612", "2844"],
    hsLabels: { "2612": "우라늄광(우라니나이트)", "2844": "농축/천연 우라늄" },
    industries: ["원자력 발전 핵연료", "방사성 동위원소"],
    riskLevel: "높음",
    color: "D81B60", icon: "☢️",
    korea33: true, usgsFlag: false
  },
  fluorspar: {
    nameKr: "플루오라이트", nameEn: "Fluorspar", symbol: "CaF₂",
    group: "에너지전환",
    hsCodes: ["2529", "2826"],
    hsLabels: { "2529": "형석(플루오라이트) 원광", "2826": "불화수소산(HF)·불화물" },
    industries: ["불화수소(HF) 원료", "리튬이온배터리 전해질(LiPF₆)", "반도체 식각가스(NF₃·SF₆)"],
    riskLevel: "높음",
    color: "E91E63", icon: "⚗️",
    korea33: true, usgsFlag: true
  },

  /* ── 산업기반 ── */
  copper: {
    nameKr: "구리", nameEn: "Copper", symbol: "Cu",
    group: "산업기반",
    hsCodes: ["2603", "7401", "7402", "7403"],
    hsLabels: { "2603": "구리광", "7401": "조동", "7402": "정제동", "7403": "구리선" },
    industries: ["전력케이블", "전기차 권선", "건설·배관", "인쇄회로기판(PCB)"],
    riskLevel: "중간",
    color: "424242", icon: "🔌",
    korea33: true, usgsFlag: true
  },
  aluminium: {
    nameKr: "알루미늄", nameEn: "Aluminium", symbol: "Al",
    group: "산업기반",
    hsCodes: ["2606", "2818", "7601", "7602"],
    hsLabels: { "2606": "보크사이트", "2818": "알루미나(Al₂O₃)", "7601": "알루미늄 괴", "7602": "알루미늄 스크랩" },
    industries: ["전기차 경량화", "항공기 기체", "건설·포장재", "태양광 패널 프레임"],
    riskLevel: "낮음",
    color: "616161", icon: "🏗️",
    korea33: false, usgsFlag: true
  },
  zinc: {
    nameKr: "아연", nameEn: "Zinc", symbol: "Zn",
    group: "산업기반",
    hsCodes: ["2608", "7901", "7902"],
    hsLabels: { "2608": "아연광", "7901": "아연 괴", "7902": "아연 스크랩" },
    industries: ["도금강판(아연도금)", "브라스(황동)", "건전지 전극"],
    riskLevel: "낮음",
    color: "757575", icon: "🏗️",
    korea33: false, usgsFlag: true
  },
  lead: {
    nameKr: "납", nameEn: "Lead", symbol: "Pb",
    group: "산업기반",
    hsCodes: ["2607", "7801"],
    hsLabels: { "2607": "납광", "7801": "납 괴" },
    industries: ["납축전지(SLA)", "방사선 차폐", "납땜(솔더)"],
    riskLevel: "낮음",
    color: "9E9E9E", icon: "🔋",
    korea33: false, usgsFlag: false
  },
  tin: {
    nameKr: "주석", nameEn: "Tin", symbol: "Sn",
    group: "산업기반",
    hsCodes: ["2609", "8001", "8002"],
    hsLabels: { "2609": "주석광", "8001": "주석 괴", "8002": "주석 스크랩" },
    industries: ["무연솔더(전자부품)", "주석도금강판(식품캔)", "청동 합금"],
    riskLevel: "중간",
    color: "BDBDBD", icon: "🔧",
    korea33: true, usgsFlag: true
  },
  chromium: {
    nameKr: "크롬", nameEn: "Chromium", symbol: "Cr",
    group: "산업기반",
    hsCodes: ["2610", "2819", "7202"],
    hsLabels: { "2610": "크롬광(크로마이트)", "2819": "산화크롬", "7202": "페로크롬" },
    industries: ["스테인리스강(STS)", "표면도금(경질크롬)", "내화물"],
    riskLevel: "중간",
    color: "E0E0E0", icon: "🏗️",
    korea33: false, usgsFlag: true
  },
  magnesium: {
    nameKr: "마그네슘", nameEn: "Magnesium", symbol: "Mg",
    group: "산업기반",
    hsCodes: ["2519", "8104"],
    hsLabels: { "2519": "마그네사이트", "8104": "마그네슘 괴·분말" },
    industries: ["자동차 경량합금(Al-Mg)", "의료기기 생분해 임플란트", "철강 탈황제"],
    riskLevel: "높음",
    color: "F5F5F5", icon: "🏋️",
    korea33: true, usgsFlag: true
  },
  phosphate: {
    nameKr: "인광석", nameEn: "Phosphate Rock", symbol: "P",
    group: "산업기반",
    hsCodes: ["2510", "2835"],
    hsLabels: { "2510": "인산염광(아파타이트)", "2835": "인산 및 인산염" },
    industries: ["비료(인산암모늄·과린산석회)", "리튬이온 LFP 양극재(LiFePO₄)", "농업"],
    riskLevel: "중간",
    color: "EEEEEE", icon: "🌱",
    korea33: true, usgsFlag: true
  },
};

// ─────────────────────────────────────────────────────────────
// 2. 역방향 인덱스: 수요산업 → 광종 목록
// ─────────────────────────────────────────────────────────────
const INDUSTRY_TO_MINERALS = {};
Object.entries(MINERAL_META).forEach(([id, m]) => {
  m.industries.forEach(ind => {
    if (!INDUSTRY_TO_MINERALS[ind]) INDUSTRY_TO_MINERALS[ind] = [];
    INDUSTRY_TO_MINERALS[ind].push(id);
  });
});

// ─────────────────────────────────────────────────────────────
// 3. 공급리스크별 광종 분류
// ─────────────────────────────────────────────────────────────
const RISK_MINERALS = {
  "매우높음": Object.entries(MINERAL_META).filter(([,m]) => m.riskLevel === "매우높음").map(([id]) => id),
  "높음":     Object.entries(MINERAL_META).filter(([,m]) => m.riskLevel === "높음").map(([id]) => id),
  "중간":     Object.entries(MINERAL_META).filter(([,m]) => m.riskLevel === "중간").map(([id]) => id),
  "낮음":     Object.entries(MINERAL_META).filter(([,m]) => m.riskLevel === "낮음").map(([id]) => id),
};

// ─────────────────────────────────────────────────────────────
// 4. HS 4자리 → 광종 역방향 매핑
// ─────────────────────────────────────────────────────────────
const HS_TO_MINERAL = {};
Object.entries(MINERAL_META).forEach(([id, m]) => {
  m.hsCodes.forEach(hs => {
    const key = hs.substring(0, 4);
    if (!HS_TO_MINERAL[key]) HS_TO_MINERAL[key] = [];
    if (!HS_TO_MINERAL[key].includes(id)) HS_TO_MINERAL[key].push(id);
  });
});

// ─────────────────────────────────────────────────────────────
// 5. 그룹별 광종 분류
// ─────────────────────────────────────────────────────────────
const GROUP_MINERALS = {};
Object.entries(MINERAL_META).forEach(([id, m]) => {
  if (!GROUP_MINERALS[m.group]) GROUP_MINERALS[m.group] = [];
  GROUP_MINERALS[m.group].push(id);
});

// ─────────────────────────────────────────────────────────────
// 6. 희토류 그룹 전용 인덱스
// ─────────────────────────────────────────────────────────────
const REE_LREE = GROUP_MINERALS["희토류-경(LREE)"] || [];
const REE_HREE = GROUP_MINERALS["희토류-중(HREE)"] || [];
const REE_ALL  = [...REE_LREE, ...REE_HREE];

// ─────────────────────────────────────────────────────────────
// 7. 중국 수출 제한 광종 목록 (2023~2024)
// ─────────────────────────────────────────────────────────────
const CHINA_EXPORT_RESTRICTED = Object.entries(MINERAL_META)
  .filter(([, m]) => m.exportRestriction)
  .map(([id, m]) => ({ id, name: m.nameKr, restriction: m.exportRestriction }));

// ─────────────────────────────────────────────────────────────
// 8. 미국 기준 핵심광물 메타데이터 (USGS 2022 + DOE/IRA)
//    총 60종 — 세부 데이터는 광종_HS코드_수요산업_매핑_v2.xlsx 참조
//    형식: [번호, ID, nameKr, nameEn, symbol, USGS22, DOE23, IRA45X, hsCodes, industries, korea33]
// ─────────────────────────────────────────────────────────────
const US_MINERAL_META = [
  [1,"aluminum","알루미늄","Aluminum","Al",true,true,true,["2606","7601"],["🔋 전기차 경량화","🏗️ 건설·포장재","🔋 태양광 패널"],true],
  [2,"antimony","안티몬","Antimony","Sb",true,false,true,["2617","8110"],["💻 반도체 도핑","⚔️ 방염·방산","🔋 납축전지"],true],
  [3,"arsenic","비소","Arsenic","As",true,false,false,["2811","2850"],["💻 GaAs 반도체","🌱 농약·목재방부","🏥 의약품"],false],
  [4,"barite","중정석","Barite","BaSO₄",true,false,false,["2511"],["🏗️ 시추니","🏥 조영제"],false],
  [5,"beryllium","베릴륨","Beryllium","Be",true,true,false,["2825","7409"],["⚔️ 항공우주 합금","⚔️ 핵무기 반사재","💻 X선 창"],false],
  [6,"bismuth","비스무트","Bismuth","Bi",true,false,false,["2617","8106"],["🏥 위장약","💻 무연납땜","🔋 열전소자"],false],
  [7,"cerium","세륨","Cerium","Ce",true,false,false,["2805","2846"],["🔋 연마재(CeO₂)","🚗 자동차 촉매","💡 형광체"],false],
  [8,"cesium","세슘","Cesium","Cs",true,false,false,["2805"],["💻 원자시계","💻 이온추진기"],false],
  [9,"chromium","크롬","Chromium","Cr",true,false,false,["2610","2819"],["🏗️ 스테인리스강","⚔️ 내화재"],false],
  [10,"cobalt","코발트","Cobalt","Co",true,true,true,["2605","8105"],["🔋 이차전지 양극재","✈️ 초내열합금"],true],
  [11,"dysprosium","디스프로슘","Dysprosium","Dy",true,true,false,["2805","2846"],["🧲 NdFeB 고온안정화","🔋 전기차 모터"],true],
  [12,"erbium","어븀","Erbium","Er",true,false,false,["2805","2846"],["📡 광섬유 증폭기","💡 레이저"],false],
  [13,"europium","유로퓸","Europium","Eu",true,false,false,["2805","2846"],["💡 OLED 형광체","💡 위조방지"],false],
  [14,"fluorspar","플루오라이트","Fluorspar","CaF₂",true,false,false,["2529","2826"],["⚗️ HF 원료","💻 반도체 식각가스","🔋 배터리 전해질"],true],
  [15,"gadolinium","가돌리늄","Gadolinium","Gd",true,false,false,["2805","2846"],["🏥 MRI 조영제","⚔️ 방사선 차폐"],false],
  [16,"gallium","갈륨","Gallium","Ga",true,true,true,["2804","8112"],["💻 GaN 반도체","📡 5G RF칩","💡 청색 LED"],true],
  [17,"germanium","게르마늄","Germanium","Ge",true,true,false,["2804","8112"],["📡 광섬유","⚔️ 야간투시 적외선","🔋 PV 태양전지"],true],
  [18,"graphite","흑연","Graphite","C",true,true,true,["2504","3801"],["🔋 이차전지 음극재","🔋 전기차 배터리"],true],
  [19,"hafnium","하프늄","Hafnium","Hf",true,false,false,["2612","8112"],["💻 반도체 게이트(HfO₂)","✈️ 초내열합금 코팅"],true],
  [20,"holmium","홀뮴","Holmium","Ho",true,false,false,["2805","2846"],["🧲 고온 자석 첨가제","🏥 MRI 조영제"],false],
  [21,"indium","인듐","Indium","In",true,false,false,["8112"],["📱 ITO 전극(OLED·LCD)","☀️ CIGS 박막태양전지"],true],
  [22,"iridium","이리듐","Iridium","Ir",true,false,false,["7110"],["⚗️ 전기분해 전극","🕯️ 스파크플러그"],false],
  [23,"lanthanum","란타넘","Lanthanum","La",true,false,false,["2805","2846"],["🔋 NiMH 배터리","⚗️ FCC 촉매"],true],
  [24,"lithium","리튬","Lithium","Li",true,true,true,["2530","2836","2825"],["🔋 이차전지","🔋 전기차 배터리"],true],
  [25,"lutetium","루테튬","Lutetium","Lu",true,false,false,["2805","2846"],["🏥 PET 스캔","💻 광 데이터 저장"],false],
  [26,"magnesium","마그네슘","Magnesium","Mg",true,false,false,["2519","8104"],["🏗️ 경량합금","🔋 LFP 양극재"],true],
  [27,"manganese","망간","Manganese","Mn",true,true,true,["2602","7202"],["🔋 이차전지 양극재","🏗️ 철강"],true],
  [28,"neodymium","네오디뮴","Neodymium","Nd",true,true,false,["2805","2846"],["🧲 NdFeB 영구자석","🔋 전기차 구동모터"],true],
  [29,"nickel","니켈","Nickel","Ni",true,true,true,["2604","7501","7502"],["🔋 이차전지 양극재","🚗 전기차"],true],
  [30,"niobium","니오븀","Niobium","Nb",true,false,false,["2615","8112"],["🏗️ HSLA 철강","💻 초전도 자석"],true],
  [31,"palladium","팔라듐","Palladium","Pd",true,false,false,["7110"],["🚗 자동차 촉매","💾 MLCC 전극"],true],
  [32,"platinum","백금","Platinum","Pt",true,true,false,["7110"],["♻️ 수소 연료전지","🚗 자동차 촉매"],true],
  [33,"praseodymium","프라세오디뮴","Praseodymium","Pr",true,false,false,["2805","2846"],["🧲 NdFeB 자석(PrNd)","🏺 세라믹 안료"],true],
  [34,"rhenium","레늄","Rhenium","Re",true,false,false,["2615","8112"],["✈️ 초내열합금(터빈)","⚗️ 석유 리포밍 촉매"],false],
  [35,"rubidium","루비듐","Rubidium","Rb",true,false,false,["2805"],["💻 원자시계","💻 광전자"],false],
  [36,"ruthenium","루테늄","Ruthenium","Ru",true,false,false,["7110"],["💾 HDD 기록층","⚗️ 전기화학 촉매"],false],
  [37,"samarium","사마륨","Samarium","Sm",true,false,false,["2805","2846"],["🧲 SmCo 고온 영구자석","⚔️ 유도무기"],false],
  [38,"scandium","스칸듐","Scandium","Sc",true,true,false,["2805","2846"],["✈️ Al-Sc 경량합금","⚡ SOFC 연료전지"],false],
  [39,"tantalum","탄탈","Tantalum","Ta",true,false,false,["2615","8103"],["💾 커패시터","🏥 의료 임플란트"],true],
  [40,"tellurium","텔루륨","Tellurium","Te",true,true,false,["2804","8112"],["☀️ CdTe 태양전지","🔋 열전소자"],true],
  [41,"terbium","테르븀","Terbium","Tb",true,true,false,["2805","2846"],["🧲 NdFeB 자석 첨가","💡 녹색 형광체"],true],
  [42,"thulium","툴륨","Thulium","Tm",true,false,false,["2805","2846"],["🏥 휴대용 X선","💡 레이저"],false],
  [43,"tin","주석","Tin","Sn",true,false,false,["2609","8001"],["💾 무연솔더","🏗️ 주석도금강판"],true],
  [44,"titanium","티타늄","Titanium","Ti",true,false,false,["2614","8108"],["✈️ 항공기 기체","⚔️ 방산 장갑판"],true],
  [45,"tungsten","텅스텐","Tungsten","W",true,true,false,["2611","8101"],["🔧 초경합금 절삭공구","⚔️ 방산 관통자"],true],
  [46,"uranium","우라늄","Uranium","U",true,false,false,["2612","2844"],["☢️ 원자력 발전 핵연료"],true],
  [47,"vanadium","바나듐","Vanadium","V",true,false,false,["2615","8112"],["🏗️ 고강도 구조강","⚡ VRFB 흐름전지"],true],
  [48,"ytterbium","이터븀","Ytterbium","Yb",true,false,false,["2805","2846"],["💻 광섬유 레이저","🏥 암 방사선 치료"],false],
  [49,"yttrium","이트륨","Yttrium","Y",true,true,false,["2805","2846"],["🔴 YAG 레이저","🏗️ 안정화 지르코니아"],true],
  [50,"zinc","아연","Zinc","Zn",true,false,false,["2608","7901"],["🏗️ 도금강판","🔋 아연-공기 배터리"],false],
  // DOE/IRA 추가 10종
  [51,"silicon","실리콘","Silicon","Si",false,true,true,["2804","3818"],["💻 반도체 웨이퍼","🔋 Si 음극재(차세대)","☀️ 태양전지"],true],
  [52,"copper_doe","구리","Copper","Cu",false,true,true,["2603","7401","7403"],["🔌 전력케이블","🔋 전기차 권선","🏗️ 건설"],true],
  [53,"phosphate_doe","인광석","Phosphate Rock","P",false,true,false,["2510","2835"],["🌱 비료","🔋 LFP 양극재(LiFePO₄)"],true],
  [54,"sulfur","황","Sulfur","S",false,false,true,["2802","2503"],["⚗️ 황산 원료","🌱 비료"],false],
  [55,"boron","붕소","Boron","B",false,true,false,["2528","2810"],["🧲 NdFeB 자석 원료","🔋 NMC 양극재 도핑","🏗️ 유리섬유"],false],
  [56,"selenium","셀레늄","Selenium","Se",false,true,false,["2804","8112"],["☀️ CIGS·CdSe 태양전지","🌱 동물 영양소"],false],
  [57,"iodine","요오드","Iodine","I",false,false,true,["2801","2853"],["🏥 의약품·조영제","⚗️ LCD 편광판"],false],
  [58,"platinum_doe","백금족(PGM)","Platinum Group Metals","PGM",false,true,false,["7110"],["♻️ 수소 연료전지 촉매","🚗 자동차 촉매"],true],
  [59,"chromium_ira","크롬(IRA)","Chromium (IRA)","Cr",false,false,true,["2610"],["🏗️ 스테인리스강","⚔️ 내화재"],false],
  [60,"zinc_doe","아연(DOE)","Zinc (DOE)","Zn",false,true,false,["2608","7901"],["🔋 아연-공기 배터리","🏗️ 도금강판"],false],
];

// ─────────────────────────────────────────────────────────────
// 9. Export (Node.js 환경 지원)
// ─────────────────────────────────────────────────────────────
if (typeof module !== "undefined") {
  module.exports = {
    MINERAL_META,
    INDUSTRY_TO_MINERALS,
    RISK_MINERALS,
    HS_TO_MINERAL,
    GROUP_MINERALS,
    REE_LREE,
    REE_HREE,
    REE_ALL,
    CHINA_EXPORT_RESTRICTED,
    US_MINERAL_META,
  };
}
