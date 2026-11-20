export const PRODUCTS = [
  { id: "health-individual", name: "Individual health", blurb: "Doctor visits, prescriptions, tests and hospital stays for you." },
  { id: "health-family", name: "Family health", blurb: "One plan that covers your partner and children too." },
  { id: "life", name: "Life insurance", blurb: "A payout for your family if something happens to you." },
  { id: "critical-illness", name: "Critical illness", blurb: "A lump sum if you are diagnosed with cancer, a heart attack, stroke and more." },
  { id: "income-protection", name: "Income protection", blurb: "Replaces part of your income if illness or injury stops you working." },
  { id: "personal-accident", name: "Personal accident", blurb: "Cover for injuries on the job site, on the road or on stage." },
  { id: "dental-vision", name: "Dental & vision", blurb: "Check-ups, cleanings, glasses and contacts." },
  { id: "travel-medical", name: "Travel medical", blurb: "Medical cover for gigs, jobs and trips overseas." },
  { id: "business-equipment", name: "Tools & equipment", blurb: "Protects the instruments, tools and gear you earn with." },
] as const;
export const productName = (id: string) => PRODUCTS.find((p) => p.id === id)?.name ?? id;
export const INSURERS = ["Sagicor", "Guardian Life", "Canopy Insurance", "BUPA", "Other"];
export const LICENCE_TYPES: Record<string, string> = { broker: "Insurance broker", agent: "Insurance agent", agency: "Agency / corporate agent", sales_rep: "Sales representative" };
export const PLANS = [
  { id: "starter", name: "Starter", price: "Free", per: "", features: ["Verified profile in the marketplace", "Up to 5 new leads a month", "10 client records", "3 e-signatures a month"] },
  { id: "pro", name: "Pro", price: "J$9,900", per: "/month", features: ["Unlimited leads", "Unlimited clients and secure document vault", "Unlimited e-signatures with audit certificates", "Priority placement in your parishes"] },
  { id: "agency", name: "Agency", price: "J$29,900", per: "/month", features: ["Everything in Pro", "Featured badge and top placement island-wide", "Up to 5 team members (coming soon)", "Monthly performance report"] },
];
