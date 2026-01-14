import { useState, useEffect } from "react";
import {
  ArrowRightLeft,
  LayoutDashboard,
  Users,
  Building2,
  AlertTriangle,
  ScrollText,
  Activity
} from "lucide-react";
import Dashboard from "./pages/Dashboard";
import Contacts from "./pages/Contacts";
import Companies from "./pages/Companies";
import Conflicts from "./pages/Conflicts";
import Logs from "./pages/Logs";
import { api } from "./services/api";

const NAV_ITEMS = [
  { id: "dashboard", label: "Overview", icon: LayoutDashboard },
  { id: "contacts", label: "Contacts", icon: Users },
  { id: "companies", label: "Companies", icon: Building2 },
  { id: "conflicts", label: "Conflicts", icon: AlertTriangle },
  { id: "logs", label: "Activity Logs", icon: ScrollText },
];

function App() {
  const [activePage, setActivePage] = useState("dashboard");
  const [systemHealth, setSystemHealth] = useState("connected"); // simplified for visual

  const renderPage = () => {
    switch (activePage) {
      case "dashboard": return <Dashboard onChangePage={setActivePage} />;
      case "contacts": return <Contacts />;
      case "companies": return <Companies />;
      case "conflicts": return <Conflicts />;
      case "logs": return <Logs />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="app">
      <aside className="sidebar">
        <div style={{ padding: "0 16px 40px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", color: "#fff" }}>
            <ArrowRightLeft size={32} />
            <h1 style={{ fontSize: "20px", margin: 0, letterSpacing: "-0.5px" }}>SyncEngine<span style={{ color: "var(--accent)" }}>.</span></h1>
          </div>
        </div>

        <nav style={{ flex: 1 }}>
          <div style={{
            padding: "0 16px 12px",
            fontSize: "11px",
            fontWeight: "700",
            color: "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: "1px"
          }}>
            Menu
          </div>

          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <div
                key={item.id}
                className={`nav-item ${isActive ? "active" : ""}`}
                onClick={() => setActivePage(item.id)}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </div>
            );
          })}
        </nav>

        <div style={{ padding: "24px" }}>
          <div style={{ background: "#282828", borderRadius: "8px", padding: "16px" }}>
            <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "8px", fontWeight: "600" }}>SYSTEM STATUS</div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--accent)", boxShadow: "0 0 10px var(--accent)" }}></div>
              <span style={{ fontSize: "13px", fontWeight: "500", color: "#fff" }}>Operational</span>
            </div>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <div className="fade-in-up">
          {renderPage()}
        </div>
      </main>
    </div>
  );
}

export default App;
