import { useState } from "react";
import { Star, Send } from "lucide-react";
import api from "../services/api";
import { useToast } from "../context/ToastContext";

const ReviewForm = ({ rideId, revieweeName, onDone }) => {
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) return toast("Please select a rating", "error");
    setSending(true);
    try {
      await api.post("/reviews", { rideId, rating, comment });
      toast("Review submitted!", "success");
      onDone?.();
    } catch (e) {
      toast(e?.response?.data?.message || "Could not submit review", "error");
    }
    setSending(false);
  };

  return (
    <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid var(--border)" }}>
      <p style={{ color: "var(--text-secondary)", fontSize: "0.8rem", marginBottom: "8px" }}>Rate {revieweeName}:</p>
      <div style={{ display: "flex", gap: "4px", marginBottom: "8px" }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" onClick={() => setRating(n)}
            style={{ background: "none", border: "none", cursor: "pointer", padding: "2px" }}>
            <Star size={18} color={n <= rating ? "var(--brand)" : "var(--border)"} fill={n <= rating ? "var(--brand)" : "none"} />
          </button>
        ))}
      </div>
      <div style={{ display: "flex", gap: "8px" }}>
        <input className="rw-input" placeholder="Add a comment (optional)" value={comment} onChange={(e) => setComment(e.target.value)}
          style={{ fontSize: "0.8rem", padding: "8px 12px" }} />
        <button className="rw-btn-primary" onClick={handleSubmit} disabled={sending}
          style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.8rem", padding: "8px 14px", whiteSpace: "nowrap" }}>
          <Send size={13} />{sending ? "..." : "Submit"}
        </button>
      </div>
    </div>
  );
};

export default ReviewForm;