import { useState } from "react";
import { ChevronDown, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import PageHeader from "../components/PageHeader";
const FAQS = [
  { q: "How do I book a ride?", a: "Sign in, go to \"Book a Ride,\" enter your pickup and dropoff locations (or use the location button to auto-detect your pickup), choose a ride type, and confirm your booking. A nearby driver will be matched to your trip." },
  { q: "How is the fare calculated?", a: "Fares are based on a base fare plus a per-kilometer rate that varies by ride type (Bike, Auto, or Car). You'll always see the estimated fare before you confirm your booking." },
  { q: "What payment methods are accepted?", a: "You can pay with cash directly to your driver, or choose the online payment option at checkout for a card-based transaction." },
  { q: "How do I become a driver?", a: "Register for an account and select \"Driver\" as your account type. Once registered, you can view and accept ride requests from your driver dashboard." },
  { q: "Can I cancel a ride after booking?", a: "Yes. Rides can be cancelled from \"My Rides\" as long as a driver hasn't been assigned yet. Once a driver accepts, cancellation options may be limited." },
  { q: "Is my payment information secure?", a: "Yes. All transactions are encrypted, and RideWave never stores raw card details on its own servers." },
  { q: "What if I have an issue with my driver or ride?", a: "Reach out through our Contact page with your ride details, and our support team will help resolve it." },
];
const FAQItem = ({ q, a, open, onClick }) => (
  <div className="rw-card" style={{ padding: "0", overflow: "hidden" }}>
    <button onClick={onClick} style={{ width: "100%", background: "none", border: "none", cursor: "pointer", padding: "18px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", textAlign: "left", fontFamily: "var(--font-sans)" }}>
      <span style={{ color: "var(--text-primary)", fontWeight: 600, fontSize: "0.95rem" }}>{q}</span>
      <ChevronDown size={18} color="var(--text-secondary)" style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s", flexShrink: 0, marginLeft: "12px" }} />
    </button>
    {open && (<div style={{ padding: "0 20px 18px" }}><p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", lineHeight: 1.7 }}>{a}</p></div>)}
  </div>
);
const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(0);
  return (
    <div style={{ background: "var(--bg-secondary)", minHeight: "100%" }}>
      <PageHeader centered maxWidth="760px" eyebrow="Support" title="Frequently Asked Questions"
        subtitle="Answers to the most common questions about booking, fares, payments, and driving with RideWave." />
      <div style={{ maxWidth: "720px", margin: "0 auto", padding: "56px 24px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "40px" }}>
          {FAQS.map((item, i) => (<FAQItem key={item.q} {...item} open={openIndex === i} onClick={() => setOpenIndex(openIndex === i ? -1 : i)} />))}
        </div>
        <div className="rw-card" style={{ padding: "28px", textAlign: "center", background: "var(--brand-light)", border: "none" }}>
          <MessageCircle size={26} color="var(--brand-dark)" style={{ marginBottom: "10px" }} />
          <h3 style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: "1.1rem", marginBottom: "6px" }}>Still have questions?</h3>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginBottom: "18px" }}>Our support team is happy to help with anything not covered here.</p>
          <Link to="/contact" style={{ textDecoration: "none" }}><button className="rw-btn-primary">Contact Support</button></Link>
        </div>
      </div>
    </div>
  );
};
export default FAQ;
