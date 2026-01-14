import { useState, useEffect } from "react";
import { api } from "../services/api";
import { ScrollText, ArrowRight, ArrowLeft } from "lucide-react";

function Logs() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const data = await api.logs.getAll();
                setLogs(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchLogs();
        const interval = setInterval(fetchLogs, 5000);
        return () => clearInterval(interval);
    }, []);

    if (loading) return <div className="loading"><div className="spinner"></div></div>;

    return (
        <div>
            <div className="page-header">
                <div>
                    <h2 style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <ScrollText color="var(--color-primary)" />
                        System Logs
                    </h2>
                    <p style={{ color: "var(--color-text-muted)" }}>Recent synchronization events</p>
                </div>
            </div>

            <div className="card">
                <table className="table">
                    <thead>
                        <tr>
                            <th>Direction</th>
                            <th>Entity</th>
                            <th>Action</th>
                            <th>Status</th>
                            <th>Duration</th>
                            <th>Time</th>
                        </tr>
                    </thead>
                    <tbody style={{ fontSize: "13px" }}>
                        {logs.map((log) => (
                            <tr key={log._id}>
                                <td>
                                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                        {log.direction === "INBOUND" ? (
                                            <ArrowRight size={14} color="var(--color-warning)" />
                                        ) : (
                                            <ArrowLeft size={14} color="var(--color-primary)" />
                                        )}
                                        <span style={{ fontWeight: "600", fontSize: "11px", color: "var(--color-text-muted)" }}>
                                            {log.direction}
                                        </span>
                                    </div>
                                </td>
                                <td style={{ textTransform: "capitalize" }}>{log.entityType}</td>
                                <td>{log.action}</td>
                                <td>
                                    {log.status === "SUCCESS" ? (
                                        <span style={{ color: "var(--color-success)" }}>● Success</span>
                                    ) : log.status === "FAILED" ? (
                                        <span style={{ color: "var(--color-error)" }}>● Failed</span>
                                    ) : (
                                        <span>{log.status}</span>
                                    )}
                                </td>
                                <td style={{ fontFamily: "monospace", color: "var(--color-text-muted)" }}>
                                    {log.duration}ms
                                </td>
                                <td style={{ color: "var(--color-text-muted)" }}>
                                    {new Date(log.createdAt).toLocaleTimeString()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default Logs;
