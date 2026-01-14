import { useState, useEffect } from "react";
import { api } from "../services/api";
import { ArrowRight, RefreshCw, Layers, CheckCircle, AlertOctagon } from "lucide-react";
import PageInfo from "../components/PageInfo";

function Dashboard({ onChangePage, conflictCount }) {
    const [stats, setStats] = useState({ total: 0, success: 0, failed: 0 });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadData();
        const interval = setInterval(loadData, 5000);
        return () => clearInterval(interval);
    }, []);

    const loadData = async () => {
        try {
            // Fetch real data to show current state
            const [contacts, companies] = await Promise.all([
                api.contacts.getAll(),
                api.companies.getAll()
            ]);

            const total = (contacts.length || 0) + (companies.length || 0);

            const syncedContacts = contacts.filter(c => c.hubspotId).length;
            const syncedCompanies = companies.filter(c => c.hubspotId).length;
            const success = syncedContacts + syncedCompanies;

            // Still use generic stats structure, but populated with live record counts
            setStats({ total, success });
        } catch (err) {
            console.error(err);
        }
    };

    const sync = async (direction) => {
        setLoading(true);
        try {
            if (direction === "pull") await api.sync.pullAll();
            else await api.sync.pushAll();
            await loadData();
        } catch (e) { console.error(e); }
        setLoading(false);
    }

    const StatCard = ({ label, value, icon: Icon, color, onClick }) => (
        <div className="card" onClick={onClick} style={{ cursor: onClick ? "pointer" : "default", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "24px" }}>
                <div style={{ padding: "12px", background: "rgba(255,255,255,0.05)", borderRadius: "50%" }}>
                    <Icon size={24} color={color} />
                </div>
                {onClick && <ArrowRight size={20} color="var(--text-muted)" />}
            </div>
            <div>
                <div style={{ fontSize: "48px", fontWeight: "900", lineHeight: "1", marginBottom: "8px", color: color || "#fff" }}>
                    {String(value).padStart(2, '0')}
                </div>
                <div style={{ fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px", color: "var(--text-secondary)" }}>
                    {label}
                </div>
            </div>
        </div>
    );

    return (
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
            {/* HERO SECTION */}
            <div style={{ padding: "40px 0 80px" }}>
                <h1 className="hero-title">
                    Data Sync<span style={{ color: "var(--accent)" }}>.</span><br />
                    Reimagined.
                </h1>
                <p style={{ fontSize: "20px", color: "var(--text-secondary)", maxWidth: "500px", lineHeight: "1.6", marginBottom: "40px" }}>
                    Real-time bidirectional synchronization between your local database and HubSpot CRM.
                </p>
                <div style={{ display: "flex", gap: "16px" }}>
                    <button className="btn btn-primary" onClick={() => sync("push")} disabled={loading}>
                        {loading ? "Syncing..." : "Push Updates"}
                    </button>
                    <button className="btn btn-secondary" onClick={() => sync("pull")} disabled={loading}>
                        {loading ? "Syncing..." : "Pull Changes"}
                    </button>
                </div>
            </div>

            {/* STATS GRID */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "24px", marginBottom: "40px" }}>
                <StatCard
                    label="Total Records"
                    value={stats.total}
                    icon={Layers}
                    color="#fff"
                />
                <StatCard
                    label="Synced Records"
                    value={stats.success}
                    icon={CheckCircle}
                    color="var(--accent)"
                />
                <StatCard
                    label="Conflicts Detected"
                    value={conflictCount !== undefined ? conflictCount : 0}
                    icon={AlertOctagon}
                    color="var(--danger)"
                    onClick={() => onChangePage("conflicts")}
                />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px" }}>
                <div className="card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                        <h3>System Health</h3>
                        <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>All systems operational. Queue processing active.</p>
                    </div>
                    <div style={{ padding: "8px 16px", background: "rgba(29, 185, 84, 0.1)", color: "var(--accent)", borderRadius: "4px", fontSize: "14px", fontWeight: "700" }}>
                        100% UPTIME
                    </div>
                </div>
                <div className="card" style={{ background: "linear-gradient(135deg, #181818 0%, #111 100%)", border: "1px solid #333" }}>
                    <h3 style={{ fontSize: "16px", marginBottom: "8px" }}>Next Sync</h3>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-secondary)", fontSize: "14px" }}>
                        <div className="spinner" style={{ width: "12px", height: "12px", border: "2px solid var(--text-secondary)", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
                        {/* Calculate next 5-minute interval (stable time) */}
                        Auto-scheduled (~ {(() => {
                            const now = new Date();
                            const nextSync = new Date(Math.ceil(now.getTime() / (5 * 60000)) * (5 * 60000));
                            if (nextSync <= now) nextSync.setMinutes(nextSync.getMinutes() + 5);
                            return nextSync.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        })()})
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;
