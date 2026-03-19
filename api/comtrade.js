// api/comtrade.js
// Vercel 서버리스 함수 — UN Comtrade API 프록시
// 브라우저 CORS 해결 + 응답 정규화 + 서버 캐시 + Rate Limit 관리

// ─── Rate Limiting ──────────────────────────────────────────────────────────
const _rateStore = new Map();
const RATE_LIMIT  = 60;
const RATE_WINDOW = 60_000;

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

// ─── 무인증 모드: 1req/sec 간격 강제 ────────────────────────────────────────
let _lastUpstreamCall = 0;

// ─── 허용 오리진 ────────────────────────────────────────────────────────────
const ALLOWED_ORIGINS = [
  /\.vercel\.app$/,
  /^https?:\/\/localhost(:\d+)?$/,
  /^https?:\/\/127\.0\.0\.1(:\d+)?$/,
];

function isAllowedOrigin(req) {
  const origin  = req.headers['origin']  || '';
  let   referer = req.headers['referer'] || '';
  if (referer) {
    try { referer = new URL(referer).origin; } catch { referer = ''; }
  }
  const check = origin || referer;
  if (!check) return true;
  return ALLOWED_ORIGINS.some(re => re.test(check));
}

// ─── 서버 캐시 (LRU, TTL 24h) ──────────────────────────────────────────────
const _cache = new Map();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24시간
const CACHE_MAX = 500;

function cacheGet(key) {
  const entry = _cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL) { _cache.delete(key); return null; }
  // LRU: 재삽입으로 순서 갱신
  _cache.delete(key);
  _cache.set(key, entry);
  return entry.data;
}

function cacheSet(key, data) {
  if (_cache.size >= CACHE_MAX) {
    // 가장 오래된 항목(첫 번째) 삭제
    const oldest = _cache.keys().next().value;
    _cache.delete(oldest);
  }
  _cache.set(key, { data, ts: Date.now() });
}

// ─── Comtrade 숫자 국가코드 → ISO alpha-3 ──────────────────────────────────
const NUM_TO_A3 = {
  0:'WLD',4:'AFG',8:'ALB',12:'DZA',20:'AND',24:'AGO',32:'ARG',36:'AUS',
  40:'AUT',48:'BHR',50:'BGD',51:'ARM',56:'BEL',64:'BTN',68:'BOL',70:'BIH',
  72:'BWA',76:'BRA',84:'BLZ',90:'SLB',96:'BRN',100:'BGR',104:'MMR',108:'BDI',
  112:'BLR',116:'KHM',120:'CMR',124:'CAN',140:'CAF',144:'LKA',148:'TCD',
  152:'CHL',156:'CHN',158:'TWN',170:'COL',178:'COG',180:'COD',188:'CRI',
  191:'HRV',192:'CUB',196:'CYP',203:'CZE',204:'BEN',208:'DNK',214:'DOM',
  218:'ECU',818:'EGY',222:'SLV',226:'GNQ',231:'ETH',233:'EST',242:'FJI',
  246:'FIN',250:'FRA',266:'GAB',268:'GEO',276:'DEU',288:'GHA',300:'GRC',
  320:'GTM',324:'GIN',328:'GUY',332:'HTI',340:'HND',344:'HKG',348:'HUN',
  352:'ISL',356:'IND',360:'IDN',364:'IRN',368:'IRQ',372:'IRL',376:'ISR',
  380:'ITA',384:'CIV',388:'JAM',392:'JPN',398:'KAZ',400:'JOR',404:'KEN',
  408:'PRK',410:'KOR',414:'KWT',417:'KGZ',418:'LAO',422:'LBN',426:'LSO',
  428:'LVA',430:'LBR',434:'LBY',440:'LTU',442:'LUX',446:'MAC',450:'MDG',
  454:'MWI',458:'MYS',462:'MDV',466:'MLI',470:'MLT',478:'MRT',480:'MUS',
  484:'MEX',496:'MNG',498:'MDA',504:'MAR',508:'MOZ',512:'OMN',516:'NAM',
  524:'NPL',528:'NLD',540:'NCL',554:'NZL',558:'NIC',562:'NER',566:'NGA',
  578:'NOR',586:'PAK',591:'PAN',598:'PNG',600:'PRY',604:'PER',608:'PHL',
  616:'POL',620:'PRT',634:'QAT',642:'ROU',643:'RUS',646:'RWA',682:'SAU',
  686:'SEN',688:'SRB',694:'SLE',702:'SGP',703:'SVK',704:'VNM',705:'SVN',
  706:'SOM',710:'ZAF',716:'ZWE',724:'ESP',728:'SSD',736:'SDN',740:'SUR',
  748:'SWZ',752:'SWE',756:'CHE',760:'SYR',762:'TJK',764:'THA',768:'TGO',
  780:'TTO',784:'ARE',788:'TUN',792:'TUR',795:'TKM',800:'UGA',804:'UKR',
  807:'MKD',826:'GBR',834:'TZA',840:'USA',842:'USA',858:'URY',860:'UZB',
  862:'VEN',887:'YEM',894:'ZMB',
};

