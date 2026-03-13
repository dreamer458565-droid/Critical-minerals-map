// api/trade.js
// Vercel 서버리스 함수 — 공공데이터포털 관세청 품목별 국가별 수출입실적 API 프록시
// 브라우저 CORS 문제를 서버사이드에서 해결, XML → JSON 변환, 국가별 합산

// ─── Rate Limiting (메모리 기반, 서버리스 인스턴스 단위) ──────────────────────
// Vercel Serverless는 인스턴스가 여러 개 뜰 수 있으므로 완전한 전역 제한은 아니지만
// 단일 인스턴스 내 과도한 연속 호출을 막는 1차 방어선으로 충분히 유효
const _rateStore = new Map(); // ip → { count, windowStart }
const RATE_LIMIT  = 60;       // 윈도우당 최대 요청 수
const RATE_WINDOW = 60_000;   // 1분 (ms)

function checkRateLimit(ip) {
  const now = Date.now();
  const entry = _rateStore.get(ip);
  if (!entry || now - entry.windowStart > RATE_WINDOW) {
    _rateStore.set(ip, { count: 1, windowStart: now });
    return true;
  }
  entry.count += 1;
  if (entry.count > RATE_LIMIT) return false;
  return true;
}

// ─── 허용 오리진 (Referer/Origin 검증) ───────────────────────────────────────
// Vercel 배포 도메인 또는 로컬 개발 환경만 허용
const ALLOWED_ORIGINS = [
  /\.vercel\.app$/,
  /^https?:\/\/localhost(:\d+)?$/,
  /^https?:\/\/127\.0\.0\.1(:\d+)?$/,
];

function isAllowedOrigin(req) {
  const origin  = req.headers['origin']  || '';
  let   referer = req.headers['referer'] || '';
  // Referer는 전체 URL — origin 부분만 추출해야 trailing slash/경로를 제거할 수 있음
  // 예: 'https://xyz.vercel.app/' → 'https://xyz.vercel.app'
  if (referer) {
    try { referer = new URL(referer).origin; } catch { referer = ''; }
  }
  const check = origin || referer;
  // origin/referer 헤더가 아예 없으면 서버 간 호출로 간주 → 허용
  if (!check) return true;
  return ALLOWED_ORIGINS.some(re => re.test(check));
}

// ISO 3166-1 alpha-2 → alpha-3 변환 (프론트엔드 GEO 테이블이 alpha-3 사용)
const A2_TO_A3 = {
  AU:'AUS',CL:'CHL',CN:'CHN',US:'USA',CA:'CAN',BR:'BRA',ZA:'ZAF',
  ID:'IDN',PH:'PHL',RU:'RUS',CD:'COD',NO:'NOR',FI:'FIN',JP:'JPN',
  KZ:'KAZ',MM:'MMR',MN:'MNG',BE:'BEL',NL:'NLD',DE:'DEU',GB:'GBR',
  FR:'FRA',IN:'IND',PG:'PNG',ZM:'ZMB',PE:'PER',MX:'MEX',BO:'BOL',
  AR:'ARG',KR:'KOR',MY:'MYS',SG:'SGP',TW:'TWN',UA:'UKR',PL:'POL',
  TH:'THA',VN:'VNM',SA:'SAU',AE:'ARE',TR:'TUR',SE:'SWE',ES:'ESP',
  IT:'ITA',AT:'AUT',CZ:'CZE',HU:'HUN',RO:'ROU',BG:'BGR',HR:'HRV',
  SK:'SVK',SI:'SVN',LT:'LTU',LV:'LVA',EE:'EST',PT:'PRT',GR:'GRC',
  IE:'IRL',DK:'DNK',CH:'CHE',IL:'ISR',EG:'EGY',MA:'MAR',NG:'NGA',
  KE:'KEN',TZ:'TZA',GH:'GHA',ET:'ETH',MZ:'MOZ',CG:'COG',GA:'GAB',
  CM:'CMR',CI:'CIV',SN:'SEN',ZW:'ZWE',BW:'BWA',NA:'NAM',MG:'MDG',
  NZ:'NZL',FJ:'FJI',PK:'PAK',BD:'BGD',LK:'LKA',NP:'NPL',KH:'KHM',
  LA:'LAO',CU:'CUB',DO:'DOM',CO:'COL',VE:'VEN',EC:'ECU',UY:'URY',
  PY:'PRY',GY:'GUY',SR:'SUR',PA:'PAN',CR:'CRI',GT:'GTM',HN:'HND',
  SV:'SLV',NI:'NIC',JM:'JAM',TT:'TTO',HT:'HTI',BZ:'BLZ',QA:'QAT',
  KW:'KWT',BH:'BHR',OM:'OMN',JO:'JOR',LB:'LBN',IQ:'IRQ',IR:'IRN',
  AF:'AFG',UZ:'UZB',TM:'TKM',TJ:'TJK',KG:'KGZ',GE:'GEO',AM:'ARM',
  AZ:'AZE',BY:'BLR',MD:'MDA',RS:'SRB',BA:'BIH',ME:'MNE',MK:'MKD',
  AL:'ALB',XK:'XKX',CY:'CYP',MT:'MLT',IS:'ISL',LU:'LUX',LI:'LIE',
  MC:'MCO',AD:'AND',SM:'SMR',NC:'NCL',PF:'PYF',WS:'WSM',TO:'TON',
  SL:'SLE',RW:'RWA',TD:'TCD',MR:'MRT',ML:'MLI',BF:'BFA',NE:'NER',
  ER:'ERI',DJ:'DJI',SO:'SOM',SS:'SSD',TG:'TGO',BJ:'BEN',GN:'GIN',
  GW:'GNB',SZ:'SWZ',LS:'LSO',MW:'MWI',UG:'UGA',BI:'BDI',LY:'LBY',
  DZ:'DZA',TN:'TUN',SD:'SDN',AO:'AGO',MU:'MUS',SC:'SYC',CV:'CPV',
};

