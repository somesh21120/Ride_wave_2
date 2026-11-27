import { Link } from "react-router-dom";
import PageHeader from "../components/PageHeader";
const SECTIONS = [
  { title: "1. Acceptance of Terms", body: "By creating an account or using RideWave, you agree to be bound by these Terms of Service. If you do not agree, please do not use the platform." },
  { title: "2. Who Can Use RideWave", body: "You must be at least 18 years old and able to form a legally binding contract to register as a passenger or driver-partner on RideWave." },
  { title: "3. Booking & Fares", body: "Estimated fares are calculated based on distance and ride type at the time of booking. Final fares may vary slightly based on route or ride conditions and are shown to you before payment." },
  { title: "4. Cancellations", body: "Passengers may cancel a ride before a driver is assigned at no charge. Cancellations after a driver has been assigned may be subject to a cancellation fee." },
  { title: "5. Driver-Partner Responsibilities", body: "Driver-partners agree to maintain a valid license, provide accurate vehicle information, and conduct rides safely and courteously." },
  { title: "6. Payments", body: "Payments may be made via cash or supported online payment methods. RideWave does not store raw card details on its own servers." },
  { title: "7. Limitation of Liability", body: "RideWave facilitates connections between passengers and driver-partners but is not liable for the conduct of either party during a ride, to the fullest extent permitted by law." },
  { title: "8. Changes to These Terms", body: "We may update these Terms from time to time. Continued use of RideWave after changes take effect constitutes acceptance of the revised Terms." },
];
const Terms = () => (
  <div style={{ background: "var(--bg-secondary)", minHeight: "100%" }}>
    <PageHeader maxWidth="760px" eyebrow="Legal" title="Terms of Service" subtitle="Last updated: July 2026" />
    <div style={{ maxWidth: "760px", margin: "0 auto", padding: "48px 24px" }}>
      <div className="rw-card" style={{ padding: "32px" }}>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: 1.7, marginBottom: "28px" }}>These Terms of Service govern your use of RideWave. Please read them carefully before using the platform as a passenger or driver-partner.</p>
        {SECTIONS.map(({ title, body }) => (<div key={title} style={{ marginBottom: "24px" }}><h2 style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: "1rem", marginBottom: "8px" }}>{title}</h2><p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", lineHeight: 1.75 }}>{body}</p></div>))}
        <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginTop: "32px", paddingTop: "20px", borderTop: "1px solid var(--border)" }}>Questions about these Terms? <Link to="/contact" style={{ color: "var(--brand)", fontWeight: 600 }}>Contact us</Link>.</p>
      </div>
    </div>
  </div>
);
export default Terms;
