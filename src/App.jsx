import { useState } from "react";
import { useAuth } from "./context/AuthContext";
import Login from "./components/Login";
import ChatList from "./components/ChatList";
import ChatWindow from "./components/ChatWindow";

export default function App() {
  const { user, loading, logout } = useAuth();
  const [peer, setPeer] = useState(null);

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          background: "#f8fafc",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: 40,
              height: 40,
              border: "3px solid #4f46e5",
              borderTopColor: "transparent",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
              margin: "0 auto 12px",
            }}
          />
          <p style={{ color: "#4f46e5", fontSize: 13, fontWeight: 600 }}>
            Loading LETS CHAT…
          </p>
        </div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if (!user) return <Login />;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
        maxWidth: 480,
        margin: "0 auto",
        background: "#ffffff",
        boxShadow: "0 0 40px rgba(0,0,0,0.06)",
        borderLeft: "1px solid #f1f5f9",
        borderRight: "1px solid #f1f5f9",
      }}
    >
      {/* Top bar — shown on contacts screen */}
      {!peer && <TopBar user={user} onLogout={logout} />}

      <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
        {peer ? (
          <ChatWindow peer={peer} onBack={() => setPeer(null)} />
        ) : (
          <ChatList onSelectUser={setPeer} />
        )}
      </div>
    </div>
  );
}

function TopBar({ user, onLogout }) {
  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "14px 16px",
        flexShrink: 0,
        background: "#ffffff",
        borderBottom: "1px solid #e2e8f0",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ position: "relative" }}>
          <img
            src={user.photoURL}
            alt=""
            referrerPolicy="no-referrer"
            style={{
              height: 38,
              width: 38,
              borderRadius: "50%",
              objectFit: "cover",
              border: "1px solid #cbd5e1",
            }}
          />
          <span
            className="online-dot"
            style={{
              position: "absolute",
              bottom: 0,
              right: 0,
              height: 10,
              width: 10,
              borderRadius: "50%",
              background: "#22c55e",
              border: "2px solid #ffffff",
            }}
          />
        </div>
        <div>
          <p
            style={{
              color: "#0f172a",
              fontSize: 14,
              fontWeight: 700,
              margin: 0,
              maxWidth: 150,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {user.displayName}
          </p>
          <p style={{ color: "#22c55e", fontSize: 11, fontWeight: 500, margin: 0 }}>
            ● Online
          </p>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {/* App Title */}
        <span
          style={{
            fontSize: 13,
            fontWeight: 800,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "#4f46e5",
          }}
        >
          LETS CHAT
        </span>

        {/* Logout Button */}
        <button
          type="button"
          onClick={onLogout}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            padding: "6px 12px",
            borderRadius: 10,
            background: "#f1f5f9",
            border: "1px solid #e2e8f0",
            color: "#475569",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#fee2e2";
            e.currentTarget.style.color = "#dc2626";
            e.currentTarget.style.borderColor = "#fca5a5";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#f1f5f9";
            e.currentTarget.style.color = "#475569";
            e.currentTarget.style.borderColor = "#e2e8f0";
          }}
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16,17 21,12 16,7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Logout
        </button>
      </div>
    </header>
  );
}
