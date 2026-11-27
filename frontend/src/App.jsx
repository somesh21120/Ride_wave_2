import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import Landing from "./pages/Landing";
import PassengerLogin from "./pages/PassengerLogin";
import DriverLogin from "./pages/DriverLogin";
import PassengerRegister from "./pages/PassengerRegister";
import DriverRegister from "./pages/DriverRegister";
import Dashboard from "./pages/Dashboard";
import BookRide from "./pages/BookRide";
import MyRides from "./pages/MyRides";
import DriverDashboard from "./pages/DriverDashboard";
import Profile from "./pages/Profile";
import DailyRides from "./pages/DailyRides";
import AdminDashboard from "./pages/AdminDashboard";
import AdminLogin from "./pages/AdminLogin";
import About from "./pages/About";
import Contact from "./pages/Contact";
import FAQ from "./pages/FAQ";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import NotFound from "./pages/NotFound";
import MlLab from "./pages/MlLab";
import TripShare from "./pages/TripShare";
import TopProgress from "./components/ui/TopProgress";
import Navbar from "./components/Navbar";
import PublicNavbar from "./components/PublicNavbar";
import Footer from "./components/Footer";
import BottomNav from "./components/BottomNav";
// Passengers and drivers get a bottom nav on phones, so the top navbar and footer
// are hidden there. Admins have no bottom nav, so they keep the navbar on phones.
const AppLayout = ({ children }) => {
  const { user } = useSelector((state) => state.auth);
  const hasBottomNav = user && user.role !== "admin";
  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <div className={hasBottomNav ? "rw-navbar-mobile-hidden" : undefined}><Navbar /></div>
      <div style={{ flex: 1, paddingBottom: "env(safe-area-inset-bottom, 0px)" }} className={hasBottomNav ? "rw-page-content" : undefined}>{children}</div>
      <div className="rw-footer-mobile-hidden"><Footer /></div>
      <BottomNav />
    </div>
  );
};
const PublicLayout = ({ children }) => (
  <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
    <PublicNavbar />
    <div style={{ flex: 1 }}>{children}</div>
    <Footer />
  </div>
);
const PrivateRoute = ({ children }) => {
  const { user } = useSelector((state) => state.auth);
  return user ? <AppLayout>{children}</AppLayout> : <Navigate to="/login" replace />;
};
const AdminRoute = ({ children }) => {
  const { user } = useSelector((state) => state.auth);
  if (!user) return <Navigate to="/admin/login" replace />;
  if (user.role !== "admin") return <Navigate to="/dashboard" replace />;
  return <AppLayout>{children}</AppLayout>;
};
const HomeRoute = () => {
  const { user } = useSelector((state) => state.auth);
  if (user?.role === "admin") return <Navigate to="/admin" replace />;
  if (user?.role === "driver") return <Navigate to="/driver" replace />;
  return user ? <Navigate to="/dashboard" replace /> : <PublicLayout><Landing /></PublicLayout>;
};
function AppRoutes() {
  const location = useLocation();
  return (
    <>
      <TopProgress />
      <div key={location.pathname} className="rw-fade-up" style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <Routes>
        <Route path="/" element={<HomeRoute />} />
        <Route path="/login" element={<PublicLayout><PassengerLogin /></PublicLayout>} />
        <Route path="/login/passenger" element={<PublicLayout><PassengerLogin /></PublicLayout>} />
        <Route path="/login/driver" element={<PublicLayout><DriverLogin /></PublicLayout>} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/register" element={<PublicLayout><PassengerRegister /></PublicLayout>} />
        <Route path="/register/passenger" element={<PublicLayout><PassengerRegister /></PublicLayout>} />
        <Route path="/register/driver" element={<PublicLayout><DriverRegister /></PublicLayout>} />
        <Route path="/about" element={<PublicLayout><About /></PublicLayout>} />
        <Route path="/contact" element={<PublicLayout><Contact /></PublicLayout>} />
        <Route path="/faq" element={<PublicLayout><FAQ /></PublicLayout>} />
        <Route path="/trip/:token" element={<TripShare />} />
        <Route path="/lab" element={<Navigate to="/admin/ml-lab" replace />} />
        <Route path="/admin/ml-lab" element={<AdminRoute><MlLab /></AdminRoute>} />
        <Route path="/terms" element={<PublicLayout><Terms /></PublicLayout>} />
        <Route path="/privacy" element={<PublicLayout><Privacy /></PublicLayout>} />
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/book" element={<PrivateRoute><BookRide /></PrivateRoute>} />
        <Route path="/my-rides" element={<PrivateRoute><MyRides /></PrivateRoute>} />
        <Route path="/driver" element={<PrivateRoute><DriverDashboard /></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
        <Route path="/daily-rides" element={<PrivateRoute><DailyRides /></PrivateRoute>} />
        <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="*" element={<PublicLayout><NotFound /></PublicLayout>} />
      </Routes>
      </div>
    </>
  );
}

function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}
export default App;
