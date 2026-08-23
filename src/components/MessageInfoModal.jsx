export default function MessageInfoModal({ message, isRead, readTimestamp, onClose }) {
  if (!message) return null;

  const sentTimeStr = formatFullDateTime(message.timestamp);
  const readTimeStr = isRead && readTimestamp ? formatFullDateTime(readTimestamp) : null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(15, 23, 42, 0.45)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: 16,
        animation: "fadeIn 0.2s ease",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#ffffff",
          borderRadius: 20,
          width: "100%",
          maxWidth: 380,
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
          overflow: "hidden",
          border: "1px solid #e2e8f0",
          animation: "scaleUp 0.2s ease",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid #f1f5f9",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "#f8fafc",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                background: "#eef2ff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#4f46e5",
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
            </div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#0f172a" }}>
              Message Info
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 6,
              borderRadius: 8,
              color: "#94a3b8",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Message Preview Bubble */}
        <div style={{ padding: "16px 20px", background: "#f1f5f9" }}>
          <div
            style={{
              background: "var(--color-sent-bg, #4f46e5)",
              color: "#ffffff",
              padding: "10px 14px",
              borderRadius: "16px 16px 4px 16px",
              fontSize: 14,
              lineHeight: 1.45,
              wordBreak: "break-word",
              maxWidth: "85%",
              marginLeft: "auto",
              boxShadow: "0 2px 6px rgba(79, 70, 229, 0.2)",
            }}
          >
            {message.deleted ? (
              <span style={{ fontStyle: "italic", opacity: 0.85 }}>🚫 This message was deleted</span>
            ) : (
              message.text
            )}
          </div>
        </div>

        {/* Info Rows */}
        <div style={{ padding: "16px 20px" }}>
          {/* Read Status Row */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 14,
              paddingBottom: 16,
              borderBottom: "1px solid #f1f5f9",
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 12,
                background: isRead ? "#e0f2fe" : "#f1f5f9",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <svg width="18" height="13" viewBox="0 0 16 11" fill="none">
                <path
                  d="M1 5.5L5 9.5L15 1.5"
                  stroke={isRead ? "#0284c7" : "#94a3b8"}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M5 5.5L9 9.5"
                  stroke={isRead ? "#0284c7" : "#94a3b8"}
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: isRead ? "#0369a1" : "#475569" }}>
                {isRead ? "Read" : "Unread"}
              </p>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "#64748b" }}>
                {isRead
                  ? `Seen around ${readTimeStr || "recently"}`
                  : "Recipient has not opened this message yet"}
              </p>
            </div>
          </div>

          {/* Delivered Status Row */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 14,
              paddingTop: 16,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 12,
                background: "#f1f5f9",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                <path d="M22 2L11 13" />
                <path d="M22 2L15 22L11 13L2 9L22 2Z" />
              </svg>
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#334155" }}>
                Sent
              </p>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "#64748b" }}>
                {sentTimeStr || "Just now"}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "12px 20px",
            background: "#f8fafc",
            borderTop: "1px solid #f1f5f9",
            textAlign: "right",
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "8px 16px",
              borderRadius: 10,
              background: "#4f46e5",
              color: "#ffffff",
              border: "none",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Close
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleUp {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

function formatFullDateTime(timestamp) {
  if (!timestamp) return null;
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp.seconds ? timestamp.seconds * 1000 : timestamp);
  if (isNaN(date.getTime())) return null;

  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
