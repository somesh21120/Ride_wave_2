import { useState } from "react";
import { Mail, Phone, MapPin, Send } from "lucide-react";
import { useToast } from "../context/ToastContext";
import MapComponent from "../components/MapComponent";
import PageHeader from "../components/PageHeader";
const OFFICE = { lat: 12.9716, lng: 77.5946, address: "MG Road, Bengaluru, Karnataka, India" };
const Contact = () => {
  const { toast } = useToast();
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sending, setSending] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    await new Promise((r) => setTimeout(r, 700));
    toast("Message sent! We'll get back to you soon.", "success");
    setForm({ name: "", email: "", subject: "", message: "" });
    setSending(false);
  };
  return (
    <div style={{ background: "var(--bg-secondary)", minHeight: "100%" }}>
      <PageHeader centered maxWidth="760px" eyebrow="Contact Us" title="We'd love to hear from you"
        subtitle="Questions, feedback, or an issue with a ride? Send us a message and our team will respond shortly." />
      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "56px 24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", alignItems: "start" }} className="rw-grid-2">
        <div className="rw-card" style={{ padding: "28px" }}>
          <h2 style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: "1.15rem", marginBottom: "20px" }}>Send us a message</h2>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div><label className="rw-label">Your Name</label><input className="rw-input" placeholder="John Doe" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
            <div><label className="rw-label">Email Address</label><input type="email" className="rw-input" placeholder="you@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></div>
            <div><label className="rw-label">Subject</label><input className="rw-input" placeholder="How can we help?" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required /></div>
            <div><label className="rw-label">Message</label><textarea className="rw-input" placeholder="Tell us more..." rows={5} style={{ resize: "vertical", fontFamily: "var(--font-sans)" }} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required /></div>
            <button type="submit" className="rw-btn-primary" disabled={sending} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}><Send size={15} /> {sending ? "Sending..." : "Send Message"}</button>
          </form>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div className="rw-card" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
            {[{ Icon: Mail, label: "Email", value: "support@ridewave.app" }, { Icon: Phone, label: "Phone", value: "1800-123-4567" }, { Icon: MapPin, label: "Head Office", value: OFFICE.address }].map(({ Icon, label, value }) => (
              <div key={label} style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
                <div style={{ background: "var(--bg-secondary)", borderRadius: "8px", width: "38px", height: "38px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon size={17} color="var(--brand)" /></div>
                <div><p style={{ color: "var(--text-muted)", fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</p><p style={{ color: "var(--text-primary)", fontSize: "0.9rem", fontWeight: 500 }}>{value}</p></div>
              </div>
            ))}
          </div>
          <div style={{ borderRadius: "var(--radius-lg)", overflow: "hidden", border: "1px solid var(--border)", height: "260px" }}>
            <MapComponent pickupCoords={OFFICE} dropoffCoords={null} height="100%" />
          </div>
        </div>
      </div>
    </div>
  );
};
export default Contact;
