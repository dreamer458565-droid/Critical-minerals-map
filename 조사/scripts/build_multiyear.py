#!/usr/bin/env python3
"""
Multi-year USGS MCS data merger (2020-2025)
Combines MCS2022, MCS2024, MCS2026 world production/reserves into a single JS file.

Priority (latest edition wins):
  - 2020, 2021: MCS2022
  - 2022, 2023: MCS2024
  - 2024, 2025: MCS2026
"""
import csv, json, re, sys, os, glob
from collections import defaultdict

# ─── Paths ───
MCS2022_DIR = "/Users/theoai/내 드라이브/회사파일/14_USGS/데이터/MCS2022_Data/world"
MCS2024_DIR = "/Users/theoai/내 드라이브/회사파일/14_USGS/데이터/MCS2024_Data"
MCS2026_CSV = "/Users/theoai/내 드라이브/회사파일/14_USGS/데이터/MCS2026_Mineral_Industry_Trends_and_Salient_Statistics/MCS2026_Commodities_Data.csv"
OUTPUT_JS = "/tmp/supply_multiyear.js"

# ─── Country normalization ───
COUNTRY_NORMALIZE = {
    'C\x92te d\x92Ivoire': "Côte d'Ivoire",
    'Côte dIvoire': "Côte d'Ivoire",
    'CÃ´te dâ\x80\x99Ivoire': "Côte d'Ivoire",
    'World total (rounded)': 'World total',
}

def normalize_country(c):
    c = c.strip()
    return COUNTRY_NORMALIZE.get(c, c)

# ─── Value parsing ───
def parse_value(v):
    if v is None:
        return None
    v = v.strip()
    if v in ('W', '--', 'NA', '', 'E', 'XX', 'e', 's', 'S', '(4)', '(3)', '(2)', '(1)'):
        return None
    if v.startswith('(') and v.endswith(')'):
        return None  # footnote references
    v = v.replace(',', '').replace('\xa0', '')
    m = re.match(r'^[><]?\s*([0-9.]+)\s*$', v)
    if m:
        try:
            return float(m.group(1))
        except ValueError:
            return None
    return None

# ─── Unit extraction from column names ───
def extract_unit_from_col(col):
    """Extract unit from column name like Prod_kt_2020, Prod_t_Est_2021, etc."""
    col_lower = col.lower()
    if '_mmt_' in col_lower or '_mmt' in col_lower:
        return 'million metric tons'
    if '_kt_' in col_lower or '_kt' in col_lower:
        return 'thousand metric tons'
    if '_kg_' in col_lower or '_kg' in col_lower:
        return 'kilograms'
    if '_t_' in col_lower or col_lower.endswith('_t'):
        return 'metric tons'
    return 'metric tons'

# ─── Detect production columns in MCS2022/2024 CSVs ───
def find_prod_columns(headers, edition_year):
    """Find production value columns and their years.
    Returns list of (col_name, year_str, unit).
    Skips capacity, reserves, notes columns.
    """
    results = []
    for h in headers:
        h_lower = h.lower()
        # Skip non-production columns
        if any(kw in h_lower for kw in ['cap_', 'reserves', 'notes', 'source', 'country', 'type']):
            continue
        if 'prod' not in h_lower:
            continue
        # Extract year from column name
        year_match = re.search(r'(\d{4})', h)
        if year_match:
            year = year_match.group(1)
            unit = extract_unit_from_col(h)
            results.append((h, year, unit))
    return results

