import { CheckCircle2, Circle, Loader } from "lucide-react";

const STEPS = [
  { key: "requested", label: "Requested" },
  { key: "accepted", label: "Driver assigned" },
  { key: "arriving", label: "Arriving" },
  { key: "ongoing", label: "On trip" },
  { key: "completed", label: "Completed" },
];

const STATUS_MAP = {
  requested: 0,
  accepted: 1,
  arriving: 2,
  ongoing: 3,
  completed: 4,
};

const StatusStepper = ({ currentStatus }) => {
  const currentIdx = STATUS_MAP[currentStatus] ?? 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0", padding: "8px 0" }}>
      {STEPS.map((step, i) => {
        const isDone = i < currentIdx;
        const isCurrent = i === currentIdx;
        const isFuture = i > currentIdx;
        return (
          <div key={step.key} style={{ display: "flex", alignItems: "flex-start", gap: "12px", minHeight: "40px" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "24px", flexShrink: 0 }}>
              <div style={{ width: "24px", height: "24px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: isDone ? "var(--success)" : isCurrent ? "var(--brand)" : "var(--surface-2)" }}>
                {isDone ? <CheckCircle2 size={14} color="white" /> : isCurrent ? <Loader size={12} color="white" className="rw-spin" /> : <Circle size={14} color="var(--text-muted)" />}
              </div>
              {i < STEPS.length - 1 && <div style={{ width: "2px", flex: 1, minHeight: "16px", background: isDone ? "var(--success)" : "var(--border)" }} />}
            </div>
            <div style={{ paddingTop: "2px" }}>
              <p style={{ fontWeight: isCurrent ? 700 : 500, fontSize: "0.85rem", color: isDone ? "var(--success)" : isCurrent ? "var(--text-primary)" : "var(--text-muted)" }}>{step.label}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
export default StatusStepper;