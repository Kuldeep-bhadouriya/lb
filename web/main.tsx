import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";

// Global Layout
import RootLayout from "../app/_layout";

// Screens
import Index from "../app/index";
import Onboarding from "../app/onboarding/index";

// Auth
import Login from "../app/auth/login";
import Register from "../app/auth/register";
import ForgotPassword from "../app/auth/forgotPassword";
import FacultyLogin from "../app/auth/facultyLogin";
import FacultyRegister from "../app/auth/facultyRegister";

// Home Tabs Layout & Screens
import HomeTabsLayout from "../app/home/_layout";
import Passenger from "../app/home/passenger";
import Driver from "../app/home/driver";
import Myrides from "../app/home/Myrides";
import Dashboard from "../app/home/dashboard";
import ProfileTab from "../app/home/profileTab";

// Profile
import ChangePassword from "../app/profile/changePassword";
import EditProfile from "../app/profile/editProfile";
import Feedback from "../app/profile/feedback";
import Help from "../app/profile/help";
import Privacy from "../app/profile/privacy";

// Verify
import VerifyEmail from "../app/verify/verifyEmail";
import VerifyLicence from "../app/verify/verifyLicence";
import VerifyOtp from "../app/verify/verifyOtp";
import VerifyPhone from "../app/verify/verifyPhone";

// Search
import PickupSearch from "../app/pickupSearch";
import DestinationSearch from "../app/destinationSearch";

// Ride
import AvailableRides from "../app/ride/availableRides";
import EditDestinationSearch from "../app/ride/editDestinationSearch";
import EditPickupSearch from "../app/ride/editPickupSearch";
import EditRides from "../app/ride/editRides";
import Tracking from "../app/ride/tracking";

