import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";
import { MDLINK_URL } from "@/lib/data";

export const metadata: Metadata = {
  title: { default: "Yaad Doctor — find care across Jamaica", template: "%s · Yaad Doctor" },
  description: "Find doctors, hospitals, clinics, dentists and pharmacies across all 14 parishes of Jamaica, or see a doctor online in minutes through MDLink. Built for people who work for themselves.",
};
export const viewport: Viewport = { themeColor: "#0f4a30", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-JM">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400..600;1,9..144,400..600&family=JetBrains+Mono:wght@400;500&family=Manrope:wght@400;500;600;700&display=swap" />
        <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='9' fill='%230f4a30'/%3E%3Cpath d='M13 8h6v5h5v6h-5v5h-6v-5H8v-6h5z' fill='%23e8732a'/%3E%3C/svg%3E" />
      </head>
      <body>
        <a href="#main" className="btn btn-sm btn-ghost" style={{ position: "absolute", left: -9999 }}>Skip to content</a>
        <nav className="nav" aria-label="Main">
          <div className="wrap">
            <Link href="/" className="logo"><span className="logo-mark" aria-hidden>✚</span>Yaad<em>Doctor</em></Link>
            <div className="nav-links">
              <Link href="/find">Find care</Link>
              <Link href="/online" className="hide-sm">Online visits</Link>
              <Link href="/about" className="hide-sm">About the data</Link>
              <a className="btn btn-orange btn-sm" href={MDLINK_URL} target="_blank" rel="noopener">See a doctor now</a>
            </div>
          </div>
        </nav>
        <main id="main">{children}</main>
        <footer className="site">
          <div className="wrap">
            <p style={{ margin: 0 }}><b>Yaad Doctor</b> helps self-employed Jamaicans find care. In an emergency, call <a href="tel:119">119</a> or go to the nearest hospital.</p>
            <p style={{ margin: 0 }}>Listings come from public sources and may be out of date: please call ahead. Map data © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap contributors</a> (ODbL). Hospital details include public sector information from the UK FCDO, licensed under the <a href="https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/" target="_blank" rel="noopener">Open Government Licence v3.0</a>. Online visits are provided by MDLink, an independent service. <Link href="/about">Sources and corrections</Link>.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
