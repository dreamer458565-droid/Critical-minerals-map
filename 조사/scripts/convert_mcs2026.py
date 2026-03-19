#!/usr/bin/env python3
"""
MCS2026 CSV → JS 데이터 변환 스크립트
출력: USGS_SUPPLY_DATA, USGS_IMPORT_RELIANCE, USGS_PRICE_GROWTH,
      USGS_CRITICAL_SUMMARY, USGS_US_SALIENT
"""
import csv, json, re, sys, os

BASE = "/Users/theoai/내 드라이브/회사파일/14_USGS/데이터/MCS2026_Mineral_Industry_Trends_and_Salient_Statistics"
MAIN_CSV = os.path.join(BASE, "MCS2026_Commodities_Data.csv")
FIG2_CSV = os.path.join(BASE, "MCS2026_Fig2_Net_Import_Reliance.csv")
FIG10_CSV = os.path.join(BASE, "MCS2026_Fig10_Price_Growth_Rates.csv")
T7_CSV = os.path.join(BASE, "MCS2026_T7_Critical_Minerals_Salient.csv")

def parse_value(v):
    """CSV 값 파싱: W/--/NA→None, 쉼표 제거, >/< 접두사 처리"""
    if v is None:
        return None
    v = v.strip()
    if v in ('W', '--', 'NA', '', 'E', 'XX'):
        return None
    v = v.replace(',', '')
    # Handle >95, <50 etc
    m = re.match(r'^[><]?\s*(.+)$', v)
    if m:
        try:
            return float(m.group(1))
        except ValueError:
            return None
    return None

# Country name normalization
COUNTRY_NORMALIZE = {
    'C\x92te d\x92Ivoire': "Côte d'Ivoire",
    'Côte dIvoire': "Côte d'Ivoire",
}

def normalize_country(c):
    c = c.strip()
    return COUNTRY_NORMALIZE.get(c, c)

def read_main_csv():
    rows = []
    with open(MAIN_CSV, encoding='latin-1') as f:
        reader = csv.DictReader(f)
        for row in reader:
            rows.append(row)
    return rows

# ─── 1. USGS_SUPPLY_DATA (production + reserves) ───
def build_supply_data(rows):
    production = {}
    reserves = {}

    for row in rows:
        section = row['Section']
        commodity = row['Commodity'].strip()
        country = normalize_country(row['Country'])
        stat = row['Statistics'].strip()
        detail = row['Statistics_detail'].strip()
        year = row['Year'].strip()
        unit = row['Unit'].strip()
        value = parse_value(row['Value'])

        # Skip non-World sections
        if 'World' not in section:
            continue
        # Skip years before 2024
        if year not in ('2024', '2025'):
            continue

        is_production = stat == 'Production'
        is_reserves = stat == 'Reserves'
        if not is_production and not is_reserves:
            continue

        target = production if is_production else reserves

        # Handle Titanium split (Ilmenite/Rutile)
        if commodity == 'Titanium Mineral Concentrates':
            if 'ilmenite' in detail.lower():
                commodity = 'Titanium Mineral Concentrates (Ilmenite)'
            elif 'rutile' in detail.lower():
                commodity = 'Titanium Mineral Concentrates (Rutile)'

        # TiO2 fix
        if commodity == 'Tio2 Pigment':
            commodity = 'TiO2 Pigment'

        if commodity not in target:
            target[commodity] = {}
        if year not in target[commodity]:
            target[commodity][year] = {
                'world_total': None,
                'unit': unit,
                'world_det': detail if 'rounded' not in detail.lower() else detail.replace(': rounded', ''),
                'countries': []
            }

        entry = target[commodity][year]

        if country == 'World total':
            entry['world_total'] = value
            # Clean up world_det
            if detail:
                det = detail.replace(': rounded', '').replace(', rounded', '').strip()
                if det:
                    entry['world_det'] = det
        elif country == 'Other countries':
            if value is not None and value > 0:
                entry['countries'].append({
                    'country': 'Other countries',
                    'value': value,
                    'pct': 0
                })
        else:
            if value is not None and value > 0:
                entry['countries'].append({
                    'country': country,
                    'value': value,
                    'pct': 0
                })

    # Calculate percentages
    for category in [production, reserves]:
        for mineral, years in category.items():
            for year, data in years.items():
                total = data['world_total']
                if total and total > 0:
                    for c in data['countries']:
                        c['pct'] = round(c['value'] / total * 100, 1)
                # Sort by value descending
                data['countries'].sort(key=lambda x: x['value'] or 0, reverse=True)

    return {'production': production, 'reserves': reserves}

