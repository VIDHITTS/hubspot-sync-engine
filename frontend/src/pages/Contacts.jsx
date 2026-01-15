import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../services/api";
import { Mail, Phone, Plus, RefreshCw, Trash2, Edit2, X, AlertTriangle, Loader } from "lucide-react";
import PageInfo from "../components/PageInfo";

// Custom Confirmation Modal
const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel, loading }) => {
    if (!isOpen) return null;
    return (
        <div className="modal-overlay" onClick={onCancel}>
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="modal"
                style={{ maxWidth: "400px" }}
                onClick={e => e.stopPropagation()}
            >
                <div className="modal-header">
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <AlertTriangle color="var(--danger)" size={20} />
                        <h3 style={{ margin: 0 }}>{title}</h3>
                    </div>
                </div>
                <div className="modal-body">
                    <p style={{ color: "var(--text-secondary)", margin: 0 }}>{message}</p>
                </div>
                <div className="modal-footer" style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                    <button className="btn btn-secondary" onClick={onCancel} disabled={loading}>
                        Cancel
                    </button>
                    <button className="btn btn-primary" style={{ background: "var(--danger)" }} onClick={onConfirm} disabled={loading}>
                        {loading ? <Loader className="animate-spin" size={16} /> : "Delete"}
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

// Toast Notification
const Toast = ({ message, type, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 1500);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            style={{
                position: "fixed",
                bottom: "32px",
                right: "32px",
                padding: "16px 24px",
                background: type === "success" ? "var(--accent)" : "var(--danger)",
                color: type === "success" ? "#000" : "#fff",
                fontWeight: "700",
                borderRadius: "8px",
                boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
                zIndex: 2000
            }}
        >
            {message}
        </motion.div>
    );
};

function Contacts() {
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(null);
    const [formData, setFormData] = useState({ firstname: "", lastname: "", email: "", phone: "", company: "" });

    // Confirmation and feedback state
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [toast, setToast] = useState(null);

    useEffect(() => { loadContacts(); }, []);

    // Auto-refresh every 3 seconds to show sync status updates
    useEffect(() => {
        const interval = setInterval(() => {
            loadContacts();
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    const loadContacts = async () => {
        setLoading(true);
        try {
            const data = await api.contacts.getAll();
            setContacts(data);
        } catch (e) {
            console.error(e);
            setToast({ message: "Failed to load contacts", type: "error" });
        }
        finally { setLoading(false); }
    }

    const handleDelete = async () => {
        if (!confirmDelete) return;
        setDeleteLoading(true);
        try {
            await api.contacts.delete(confirmDelete);
            setContacts(prev => prev.filter(c => c._id !== confirmDelete));
            setToast({ message: "Contact deleted successfully", type: "success" });
        } catch (e) {
            console.error(e);
            setToast({ message: e.message || "Delete failed", type: "error" });
        } finally {
            setDeleteLoading(false);
            setConfirmDelete(null);
        }
    }

    const handleEdit = (c) => {
        setFormData({
            firstname: c.firstname || "",
            lastname: c.lastname || "",
            email: c.email || "",
            phone: c.phone || "",
            company: c.company || ""
        });
        setIsEditing(c._id);
        setShowModal(true);
    }

    const handleCreate = () => {
        setFormData({ firstname: "", lastname: "", email: "", phone: "", company: "" });
        setIsEditing(null);
        setShowModal(true);
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isEditing) {
                await api.contacts.update(isEditing, formData);
                setToast({ message: "Contact updated", type: "success" });
            } else {
                await api.contacts.create(formData);
                setToast({ message: "Contact created", type: "success" });
            }
            setShowModal(false);
            loadContacts();
        } catch (err) {
            setToast({ message: err.message || "Operation failed", type: "error" });
        }
    }

    return (
        <div>
            <AnimatePresence>
                {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            </AnimatePresence>

            <ConfirmModal
                isOpen={!!confirmDelete}
                title="Delete Contact"
                message="Are you sure you want to delete this contact? This action cannot be undone."
                onConfirm={handleDelete}
                onCancel={() => setConfirmDelete(null)}
                loading={deleteLoading}
            />

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <PageInfo
                    description="Manage your local contacts synchronized with HubSpot."
                    functionalities={["Bi-Directional Sync", "Create & Update", "Delete Propagation"]}
                />
                <button className="btn btn-primary" onClick={handleCreate}>
                    <Plus size={16} /> New Contact
                </button>
            </div>

            <div className="card" style={{ padding: "0" }}>
                <table className="table">
                    <thead>
                        <tr>
                            <th>Identity</th>
                            <th>Contact Info</th>
                            <th>Company</th>
                            <th>Status</th>
                            <th style={{ textAlign: "right" }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {contacts.map(c => (
                            <tr key={c._id}>
                                <td>
                                    <div style={{ fontWeight: "700", color: "#fff" }}>{c.firstname} {c.lastname}</div>
                                    <code style={{ fontSize: "10px", color: "var(--text-muted)" }}>{c._id.slice(-6)}</code>
                                </td>
                                <td>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "12px", color: "var(--text-secondary)" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}><Mail size={12} /> {c.email}</div>
                                        {c.phone && <div style={{ display: "flex", alignItems: "center", gap: "6px" }}><Phone size={12} /> {c.phone}</div>}
                                    </div>
                                </td>
                                <td>{c.company || <span style={{ opacity: 0.3 }}>—</span>}</td>
                                <td>
                                    <span className={`badge ${c.syncStatus?.toLowerCase() === 'synced' ? 'synced' : 'pending'}`}>
                                        {c.syncStatus || "SYNCED"}
                                    </span>
                                </td>
                                <td style={{ textAlign: "right" }}>
                                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                                        <button className="btn btn-secondary btn-sm" title="Edit" onClick={() => handleEdit(c)}>
                                            <Edit2 size={14} />
                                        </button>
                                        <button className="btn btn-secondary btn-sm" title="Delete" style={{ borderColor: "var(--danger)", color: "var(--danger)" }} onClick={() => setConfirmDelete(c._id)}>
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {contacts.length === 0 && !loading && (
                            <tr>
                                <td colSpan="5" style={{ textAlign: "center", padding: "40px", color: "var(--text-secondary)" }}>
                                    No contacts found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {
                showModal && (
                    <div className="modal-overlay" onClick={() => setShowModal(false)}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="modal"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="modal-header">
                                <h3>{isEditing ? "Edit Contact" : "Create Contact"}</h3>
                                <button className="btn-secondary" style={{ border: "none" }} onClick={() => setShowModal(false)}>
                                    <X size={20} />
                                </button>
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div className="modal-body" style={{ display: "grid", gap: "16px" }}>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                                        <div>
                                            <label style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-secondary)", marginBottom: "8px", display: "block" }}>
                                                FIRST NAME <span style={{ opacity: 0.5, fontWeight: 400, fontSize: "11px" }}>(Optional)</span>
                                            </label>
                                            <input value={formData.firstname} onChange={e => setFormData({ ...formData, firstname: e.target.value })} />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-secondary)", marginBottom: "8px", display: "block" }}>
                                                LAST NAME <span style={{ opacity: 0.5, fontWeight: 400, fontSize: "11px" }}>(Optional)</span>
                                            </label>
                                            <input value={formData.lastname} onChange={e => setFormData({ ...formData, lastname: e.target.value })} />
                                        </div>
                                    </div>
                                    <div>
                                        <label style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-secondary)", marginBottom: "8px", display: "block" }}>EMAIL <span style={{ color: "var(--danger)", marginLeft: "4px" }}>*</span> ADDRESS</label>
                                        <input type="email" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-secondary)", marginBottom: "8px", display: "block" }}>
                                            PHONE <span style={{ opacity: 0.5, fontWeight: 400, fontSize: "11px" }}>(Optional)</span>
                                        </label>
                                        <input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-secondary)", marginBottom: "8px", display: "block" }}>
                                            COMPANY <span style={{ opacity: 0.5, fontWeight: 400, fontSize: "11px" }}>(Optional)</span>
                                        </label>
                                        <input value={formData.company} onChange={e => setFormData({ ...formData, company: e.target.value })} />
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" style={{ marginRight: "12px" }} onClick={() => setShowModal(false)}>Cancel</button>
                                    <button type="submit" className="btn btn-primary">{isEditing ? "Update Contact" : "Create Contact"}</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )
            }
        </div >
    );
}

export default Contacts;
