import React from 'react';

const PageInfo = ({ description, functionalities = [] }) => {
    return (
        <div style={{
            marginBottom: "40px",
            borderBottom: "1px solid var(--border)",
            paddingBottom: "32px"
        }} className="fade-in-up">
            <p style={{
                fontSize: "18px",
                color: "var(--text-secondary)",
                marginBottom: "24px",
                maxWidth: "800px",
                lineHeight: "1.6"
            }}>
                {description}
            </p>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                {functionalities.map((func, index) => (
                    <span key={index} style={{
                        fontSize: "11px",
                        fontWeight: "700",
                        textTransform: "uppercase",
                        letterSpacing: "1px",
                        color: "var(--accent)",
                        background: "rgba(29, 185, 84, 0.1)",
                        padding: "8px 16px",
                        borderRadius: "500px"
                    }}>
                        {func}
                    </span>
                ))}
            </div>
        </div>
    );
};

export default PageInfo;
