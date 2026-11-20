import json, re, sys, os, difflib
D = sys.argv[1]; OUT = sys.argv[2]
osm = json.load(open(f'{D}/osm.json'))['elements']
par = json.load(open(f'{D}/parishes.json'))['elements']
fcdo = json.load(open(f'{D}/fcdo.json'))[1:]
OSM_DATE = '2026-11-20'

# parish point-in-polygon (even-odd over all outer segments)
PAR = []
for r in par:
    segs = []
    for m in r.get('members', []):
        if m.get('type') == 'way' and m.get('role') in ('outer', '') and 'geometry' in m:
            g = m['geometry']
            segs += [(g[i]['lon'], g[i]['lat'], g[i+1]['lon'], g[i+1]['lat']) for i in range(len(g)-1)]
    name = r['tags']['name'].replace('Saint ', 'St. ')
    PAR.append((name, segs))
def parish_of(lat, lon):
    for name, segs in PAR:
        inside = False
        for x1, y1, x2, y2 in segs:
            if (y1 > lat) != (y2 > lat):
                xi = x1 + (lat - y1) * (x2 - x1) / (y2 - y1)
                if xi > lon: inside = not inside
        if inside: return name
    # nearest-vertex fallback (coastal points)
    best = None
    for name, segs in PAR:
        for x1, y1, *_ in segs[::20]:
            d = (x1-lon)**2 + (y1-lat)**2
            if best is None or d < best[0]: best = (d, name)
    return best[1] if best else None

TOWNS = {  # approximate town centres, used only when a source gives no coordinates
 'Kingston 10': (18.0105, -76.7930), 'Kingston 5': (18.0120, -76.7830), 'Kingston 2': (17.9800, -76.7700),
 'Kingston 7': (18.0062, -76.7471), 'Kingston 6': (18.0300, -76.7650), 'Kingston': (17.9714, -76.7920),
 'Ocho Rios': (18.4078, -77.1031), 'Montego Bay': (18.4762, -77.8939), "St. Ann's Bay": (18.4362, -77.2009),
 'Annotto Bay': (18.2717, -76.7700), 'Black River': (18.0260, -77.8487), 'Falmouth': (18.4930, -77.6560),
 'Mandeville': (18.0417, -77.5071), 'Linstead': (18.1360, -77.0317), 'May Pen': (17.9645, -77.2453),
 'Lucea': (18.4510, -78.1736), 'Morant Bay': (17.8815, -76.4093), 'Spanish Town': (17.9911, -76.9574),
}

def norm(s): return re.sub(r'[^a-z0-9 ]', '', (s or '').lower()).strip()
def fmt_phone(p):
    if not p: return []
    out = []
    for part in re.split(r'[;/]| or ', p):
        digits = re.sub(r'\D', '', part)
        if len(digits) == 7: digits = '1876' + digits
        if len(digits) == 10: digits = '1' + digits
        if len(digits) >= 11 and digits.startswith('1876'):
            d = digits[:11]; out.append(f'+1 876 {d[4:7]} {d[7:11]}')
    return list(dict.fromkeys(out))

SPEC_WORDS = [
 (r'eye|optic|vision|ophthal', 'Eye care'), (r'dental|dentist|teeth|smile|orthodon', 'Dentistry'),
 (r'heart|cardi', 'Cardiology'), (r'child|paediat|pediat|kiddie', 'Paediatrics'),
 (r'women|gyna|gyne|obstet|maternity|fertility', 'Obstetrics & gynaecology'),
 (r'skin|derma', 'Dermatology'), (r'psych|mental|bellevue', 'Psychiatry & mental health'),
 (r'chest|lung|pulmon', 'Pulmonology'), (r'mri|imaging|radiolog|x-ray|scan', 'Imaging & radiology'),
 (r'lab\b|laborator|diagnostic', 'Laboratory'), (r'chiropract|physio|rehab', 'Physio & chiropractic'),
 (r'kidney|renal|dialysis|nephro', 'Nephrology'), (r'cancer|oncol', 'Oncology'), (r'\bent\b|otolaryn|ear nose', 'ENT'),
 (r'surg', 'Surgery'), (r'ortho', 'Orthopaedics'), (r'hiv|sexual', 'Sexual health'),
]
SPEC_TAG = {'gynaecology': 'Obstetrics & gynaecology', 'dermatology': 'Dermatology', 'psychiatry': 'Psychiatry & mental health',
 'cardiology': 'Cardiology', 'nephrology': 'Nephrology', 'pulmonology': 'Pulmonology', 'cosmetic': 'Cosmetic medicine',
 'naturopathy': 'Naturopathy', 'dentist': 'Dentistry', 'dentistry': 'Dentistry', 'general': 'General practice'}