# ─── Parse MCS2022/2024 world CSVs ───
def parse_old_mcs_csvs(directory, edition_tag):
    """Parse individual world CSV files from MCS2022 or MCS2024.
    Returns dict: {mineral: {year: {country: value, '_unit': unit, '_type': type}}}
    """
    data = {}
    pattern = os.path.join(directory, '*_world.csv')
    files = glob.glob(pattern)
    if not files:
        # Try case-insensitive
        pattern2 = os.path.join(directory, '*_world.csv')
        files = glob.glob(pattern2)

    print(f"  Found {len(files)} world CSV files in {edition_tag}")

    for filepath in sorted(files):
        fname = os.path.basename(filepath).lower()
        try:
            # Try utf-8-sig first, fall back to latin-1
            enc = 'utf-8-sig'
            try:
                with open(filepath, encoding='utf-8-sig') as f:
                    f.read(100)
            except UnicodeDecodeError:
                enc = 'latin-1'
            with open(filepath, encoding=enc) as f:
                reader = csv.DictReader(f)
                headers = reader.fieldnames
                if not headers:
                    continue
                # Clean headers (remove \r etc)
                headers = [h.strip().replace('\r', '') for h in headers]

                prod_cols = find_prod_columns(headers, edition_tag)
                if not prod_cols:
                    print(f"    SKIP (no prod cols): {fname} — cols: {headers}")
                    continue

                rows = list(reader)
                if not rows:
                    continue

                # Determine mineral name from Type column of first data row
                first_type = rows[0].get('Type', '').strip().replace('\r', '')
                # Determine mineral from filename + type
                mineral_name = derive_mineral_name(fname, first_type, edition_tag)
                if mineral_name is None:
                    print(f"    SKIP (can't derive mineral): {fname}")
                    continue

                unit = prod_cols[0][2]  # unit from first prod column

                for row in rows:
                    country = normalize_country(row.get('Country', '').strip().replace('\r', ''))
                    row_type = row.get('Type', '').strip().replace('\r', '')

                    # Determine sub-mineral for titanium/silicon etc
                    sub_mineral = resolve_sub_mineral(mineral_name, row_type, fname)

                    for col_name, year_str, col_unit in prod_cols:
                        val = parse_value(row.get(col_name, row.get(col_name.strip(), '')))

                        if sub_mineral not in data:
                            data[sub_mineral] = {}
                        if year_str not in data[sub_mineral]:
                            data[sub_mineral][year_str] = {'_unit': col_unit, '_type': row_type, '_countries': defaultdict(float), '_world_total': None}

                        entry = data[sub_mineral][year_str]
                        if country == 'World total':
                            if val is not None:
                                if entry['_world_total'] is None:
                                    entry['_world_total'] = 0
                                entry['_world_total'] += val
                        elif val is not None:
                            entry['_countries'][country] += val

        except Exception as e:
            print(f"    ERROR reading {fname}: {e}")

    return data


# ─── Mineral name derivation from filename ───
# Map from filename prefix to a canonical mineral name.
# The actual commodity name is refined by the Type column content.
FILENAME_TO_MINERAL = {
    'abras': 'Abrasives (Manufactured)',
    'alumi': 'Aluminum',
    'antim': 'Antimony',
    'arsen': 'Arsenic',
    'asbes': 'Asbestos',
    'barit': 'Barite',
    'bauxi': 'Bauxite',
    'beryl': 'Beryllium',
    'bismu': 'Bismuth',
    'boron': 'Boron',
    'bromi': 'Bromine',
    'cadmi': 'Cadmium',
    'cemen': 'Cement',
    'chrom': 'Chromium',
    'clays': 'Clays',
    'cobal': 'Cobalt',
    'coppe': 'Copper',
    'diamo': 'Diamond (Industrial)',
    'diato': 'Diatomite',
    'felds': 'Feldspar And Nepheline Syenite',
    'feore': 'Iron Ore',
    'fepig': 'Iron Oxide Pigments',
    'feste': 'Iron And Steel',
    'fluor': 'Fluorspar',
    'galli': 'Gallium',
    'garne': 'Garnet (Industrial)',
    'gemst': 'Gemstones',
    'germa': 'Germanium',
    'gold': 'Gold',
    'graph': 'Graphite (Natural)',
    'gypsu': 'Gypsum',
    'heliu': 'Helium',
    'indiu': 'Indium',
    'iodin': 'Iodine',
    'kyani': 'Kyanite And Related Minerals',
    'lead': 'Lead',
    'lime': 'Lime',
    'lithi': 'Lithium',
    'manga': 'Manganese',
    'mercu': 'Mercury',
    'mgcomp': 'Magnesium Compounds',
    'mgmet': 'Magnesium Metal',
    'mica': 'Mica (Natural)',
    'molyb': 'Molybdenum',
    'nicke': 'Nickel',
    'niobi': 'Niobium (Columbium)',
    'nitro': 'Nitrogen (Fixed)—Ammonia',
    'peat': 'Peat',
    'perli': 'Perlite',
    'phosp': 'Phosphate Rock',
    'plati': 'Platinum-Group Metals',
    'potas': 'Potash',
    'pumic': 'Pumice And Pumicite',
    'raree': 'Rare Earths',
    'rheni': 'Rhenium',
    'salt': 'Salt',
    'sandi': 'Sand And Gravel (Industrial)',
    'selen': 'Selenium',
    'silve': 'Silver',
    'simet': 'Silicon',
    'sodaa': 'Soda Ash',
    'stond': 'Stone (Dimension)',
    'stonc': 'Stone (Crushed)',
    'stron': 'Strontium',
    'sulfu': 'Sulfur',
    'talc': 'Talc And Pyrophyllite',
    'tanta': 'Tantalum',
    'tellu': 'Tellurium',
    'timin': 'Titanium Mineral Concentrates',
    'tin': 'Tin',
    'titan': 'Titanium Sponge Metal',
    'tungs': 'Tungsten',
    'vanad': 'Vanadium',
    'vermi': 'Vermiculite',
    'wolla': 'Wollastonite',
    'zeoli': 'Zeolites (Natural)',
    'zinc': 'Zinc',
    'zirco': 'Zirconium',
}

