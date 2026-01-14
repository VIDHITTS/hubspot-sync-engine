import { useState, useEffect } from "react";
import { api } from "../services/api";
import { AlertTriangle, ArrowRight, CheckCircle, Database, Cloud, X, ShieldAlert, Loader } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import PageInfo from "../components/PageInfo";
import ConflictVisualizer from "../components/ConflictVisualizer";

// Mini Toast Component
const Toast = ({ message, type, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            style={{
                position: "fixed",
                bottom: "32px",
                right: "32px",
                padding: "16px 24px",
                background: type === "success" ? "var(--accent)" : "var(--danger)",
                color: "#000",
                fontWeight: "700",
                borderRadius: "8px",
                boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
                zIndex: 2000,
                display: "flex",
                alignItems: "center",
                gap: "12px"
            }}
        >
            {type === "success" ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
            {message}
        </motion.div>
    );
};

function Conflicts() {
    const [conflicts, setConflicts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [resolvingId, setResolvingId] = useState(null); // Track which ID is resolving
    const [selectedConflict, setSelectedConflict] = useState(null);
    const [toast, setToast] = useState(null); // { message, type }

    const loadConflicts = async () => {
        try {
            const data = await api.conflicts.getAll();
            setConflicts(data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => { loadConflicts(); }, []);

    const resolve = async (id, method) => {
        // Removed the native confirm() dialog for smoother UX
        setResolvingId(id);
        try {
            if (method === "local") await api.conflicts.keepLocal(id);
            else await api.conflicts.keepRemote(id);

            setToast({ message: "Conflict Resolved Successfully", type: "success" });
            setSelectedConflict(null);

            // Slight delay to allow animation
            setTimeout(() => {
                setConflicts(prev => prev.filter(c => c._id !== id));
                setResolvingId(null);
            }, 500);

        } catch (e) {
            setToast({ message: e.message || "Resolution Failed", type: "error" });
            setResolvingId(null);
        }
    }

    // Helper to safely get data regardless of naming convention
    const getData = (conflict, type) => {
        if (type === 'local') return conflict.localData || conflict.localSnapshot || {};
        return conflict.hubspotData || conflict.remoteSnapshot || {};
    }

    // Helper to get display name
    const getName = (data) => {
        return data.email || data.domain || data.name || data.firstname ? `${data.firstname || ''} ${data.lastname || ''}`.trim() || data.name || data.email : "Unknown Entity";
    }

    return (
        <div>
            <PageInfo
                description="Conflict Quarantine Desk. Rapid updates and data collisions are held here for manual review to prevent data loss."
                functionalities={["Race Condition Guard", "Time-Lock Active", "Manual Resolution"]}
            />

            <AnimatePresence>
                {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            </AnimatePresence>

            {conflicts.length === 0 ? (
                <div className="card" style={{ textAlign: "center", padding: "80px 0" }}>
                    <div style={{ width: "80px", height: "80px", background: "var(--surface-elevated)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 32px" }}>
                        <CheckCircle size={40} color="var(--accent)" />
                    </div>
                    <h2>No Active Conflicts</h2>
                    <p style={{ color: "var(--text-secondary)" }}>Your data is perfectly synchronized.</p>
                </div>
            ) : (
                <div style={{ display: "grid", gap: "16px" }}>
                    <AnimatePresence>
                        {conflicts.map(conflict => {
                            const localData = getData(conflict, 'local');
                            const name = getName(localData);
                            const isResolving = resolvingId === conflict._id;

                            return (
                                <motion.div
                                    key={conflict._id}
                                    layout
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, x: -50 }}
                                    className="card"
                                    style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "24px" }}
                                >
                                    <div style={{ display: "flex", alignItems: "center", gap: "24px", flex: 1 }}>
                                        <div style={{ padding: "12px", background: "rgba(233, 20, 41, 0.1)", borderRadius: "8px" }}>
                                            <AlertTriangle color="var(--danger)" size={24} />
                                        </div>
                                        <div>
                                            <div style={{ fontSize: "12px", fontWeight: "700", color: "var(--danger)", textTransform: "uppercase", marginBottom: "4px" }}>
                                                {conflict.conflictMetadata?.type || "Data Mismatch"}
                                            </div>
                                            <div style={{ fontSize: "18px", fontWeight: "700", color: "#fff", marginBottom: "4px" }}>
                                                {name}
                                            </div>
                                            <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                                                Detected: {new Date(conflict.detectedAt).toLocaleString()}
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ display: "flex", gap: "12px" }}>
                                        <button
                                            className="btn btn-primary btn-sm"
                                            onClick={() => setSelectedConflict(conflict)}
                                            disabled={isResolving}
                                        >
                                            {isResolving ? <Loader className="animate-spin" size={14} /> : "Review & Resolve"}
                                        </button>
                                    </div>
                                </motion.div>
                            )
                        })}
                    </AnimatePresence>
                </div>
            )}

            {selectedConflict && (
                <div className="modal-overlay" onClick={() => setSelectedConflict(null)}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="modal"
                        style={{ maxWidth: "1000px", height: "85vh" }}
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="modal-header">
                            <h3>Resolution Desk</h3>
                            <button className="btn-secondary" style={{ border: "none", padding: "8px" }} onClick={() => setSelectedConflict(null)}><X size={20} /></button>
                        </div>
                        <div className="modal-body" style={{ display: "flex", flexDirection: "column" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px", background: "rgba(255, 164, 43, 0.1)", padding: "16px", borderRadius: "8px", marginBottom: "24px", border: "1px solid rgba(255, 164, 43, 0.2)" }}>
                                <ShieldAlert color="var(--warning)" size={24} />
                                <span style={{ fontSize: "14px", color: "#e2e2e2" }}>
                                    <strong>Action Required:</strong> Compare field values below. Click the card for the version you want to keep.
                                </span>
                            </div>

                            <div style={{ flex: 1 }}>
                                <ConflictVisualizer
                                    localData={getData(selectedConflict, 'local')}
                                    remoteData={getData(selectedConflict, 'hubspot')}
                                    onResolve={(type) => resolve(selectedConflict._id, type)}
                                />
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}

export default Conflicts;
