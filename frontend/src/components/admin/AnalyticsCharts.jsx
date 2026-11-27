import { useState, useEffect } from "react";
import api from "../../services/api";

const COLORS = { brand: "#0F766E", ai: "#6D5BD0", gold: "#B08D57", success: "#059669", danger: "#DC2626", info: "#2563EB" };

const ChartCard = ({ title, children }) => (
  <div className="rw-card" style={{ padding: "16px" }}>
    <p className="rw-section-title" style={{ marginBottom: "12px" }}>{title}</p>
    {children}
  </div>
);

const StackedBar = ({ label, total, pooled, max }) => (
  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
    <span style={{ fontSize: "0.78rem", color: "var(--text-secondary)", width: "60px", flexShrink: 0 }}>{label}</span>
    <div style={{ flex: 1, height: "20px", background: "var(--surface-2)", borderRadius: "4px", overflow: "hidden", display: "flex" }}>
      <div style={{ width: `${max > 0 ? ((total - pooled) / max) * 100 : 0}%`, height: "100%", background: COLORS.brand, borderRadius: "4px 0 0 4px", transition: "width 0.3s" }} />
      <div style={{ width: `${max > 0 ? (pooled / max) * 100 : 0}%`, height: "100%", background: COLORS.ai, borderRadius: "0 4px 4px 0", transition: "width 0.3s" }} />
    </div>
    <span style={{ fontSize: "0.78rem", color: "var(--text-primary)", fontWeight: 600, width: "30px", textAlign: "right" }}>{total}</span>
  </div>
);

const AnalyticsCharts = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data: d } = await api.get("/admin/analytics?days=14");
        setData(d);
      } catch { setData(null); }
      setLoading(false);
    };
    fetch();
  }, []);

  if (loading) return <p style={{ color: "var(--text-muted)", padding: "16px" }}>Loading charts...</p>;
  if (!data || data.daily.every(d => d.rides === 0)) {
    return <p style={{ color: "var(--text-muted)", padding: "16px" }}>No rides in this period</p>;
  }

  const maxRides = Math.max(...data.daily.map(d => d.rides), 1);
  const maxRevenue = Math.max(...data.daily.map(d => d.revenue), 1);
  const typeData = Object.entries(data.byType).filter(([_, v]) => v > 0);
  const statusData = Object.entries(data.byStatus).filter(([_, v]) => v > 0);
  const maxType = Math.max(...typeData.map(([_, v]) => v), 1);
  const maxStatus = Math.max(...statusData.map(([_, v]) => v), 1);

  return (
    <div style={{ marginTop: "24px" }}>
      <p className="rw-section-title" style={{ marginBottom: "16px" }}>Last {data.days} days</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px" }} className="rw-grid-2">
        <ChartCard title="Rides per day">
            <div style={{ display: "flex", gap: "16px", marginBottom: "8px", fontSize: "0.72rem", color: "var(--text-muted)" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><span style={{ width: "8px", height: "8px", borderRadius: "2px", background: COLORS.brand }} /> Solo</span>
              <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><span style={{ width: "8px", height: "8px", borderRadius: "2px", background: COLORS.ai }} /> Pooled</span>
            </div>
            {data.daily.map(d => (
              <StackedBar key={d.date} label={d.date.slice(5)} total={d.rides} pooled={d.pooled} max={maxRides} />
          ))}
        </ChartCard>
        <ChartCard title="Revenue per day (₹)">
                  {data.daily.map(d => (
                    <StackedBar key={d.date} label={d.date.slice(5)} total={d.revenue} pooled={0} max={maxRevenue} />
          ))}
        </ChartCard>
        <ChartCard title="By ride type">
          {typeData.map(([name, value]) => (
                    <StackedBar key={name} label={name} value={value} total={value} pooled={0} max={maxType} />
          ))}
          {typeData.length === 0 && <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>No rides</p>}
        </ChartCard>
        <ChartCard title="By status">
          {statusData.map(([name, value]) => (
                    <StackedBar key={name} label={name} value={value} total={value} pooled={0} max={maxStatus} />
          ))}
          {statusData.length === 0 && <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>No rides</p>}
        </ChartCard>
      </div>
    </div>
  );
};
export default AnalyticsCharts;