def derive_mineral_name(fname, first_type, edition_tag):
    """Get mineral name from filename prefix."""
    # Extract prefix: mcs20XX-PREFIX_world.csv
    m = re.match(r'mcs\d{4}-([a-z]+)_world\.csv', fname.lower())
    if not m:
        return None
    prefix = m.group(1)
    name = FILENAME_TO_MINERAL.get(prefix, None)
    if name:
        name = MINERAL_NAME_NORMALIZE.get(name, name)
    return name


# Mineral name normalization across editions
MINERAL_NAME_NORMALIZE = {
    'Nitrogen (Fixed)\u2014Ammonia': 'Nitrogen (Fixed)\u2014Ammonia',  # already correct
    'Nitrogen (Fixed)\x97Ammonia': 'Nitrogen (Fixed)\u2014Ammonia',   # latin-1 em-dash
    'Nitrogen (Fixed)—Ammonia': 'Nitrogen (Fixed)\u2014Ammonia',      # file map name
}


def resolve_sub_mineral(mineral_name, row_type, fname):
    """Handle titanium split and copper mine vs refinery."""
    row_type_lower = row_type.lower()

    # Titanium Mineral Concentrates split
    if mineral_name == 'Titanium Mineral Concentrates':
        if 'ilmenite' in row_type_lower:
            return 'Titanium Mineral Concentrates (Ilmenite)'
        elif 'rutile' in row_type_lower:
            return 'Titanium Mineral Concentrates (Rutile)'
        else:
            # Combined "Ilmenite and rutile" — keep as-is, will not split
            return 'Titanium Mineral Concentrates'

    # Copper: keep only mine production, not refinery
    if mineral_name == 'Copper':
        if 'refinery' in row_type_lower:
            return 'Copper (Refinery)'
        return 'Copper'

    # Aluminum: smelter production (not alumina)
    if mineral_name == 'Aluminum':
        if 'alumina' in row_type_lower:
            return 'Alumina'
        return 'Aluminum'

    # Platinum-Group Metals → split into Palladium and Platinum
    if mineral_name == 'Platinum-Group Metals':
        if 'palladium' in row_type_lower:
            return 'Palladium'
        elif 'platinum' in row_type_lower:
            return 'Platinum'
        return mineral_name

    return mineral_name


