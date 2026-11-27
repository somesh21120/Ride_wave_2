import { Link } from "react-router-dom";
import PageHeader from "../components/PageHeader";
const SECTIONS = [
  { title: "1. Information We Collect", body: "We collect information you provide directly, such as your name, email, phone number, and role (passenger or driver). We also collect ride details like pickup/dropoff locations and fare information to operate the service." },
  { title: "2. Location Data", body: "With your permission, we use your device's location to detect your pickup point and to power live tracking during a ride. Location access can be controlled through your browser settings." },
  { title: "3. How We Use Your Information", body: "Your information is used to match you with drivers or ride requests, calculate fares, process payments, and improve the reliability of the platform." },
  { title: "4. Data Security", body: "We use industry-standard measures, including encrypted authentication tokens and hashed passwords, to protect your account information." },
  { title: "5. Sharing of Information", body: "Passenger and driver contact details (name and phone number) are shared with each other only for the duration of an active ride, to facilitate pickup and communication." },
  { title: "6. Cookies & Local Storage", body: "RideWave uses local storage in your browser to keep you signed in between visits. We do not use tracking cookies for advertising purposes." },
  { title: "7. Your Rights", body: "You can view and update your profile information at any time from your account settings. To request account deletion, contact our support team." },
  { title: "8. Changes to This Policy", body: "We may update this Privacy Policy periodically. Material changes will be reflected with an updated \"last updated\" date." },
];
const Privacy = () => (
  <div style={{ background: "var(--bg-secondary)", minHeight: "100%" }}>
    <PageHeader maxWidth="760px" eyebrow="Legal" title="Privacy Policy" subtitle="Last updated: July 2026" />
    <div style={{ maxWidth: "760px", margin: "0 auto", padding: "48px 24px" }}>
      <div className="rw-card" style={{ padding: "32px" }}>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: 1.7, marginBottom: "28px" }}>This Privacy Policy explains what information RideWave collects, how it's used, and the choices you have regarding your data.</p>
        {SECTIONS.map(({ title, body }) => (<div key={title} style={{ marginBottom: "24px" }}><h2 style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: "1rem", marginBottom: "8px" }}>{title}</h2><p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", lineHeight: 1.75 }}>{body}</p></div>))}
        <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginTop: "32px", paddingTop: "20px", borderTop: "1px solid var(--border)" }}>Questions about your data? <Link to="/contact" style={{ color: "var(--brand)", fontWeight: 600 }}>Contact us</Link>.</p>
      </div>
    </div>
  </div>
);
export default Privacy;
