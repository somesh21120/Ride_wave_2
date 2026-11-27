import { Copy, Check } from "lucide-react";
import { useState } from "react";

const OtpCard = ({ otp }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(otp);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* fallback */ }
  };

  if (!otp) return null;

  return (
    <div style={{ border: "1.5px dashed var(--brand)", background: "var(--brand-light)", borderRadius: "var(--radius-md)", padding: "14px", marginBottom: "14px" }}>
      <p style={{ fontWeight: 600, fontSize: "0.8rem", color: "var(--text-primary)", marginBottom: "8px" }}>Share this code with your driver to start the ride</p>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px" }}>
        <span style={{ fontSize: "2rem", fontWeight: 800, letterSpacing: "0.3em", color: "var(--brand-dark)", fontVariantNumeric: "tabular-nums" }}>{otp}</span>
        <button onClick={handleCopy} className="rw-btn-ghost" style={{ fontSize: "0.8rem" }}>
          {copied ? <Check size={16} color="var(--success)" /> : <Copy size={16} />}
        </button>
      </div>
    </div>
  );
};
export default OtpCard;