export default async function handler(req, res) {
  // ─── CORS ─────────────────────────────────────────────────────────────────
  const origin = req.headers['origin'] || '';
  if (origin && ALLOWED_ORIGINS.some(re => re.test(origin))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // ─── Origin 검증 ─────────────────────────────────────────────────────────
  if (!isAllowedOrigin(req)) {
    return res.status(403).json({ error: 'FORBIDDEN', message: '허용되지 않은 출처입니다.' });
  }

  // ─── Rate Limiting ────────────────────────────────────────────────────────
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

  // ─── 파라미터 ─────────────────────────────────────────────────────────────
  const {
    cmdCode,        // HS 코드 (2~6자리), 쉼표 구분 가능
    period,         // 연도 (예: 2023 또는 2022,2023)
    reporterCode,   // 보고국 숫자코드 (0=전체, 410=한국)
    partnerCode,    // 상대국 숫자코드 (0=세계)
    flowCode,       // M=수입, X=수출
  } = req.query;

  if (!cmdCode) {
    return res.status(400).json({
      error: 'MISSING_PARAMS',
      message: 'cmdCode(HS 코드) 파라미터가 필요합니다.',
    });
  }

  // ─── API 키 확인 ──────────────────────────────────────────────────────────
  const apiKey = process.env.UN_COMTRADE_API_KEY || '';
  const authMode = apiKey ? 'key' : 'free';

  // ─── 캐시 확인 ────────────────────────────────────────────────────────────
  const cacheKey = JSON.stringify({ cmdCode, period, reporterCode, partnerCode, flowCode });
  const cached = cacheGet(cacheKey);
  if (cached) {
    return res.status(200).json({
      comtrade: { data: cached, meta: { auth: authMode, cached: true } }
    });
  }

  // ─── 무인증 모드: 1초 간격 강제 ───────────────────────────────────────────
  if (!apiKey) {
    const now = Date.now();
    const elapsed = now - _lastUpstreamCall;
    if (elapsed < 1100) {
      await new Promise(r => setTimeout(r, 1100 - elapsed));
    }
    _lastUpstreamCall = Date.now();
  }

  // ─── Comtrade API 호출 ────────────────────────────────────────────────────
  const params = new URLSearchParams();
  params.set('cmdCode', cmdCode);
  if (period)       params.set('period', period);
  if (reporterCode) params.set('reporterCode', reporterCode);
  if (partnerCode)  params.set('partnerCode', partnerCode);
  if (flowCode)     params.set('flowCode', flowCode);
  params.set('includeDesc', 'true');

  // API 키가 있으면 인증 API, 없으면 공개 Preview API 사용
  let apiUrl;
  if (apiKey) {
    params.set('subscription-key', apiKey);
    apiUrl = `https://comtradeapi.un.org/data/v1/get/C/A/HS?${params}`;
  } else {
    apiUrl = `https://comtradeapi.un.org/public/v1/preview/C/A/HS?${params}`;
  }

  try {
    const upstream = await fetch(apiUrl, {
      signal: AbortSignal.timeout(20000),
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'KOMIR-Dashboard/1.0',
      },
    });

    if (upstream.status === 429) {
      return res.status(429).json({
        comtrade: { data: [], meta: { auth: authMode, cached: false } },
        error: 'COMTRADE_RATE_LIMIT',
        message: 'UN Comtrade 요청 한도 초과. 잠시 후 다시 시도하세요.',
      });
    }

    if (!upstream.ok) {
      const errText = await upstream.text().catch(() => '');
      console.error('[comtrade] upstream error:', upstream.status, errText.substring(0, 300));
      return res.status(502).json({
        error: 'UPSTREAM_ERROR',
        message: `Comtrade API 오류 (HTTP ${upstream.status})`,
      });
    }

    const json = await upstream.json();

    // Comtrade v1 응답: { data: [...], ... } 또는 { error: "msg" }
    // Preview API는 error="" (빈 문자열)도 반환하므로 실제 에러만 체크
    if ((json.error && json.error !== '') || json.statusCode) {
      console.warn('[comtrade] API error:', json.error || json.statusCode, json.message);
      return res.status(200).json({
        comtrade: { data: [], meta: { auth: authMode, cached: false } },
        _debug: { comtradeError: json.error || json.statusCode },
      });
    }

    const rawData = Array.isArray(json.data) ? json.data : [];

    // ─── 응답 정규화 ──────────────────────────────────────────────────────
    const normalized = rawData.map(r => ({
      reporterCode:  r.reporterCode,
      reporterISO:   r.reporterISO || NUM_TO_A3[r.reporterCode] || String(r.reporterCode),
      reporterDesc:  r.reporterDesc || '',
      partnerCode:   r.partnerCode,
      partnerISO:    (r.partnerISO === 'W00' ? 'WLD' : r.partnerISO) || NUM_TO_A3[r.partnerCode] || String(r.partnerCode),
      partnerDesc:   r.partnerDesc || '',
      cmdCode:       r.cmdCode || '',
      cmdDesc:       r.cmdDesc || '',
      flowCode:      r.flowCode || '',   // M=import, X=export
      period:        r.period,
      tradeValue:    Number(r.primaryValue || r.tradeValue || 0),
      netWeight:     Number(r.netWgt || r.netWeight || 0),
      qty:           Number(r.qty || 0),
      qtyUnitAbbr:   r.qtyUnitAbbr || '',
    }));

    // 캐시 저장
    cacheSet(cacheKey, normalized);

    return res.status(200).json({
      comtrade: {
        data: normalized,
        meta: { auth: authMode, cached: false, count: normalized.length },
      },
    });

  } catch (err) {
    console.error('[comtrade] fetch error:', err.message);
    return res.status(500).json({
      error: 'FETCH_FAILED',
      message: err.message,
    });
  }
}
