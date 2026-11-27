import { useState } from "react";
import { Tag, X } from "lucide-react";

const PromoBanner = ({ image, title, subtitle, code, dismissible = true, compact = false, storageKey }) => {
  const key = storageKey || (code ? `rw-banner-${code}` : "rw-banner-default");
  const [visible, setVisible] = useState(() => {
    try { return !localStorage.getItem(key); } catch { return true; }
  });
  const dismiss = () => {
    setVisible(false);
    try { localStorage.setItem(key, "closed"); } catch {}
  };
  if (!visible) return null;
  return (
    <div style={{ background: "linear-gradient(120deg, #FBBF24 0%, var(--brand) 55%, var(--brand-dark) 100%)", borderRadius: "16px", overflow: "hidden", position: "relative", display: "flex", alignItems: "stretch", minHeight: compact ? "92px" : "128px" }}>
      <div style={{ flex: 1, padding: compact ? "14px 18px" : "20px 26px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
          <Tag size={13} color="#0F172A" />
          <span style={{ color: "#0F172A", fontWeight: 700, fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>Limited Time Offer</span>
        </div>
        <h3 style={{ color: "#0F172A", fontWeight: 800, fontSize: compact ? "1rem" : "1.2rem", marginBottom: "4px", lineHeight: 1.2 }}>{title}</h3>
        <p style={{ color: "rgba(15,23,42,0.75)", fontSize: "0.82rem" }}>{subtitle}{code && <> Use code <strong>{code}</strong></>}</p>
      </div>
      {image && (<img src={image} alt="" style={{ width: compact ? "110px" : "160px", objectFit: "cover", flexShrink: 0 }} />)}
      {dismissible && (
        <button onClick={dismiss} aria-label="Dismiss offer" style={{ position: "absolute", top: "8px", right: "8px", background: "rgba(15,23,42,0.18)", border: "none", borderRadius: "50%", width: "22px", height: "22px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <X size={13} color="#0F172A" />
        </button>
      )}
    </div>
  );
};
export default PromoBanner;