def kind_of(t):
    a = t.get('amenity') or ''; h = t.get('healthcare') or ''
    if a == 'pharmacy' or h == 'pharmacy': return 'pharmacy'
    if a == 'dentist' or h == 'dentist': return 'dentist'
    if a == 'hospital' or h == 'hospital': return 'hospital'
    if a == 'doctors' or h == 'doctor': return 'doctor'
    if h == 'laboratory': return 'lab'
    return 'clinic'

def specialties(name, t, kind):
    s = []
    for tag in (t.get('healthcare:speciality') or '').split(';'):
        if tag in SPEC_TAG: s.append(SPEC_TAG[tag])
    for rx, lab in SPEC_WORDS:
        if re.search(rx, name.lower()): s.append(lab)
    if kind == 'dentist': s.append('Dentistry')
    if kind == 'lab': s.append('Laboratory')
    if not s and kind in ('doctor', 'clinic'): s.append('General practice')
    if kind == 'clinic' and re.search(r'health cent', name.lower()): s = ['Public health centre'] + [x for x in s if x != 'General practice']
    return list(dict.fromkeys(s))

def is_person(name): return bool(re.match(r'(dr\.?|doctor)\s', name.lower()))

recs = []
skip_names = {'pharmacy', 'clinic', 'hospital', 'health centre', 'health center', 'dentist', 'doctor', 'community health center'}
for e in osm:
    t = e.get('tags', {}); name = (t.get('name') or '').strip()
    if not name or norm(name) in skip_names: continue
    if t.get('healthcare:speciality') == 'holiday_rental' or 'heart trust' in name.lower(): continue
    if t.get('healthcare') in ('alternative',) and t.get('amenity') is None: continue
    lat = e.get('lat') or e.get('center', {}).get('lat'); lon = e.get('lon') or e.get('center', {}).get('lon')
    if lat is None: continue
    kind = kind_of(t)
    addr = ', '.join(x for x in [ ' '.join(y for y in [t.get('addr:housenumber'), t.get('addr:street')] if y), t.get('addr:city') ] if x)
    recs.append(dict(
        id=f"osm-{e['type'][0]}{e['id']}", name=name, kind=kind,
        person=is_person(name), specialties=specialties(name, t, kind),
        phones=fmt_phone(t.get('phone') or t.get('contact:phone')),
        email=t.get('email') or t.get('contact:email'), website=t.get('website') or t.get('contact:website'),
        address=addr or None, lat=round(lat, 6), lon=round(lon, 6), approx=False,
        hours=t.get('opening_hours'), emergency=t.get('emergency') == 'yes',
        sector='public' if re.search(r'government|ministry|serha|nerha|sera|wrha|health authority', (t.get('operator') or '').lower()) or re.search(r'health cent', name.lower()) else None,
        sources=[dict(name='OpenStreetMap contributors (ODbL)', url=f"https://www.openstreetmap.org/{e['type']}/{e['id']}", date=OSM_DATE)],
    ))

FCDO_URL = 'https://www.gov.uk/government/publications/list-of-medical-facilitiespractitioners-in-jamaica/list-of-medical-facilities-in-jamaica'
def town_from(addr):
    for k in sorted(TOWNS, key=len, reverse=True):
        if k.lower() in addr.lower(): return k
    return None
for name, email, tel, addr, _eng, spec, sector in fcdo:
    addr = re.sub(r',?\s*Jamaica,?\s*West Indies', '', addr).strip(' ,')
    sp = [x.strip() for x in re.split(r',', spec) if x.strip()][:12]
    sector = {'Private': 'private', 'Public': 'public', 'Public and Private': 'public & private'}.get(sector)
    match = None
    for r in recs:
        a, b = norm(r['name']), norm(name)
        if r['kind'] == 'hospital' and not r.get('_m') and a.split()[:1] == b.split()[:1] and difflib.SequenceMatcher(None, a, b).ratio() > 0.85: match = r; r['_m'] = 1; break
    phones = fmt_phone(tel)
    src = dict(name='UK Foreign, Commonwealth & Development Office list of medical facilities in Jamaica (OGL v3.0)', url=FCDO_URL, date='2020-09-02')
    if match:
        match['phones'] = list(dict.fromkeys(match['phones'] + phones)); match['email'] = match['email'] or email or None
        match['address'] = match['address'] or addr; match['sector'] = match['sector'] or sector
        match['services'] = sp; match['sources'].append(src); match['name'] = name
    else:
        town = town_from(addr) or 'Kingston'; lat, lon = TOWNS[town]
        recs.append(dict(id='fcdo-' + norm(name).replace(' ', '-'), name=name, kind='hospital', person=False,
            specialties=[], services=sp, phones=phones, email=email or None, website=None, address=addr,
            lat=lat, lon=lon, approx=True, hours=None, emergency=False, sector=sector, sources=[src]))