# ─── Parse MCS2026 ───
def parse_mcs2026():
    """Parse MCS2026 big CSV for World Production and Reserves.
    Returns dict: {mineral: {year: {country: value, '_unit': ..., '_type': ..., '_world_total': ...}}}
    For both production and reserves.
    """
    prod_data = {}
    res_data = {}

    with open(MCS2026_CSV, encoding='latin-1') as f:
        reader = csv.DictReader(f)
        for row in reader:
            section = row.get('Section', '')
            if 'World' not in section:
                continue
            stat = row.get('Statistics', '').strip()
            if stat not in ('Production', 'Reserves'):
                continue

            commodity = row['Commodity'].strip()
            country = normalize_country(row['Country'].strip())
            detail = row.get('Statistics_detail', '').strip()
            year = row.get('Year', '').strip()
            unit = row.get('Unit', '').strip()
            value = parse_value(row.get('Value', ''))

            if year not in ('2023', '2024', '2025'):
                continue

            # Normalize mineral name
            commodity = MINERAL_NAME_NORMALIZE.get(commodity, commodity)

            # Titanium split
            if commodity == 'Titanium Mineral Concentrates':
                if 'ilmenite' in detail.lower():
                    commodity = 'Titanium Mineral Concentrates (Ilmenite)'
                elif 'rutile' in detail.lower():
                    commodity = 'Titanium Mineral Concentrates (Rutile)'

            # Copper split
            if commodity == 'Copper':
                if 'refinery' in detail.lower():
                    commodity = 'Copper (Refinery)'

            target = prod_data if stat == 'Production' else res_data

            if commodity not in target:
                target[commodity] = {}
            if year not in target[commodity]:
                target[commodity][year] = {
                    '_unit': unit,
                    '_type': detail.replace(': rounded', '').replace(', rounded', '').strip(),
                    '_countries': defaultdict(float),
                    '_world_total': None
                }

            entry = target[commodity][year]

            if country == 'World total':
                if value is not None:
                    if entry['_world_total'] is None:
                        entry['_world_total'] = 0
                    entry['_world_total'] += val if False else value
            elif value is not None and country != 'Other countries':
                entry['_countries'][country] += value
            elif country == 'Other countries' and value is not None:
                entry['_countries']['Other countries'] += value

    return prod_data, res_data


# ─── Merge logic ───
def merge_production(mcs2022_data, mcs2024_data, mcs2026_prod):
    """
    Merge production data with priority:
    2020-2021: MCS2022
    2022: MCS2024
    2023-2025: MCS2026
    """
    merged = {}

    # Collect all mineral names across all editions
    all_minerals = set()
    for d in [mcs2022_data, mcs2024_data, mcs2026_prod]:
        all_minerals.update(d.keys())

    for mineral in sorted(all_minerals):
        merged[mineral] = {}

        # 2020, 2021 from MCS2022
        src_2022 = mcs2022_data.get(mineral, {})
        for yr in ('2020', '2021'):
            if yr in src_2022:
                merged[mineral][yr] = src_2022[yr]

        # 2022, 2023 from MCS2024
        src_2024 = mcs2024_data.get(mineral, {})
        for yr in ('2022', '2023'):
            if yr in src_2024:
                merged[mineral][yr] = src_2024[yr]

        # 2023, 2024, 2025 from MCS2026 (overrides MCS2024's 2023)
        src_2026 = mcs2026_prod.get(mineral, {})
        for yr in ('2023', '2024', '2025'):
            if yr in src_2026:
                merged[mineral][yr] = src_2026[yr]

    # Remove minerals with no data, and combined Titanium (keep split only)
    merged = {m: yrs for m, yrs in merged.items()
              if yrs and m != 'Titanium Mineral Concentrates' and m != 'Copper (Refinery)'}
    return merged


