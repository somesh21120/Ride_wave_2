import { useEffect, useState, useCallback } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import PageHeader from "../components/PageHeader";
import { useToast } from "../context/ToastContext";
import {
  Users, Car, Repeat, IndianRupee, CheckCircle2, Clock, RefreshCw, ShieldCheck,
  Search, Trash2, UserCheck, UserX, MapPin, Navigation, Star, Edit2, X, UserPlus, Activity, PiggyBank, FlaskConical,
} from "lucide-react";
import { SkeletonCard, SkeletonRow } from "../components/Skeleton";
import AddUserModal from "../components/admin/AddUserModal";
import RideDetailDrawer from "../components/admin/RideDetailDrawer";
import AnalyticsCharts from "../components/admin/AnalyticsCharts";
import SafetyAlerts from "../components/admin/SafetyAlerts";
import CountUp from "../components/ui/CountUp";
import EmptyState from "../components/ui/EmptyState";
import { EmptyRides, NoResults, AllClear } from "../components/illustrations";

const TABS = [
  { id: "overview", label: "Overview", Icon: ShieldCheck },
  { id: "users", label: "Users", Icon: Users },
  { id: "rides", label: "Rides", Icon: Car },
  { id: "recurring", label: "Daily Rides", Icon: Repeat },
  { id: "reviews", label: "Reviews", Icon: Star },
  { id: "ml-lab", label: "ML Lab", Icon: FlaskConical, external: "/admin/ml-lab" },
];

const STATUS_STYLES = {
  requested: { label: "Requested", color: "var(--brand-dark)", bg: "var(--brand-light)" },
  accepted: { label: "Accepted", color: "#2563EB", bg: "#DBEAFE" },
  ongoing: { label: "Ongoing", color: "#7C3AED", bg: "#EDE9FE" },
  completed: { label: "Completed", color: "#059669", bg: "#D1FAE5" },
  cancelled: { label: "Cancelled", color: "#DC2626", bg: "#FEE2E2" },
};

