"""Download the open data sources used by build_data.py into a directory.

Usage: python3 -I scripts/fetch_sources.py <out_dir>
Sources: OpenStreetMap via Overpass (ODbL), UK FCDO list of medical facilities in Jamaica (OGL v3).
The Maritime Authority list and the Heart Institute entry are maintained by hand in build_data.py.
Never add sources whose robots.txt or terms forbid automated collection (e.g. findyello.com, jm.usembassy.gov).
"""
import html, json, re, sys, time, urllib.parse, urllib.request

OUT = sys.argv[1]
UA = {"User-Agent": "YaadDoctorDataRefresh/1.0 (open-data directory refresh)"}
MIRRORS = ["https://maps.mail.ru/osm/tools/overpass/api/interpreter", "https://overpass-api.de/api/interpreter",
           "https://overpass.kumi.systems/api/interpreter", "https://overpass.private.coffee/api/interpreter"]

def overpass(q):
    last = None
    for m in MIRRORS:
        for attempt in range(1):
            try:
                req = urllib.request.Request(m, data=urllib.parse.urlencode({"data": q}).encode(), headers=UA)
                with urllib.request.urlopen(req, timeout=150) as r:
                    d = json.load(r)
                    if d.get("elements"): return d
            except Exception as e:  # try next mirror
                last = e; time.sleep(5)
    raise SystemExit(f"Overpass failed on all mirrors: {last}")

AREA = 'area["ISO3166-1"="JM"][admin_level=2]->.jm;'
osm = overpass('[out:json][timeout:180];' + AREA + '(nwr["amenity"~"^(doctors|clinic|hospital|dentist|pharmacy)$"](area.jm);nwr["healthcare"](area.jm););out center tags;')
json.dump(osm, open(f"{OUT}/osm.json", "w"))
par = overpass('[out:json][timeout:180];' + AREA + 'rel(area.jm)["boundary"="administrative"]["admin_level"="6"];out geom;')
json.dump(par, open(f"{OUT}/parishes.json", "w"))

u = "https://www.gov.uk/api/content/government/publications/list-of-medical-facilitiespractitioners-in-jamaica/list-of-medical-facilities-in-jamaica"
with urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=60) as r:
    body = json.load(r)["details"]["body"]
rows = []
for tr in re.findall(r"<tr>(.*?)</tr>", body, re.S):
    rows.append([html.unescape(re.sub(r"<[^>]+>", "", c)).strip() for c in re.findall(r"<t[dh][^>]*>(.*?)</t[dh]>", tr, re.S)])
json.dump(rows, open(f"{OUT}/fcdo.json", "w"))
print(f"osm={len(osm['elements'])} parishes={len(par['elements'])} fcdo_rows={len(rows)-1}")
