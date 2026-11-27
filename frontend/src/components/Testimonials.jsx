import { Star } from "lucide-react";
const TESTIMONIALS = [
  { name: "Priya Sharma", location: "Bengaluru", rating: 5, quote: "Booking is quick and the fare shown upfront means no surprises. It's my go-to for the daily commute now.", seed: "priya-ridewave" },
  { name: "Arjun Mehta", location: "Mumbai", rating: 5, quote: "The driver arrived right on time and live tracking made waiting a lot less stressful.", seed: "arjun-ridewave" },
  { name: "Sneha Reddy", location: "Hyderabad", rating: 4, quote: "Pricing feels fairer than other apps I've used. Switched over completely for office rides.", seed: "sneha-ridewave" },
];
const Testimonials = () => (
  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" }} className="rw-grid-3">
    {TESTIMONIALS.map(({ name, location, rating, quote, seed }) => (
      <div key={name} className="rw-card" style={{ padding: "22px" }}>
        <div style={{ display: "flex", gap: "2px", marginBottom: "14px" }}>
          {Array.from({ length: 5 }).map((_, i) => (<Star key={i} size={14} color="var(--brand)" fill={i < rating ? "var(--brand)" : "none"} />))}
        </div>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", lineHeight: 1.7, marginBottom: "18px" }}>&ldquo;{quote}&rdquo;</p>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <img src={`https://i.pravatar.cc/64?u=${seed}`} alt="" style={{ width: "38px", height: "38px", borderRadius: "50%", objectFit: "cover" }} />
          <div><p style={{ color: "var(--text-primary)", fontWeight: 600, fontSize: "0.85rem" }}>{name}</p><p style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>{location}</p></div>
        </div>
      </div>
    ))}
  </div>
);
export default Testimonials;
