import { Component } from "react";
import { SomethingWrong } from "./illustrations";

/**
 * Catches render crashes anywhere below it and shows a recovery screen instead of a
 * blank page. The error and component stack are logged to the browser console,
 * which is what to copy into a bug report (see docs/DEVELOPMENT_GUIDE.md).
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    console.error("[RideWave crash]", error, info?.componentStack);
  }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", background: "var(--bg-secondary)" }}>
        <div className="rw-card" style={{ maxWidth: "460px", width: "100%", padding: "28px", textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "12px" }}><SomethingWrong width={170} /></div>
          <h1 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "8px" }}>Something went wrong</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: "16px" }}>This screen hit an error. Your rides are safe. Try again or go back home.</p>
          <pre style={{ textAlign: "left", fontSize: "0.72rem", background: "var(--bg-secondary)", padding: "10px", borderRadius: "8px", overflowX: "auto", color: "#DC2626", marginBottom: "16px" }}>{String(this.state.error?.message || this.state.error)}</pre>
          <div style={{ display: "flex", gap: "8px" }}>
            <button className="rw-btn-secondary" style={{ flex: 1 }} onClick={() => this.setState({ error: null })}>Try again</button>
            <button className="rw-btn-primary" style={{ flex: 1 }} onClick={() => { window.location.href = "/"; }}>Home</button>
          </div>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