export default async function handler(req, res) {
  // ─── CORS: 허용 오리진만 반사 ──────────────────────────────────────────────
  const origin = req.headers['origin'] || '';
  if (origin && ALLOWED_ORIGINS.some(re => re.test(origin))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // ─── 오리진 검증 ────────────────────────────────────────────────────────────
  if (!isAllowedOrigin(req)) {
    return res.status(403).json({ error: 'FORBIDDEN', message: '허용되지 않은 출처입니다.' });
  }

  // ─── Rate Limiting ──────────────────────────────────────────────────────────
  const clientIp =
    (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
    req.socket?.remoteAddress || 'unknown';
  if (!checkRateLimit(clientIp)) {
    res.setHeader('Retry-After', '60');
    return res.status(429).json({
      error: 'TOO_MANY_REQUESTS',
      message: '요청이 너무 많습니다. 1분 후 다시 시도하세요.',
    });
  }

  // ─── 파라미터 수신 (프론트엔드 명칭 + 레거시 명칭 모두 허용) ─────────────
  const {
    // HS 코드: hsCd(프론트엔드) 또는 hsSgn/hsCode(레거시)
    hsCd, hsSgn, hsCode,
    // 기간: strtYr/endYr (연도, YYYY) 또는 strtYymm/endYymm (월, YYYYMM) 또는 period(연도)
    strtYr, endYr, strtYymm, endYymm, period,
    // 국가 코드
    cntyCd,
    // 수출입 구분: IMP/EXP (없으면 전체)
    impExpDivCd,
  } = req.query;

  const serviceKey = process.env.DATA_GO_KR_API_KEY;

  if (!serviceKey) {
    return res.status(500).json({
      error: 'API_KEY_NOT_SET',
      message: 'Vercel 대시보드에서 DATA_GO_KR_API_KEY 환경변수를 설정하세요.',
    });
  }

  // HS 코드 결정 (우선순위: hsCd > hsSgn > hsCode)
  const rawCode = hsCd || hsSgn || hsCode || '';
  const itemCode = rawCode.replace(/[.\-\s]/g, '');

  // HS 코드 유효성 검증 (2~10자리 숫자만 허용)
  if (itemCode && !/^\d{2,10}$/.test(itemCode)) {
    return res.status(400).json({
      error: 'INVALID_HS_CODE',
      message: `HS 코드는 2~10자리 숫자여야 합니다: "${rawCode}"`,
    });
  }

  // 기간 결정 (YYYYMM 포맷으로 통일)
  let startYm = strtYymm;
  let endYm   = endYymm;

  if (!startYm && strtYr) {
    // strtYr=2023 → strtYymm=202301
    startYm = `${strtYr}01`;
  }
  if (!endYm && endYr) {
    // endYr=2023 → endYymm=202312
    endYm = `${endYr}12`;
  }
  if (!startYm && period) {
    startYm = `${period}01`;
    endYm   = `${period}12`;
  }

  if (!startYm || !endYm) {
    return res.status(400).json({
      error: 'MISSING_PARAMS',
      message: 'strtYr/endYr 또는 strtYymm/endYymm 또는 period 파라미터가 필요합니다.',
    });
  }

  // 기간 형식 검증 (YYYYMM)
  if (!/^\d{6}$/.test(startYm) || !/^\d{6}$/.test(endYm)) {
    return res.status(400).json({
      error: 'INVALID_PERIOD',
      message: `기간은 YYYYMM 형식이어야 합니다: start=${startYm}, end=${endYm}`,
    });
  }

  // ─── 관세청 API 파라미터 구성 ────────────────────────────────────────────
  // _type=json은 406 반환하므로 XML 기본 사용 (서버에서 파싱)
  const params = new URLSearchParams({
    strtYymm: startYm,
    endYymm:  endYm,
    numOfRows: '1000',
    pageNo:    '1',
  });
  if (itemCode)    params.set('hsSgn', itemCode);
  if (cntyCd)      params.set('cntyCd', cntyCd);
  if (impExpDivCd) params.set('impExpDivCd', impExpDivCd);

  let safeKey;
  try {
    safeKey = encodeURIComponent(decodeURIComponent(serviceKey));
  } catch {
    safeKey = encodeURIComponent(serviceKey);
  }

  const apiUrl = `https://apis.data.go.kr/1220000/nitemtrade/getNitemtradeList?serviceKey=${safeKey}&${params}`;

  try {
    const upstream = await fetch(apiUrl, {
      signal: AbortSignal.timeout(15000),
      headers: {
        'Accept': 'application/json, application/xml, text/xml, */*',
        'User-Agent': 'Mozilla/5.0 (compatible; KOMIR-Dashboard/1.0)',
      },
    });

    const contentType = upstream.headers.get('content-type') || '';
    const text = await upstream.text();

    if (!text || !text.trim()) {
      // 업스트림이 빈 응답 반환 → 데이터 없음으로 처리 (에러 대신 빈 배열)
      console.error('[trade] Empty upstream response:', {
        status: upstream.status,
        statusText: upstream.statusText,
        url: apiUrl.replace(safeKey, '[REDACTED]'),
      });
      return res.status(200).json({
        response: {
          header: { resultCode: '00', resultMsg: 'OK' },
          body: { items: { item: [] }, totalCount: 0 },
        },
        _debug: { emptyUpstream: true, upstreamStatus: upstream.status },
      });
    }

    // ─── JSON 응답 처리 (만약 JSON이 돌아오면 처리) ───────────────────────────────
    if (contentType.includes('application/json') || text.trim().startsWith('{')) {
      try {
        const json = JSON.parse(text);
        const body = json?.response?.body;
        if (!body) {
          return res.status(502).json({ error: 'BAD_JSON_STRUCTURE', raw: text.substring(0, 500) });
        }
        const items = body.items?.item;
        if (!items) {
          return res.status(200).json({
            response: { header: { resultCode: '00', resultMsg: 'OK' }, body: { items: { item: [] }, totalCount: 0 } }
          });
        }
        const arr = Array.isArray(items) ? items : [items];
        // alpha-2 → alpha-3 변환 및 필드 정규화
        const mapped = arr.map(r => ({
          cntyCd:  A2_TO_A3[r.statCd || r.cntyCd] || r.statCd || r.cntyCd,
          cntyNm:  r.statCdCntnKor1 || r.cntyNm || '',
          hsCd:    r.hsCd || '',
          hsNm:    r.statKor || '',
          period:  r.year || '',
          impAmt:  String(r.impDlr || r.impAmt || '0'),
          expAmt:  String(r.expDlr || r.expAmt || '0'),
          impWgt:  String(r.impWgt || '0'),
          expWgt:  String(r.expWgt || '0'),
          balPayments: String(r.balPayments || '0'),
        }));
        return res.status(200).json({
          response: {
            header: { resultCode: '00', resultMsg: 'OK' },
            body: { items: { item: mapped }, detail: mapped, totalCount: mapped.length },
          },
        });
      } catch (_) {
        // JSON 파싱 실패 → XML로 재시도
      }
    }

    // ─── XML 응답 처리 ─────────────────────────────────────────────────────
    const authErrMatch = text.match(/<returnAuthMsg>(.*?)<\/returnAuthMsg>/);
    if (authErrMatch) {
      return res.status(502).json({ error: authErrMatch[1], raw: text.substring(0, 500) });
    }

    const resultCodeMatch = text.match(/<resultCode>(.*?)<\/resultCode>/);
    const resultMsgMatch  = text.match(/<resultMsg>(.*?)<\/resultMsg>/);
    const resultCode = resultCodeMatch ? resultCodeMatch[1] : null;
    const resultMsg  = resultMsgMatch  ? resultMsgMatch[1]  : '';

    if (resultCode && resultCode !== '00') {
      // 관세청 API는 데이터 없을 때도 non-'00' 코드를 반환함
      // → 클라이언트에 502를 주지 않고 빈 결과로 처리 (failCount 방지)
      console.warn(`[trade] upstream resultCode=${resultCode} "${resultMsg}"`, { startYm, endYm, itemCode });
      return res.status(200).json({
        response: {
          header: { resultCode: '00', resultMsg: 'OK' },
          body: { items: { item: [] }, detail: [], totalCount: 0 },
        },
      });
    }

    // XML → 아이템 파싱
    const rawItems = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;
    while ((match = itemRegex.exec(text)) !== null) {
      const itemXml = match[1];
      const raw = {};
      const fieldRegex = /<(\w+)>(.*?)<\/\1>/g;
      let fieldMatch;
      while ((fieldMatch = fieldRegex.exec(itemXml)) !== null) {
        raw[fieldMatch[1]] = fieldMatch[2];
      }
      if (raw.year === '총계') continue;
      rawItems.push(raw);
    }

    // ─── 개별 행 정규화 (프론트엔드 필드명 통일) ─────────────────────
    const detailItems = rawItems
      .filter(r => r.statCd && r.statCd !== '-')
      .map(r => ({
        cntyCd:     A2_TO_A3[r.statCd] || r.statCd,
        cntyNm:     r.statCdCntnKor1 || '',
        hsCd:       r.hsCd || '',
        hsNm:       r.statKor || '',
        period:     r.year || '',
        impAmt:     String(r.impDlr || '0'),
        expAmt:     String(r.expDlr || '0'),
        impWgt:     String(r.impWgt || '0'),
        expWgt:     String(r.expWgt || '0'),
        balPayments: String(r.balPayments || '0'),
      }));

    // ─── 국가별 합산 (현황 개요·수입지도용) ──────────────────────────
    const countryMap = {};
    for (const r of detailItems) {
      const key = r.cntyCd;
      if (!countryMap[key]) {
        countryMap[key] = {
          cntyCd: r.cntyCd,
          cntyNm: r.cntyNm,
          hsCd:   r.hsCd,
          hsNm:   r.hsNm,
          impAmt: 0, expAmt: 0, impWgt: 0, expWgt: 0, balPayments: 0,
        };
      }
      const c = countryMap[key];
      c.impAmt     += parseInt(r.impAmt || '0', 10);
      c.expAmt     += parseInt(r.expAmt || '0', 10);
      c.impWgt     += parseInt(r.impWgt || '0', 10);
      c.expWgt     += parseInt(r.expWgt || '0', 10);
      c.balPayments += parseInt(r.balPayments || '0', 10);
    }

    const aggregated = Object.values(countryMap).map(c => ({
      ...c,
      impAmt:     String(c.impAmt),
      expAmt:     String(c.expAmt),
      impWgt:     String(c.impWgt),
      expWgt:     String(c.expWgt),
      balPayments: String(c.balPayments),
    }));

    return res.status(200).json({
      response: {
        header: { resultCode: resultCode || '00', resultMsg },
        body: {
          items: { item: aggregated },
          detail: detailItems,
          totalCount: aggregated.length,
        },
      },
    });

  } catch (err) {
    return res.status(500).json({
      error: 'FETCH_FAILED',
      message: err.message,
    });
  }
}
