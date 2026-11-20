export const metadata = { title: "Privacy policy" };
export default function Privacy() {
  return (
    <div className="wrap prose">
      <h1>Privacy <i>policy</i></h1>
      <p className="note">Last updated 20 November 2026. This policy should be reviewed by a Jamaican lawyer before launch.</p>
      <h2>Who we are</h2><p>Yaad Doctor runs a directory of health care providers in Jamaica, a marketplace that connects people with licensed insurance intermediaries, and Brokers HQ, software that brokers use to manage their clients.</p>
      <h2>What we collect</h2>
      <ul>
        <li><b>Quote requests:</b> your name, phone, email, parish, occupation, the cover you want and anything you choose to tell us.</li>
        <li><b>Broker accounts:</b> name, contact details and Financial Services Commission licence details.</li>
        <li><b>Client records in Brokers HQ:</b> brokers store their clients' details and documents. For that information the broker is responsible for deciding how it is used, and Yaad Doctor stores it on their behalf.</li>
        <li><b>E-signatures:</b> the name you type, your drawn signature, the time, your IP address and device, kept as evidence of signing.</li>
      </ul>
      <h2>How we use it</h2><p>We send your quote request only to the brokers you choose or that we match you with (at most three). We never sell personal information. We use service providers to host the site and store data securely, including Vercel and Supabase.</p>
      <h2>Security</h2><p>Documents are stored in private, encrypted storage. Each broker can access only their own clients, enforced by the database itself. Signing links are single-use secrets that expire after 14 days.</p>
      <h2>Your rights</h2><p>Under Jamaica's Data Protection Act, 2020 you can ask to see, correct or delete your information. Contact the broker who holds your file, or contact us.</p>
    </div>
  );
}
