import ClaimForm from "@/components/ClaimForm";
import { listings } from "@/lib/data";
export const metadata = { title: "For practices", description: "Claim your free listing on Yaad Doctor, add the insurance cards you accept, or get featured." };
export default async function Practices({ searchParams }: { searchParams: Promise<{ listing?: string }> }) {
  const { listing } = await searchParams;
  const l = listings.find((x) => x.id === listing);
  return (
    <div className="wrap hero" style={{ alignItems: "start" }}>
      <div>
        <span className="eyebrow">For doctors, clinics and pharmacies</span>
        <h1>Get found by <i>new patients.</i></h1>
        <p className="lede">Thousands of self-employed Jamaicans have no company doctor. Make sure they find you: claim your free listing to correct your details, add the insurance cards you accept and your opening hours.</p>
        <div className="grid" style={{ gap: 10, maxWidth: 560 }}>
          <div className="step"><span className="num">Free</span><h3>Claimed listing</h3><p>Correct contact details, opening hours, insurance accepted and specialities.</p></div>
          <div className="step"><span className="num">J$4,900 / month</span><h3>Featured</h3><p>Top placement in your parish and speciality, your own practice photo, and an "Accepting new patients" badge.</p></div>
        </div>
      </div>
      <ClaimForm listingId={l?.id} practice={l?.name} />
    </div>
  );
}