def format_entry(year_data):
    """Convert internal year data to output format."""
    total = year_data['_world_total']
    unit = year_data['_unit']
    det = year_data['_type']
    countries = []

    for country, value in year_data['_countries'].items():
        pct = 0
        if total and total > 0:
            pct = round(value / total * 100, 1)
        countries.append({
            'country': country,
            'value': round(value, 2) if value != int(value) else int(value),
            'pct': pct
        })

    # Sort by value descending
    countries.sort(key=lambda x: x['value'], reverse=True)

    # Round world_total
    if total is not None:
        total = round(total, 2) if total != int(total) else int(total)

    return {
        'world_total': total,
        'unit': unit,
        'world_det': det,
        'countries': countries
    }


def build_output(merged_prod, reserves_2026):
    """Build final output structure."""
    production = {}
    for mineral in sorted(merged_prod):
        production[mineral] = {}
        for year in sorted(merged_prod[mineral]):
            production[mineral][year] = format_entry(merged_prod[mineral][year])

    reserves = {}
    for mineral in sorted(reserves_2026):
        reserves[mineral] = {}
        # Only keep latest year for reserves
        years = sorted(reserves_2026[mineral].keys())
        if years:
            latest = years[-1]
            reserves[mineral][latest] = format_entry(reserves_2026[mineral][latest])

    return {'production': production, 'reserves': reserves}


def write_js(data, outpath):
    """Write JS file."""
    js_str = json.dumps(data, ensure_ascii=False, separators=(',', ':'))
    with open(outpath, 'w', encoding='utf-8') as f:
        f.write(f"const USGS_SUPPLY_DATA = {js_str};\n")
    print(f"\nWritten to {outpath}")
    print(f"File size: {os.path.getsize(outpath):,} bytes")


# ─── Main ───
def main():
    print("=== Build Multi-Year USGS Supply Data (2020-2025) ===\n")

    # 1. Parse MCS2022 (years 2020-2021)
    print("1. Parsing MCS2022 world CSVs...")
    mcs2022 = parse_old_mcs_csvs(MCS2022_DIR, 'MCS2022')
    print(f"   → {len(mcs2022)} minerals extracted")

    # 2. Parse MCS2024 (year 2022)
    print("\n2. Parsing MCS2024 world CSVs...")
    mcs2024 = parse_old_mcs_csvs(MCS2024_DIR, 'MCS2024')
    print(f"   → {len(mcs2024)} minerals extracted")

    # 3. Parse MCS2026 (years 2023-2025)
    print("\n3. Parsing MCS2026 CSV...")
    mcs2026_prod, mcs2026_res = parse_mcs2026()
    print(f"   → {len(mcs2026_prod)} production minerals, {len(mcs2026_res)} reserves minerals")

    # 4. Merge
    print("\n4. Merging with priority rules...")
    merged_prod = merge_production(mcs2022, mcs2024, mcs2026_prod)
    print(f"   → {len(merged_prod)} total production minerals")

    # Report years per mineral
    year_counts = defaultdict(int)
    for mineral, years in merged_prod.items():
        n = len(years)
        year_counts[n] += 1
    for n in sorted(year_counts):
        print(f"     {year_counts[n]} minerals with {n} year(s)")

    # 5. Build output
    print("\n5. Building output...")
    output = build_output(merged_prod, mcs2026_res)

    # Stats
    prod_minerals = len(output['production'])
    res_minerals = len(output['reserves'])
    all_years = set()
    for m, yrs in output['production'].items():
        all_years.update(yrs.keys())
    print(f"   Production: {prod_minerals} minerals, years: {sorted(all_years)}")
    print(f"   Reserves: {res_minerals} minerals")

    # 6. Write
    write_js(output, OUTPUT_JS)

    # Summary
    print("\n=== Summary ===")
    print(f"Total production minerals: {prod_minerals}")
    print(f"Total reserves minerals: {res_minerals}")
    print(f"Years covered: {sorted(all_years)}")

    # Show a few minerals as sample
    print("\nSample minerals (first 10):")
    for mineral in list(output['production'].keys())[:10]:
        yrs = sorted(output['production'][mineral].keys())
        wt = output['production'][mineral].get(yrs[-1], {}).get('world_total', '?')
        print(f"  {mineral}: years={yrs}, latest world_total={wt}")


if __name__ == '__main__':
    main()
