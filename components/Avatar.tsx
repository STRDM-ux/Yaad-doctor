import { initials, type Listing } from "@/lib/data";
export default function Avatar({ l, large }: { l: Listing; large?: boolean }) {
  return (
    <div className={`avatar k-${l.kind}${large ? " lg" : ""}`} aria-hidden>
      {l.photo ? <img src={l.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initials(l.name)}
    </div>
  );
}
