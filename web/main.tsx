import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

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
      width: "100%",
      minHeight: "100vh",
      backgroundColor: "#eef8ef",
      backgroundImage: [
        "radial-gradient(circle at top left, rgba(126, 213, 143, 0.18), transparent 34%)",
        "radial-gradient(circle at bottom right, rgba(82, 183, 136, 0.22), transparent 30%)",
        "linear-gradient(180deg, #f8fcf7 0%, #edf7ee 55%, #e5f3e7 100%)",
      ].join(", "),
      color: "#1b4332",
      overflow: "hidden",
      fontFamily: "'Inter', sans-serif",
      position: "relative",
    }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.22,
          backgroundImage: [
            "radial-gradient(circle at 12% 24%, rgba(126, 213, 143, 0.42) 0, rgba(126, 213, 143, 0.42) 10px, transparent 11px)",
            "radial-gradient(circle at 80% 72%, rgba(69, 123, 89, 0.22) 0, rgba(69, 123, 89, 0.22) 12px, transparent 13px)",
          ].join(", "),
          pointerEvents: "none",
        }}
      />

      <div className="desktop-info-panel" style={{
        flex: "1 1 48%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "5% 6% 5% 8%",
        overflowY: "auto",
        position: "relative",
        zIndex: 1,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "28px" }}>
          <div style={{
            width: "48px",
            height: "48px",
            borderRadius: "14px",
            background: "linear-gradient(135deg, rgba(45,106,79,0.12) 0%, rgba(82,183,136,0.26) 100%)",
            border: "1px solid rgba(82, 183, 136, 0.35)",
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
            letterSpacing: "-0.5px",
            color: "#214d3d",
          }}>
            Lift<span style={{ color: "#2d6a4f" }}>Buddy</span>
          </span>
          <span style={{
            fontSize: "11px",
            fontWeight: "600",
            backgroundColor: "rgba(82, 183, 136, 0.14)",
            color: "#2d6a4f",
            padding: "4px 8px",
            borderRadius: "20px",
            border: "1px solid rgba(82, 183, 136, 0.25)",
            marginLeft: "8px"
          }}>Eco commute</span>
        </div>

        <h1 style={{
          fontFamily: "'Outfit', sans-serif",
          fontSize: "46px",
          fontWeight: "800",
          lineHeight: "1.15",
          marginBottom: "16px",
          letterSpacing: "-1px",
          color: "#173b2e",
        }}>
          Move around Gwalior with the same calm, clean <span style={{
            background: "linear-gradient(135deg, #2d6a4f 0%, #52b788 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent"
          }}>LiftBuddy feel.</span>
        </h1>

        <p style={{
          fontSize: "16px",
          color: "#52796f",
          lineHeight: "1.6",
          marginBottom: "35px",
          maxWidth: "480px"
        }}>
          The web experience now mirrors the app's leafy eco theme with bright surfaces, rounded cards, and green action states so booking or offering a ride feels consistent across devices.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "18px", maxWidth: "500px" }}>
          {[
            { emoji: "🗺️", title: "Map-first experience", desc: "The web shell now frames the live app like the mobile passenger screen instead of a separate dark portal." },
            { emoji: "🌿", title: "Eco visual system", desc: "Soft green gradients, white cards, and muted text match the in-app LiftBuddy identity from your screenshot." },
            { emoji: "🛠️", title: "Broken web fixes", desc: "Google Maps now loads reliably on map screens even before autocomplete mounts, preventing blank web sections." }
          ].map((feat, i) => (
            <div key={i} style={{
              display: "flex",
              gap: "16px",
              padding: "16px 20px",
              borderRadius: "18px",
              backgroundColor: "rgba(255,255,255,0.76)",
              border: "1px solid rgba(82,183,136,0.14)",
              backdropFilter: "blur(10px)",
              boxShadow: "0 18px 40px rgba(45,106,79,0.08)",
            }}>
              <span style={{ fontSize: "22px", marginTop: "2px" }}>{feat.emoji}</span>
              <div>
                <h3 style={{ fontSize: "14px", fontWeight: "700", marginBottom: "4px", color: "#173b2e" }}>{feat.title}</h3>
                <p style={{ fontSize: "12px", color: "#52796f", margin: 0, lineHeight: "1.4" }}>{feat.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mobile-frame-container" style={{
        flex: "1 1 52%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "28px",
        zIndex: 5,
        position: "relative",
      }}>
        <div className="phone-mockup" style={{
          width: "430px",
          maxWidth: "100%",
          height: "860px",
          maxHeight: "calc(100vh - 48px)",
          borderRadius: "40px",
          backgroundColor: "#f7fcf8",
          border: "12px solid rgba(255,255,255,0.75)",
          boxShadow: "0 28px 65px rgba(28, 60, 45, 0.18), 0 0 0 1px rgba(82,183,136,0.08)",
          overflow: "hidden",
          position: "relative",
          display: "flex",
          flexDirection: "column",
        }}>
          <div style={{
            position: "absolute",
            top: 0,
            left: "50%",
            transform: "translateX(-50%)",
            width: "140px",
            height: "22px",
            backgroundColor: "rgba(232, 241, 234, 0.95)",
            borderBottomLeftRadius: "16px",
            borderBottomRightRadius: "16px",
            zIndex: 99999,
          }} />

          <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "100%", width: "100%", overflow: "hidden" }}>
            {children}
          </div>
        </div>
      </div>

      <style>{`
        .phone-mockup {
          animation: shellFloat 900ms ease-out;
        }

        @keyframes shellFloat {
          from {
            opacity: 0;
            transform: translateY(24px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

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
            max-width: 100% !important;
            height: 100vh !important;
            max-height: 100vh !important;
            border: none !important;
            border-radius: 0 !important;
            box-shadow: none !important;
          }
          .phone-mockup::before {
            display: none !important;
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
    <BrowserRouter>
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
    </BrowserRouter>
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
