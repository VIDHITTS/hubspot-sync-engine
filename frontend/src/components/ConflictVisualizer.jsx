import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, AlertTriangle, ArrowRight } from 'lucide-react';

const ConflictVisualizer = ({ localData, remoteData, onResolve }) => {
    // 1. Identify all unique keys to compare
    const allKeys = Array.from(new Set([
        ...Object.keys(localData || {}),
        ...Object.keys(remoteData || {})
    ])).filter(k => k !== 'id' && k !== '_id' && k !== 'createdAt' && k !== 'updatedAt' && k !== '__v');

    const FieldRow = ({ label, localVal, remoteVal }) => {
        const isDiff = JSON.stringify(localVal) !== JSON.stringify(remoteVal);

        return (
            <div style={{
                display: "grid",
                gridTemplateColumns: "100px 1fr 1fr",
                gap: "16px",
                padding: "12px 0",
                borderBottom: "1px solid rgba(255,255,255,0.05)",
                alignItems: "center"
            }}>
                <div style={{
                    fontSize: "11px",
                    fontWeight: "700",
                    textTransform: "uppercase",
                    color: isDiff ? "var(--warning)" : "var(--text-secondary)",
                    letterSpacing: "1px"
                }}>
                    {label}
                </div>
                <div style={{
                    color: isDiff ? "#fff" : "var(--text-secondary)",
                    fontSize: "13px",
                    fontWeight: isDiff ? "600" : "400"
                }}>
                    {localVal || <span style={{ opacity: 0.3 }}>-</span>}
                </div>
                <div style={{
                    color: isDiff ? "#fff" : "var(--text-secondary)",
                    fontSize: "13px",
                    fontWeight: isDiff ? "600" : "400"
                }}>
                    {remoteVal || <span style={{ opacity: 0.3 }}>-</span>}
                </div>
            </div>
        )
    }

    return (
        <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
            {/* Headers */}
            <div style={{
                display: "grid",
                gridTemplateColumns: "100px 1fr 1fr",
                gap: "16px",
                marginBottom: "16px",
                paddingBottom: "16px",
                borderBottom: "1px solid var(--border)"
            }}>
                <div></div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--accent)" }}>
                    <div style={{ width: "8px", height: "8px", background: "currentColor", borderRadius: "50%" }}></div>
                    <span style={{ fontSize: "12px", fontWeight: "800", letterSpacing: "1px" }}>LOCAL VERSION</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--warning)" }}>
                    <div style={{ width: "8px", height: "8px", background: "currentColor", borderRadius: "50%" }}></div>
                    <span style={{ fontSize: "12px", fontWeight: "800", letterSpacing: "1px" }}>HUBSPOT VERSION</span>
                </div>
            </div>

            {/* Comparison Grid */}
            <div style={{ flex: 1, overflowY: "auto", marginBottom: "24px" }}>
                {allKeys.map(key => (
                    <FieldRow
                        key={key}
                        label={key}
                        localVal={localData[key]}
                        remoteVal={remoteData[key]}
                    />
                ))}
            </div>

            {/* Selection Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                {/* Local Selection */}
                <motion.div
                    whileHover={{ scale: 1.02 }}
                    style={{
                        background: "rgba(29, 185, 84, 0.05)",
                        border: "1px solid rgba(29, 185, 84, 0.2)",
                        borderRadius: "8px",
                        padding: "20px",
                        cursor: "pointer",
                        position: "relative",
                        overflow: "hidden"
                    }}
                    onClick={() => onResolve('local')}
                >
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "4px", background: "var(--accent)" }}></div>
                    <h4 style={{ color: "#fff", marginBottom: "8px", fontSize: "16px" }}>Keep Local Version</h4>
                    <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "16px" }}>Overwrite HubSpot with local data.</p>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: "700", color: "var(--accent)" }}>
                        CONFIRM RESOLUTION <ArrowRight size={14} />
                    </div>
                </motion.div>

                {/* Remote Selection */}
                <motion.div
                    whileHover={{ scale: 1.02 }}
                    style={{
                        background: "rgba(255, 164, 43, 0.05)",
                        border: "1px solid rgba(255, 164, 43, 0.2)",
                        borderRadius: "8px",
                        padding: "20px",
                        cursor: "pointer",
                        position: "relative",
                        overflow: "hidden"
                    }}
                    onClick={() => onResolve('remote')}
                >
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "4px", background: "var(--warning)" }}></div>
                    <h4 style={{ color: "#fff", marginBottom: "8px", fontSize: "16px" }}>Keep HubSpot Version</h4>
                    <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "16px" }}>Overwrite Local DB with HubSpot data.</p>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: "700", color: "var(--warning)" }}>
                        CONFIRM RESOLUTION <ArrowRight size={14} />
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default ConflictVisualizer;
