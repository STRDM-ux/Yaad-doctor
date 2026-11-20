import raw from "@/data/listings.json";

export type Kind = "doctor" | "hospital" | "clinic" | "dentist" | "pharmacy" | "lab";
export type Source = { name: string; url: string; date: string };
export type Listing = {
  id: string; name: string; kind: Kind; person: boolean; practice: string | null;
  specialties: string[]; services: string[]; phones: string[]; email: string | null; website: string | null;
  address: string | null; parish: string | null; lat: number; lon: number; approx: boolean;
  hours: string | null; emergency: boolean; sector: string | null; photo: string | null;
  verified_contact: boolean; sources: Source[];
};

export const listings = (raw as { listings: Listing[] }).listings;
export const generated = (raw as { generated: string }).generated;

export const PARISHES = ["Kingston", "St. Andrew", "St. Catherine", "Clarendon", "Manchester", "St. Elizabeth", "Westmoreland",
  "Hanover", "St. James", "Trelawny", "St. Ann", "St. Mary", "Portland", "St. Thomas"];

export const KIND_LABEL: Record<Kind, string> = {
  doctor: "Doctor", hospital: "Hospital", clinic: "Clinic / health centre", dentist: "Dentist", pharmacy: "Pharmacy", lab: "Laboratory",
};

export const MDLINK_URL = "https://themdlink.com/see-a-doctor";

export function specialtyCounts() {
  const m = new Map<string, number>();
  for (const l of listings) if (l.kind !== "pharmacy") for (const s of l.specialties) m.set(s, (m.get(s) ?? 0) + 1);
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
}

export function initials(name: string) {
  const words = name.replace(/^(dr\.?|doctor)\s+/i, "").replace(/[^A-Za-z\s'-]/g, " ").split(/\s+/).filter((w) => w.length > 1 && !/^(of|the|and|for|ltd|limited)$/i.test(w));
  return ((words[0]?.[0] ?? "") + (words[1]?.[0] ?? "")).toUpperCase() || "+";
}

export function telHref(p: string) { return "tel:" + p.replace(/\s/g, ""); }
export function mapsHref(l: Listing) {
  const q = l.approx ? `${l.name}, ${l.address ?? l.parish ?? ""}, Jamaica` : `${l.lat},${l.lon}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}
export function kmBetween(a: [number, number], b: [number, number]) {
  const R = 6371, r = Math.PI / 180, dLat = (b[0] - a[0]) * r, dLon = (b[1] - a[1]) * r;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * r) * Math.cos(b[0] * r) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