MAJ_URL = 'https://www.deutsche-flagge.de/de/redaktion/dokumente/dokumente-bsh/jamaica_rec_doctors.pdf/@@download/file/List%20of%20Recognized%20Medical%20Practitioners.pdf'
maj_src = dict(name='Maritime Authority of Jamaica, List of Recognized Medical Practitioners (Rev. 06, June 2022)', url=MAJ_URL, date='2022-06')
MAJ = [
 (['Dr. Barbara Isaacs', 'Dr. Horace Fisher', 'Dr. H.A. Hudson-Phillips', 'Dr. Dilini Desilva-Chen', 'Dr. Rosemary Weismann-Moore'], 'Oxford Medical Centre', '22H Old Hope Road, Kingston 5', 'Kingston 5', '(876) 926-1444', None),
 (['Dr. Osmond Tomlinson Jr.'], "Tomlinson's Medical & Child Health Centre", '65 Main Street, Ocho Rios, St. Ann', 'Ocho Rios', '(876) 974-2610', None),
 (['Dr. Albert Walker'], 'Baywest Wellness Center', 'Fairview Town Center, Bogue, Montego Bay', 'Montego Bay', '(876) 622-6508', None),
 (['Dr. Denton Barnes'], None, "4 Gloucester Drive, Windsor Road, St. Ann's Bay", "St. Ann's Bay", '(876) 972-1095', None),
 (['Dr. Kamika Peddie'], 'Kamric Medical Care', '8 Carvalho Drive, Kingston 10', 'Kingston 10', '(876) 678-1426', 'info@kamricmedicalcare.com'),
]
for docs, practice, addr, town, tel, email in MAJ:
    lat, lon = TOWNS[town]
    for d in docs:
        recs.append(dict(id='maj-' + norm(d).replace(' ', '-'), name=d, kind='doctor', person=True, practice=practice,
            specialties=['General practice', 'Occupational medicals'], phones=fmt_phone(tel), email=email, website=None,
            address=addr, lat=lat, lon=lon, approx=True, hours=None, emergency=False, sector='private', sources=[maj_src]))

recs.append(dict(id='site-heart-institute-of-the-caribbean', name='Heart Institute of the Caribbean', kind='hospital', person=False,
    specialties=['Cardiology', 'Surgery', 'Imaging & radiology'], services=['Cardiac surgery', 'Catheterization', 'Cardiac imaging', 'Stress testing', 'Emergency room', 'Intensive care'],
    phones=fmt_phone('(876) 906-2105'), email='outpatientservices@caribbeanheart.com', website='https://caribbeanheart.com/',
    address='23 Balmoral Avenue, Kingston 10', lat=TOWNS['Kingston 10'][0], lon=TOWNS['Kingston 10'][1], approx=True, hours=None,
    emergency=True, sector='private', sources=[dict(name='Heart Institute of the Caribbean website (contact page)', url='https://caribbeanheart.com/contact/', date='2026-11-20')]))
for r in recs:
    r.pop('_m', None)
    if r.get('services'):
        extra=[lab for rx,lab in SPEC_WORDS if re.search(rx, ' '.join(r['services']).lower())]
        r['specialties']=list(dict.fromkeys(r['specialties']+extra))
    r['parish'] = parish_of(r['lat'], r['lon'])
    r.setdefault('services', []); r.setdefault('practice', None)
    r['photo'] = None  # no practice-published photos verified; UI renders initials
    if r['kind'] == 'hospital' and not r['specialties']: r['specialties'] = ['Hospital care']
    if r['kind'] == 'pharmacy': r['specialties'] = ['Pharmacy']
    r['verified_contact'] = bool(r['phones'] or r['email'])
recs.sort(key=lambda r: (r['kind'] != 'doctor', not r['verified_contact'], r['name']))
json.dump(dict(generated='2026-11-20', count=len(recs), listings=recs), open(OUT, 'w'), ensure_ascii=False, indent=1)
import collections
print(len(recs), collections.Counter(r['kind'] for r in recs), sum(r['verified_contact'] for r in recs))
print(collections.Counter(r['parish'] for r in recs))
print(collections.Counter(s for r in recs for s in r['specialties']).most_common())
