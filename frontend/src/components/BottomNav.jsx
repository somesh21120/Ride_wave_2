import { useNavigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { Home, Car, ListOrdered, Calendar, User, LayoutDashboard, IndianRupee } from "lucide-react";

const PASSENGER_TABS = [
  { to: "/dashboard", label: "Home", Icon: Home },
  { to: "/book", label: "Book", Icon: Car },
  { to: "/my-rides", label: "Rides", Icon: ListOrdered },
  { to: "/daily-rides", label: "Daily", Icon: Calendar },
  { to: "/profile", label: "Profile", Icon: User },
];

const DRIVER_TABS = [
  { to: "/driver", label: "Requests", Icon: Car },
  { to: "/driver", label: "Active", Icon: LayoutDashboard },
  { to: "/driver", label: "Earnings", Icon: IndianRupee },
  { to: "/profile", label: "Profile", Icon: User },
];

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);

  if (!user || user.role === "admin") return null;

  const tabs = user.role === "driver" ? DRIVER_TABS : PASSENGER_TABS;

  return (
    <>
      <style>{`
        @media (max-width: 767px) {
          .rw-bottom-nav { display: flex !important; }
          .rw-bottom-spacer { display: block !important; }
          .rw-footer-mobile-hidden { display: none !important; }
        }
        @media (min-width: 768px) {
          .rw-bottom-nav { display: none !important; }
          .rw-bottom-spacer { display: none !important; }
          .rw-footer-mobile-hidden { display: block !important; }
        }
      `}</style>
      <nav
        className="rw-bottom-nav"
        style={{
          position: "fixed", bottom: "12px", left: "12px", right: "12px", zIndex: 9999,
          height: "64px",
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-xl)",
          display: "none",
          alignItems: "center",
          justifyContent: "space-around",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
          boxShadow: "var(--shadow-lg)",
        }}
      >
        {tabs.map(({ to, label, Icon }) => {
          const active = location.pathname === to;
          return (
            <button
              key={to + label}
              onClick={() => navigate(to)}
              style={{
                display: "flex", flexDirection: "column", alignItems: "center",
                justifyContent: "center", gap: "2px",
                background: "none", border: "none", cursor: "pointer",
                padding: "4px 8px", minWidth: "48px", position: "relative",
                color: active ? "var(--brand)" : "var(--text-muted)",
                fontFamily: "var(--font-sans)",
                transition: "color 0.12s",
              }}
            >
              {active && <div style={{ position: "absolute", top: "-4px", width: "4px", height: "4px", borderRadius: "50%", background: "var(--brand)" }} />}
              <Icon size={22} />
              <span style={{ fontSize: "0.6875rem", fontWeight: active ? 700 : 500, lineHeight: 1 }}>
                {label}
              </span>
            </button>
          );
        })}
      </nav>
    </>
  );
};

export default BottomNav;