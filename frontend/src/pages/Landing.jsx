import { Link } from "react-router-dom";
import { Bike, Car, Navigation, Users, Repeat, Eye, IndianRupee, Clock, ShieldCheck, MapPin } from "lucide-react";

const RIDE_TYPES = [
  { icon: Bike, name: "Bike", starting: "₹20", perKm: "₹8/km", seats: 1 },
  { icon: Navigation, name: "Auto", starting: "₹30", perKm: "₹12/km", seats: 3 },
  { icon: Car, name: "Car", starting: "₹50", perKm: "₹18/km", seats: 4 },
];

const WHATS_NEW = [
  { title: "Route-corridor pooling", desc: "Matched by your route, not just proximity.", link: null },
  { title: "ML-assisted matching", desc: "Smarter pairings using simulated data.", link: null },
  { title: "OTP ride start", desc: "Share a code with your driver to begin.", link: "/about" },
  { title: "Saved places", desc: "Home, Work, College — book in two taps.", link: "/profile" },
  { title: "Real-time updates", desc: "Live ride events without refreshing.", link: "/about" },
  { title: "Redesigned mobile app", desc: "New look, built for your phone.", link: "/about" },
];

const HeroRouteCard = () => (
  <div className="rw-card" style={{ padding: "20px", maxWidth: "380px" }}>
    <svg viewBox="0 0 340 200" style={{ width: "100%", height: "auto", borderRadius: "var(--radius-sm)" }}>
      {/* Street grid */}
      <line x1="0" y1="40" x2="340" y2="40" stroke="var(--border)" strokeWidth="1" />
      <line x1="0" y1="100" x2="340" y2="100" stroke="var(--border)" strokeWidth="1" />
      <line x1="0" y1="160" x2="340" y2="160" stroke="var(--border)" strokeWidth="1" />
      <line x1="80" y1="0" x2="80" y2="200" stroke="var(--border)" strokeWidth="1" />
      <line x1="180" y1="0" x2="180" y2="200" stroke="var(--border)" strokeWidth="1" />
      <line x1="260" y1="0" x2="260" y2="200" stroke="var(--border)" strokeWidth="1" />
      {/* Corridor line */}
      <path d="M80 40 C120 40, 160 100, 180 100 C200 100, 240 160, 260 160" stroke="var(--brand)" strokeWidth="3" fill="none" strokeLinecap="round" />
      {/* Stops */}
      <circle cx="80" cy="40" r="6" fill="var(--brand)" />
      <circle cx="180" cy="100" r="5" fill="var(--brand-light)" stroke="var(--brand)" strokeWidth="2" />
      <circle cx="260" cy="160" r="6" fill="var(--brand)" />
      {/* Labels */}
      <text x="80" y="30" textAnchor="middle" fontSize="9" fill="var(--text-secondary)" fontFamily="var(--font-sans)">A</text>
      <text x="180" y="90" textAnchor="middle" fontSize="9" fill="var(--text-secondary)" fontFamily="var(--font-sans)">B</text>
      <text x="260" y="175" textAnchor="middle" fontSize="9" fill="var(--text-secondary)" fontFamily="var(--font-sans)">University</text>
    </svg>
    <div style={{ marginTop: "12px", background: "var(--brand-light)", borderRadius: "var(--radius-pill)", padding: "8px 14px", display: "flex", alignItems: "center", gap: "8px" }}>
      <MapPin size={14} color="var(--brand)" />
      <span style={{ fontSize: "0.8rem", color: "var(--brand)", fontWeight: 600 }}>Shares 4.3 km with Rider A · saves ₹38</span>
    </div>
  </div>
);

