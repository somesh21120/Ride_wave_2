import { ShieldCheck, Wallet, Clock, Heart, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import PageHeader from "../components/PageHeader";
const VALUES = [
  { icon: ShieldCheck, title: "Safety First", desc: "Every driver is verified, and every ride is tracked from start to finish." },
  { icon: Wallet, title: "Fair Pricing", desc: "Transparent, upfront fares with no last-minute surge surprises." },
  { icon: Clock, title: "Reliability", desc: "Available around the clock, so you're never stuck waiting." },
  { icon: Heart, title: "Community", desc: "Built to support both riders and driver-partners fairly." },
];
const About = () => (
  <div style={{ background: "var(--bg-secondary)", minHeight: "100%" }}>
    <PageHeader centered maxWidth="760px" eyebrow="About RideWave" title="Making city travel simple, fair, and reliable"
      subtitle="RideWave connects passengers with nearby drivers in real time, combining live tracking, transparent pricing, and secure payments in one platform." />
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "56px 24px 64px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px", alignItems: "center", marginBottom: "64px" }} className="rw-grid-2">
        <div>
          <h2 style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: "1.5rem", fontFamily: "var(--font-display)", letterSpacing: "-0.02em", marginBottom: "14px" }}>Our Mission</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", lineHeight: 1.75, marginBottom: "14px" }}>We built RideWave to make getting around the city effortless. Whether you're commuting to work, heading to the airport, or exploring a new neighborhood, we want your ride to be quick to book, easy to track, and fairly priced.</p>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", lineHeight: 1.75 }}>On the other side of every trip is a driver-partner earning a living on their own schedule. We're just as focused on making RideWave work well for them as we are for riders.</p>
        </div>
        <div className="rw-card" style={{ padding: "28px" }}>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: 1.6 }}>RideWave connects passengers with nearby drivers in real time, combining live tracking, transparent pricing, and secure payments in one platform.</p>
        </div>
      </div>
      <h2 style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: "1.5rem", fontFamily: "var(--font-display)", letterSpacing: "-0.02em", marginBottom: "24px", textAlign: "center" }}>What We Stand For</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "20px", marginBottom: "56px" }} className="rw-grid-2">
        {VALUES.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="rw-card" style={{ padding: "22px", display: "flex", gap: "16px" }}>
            <div style={{ background: "var(--brand-light)", borderRadius: "10px", width: "42px", height: "42px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon size={20} color="var(--brand)" /></div>
            <div><p style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: "0.95rem", marginBottom: "4px" }}>{title}</p><p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", lineHeight: 1.6 }}>{desc}</p></div>
          </div>
        ))}
      </div>
      <div className="rw-card" style={{ padding: "36px", textAlign: "center", background: "var(--brand-light)", border: "none" }}>
        <h3 style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: "1.25rem", marginBottom: "8px" }}>Want to be part of the journey?</h3>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: "20px" }}>Sign up as a rider or driver-partner today.</p>
        <Link to="/register/passenger" style={{ textDecoration: "none" }}><button className="rw-btn-primary" style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>Get Started <ArrowRight size={16} /></button></Link>
      </div>
    </div>
  </div>
);
export default About;
