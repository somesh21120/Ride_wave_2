import { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle, XCircle, AlertCircle, X } from "lucide-react";
const ToastContext = createContext(null);
const ICONS = { success: <CheckCircle size={18} color="var(--success)" />, error: <XCircle size={18} color="var(--danger)" />, info: <AlertCircle size={18} color="var(--brand)" /> };
const BORDERS = { success: "var(--success)", error: "var(--danger)", info: "var(--brand)" };
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const toast = useCallback((message, type = "info") => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);
  const remove = (id) => setToasts(prev => prev.filter(t => t.id !== id));
  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="rw-toast-stack" aria-live="polite">
        {toasts.map(t => (
          <div key={t.id} className="rw-toast" role={t.type === "error" ? "alert" : "status"} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderLeft: `4px solid ${BORDERS[t.type] || BORDERS.info}`, borderRadius: "var(--radius-md)", padding: "12px 16px", display: "flex", alignItems: "center", gap: "10px", boxShadow: "var(--shadow-lg)", minWidth: "260px", maxWidth: "380px", color: BORDERS[t.type] || BORDERS.info }}>
            {ICONS[t.type]}
            <span style={{ color: "var(--text-primary)", fontSize: "0.875rem", fontWeight: 500, flex: 1 }}>{t.message}</span>
            <button onClick={() => remove(t.id)} aria-label="Dismiss" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex" }}><X size={14} /></button>
            <span className="rw-toast-timer" aria-hidden="true" />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
export const useToast = () => useContext(ToastContext);
