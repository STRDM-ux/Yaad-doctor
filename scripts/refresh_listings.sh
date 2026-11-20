#!/usr/bin/env bash
# Rebuilds data/listings.json from the open sources. Exits non-zero (and leaves the file untouched)
# if the result looks wrong: fewer than 90% of the current listings, or missing parishes.
set -euo pipefail
cd "$(dirname "$0")/.."
TMP=$(mktemp -d)
python3 -I scripts/fetch_sources.py "$TMP"
python3 -I scripts/build_data.py "$TMP" "$TMP/listings.json" >/dev/null
OLD=$(python3 -I -c "import json;print(json.load(open('data/listings.json'))['count'])")
python3 -I - "$TMP/listings.json" "$OLD" <<'PY'
import json, sys
d = json.load(open(sys.argv[1])); old = int(sys.argv[2])
n = d["count"]; parishes = {l["parish"] for l in d["listings"]}
assert n >= 0.9 * old, f"listing count dropped from {old} to {n}"
assert len(parishes - {None}) == 14, f"only {len(parishes)} parishes"
assert all(l["sources"] for l in d["listings"]), "listing without source"
print(f"ok: {old} -> {n} listings")
PY
python3 -I - "$TMP/listings.json" <<'PY'
import json, sys, datetime
d = json.load(open(sys.argv[1])); d["generated"] = datetime.date.today().isoformat()
json.dump(d, open("data/listings.json", "w"), ensure_ascii=False, indent=1)
PY
