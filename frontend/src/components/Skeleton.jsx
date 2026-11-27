import "./Skeleton.css";

const Skeleton = ({ width, height, borderRadius = "8px", style, className = "" }) => (
  <div className={`rw-skeleton ${className}`} style={{ width, height, borderRadius, ...style }} />
);

// Card skeleton for ride lists
export const SkeletonCard = ({ lines = 3, height = "130px" }) => (
  <div className="rw-card" style={{ padding: "18px 20px", height }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <Skeleton width="40px" height="40px" borderRadius="10px" />
        <div>
          <Skeleton width="120px" height="14px" style={{ marginBottom: "6px" }} />
          <Skeleton width="80px" height="12px" />
        </div>
      </div>
      <Skeleton width="60px" height="18px" />
    </div>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton key={i} width={`${80 - i * 15}%`} height="12px" style={{ marginBottom: "8px" }} />
    ))}
  </div>
);

// Skeleton for admin tables
export const SkeletonRow = () => (
  <div className="rw-card" style={{ padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
    <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1 }}>
      <Skeleton width="38px" height="38px" borderRadius="50%" />
      <div style={{ flex: 1 }}>
        <Skeleton width="50%" height="14px" style={{ marginBottom: "6px" }} />
        <Skeleton width="35%" height="12px" />
      </div>
    </div>
    <div style={{ display: "flex", gap: "8px" }}>
      <Skeleton width="90px" height="32px" />
      <Skeleton width="70px" height="32px" />
      <Skeleton width="32px" height="32px" />
    </div>
  </div>
);

export default Skeleton;