const StatCard = ({ icon: Icon, label, value, color = "var(--brand)" }) => (
  <div className="rw-card rw-card-hover" style={{ padding: "20px", display: "flex", alignItems: "center", gap: "16px" }}>
    <div style={{ background: `${color}18`, borderRadius: "10px", width: "46px", height: "46px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon size={22} color={color} /></div>
    <div>
      <p style={{ color: "var(--text-secondary)", fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</p>
      <p style={{ color: "var(--text-primary)", fontSize: "1.45rem", fontWeight: 800, letterSpacing: "-0.5px" }}>{typeof value === "string" && value.startsWith("₹") ? <CountUp value={value.slice(1)} prefix="₹" /> : <CountUp value={value} />}</p>
    </div>
  </div>
);

const AdminDashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tab, setTab] = useState("overview");
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [rides, setRides] = useState([]);
  const [recurring, setRecurring] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [editUser, setEditUser] = useState(null); // user being edited in modal
  const [editForm, setEditForm] = useState({});
  const [showAddUser, setShowAddUser] = useState(false);
  const [detailRideId, setDetailRideId] = useState(null);
  const [roleFilter, setRoleFilter] = useState("");
  const [rideStatusFilter, setRideStatusFilter] = useState("");

  const loadOverview = useCallback(async () => {
    try { const { data } = await api.get("/admin/stats"); setStats(data); }
    catch (e) { toast(e?.response?.data?.message || "Could not load stats", "error"); }
  }, [toast]);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (roleFilter) params.role = roleFilter;
      const { data } = await api.get("/admin/users", { params });
      setUsers(data);
    } catch (e) { toast(e?.response?.data?.message || "Could not load users", "error"); }
    setLoading(false);
  }, [search, roleFilter, toast]);

  const loadRides = useCallback(async () => {
    setLoading(true);
    try { const { data } = await api.get("/admin/rides", { params: rideStatusFilter ? { status: rideStatusFilter } : {} }); setRides(data); }
    catch (e) { toast(e?.response?.data?.message || "Could not load rides", "error"); }
    setLoading(false);
  }, [rideStatusFilter, toast]);

  const loadRecurring = useCallback(async () => {
    setLoading(true);
    try { const { data } = await api.get("/admin/recurring"); setRecurring(data); }
    catch (e) { toast(e?.response?.data?.message || "Could not load recurring rides", "error"); }
    setLoading(false);
  }, [toast]);

  const loadReviews = useCallback(async () => {
    setLoading(true);
    try { const { data } = await api.get("/reviews/all"); setReviews(data); }
    catch (e) { toast(e?.response?.data?.message || "Could not load reviews", "error"); }
    setLoading(false);
  }, [toast]);

  const handleDeleteReview = async (id) => {
    if (!window.confirm("Delete this review?")) return;
    try { await api.delete(`/reviews/${id}`); toast("Review deleted", "success"); loadReviews(); }
    catch (e) { toast(e?.response?.data?.message || "Could not delete review", "error"); }
  };

  useEffect(() => {
    if (tab === "overview") loadOverview();
    if (tab === "users") loadUsers();
    if (tab === "rides") loadRides();
    if (tab === "recurring") loadRecurring();
    if (tab === "reviews") loadReviews();
  }, [tab, loadOverview, loadUsers, loadRides, loadRecurring, loadReviews]);

  const handleUpdateUser = async (id, changes) => {
    try { await api.put(`/admin/users/${id}`, changes); toast("User updated", "success"); loadUsers(); }
    catch (e) { toast(e?.response?.data?.message || "Could not update user", "error"); }
  };
  const handleDeleteUser = async (id) => {
    if (!window.confirm("Delete this user? This cannot be undone.")) return;
    try { await api.delete(`/admin/users/${id}`); toast("User deleted", "success"); loadUsers(); }
    catch (e) { toast(e?.response?.data?.message || "Could not delete user", "error"); }
  };
  const handleUpdateRide = async (id, status) => {
    try { await api.put(`/admin/rides/${id}`, { status }); toast("Ride updated", "success"); loadRides(); }
    catch (e) { toast(e?.response?.data?.message || "Could not update ride", "error"); }
  };
  const handleDeleteRide = async (id) => {
    if (!window.confirm("Delete this ride?")) return false;
    try { await api.delete(`/admin/rides/${id}`); toast("Ride deleted", "success"); loadRides(); return true; }
    catch (e) { toast(e?.response?.data?.message || "Could not delete ride", "error"); return false; }
  };
  const handleEditSave = async () => {
    try {
      await api.put(`/admin/users/${editUser._id}`, editForm);
      toast("User updated", "success");
      setEditUser(null);
      loadUsers();
    } catch (e) { toast(e?.response?.data?.message || "Could not update user", "error"); }
  };

  const fmtDate = (d) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <div style={{ minHeight: "100%", background: "var(--bg-secondary)", display: "flex" }}>
      {/* Sidebar (desktop) */}
      <div style={{ width: "240px", flexShrink: 0, borderRight: "1px solid var(--border)", padding: "24px 12px", display: "none" }} className="rw-admin-sidebar">
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          {TABS.map(({ id, label, Icon, external }) => (
            <button key={id} onClick={() => external ? navigate(external) : setTab(id)} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", borderRadius: "var(--radius-md)", border: "none", background: tab === id ? "var(--brand-light)" : "transparent", color: tab === id ? "var(--brand)" : "var(--text-secondary)", fontWeight: tab === id ? 600 : 500, fontSize: "0.9rem", cursor: "pointer", textAlign: "left", fontFamily: "var(--font-sans)" }}>
              <Icon size={18} /> {label}
            </button>
          ))}
        </div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <PageHeader compact eyebrow="Admin" title="Admin Panel" subtitle="Manage users, rides, and monitor platform activity" maxWidth="1100px"
        actions={<div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}><button className="rw-btn-secondary" onClick={() => { if (tab === "overview") loadOverview(); if (tab === "users") loadUsers(); if (tab === "rides") loadRides(); if (tab === "recurring") loadRecurring(); if (tab === "reviews") loadReviews(); }} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.85rem" }}><RefreshCw size={14} /> Refresh</button></div>} />
      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "24px" }}>
        <div className="rw-admin-tabs" role="tablist" style={{ marginBottom: "24px" }}>
          {TABS.map(({ id, label, Icon, external }) => (
            <button key={id} role="tab" aria-selected={tab === id} onClick={() => external ? navigate(external) : setTab(id)} className={tab === id ? "rw-btn-primary" : "rw-btn-secondary"} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.875rem" }}><Icon size={15} /> {label}</button>
          ))}
        </div>

        {tab === "overview" && <SafetyAlerts onOpenRide={(id) => setDetailRideId(id)} />}
        {tab === "overview" && !stats && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: "14px", marginBottom: "14px" }}>
            {[0, 1, 2, 3].map((i) => <div key={i} className="rw-skeleton" style={{ height: "86px", borderRadius: "var(--radius-lg)" }} />)}
          </div>
        )}
        {tab === "overview" && stats && (
          <>
            <div className="rw-stagger" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: "14px", marginBottom: "14px" }}>
              <StatCard icon={Users} label="Total Users" value={stats.counts.users} color="var(--brand)" />
              <StatCard icon={Car} label="Total Rides" value={stats.counts.rides} color="#3B82F6" />
              <StatCard icon={CheckCircle2} label="Completed" value={stats.counts.completedRides} color="#10B981" />
              <StatCard icon={IndianRupee} label="Revenue" value={`₹${stats.revenue}`} color="var(--brand)" />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: "14px", marginBottom: "14px" }}>
              <StatCard icon={Car} label="Drivers" value={stats.counts.drivers ?? "-"} color="#0F766E" />
              <StatCard icon={Users} label="Passengers" value={stats.counts.passengers ?? "-"} color="#6366F1" />
              <StatCard icon={Activity} label="Live Rides" value={stats.counts.activeRides ?? "-"} color="#7C3AED" />
              <StatCard icon={PiggyBank} label="Pool Savings" value={`₹${stats.poolSavings ?? 0}`} color="#16A34A" />
              <StatCard icon={Users} label="Pooled Rides" value={stats.counts.pooledRides ?? "-"} color="#0EA5E9" />
              <StatCard icon={Trash2} label="Cancelled" value={stats.counts.cancelledRides ?? "-"} color="#DC2626" />
            </div>
            <AnalyticsCharts />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: "14px", marginBottom: "28px" }}>
              <StatCard icon={Clock} label="Pending Requests" value={stats.counts.requestedRides} color="#EF4444" />
              <StatCard icon={Repeat} label="Daily Rides" value={stats.counts.recurringRides} color="#8B5CF6" />
              <StatCard icon={Users} label="Open Pools" value={stats.counts.openPools} color="#0EA5E9" />
            </div>
            <h2 style={{ fontWeight: 700, fontSize: "1rem", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "14px" }}>Recent Rides</h2>
            {stats.recentRides.length === 0 ? (
              <div className="rw-card"><EmptyState illustration={EmptyRides} width={130} title="No rides recorded yet" text="Rides appear here as soon as passengers book." /></div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {stats.recentRides.map((ride) => {
                  const s = STATUS_STYLES[ride.status] || STATUS_STYLES.requested;
                  return (
                    <div key={ride._id} className="rw-card" style={{ padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                      <div>
                        <p style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "0.9rem", textTransform: "capitalize" }}>{ride.rideType} · ₹{ride.fare}</p>
                        <p style={{ color: "var(--text-secondary)", fontSize: "0.78rem" }}>{ride.passenger?.name || "Unknown"} · {fmtDate(ride.createdAt)}</p>
                      </div>
                      <span className="rw-badge" style={{ background: s.bg, color: s.color }}>{s.label}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {tab === "users" && (
          <>
            <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap", marginBottom: "16px" }}>
              <div style={{ position: "relative", flex: "1 1 260px", maxWidth: "380px" }}>
                <Search size={15} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                <input className="rw-input" placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: "36px" }} />
              </div>
              <select className="rw-input" aria-label="Filter by role" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} style={{ width: "auto", flex: "0 1 170px" }}>
                <option value="">All roles</option>
                <option value="passenger">Passengers</option>
                <option value="driver">Drivers</option>
                <option value="admin">Admins</option>
              </select>
              <button className="rw-btn-primary" onClick={() => setShowAddUser(true)} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.875rem" }}><UserPlus size={15} /> Add Driver / User</button>
            </div>
            {loading ? <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>{[1,2,3].map(i => <SkeletonRow key={i} />)}</div> : users.length === 0 ? (
              <div className="rw-card"><EmptyState illustration={NoResults} width={130} title="No users found" text="Try a different search or filter." /></div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {users.map((u) => (
                  <div key={u._id} className="rw-card rw-admin-row" style={{ padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
                      <div style={{ width: "38px", height: "38px", background: "var(--brand)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontWeight: 800, color: "#0F172A" }}>{u.name?.[0]?.toUpperCase()}</div>
                      <div>
                        <p style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "0.9rem" }}>{u.name} {u._id === user?._id && <span style={{ color: "var(--brand)", fontSize: "0.7rem" }}>(you)</span>}</p>
                        <p style={{ color: "var(--text-secondary)", fontSize: "0.78rem", wordBreak: "break-word" }}>{u.email} · {u.phone}</p>
                      </div>
                    </div>
                    <div className="rw-admin-row-actions" style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                      <select className="rw-input" aria-label={`Role of ${u.name}`} value={u.role} onChange={(e) => handleUpdateUser(u._id, { role: e.target.value })} style={{ width: "110px", padding: "6px 10px", fontSize: "0.8rem" }} disabled={u._id === user?._id}>
                        <option value="passenger">Passenger</option>
                        <option value="driver">Driver</option>
                        <option value="admin">Admin</option>
                      </select>
                      <button onClick={() => handleUpdateUser(u._id, { isActive: !u.isActive })} disabled={u._id === user?._id}
                        className="rw-btn-secondary" style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "0.75rem", padding: "6px 10px", color: u.isActive ? "#059669" : "#DC2626", borderColor: u.isActive ? "#10B981" : "#EF4444" }}>
                        {u.isActive ? <UserCheck size={13} /> : <UserX size={13} />} {u.isActive ? "Active" : "Inactive"}
                      </button>
                      <button onClick={() => { setEditUser(u); setEditForm({ name: u.name || "", phone: u.phone || "", vehicleType: u.vehicle?.type || "", vehicleModel: u.vehicle?.model || "", vehicleNumber: u.vehicle?.number || "", carSubtype: u.vehicle?.carSubtype || "", seatingCapacity: u.vehicle?.seatingCapacity || 0 }); }}
                        className="rw-btn-secondary" style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "0.75rem", padding: "6px 10px" }}>
                        <Edit2 size={13} /> Edit
                      </button>
                      <button onClick={() => handleDeleteUser(u._id)} disabled={u._id === user?._id} style={{ background: "#FEF2F2", border: "none", borderRadius: "10px", width: "44px", height: "44px", cursor: u._id === user?._id ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: u._id === user?._id ? 0.4 : 1 }}><Trash2 size={14} color="#DC2626" /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {tab === "rides" && (
          <>
            <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap", marginBottom: "16px" }}>
              <select className="rw-input" aria-label="Filter rides by status" value={rideStatusFilter} onChange={(e) => setRideStatusFilter(e.target.value)} style={{ width: "auto", flex: "0 1 200px" }}>
                <option value="">All statuses</option>
                {Object.keys(STATUS_STYLES).map((k) => <option key={k} value={k}>{STATUS_STYLES[k].label}</option>)}
              </select>
              <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>{rides.length} ride{rides.length === 1 ? "" : "s"}</span>
            </div>
            {loading ? <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>{[1,2,3].map(i => <SkeletonCard key={i} lines={2} height="100px" />)}</div> : rides.length === 0 ? (
            <div className="rw-card"><EmptyState illustration={EmptyRides} width={130} title="No rides recorded yet" text="Rides appear here as soon as passengers book." /></div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {rides.map((ride) => {
                const s = STATUS_STYLES[ride.status] || STATUS_STYLES.requested;
                return (
                  <div key={ride._id} className="rw-card" style={{ padding: "16px 18px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px", flexWrap: "wrap", gap: "10px" }}>
                      <div>
                        <p style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "0.9rem", textTransform: "capitalize" }}>{ride.rideType} ride · ₹{ride.fare}</p>
                        <p style={{ color: "var(--text-secondary)", fontSize: "0.78rem" }}>Passenger: {ride.passenger?.name || "Unknown"} {ride.driver ? `· Driver: ${ride.driver.name}` : ""}</p>
                        <p style={{ color: "var(--text-muted)", fontSize: "0.72rem" }}>{fmtDate(ride.createdAt)}</p>
                      </div>
                      <span className="rw-badge" style={{ background: s.bg, color: s.color }}>{s.label}</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginBottom: "12px" }}>
                      <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}><MapPin size={13} color="#10B981" style={{ marginTop: "2px", flexShrink: 0 }} /><p style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>{ride.pickupLocation?.address}</p></div>
                      <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}><Navigation size={13} color="#EF4444" style={{ marginTop: "2px", flexShrink: 0 }} /><p style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>{ride.dropoffLocation?.address}</p></div>
                    </div>
                    <div className="rw-admin-row-actions" style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                      <button type="button" className="rw-btn-secondary" onClick={() => setDetailRideId(ride._id)} style={{ fontSize: "0.8rem", padding: "8px 14px" }}>View details</button>
                      <select className="rw-input" aria-label="Change ride status" value={ride.status} onChange={(e) => handleUpdateRide(ride._id, e.target.value)} style={{ width: "150px", padding: "6px 10px", fontSize: "0.8rem" }}>
                        {Object.keys(STATUS_STYLES).map((k) => <option key={k} value={k}>{STATUS_STYLES[k].label}</option>)}
                      </select>
                      <button onClick={() => handleDeleteRide(ride._id)} aria-label="Delete ride" style={{ background: "#FEF2F2", border: "none", borderRadius: "10px", width: "44px", height: "44px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Trash2 size={14} color="#DC2626" /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          </>
        )}

        {tab === "recurring" && (
          loading ? <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>{[1,2,3].map(i => <SkeletonCard key={i} lines={1} height="60px" />)}</div> : recurring.length === 0 ? (
            <div className="rw-card" style={{ padding: "40px", textAlign: "center", color: "var(--text-secondary)" }}>No recurring rides configured.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {recurring.map((r) => (
                <div key={r._id} className="rw-card" style={{ padding: "16px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                  <div>
                    <p style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "0.9rem" }}>{r.pickupLocation?.address} → {r.dropoffLocation?.address}</p>
                    <p style={{ color: "var(--text-secondary)", fontSize: "0.78rem" }}>{r.passenger?.name || "Unknown"} · {r.time} · {r.rideType}</p>
                  </div>
                  <span className="rw-badge" style={{ background: r.active ? "#D1FAE5" : "#FEE2E2", color: r.active ? "#059669" : "#DC2626" }}>{r.active ? "Active" : "Paused"}</span>
                </div>
              ))}
            </div>
          )
        )}

        {tab === "reviews" && (
          loading ? <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>{[1,2,3].map(i => <SkeletonCard key={i} lines={2} height="90px" />)}</div> : reviews.length === 0 ? (
            <div className="rw-card"><EmptyState illustration={AllClear} width={130} title="No reviews yet" text="Ratings show up here after completed rides." /></div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {reviews.map((rev) => (
                <div key={rev._id} className="rw-card" style={{ padding: "16px 18px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px", marginBottom: "6px" }}>
                    <div>
                      <p style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "0.9rem" }}>
                        {rev.reviewer?.name || "Unknown"} <span style={{ color: "var(--text-muted)", fontWeight: 500, fontSize: "0.75rem" }}>({rev.reviewerRole})</span>
                        <span style={{ color: "var(--text-muted)", margin: "0 6px" }}>→</span>
                        {rev.reviewee?.name || "Unknown"} <span style={{ color: "var(--text-muted)", fontWeight: 500, fontSize: "0.75rem" }}>({rev.reviewee?.role})</span>
                      </p>
                      {rev.ride && <p style={{ color: "var(--text-secondary)", fontSize: "0.78rem" }}>{rev.ride.rideType} ride · ₹{rev.ride.fare}</p>}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ display: "flex", gap: "2px" }}>{[1,2,3,4,5].map((n) => <Star key={n} size={14} color={n <= rev.rating ? "var(--brand)" : "var(--border)"} fill={n <= rev.rating ? "var(--brand)" : "none"} />)}</span>
                      <button onClick={() => handleDeleteReview(rev._id)} style={{ background: "#FEF2F2", border: "none", borderRadius: "8px", width: "30px", height: "30px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Trash2 size={14} color="#DC2626" /></button>
                    </div>
                  </div>
                  {rev.comment && <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", fontStyle: "italic" }}>"{rev.comment}"</p>}
                </div>
              ))}
            </div>
          )
        )}

        {detailRideId && (
          <RideDetailDrawer
            rideId={detailRideId}
            statusStyles={STATUS_STYLES}
            onClose={() => setDetailRideId(null)}
            onStatusChange={handleUpdateRide}
            onDelete={handleDeleteRide}
          />
        )}

        {showAddUser && (
          <AddUserModal
            onClose={() => setShowAddUser(false)}
            onCreated={(u) => { toast(`${u.role === "driver" ? "Driver" : "User"} ${u.name} added`, "success"); setShowAddUser(false); loadUsers(); loadOverview(); }}
          />
        )}

        {/* Edit User Modal */}
        {editUser && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: "1rem" }}
            onClick={() => setEditUser(null)}>
            <div className="rw-card" style={{ maxWidth: "480px", width: "100%", padding: "24px", maxHeight: "90vh", overflowY: "auto" }}
              onClick={(e) => e.stopPropagation()}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
                <h2 style={{ fontWeight: 700, fontSize: "1.1rem", color: "var(--text-primary)" }}>Edit User</h2>
                <button onClick={() => setEditUser(null)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={20} color="var(--text-secondary)" /></button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div><label className="rw-label">Name</label><input className="rw-input" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} /></div>
                <div><label className="rw-label">Phone</label><input className="rw-input" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} /></div>
                {editUser.role === "driver" && (
                  <>
                    <div style={{ borderTop: "1px solid var(--border)", paddingTop: "12px", marginTop: "4px" }}>
                      <p style={{ color: "var(--text-muted)", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "10px" }}>Vehicle</p>
                    </div>
                    <div><label className="rw-label">Vehicle Type</label>
                      <select className="rw-input" value={editForm.vehicleType} onChange={(e) => setEditForm({ ...editForm, vehicleType: e.target.value })}>
                        <option value="">Select</option><option value="bike">Bike</option><option value="auto">Auto</option><option value="car">Car</option>
                      </select>
                    </div>
                    <div><label className="rw-label">Vehicle Model</label><input className="rw-input" value={editForm.vehicleModel} onChange={(e) => setEditForm({ ...editForm, vehicleModel: e.target.value })} /></div>
                    <div><label className="rw-label">Vehicle Number</label><input className="rw-input" value={editForm.vehicleNumber} onChange={(e) => setEditForm({ ...editForm, vehicleNumber: e.target.value })} /></div>
                    {editForm.vehicleType === "car" && (
                      <>
                        <div><label className="rw-label">Car Subtype</label>
                          <select className="rw-input" value={editForm.carSubtype} onChange={(e) => setEditForm({ ...editForm, carSubtype: e.target.value })}>
                            <option value="">Select</option><option value="Sedan">Sedan</option><option value="SUV">SUV</option><option value="Hatchback">Hatchback</option><option value="Other">Other</option>
                          </select>
                        </div>
                        <div><label className="rw-label">Seating Capacity</label><input type="number" className="rw-input" value={editForm.seatingCapacity} onChange={(e) => setEditForm({ ...editForm, seatingCapacity: Number(e.target.value) })} min={2} max={9} /></div>
                      </>
                    )}
                  </>
                )}
                <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                  <button className="rw-btn-secondary" onClick={() => setEditUser(null)} style={{ flex: 1 }}>Cancel</button>
                  <button className="rw-btn-primary" onClick={handleEditSave} style={{ flex: 1 }}>Save Changes</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  );
};
export default AdminDashboard;