// Styled Desktop Shell Wrapper
function WebAppShell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      display: "flex",
      width: "100vw",
      height: "100vh",
      backgroundColor: "#070a13",
      backgroundImage: "radial-gradient(circle at 10% 20%, rgba(45, 106, 79, 0.15) 0%, transparent 40%), radial-gradient(circle at 90% 80%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)",
      color: "#f8fafc",
      overflow: "hidden",
      fontFamily: "'Inter', sans-serif"
    }}>
      {/* Desktop Info Panel (only visible on screens larger than 860px) */}
      <div className="desktop-info-panel" style={{
        flex: "1 1 50%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "5% 6% 5% 8%",
        overflowY: "auto",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "30px" }}>
          <div style={{
            width: "48px",
            height: "48px",
            borderRadius: "14px",
            backgroundColor: "rgba(45, 106, 79, 0.2)",
            border: "1px solid rgba(82, 183, 136, 0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 8px 24px rgba(45, 106, 79, 0.25)"
          }}>
            <span style={{ fontSize: "24px" }}>🚗</span>
          </div>
          <span style={{
            fontFamily: "'Outfit', sans-serif",
            fontSize: "30px",
            fontWeight: "800",
            letterSpacing: "-0.5px"
          }}>
            Lift<span style={{ color: "#52b788" }}>Buddy</span>
          </span>
          <span style={{
            fontSize: "11px",
            fontWeight: "600",
            backgroundColor: "rgba(59, 130, 246, 0.15)",
            color: "#60a5fa",
            padding: "4px 8px",
            borderRadius: "20px",
            border: "1px solid rgba(59, 130, 246, 0.3)",
            marginLeft: "8px"
          }}>Web Portal v3.0</span>
        </div>

        <h1 style={{
          fontFamily: "'Outfit', sans-serif",
          fontSize: "46px",
          fontWeight: "800",
          lineHeight: "1.15",
          marginBottom: "16px",
          letterSpacing: "-1px"
        }}>
          Share rides, save money & <span style={{
            background: "linear-gradient(135deg, #52b788 0%, #3b82f6 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent"
          }}>travel smart.</span>
        </h1>

        <p style={{
          fontSize: "16px",
          color: "#94a3b8",
          lineHeight: "1.6",
          marginBottom: "35px",
          maxWidth: "480px"
        }}>
          LiftBuddy is Gwalior's smart carpooling companion. Connect with students, faculty and riders taking your route. Split travel costs, reduce carbon emissions, and build local networks.
        </p>

        {/* Feature Cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: "18px", maxWidth: "480px" }}>
          {[
            { emoji: "⚡", title: "Instant Ride Booking", desc: "Book passenger seats or offer rides on the fly in seconds." },
            { emoji: "🪙", title: "Credit Reward Points", desc: "Earn and split trip credits instantly converted into actual value." },
            { emoji: "🛡️", title: "Verified Community", desc: "Special security filters and verifications for students and faculty." }
          ].map((feat, i) => (
            <div key={i} style={{
              display: "flex",
              gap: "16px",
              padding: "16px 20px",
              borderRadius: "18px",
              backgroundColor: "rgba(30, 41, 59, 0.4)",
              border: "1px solid rgba(255,255,255,0.05)",
              backdropFilter: "blur(8px)",
              transition: "transform 0.2s ease"
            }}>
              <span style={{ fontSize: "22px", marginTop: "2px" }}>{feat.emoji}</span>
              <div>
                <h3 style={{ fontSize: "14px", fontWeight: "700", marginBottom: "4px", color: "#f1f5f9" }}>{feat.title}</h3>
                <p style={{ fontSize: "12px", color: "#94a3b8", margin: 0, lineHeight: "1.4" }}>{feat.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mobile Device Frame Container */}
      <div className="mobile-frame-container" style={{
        flex: "1 1 50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        zIndex: 5
      }}>
        {/* Responsive Mobile Phone Mockup */}
        <div className="phone-mockup" style={{
          width: "410px",
          height: "830px",
          borderRadius: "44px",
          backgroundColor: "#0b0f19",
          border: "10px solid #1e293b",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 40px rgba(82, 183, 136, 0.15)",
          overflow: "hidden",
          position: "relative",
          display: "flex",
          flexDirection: "column"
        }}>
          {/* Status bar notch */}
          <div style={{
            position: "absolute",
            top: 0,
            left: "50%",
            transform: "translateX(-50%)",
            width: "140px",
            height: "22px",
            backgroundColor: "#1e293b",
            borderBottomLeftRadius: "16px",
            borderBottomRightRadius: "16px",
            zIndex: 99999,
          }} />

          {/* Actual React App Mounting content */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "100%", width: "100%", overflow: "hidden" }}>
            {children}
          </div>
        </div>
      </div>

      {/* CSS Styles injection for responsive layouts */}
      <style>{`
        @media (max-width: 860px) {
          .desktop-info-panel {
            display: none !important;
          }
          .mobile-frame-container {
            flex: 1 1 100% !important;
            padding: 0 !important;
          }
          .phone-mockup {
            width: 100% !important;
            height: 100% !important;
            border: none !important;
            border-radius: 0 !important;
            box-shadow: none !important;
          }
          .phone-mockup > div {
            border-radius: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}

// Router Setup
function AppRouter() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<RootLayout />}>
          {/* Root/Redirect */}
          <Route path="/" element={<Index />} />
          <Route path="/onboarding" element={<Onboarding />} />

          {/* Authentication */}
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/register" element={<Register />} />
          <Route path="/auth/forgotPassword" element={<ForgotPassword />} />
          <Route path="/auth/facultyLogin" element={<FacultyLogin />} />
          <Route path="/auth/facultyRegister" element={<FacultyRegister />} />

          {/* Home Tab Views (Sub-routes under HomeTabsLayout) */}
          <Route path="/home" element={<HomeTabsLayout />}>
            <Route path="passenger" element={<Passenger />} />
            <Route path="driver" element={<Driver />} />
            <Route path="Myrides" element={<Myrides />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="profileTab" element={<ProfileTab />} />
            <Route index element={<Navigate to="passenger" replace />} />
          </Route>

          {/* Profile Management */}
          <Route path="/profile/changePassword" element={<ChangePassword />} />
          <Route path="/profile/editProfile" element={<EditProfile />} />
          <Route path="/profile/feedback" element={<Feedback />} />
          <Route path="/profile/help" element={<Help />} />
          <Route path="/profile/privacy" element={<Privacy />} />

          {/* Verifications */}
          <Route path="/verify/verifyEmail" element={<VerifyEmail />} />
          <Route path="/verify/verifyLicence" element={<VerifyLicence />} />
          <Route path="/verify/verifyOtp" element={<VerifyOtp />} />
          <Route path="/verify/verifyPhone" element={<VerifyPhone />} />

          {/* Location searches */}
          <Route path="/pickupSearch" element={<PickupSearch />} />
          <Route path="/destinationSearch" element={<DestinationSearch />} />

          {/* Rides */}
          <Route path="/ride/availableRides" element={<AvailableRides />} />
          <Route path="/ride/editDestinationSearch" element={<EditDestinationSearch />} />
          <Route path="/ride/editPickupSearch" element={<EditPickupSearch />} />
          <Route path="/ride/editRides" element={<EditRides />} />
          <Route path="/ride/tracking" element={<Tracking />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}

// App Entry
function App() {
  return (
    <WebAppShell>
      <AppRouter />
    </WebAppShell>
  );
}

const rootElement = document.getElementById("root");
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