# ─── 2. USGS_IMPORT_RELIANCE (Fig2) ───
def build_import_reliance():
    result = []
    with open(FIG2_CSV, encoding='latin-1') as f:
        reader = csv.DictReader(f)
        for row in reader:
            reliance_raw = row['Net_Import_Reliance_pct_2025'].strip()
            # Parse reliance value
            rel_val = None
            try:
                rel_val = float(reliance_raw.replace('>', '').replace('<', ''))
            except ValueError:
                pass
            result.append({
                'mineral': row['Commodity'].strip(),
                'reliance': reliance_raw,
                'reliance_num': rel_val,
                'rank': int(row['Import_Share_Order']),
                'sources': row['Major_Import_Sources_2021_24'].strip()
            })
    return result

# ─── 3. USGS_PRICE_GROWTH (Fig10) ───
def build_price_growth():
    result = {}
    with open(FIG10_CSV, encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        for row in reader:
            name = row['critical_mineral_priced'].strip()
            pch = parse_value(row['PCH_2024_2025'])
            cagr = parse_value(row['CAGR_2021_2025'])
            result[name] = {'pch': pch, 'cagr': cagr}
    return result

# ─── 4. USGS_CRITICAL_SUMMARY (T7) ───
def build_critical_summary():
    result = {}
    with open(T7_CSV, encoding='latin-1') as f:
        reader = csv.DictReader(f)
        for row in reader:
            name = row['Critical_mineral'].strip()
            # Clean footnote markers like "9" at end
            name = re.sub(r'\d+$', '', name).strip()
            result[name] = {
                'unit': row['Units'].strip(),
                'primary_prod': parse_value(row['Primary_prod']),
                'secondary_prod': parse_value(row['Secondary_prod']),
                'consumption': parse_value(row['Apparent_Consumption']),
                'reliance': row['Net_Import_Reliance'].strip(),
                'sources': row['Primary_import_sources_2021-24'].strip(),
                'leading_country': row['Leading_source_country'].strip(),
                'leading_prod': parse_value(row['Leading_country_prod']),
                'leading_pct': parse_value(row['Leading_source_precent_world']),
                'world_total': parse_value(row['World_total_prod']),
            }
    return result

# ─── 5. USGS_US_SALIENT (main CSV Salient section) ───
def build_us_salient(rows):
    """Extract price, consumption, net import reliance time series.
    Simplified: only keep first sub-detail per stat type that has actual data."""
    # First pass: collect all data
    raw = {}
    for row in rows:
        if 'Salient' not in row['Section']:
            continue
        commodity = row['Commodity'].strip()
        stat = row['Statistics'].strip()
        detail = row['Statistics_detail'].strip()
        year = row['Year'].strip()
        value = parse_value(row['Value'])
        unit = row['Unit'].strip()

        if stat not in ('Price', 'Consumption', 'Net import reliance', 'Production', 'Import', 'Export'):
            continue

        if commodity == 'Tio2 Pigment':
            commodity = 'TiO2 Pigment'

        key_map = {'Price': 'price', 'Consumption': 'consumption',
                   'Net import reliance': 'reliance', 'Production': 'production',
                   'Import': 'import', 'Export': 'export'}
        key = key_map[stat]

        if commodity not in raw:
            raw[commodity] = {}
        if key not in raw[commodity]:
            raw[commodity][key] = {}
        if detail not in raw[commodity][key]:
            raw[commodity][key][detail] = {'unit': unit, 'data': {}}
        raw[commodity][key][detail]['data'][year] = value

    # Build critical minerals set from CSV
    critical_set = set()
    for row in rows:
        if row.get('Is critical mineral 2025', '').strip().lower() == 'yes':
            c = row['Commodity'].strip()
            if c == 'Tio2 Pigment': c = 'TiO2 Pigment'
            critical_set.add(c)
    # Also add some key non-critical minerals
    extra = {'Aluminum', 'Copper', 'Gold', 'Iron Ore', 'Iron And Steel', 'Lead', 'Silver', 'Zinc',
             'Nickel', 'Lithium', 'Cobalt', 'Manganese', 'Rare Earths', 'Platinum', 'Palladium'}
    critical_set |= extra

    # Second pass: for each commodity+stat, pick the detail with most non-null data
    result = {}
    for commodity, stats in raw.items():
        if commodity not in critical_set:
            continue
        result[commodity] = {}
        for key, details in stats.items():
            best_detail = None
            best_count = -1
            for detail, info in details.items():
                count = sum(1 for v in info['data'].values() if v is not None)
                if count > best_count:
                    best_count = count
                    best_detail = detail
            if best_detail and best_count > 0:
                info = details[best_detail]
                result[commodity][key] = {
                    'unit': info['unit'],
                    'label': best_detail,
                    'data': info['data']
                }
        # Remove empty entries
        if not result[commodity]:
            del result[commodity]

    return result

# ─── 6. GS_CRITICAL set ───
def build_critical_set(rows):
    """Extract minerals marked as critical mineral 2025."""
    critical = set()
    for row in rows:
        if row.get('Is critical mineral 2025', '').strip().lower() == 'yes':
            commodity = row['Commodity'].strip()
            if commodity == 'Tio2 Pigment':
                commodity = 'TiO2 Pigment'
            critical.add(commodity)
    return sorted(critical)

# ─── 7. Country names used in World production ───
def build_country_list(rows):
    countries = set()
    for row in rows:
        if 'World' in row['Section']:
            c = row['Country'].strip()
            if c not in ('World total', 'Other countries', 'United States'):
                countries.add(c)
    return sorted(countries)

def main():
    print("Reading CSV...", file=sys.stderr)
    rows = read_main_csv()
    print(f"  {len(rows)} rows", file=sys.stderr)

    mode = sys.argv[1] if len(sys.argv) > 1 else 'all'

    if mode in ('supply', 'all'):
        print("\n// ─── USGS_SUPPLY_DATA ───", file=sys.stderr)
        supply = build_supply_data(rows)
        prod_count = len(supply['production'])
        resv_count = len(supply['reserves'])
        print(f"  Production: {prod_count} minerals, Reserves: {resv_count} minerals", file=sys.stderr)
        print("const USGS_SUPPLY_DATA = " + json.dumps(supply, ensure_ascii=False, separators=(',', ':')) + ";")

    if mode in ('reliance', 'all'):
        print("\n// ─── USGS_IMPORT_RELIANCE ───", file=sys.stderr)
        reliance = build_import_reliance()
        print(f"  {len(reliance)} minerals", file=sys.stderr)
        print("const USGS_IMPORT_RELIANCE = " + json.dumps(reliance, ensure_ascii=False, separators=(',', ':')) + ";")

    if mode in ('price', 'all'):
        print("\n// ─── USGS_PRICE_GROWTH ───", file=sys.stderr)
        prices = build_price_growth()
        print(f"  {len(prices)} minerals", file=sys.stderr)
        print("const USGS_PRICE_GROWTH = " + json.dumps(prices, ensure_ascii=False, separators=(',', ':')) + ";")

    if mode in ('critical', 'all'):
        print("\n// ─── USGS_CRITICAL_SUMMARY ───", file=sys.stderr)
        critical_sum = build_critical_summary()
        print(f"  {len(critical_sum)} minerals", file=sys.stderr)
        print("const USGS_CRITICAL_SUMMARY = " + json.dumps(critical_sum, ensure_ascii=False, separators=(',', ':')) + ";")

    if mode in ('salient', 'all'):
        print("\n// ─── USGS_US_SALIENT ───", file=sys.stderr)
        salient = build_us_salient(rows)
        print(f"  {len(salient)} commodities", file=sys.stderr)
        print("const USGS_US_SALIENT = " + json.dumps(salient, ensure_ascii=False, separators=(',', ':')) + ";")

    if mode in ('meta', 'all'):
        print("\n// ─── GS_CRITICAL (set) ───", file=sys.stderr)
        critical = build_critical_set(rows)
        print(f"  {len(critical)} critical minerals", file=sys.stderr)
        print("const GS_CRITICAL = new Set(" + json.dumps(critical, ensure_ascii=False) + ");")

        print("\n// ─── Country list ───", file=sys.stderr)
        countries = build_country_list(rows)
        print(f"  {len(countries)} countries", file=sys.stderr)
        for c in countries:
            print(f"  // {c}", file=sys.stderr)

if __name__ == '__main__':
    main()