const Landing = () => {
  return (
    <div style={{ background: "var(--bg-primary)" }}>
      {/* ── Hero ── */}
      <div style={{ background: "var(--hero-glow), var(--bg-primary)", overflow: "hidden", position: "relative" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "80px 24px 56px", position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "48px", flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 300px" }}>
              <span className="rw-tag-new" style={{ marginBottom: "16px", display: "inline-flex" }}>New in 2.0: route-corridor pooling</span>
              <h1 className="rw-display" style={{ marginBottom: "16px" }}>
                Your daily commute, <em style={{ color: "var(--brand)", fontStyle: "italic" }}>shared</em> smarter.
              </h1>
              <p style={{ color: "var(--text-secondary)", fontSize: "clamp(0.9rem, 2vw, 1.05rem)", lineHeight: 1.6, marginBottom: "28px", maxWidth: "480px" }}>
                RideWave matches you with riders on your route. Split the fare, share the ride, and save every day.
              </p>
              <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", marginBottom: "32px" }}>
                <Link to="/register/passenger" style={{ textDecoration: "none" }}>
                  <button className="rw-btn-primary">Book a ride</button>
                </Link>
                <Link to="/about#how-it-works" style={{ textDecoration: "none" }}>
                  <button className="rw-btn-secondary">See how matching works</button>
                </Link>
              </div>
              <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
                {[
                  { icon: ShieldCheck, label: "OTP-verified ride start" },
                  { icon: Eye, label: "Live tracking" },
                  { icon: IndianRupee, label: "Upfront fares" },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <Icon size={14} color="var(--brand)" />
                    <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 500 }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ flex: "1 1 280px", display: "flex", justifyContent: "center" }}>
              <HeroRouteCard />
            </div>
          </div>
        </div>
      </div>

      {/* ── How It Works ── */}
      <section style={{ maxWidth: "1200px", margin: "0 auto", padding: "64px 24px" }}>
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <p className="rw-section-title" style={{ marginBottom: "10px" }}>How It Works</p>
          <h2 style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: "clamp(1.4rem, 3vw, 2rem)", letterSpacing: "-0.02em" }}>Book a ride in three simple steps</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "24px" }} className="rw-grid-3">
          {[
            { step: "1", title: "Set your route", desc: "Enter pickup and drop-off. See your fare before you book." },
            { step: "2", title: "We match riders on your corridor", desc: "Our algorithm finds riders heading your way and splits the fare." },
            { step: "3", title: "Split the fare fairly", desc: "Pay only for the distance you ride. Pool or solo, you choose." },
          ].map(({ step, title, desc }) => (
            <div key={step} className="rw-card" style={{ padding: "28px", position: "relative" }}>
              <span style={{ position: "absolute", top: "20px", right: "24px", color: "var(--border)", fontWeight: 700, fontSize: "2.2rem", fontFamily: "var(--font-sans)" }}>{step}</span>
              <div style={{ background: "var(--brand-light)", borderRadius: "var(--radius-md)", width: "48px", height: "48px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "18px" }}>
                <MapPin size={22} color="var(--brand)" />
              </div>
              <h3 style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: "1.1rem", marginBottom: "8px" }}>{title}</h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: 1.6 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Ride Types ── */}
      <section style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 24px 64px" }}>
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <p className="rw-section-title" style={{ marginBottom: "10px" }}>Ride Types</p>
          <h2 style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: "clamp(1.4rem, 3vw, 2rem)", letterSpacing: "-0.02em" }}>Choose your ride, know the fare</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "24px" }} className="rw-grid-3">
          {RIDE_TYPES.map(({ icon: Icon, name, starting, perKm, seats }) => (
            <div key={name} className="rw-card" style={{ padding: "28px", textAlign: "center" }}>
              <div style={{ background: "var(--bg-secondary)", borderRadius: "50%", width: "64px", height: "64px", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                <Icon size={28} color="var(--brand)" />
              </div>
              <h3 style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: "1.2rem", marginBottom: "4px" }}>{name}</h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginBottom: "16px" }}>{seats} seat{seats > 1 ? "s" : ""}</p>
              <p style={{ color: "var(--brand)", fontWeight: 700, fontSize: "1.8rem", marginBottom: "4px", fontFamily: "var(--font-sans)", fontVariantNumeric: "tabular-nums" }}>{starting}</p>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>+ {perKm}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── What's New in 2.0 ── */}
      <section style={{ background: "var(--bg-secondary)", padding: "64px 24px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
            <p className="rw-section-title" style={{ marginBottom: "10px" }}>What's New</p>
            <h2 style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: "clamp(1.4rem, 3vw, 2rem)", letterSpacing: "-0.02em" }}>New in RideWave 2.0</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" }} className="rw-grid-3">
            {WHATS_NEW.map(({ title, desc, link }) => {
            const content = (
              <div className="rw-card" style={{ padding: "24px", height: "100%" }}>
                <span className="rw-tag-new" style={{ marginBottom: "10px", display: "inline-flex" }}>New in 2.0</span>
                <h3 style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: "1rem", marginBottom: "6px" }}>{title}</h3>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", lineHeight: 1.6 }}>{desc}</p>
              </div>
            );
            return link ? <Link key={title} to={link} style={{ textDecoration: "none" }}>{content}</Link> : <div key={title}>{content}</div>;
          })}
          </div>
        </div>
      </section>

      {/* ── For Drivers ── */}
      <div style={{ background: "var(--bg-secondary)" }}>
        <section style={{ maxWidth: "1200px", margin: "0 auto", padding: "64px 24px" }}>
          <div style={{ maxWidth: "640px" }}>
            <p className="rw-section-title" style={{ marginBottom: "12px", color: "var(--text-muted)" }}>For Drivers</p>
            <h2 style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: "clamp(1.4rem, 3vw, 2rem)", letterSpacing: "-0.02em", marginBottom: "16px" }}>Drive on your own schedule</h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", lineHeight: 1.7, marginBottom: "24px" }}>Join RideWave as a driver-partner. Accept ride requests that fit your schedule and get paid reliably.</p>
            <Link to="/register/driver" style={{ textDecoration: "none" }}>
              <button className="rw-btn-primary">Drive with RideWave</button>
            </Link>
          </div>
        </section>
      </div>

    </div>
  );
};
export default Landing;
