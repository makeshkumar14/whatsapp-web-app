import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { loginWithGoogle } = useAuth();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleGoogleSignIn() {
    setError("");
    setBusy(true);
    try {
      await loginWithGoogle();
    } catch (err) {
      setError(err.message || "Google sign-in failed. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "100%",
      background: "#f8fafc",
      padding: "24px 16px",
    }}>
      <div className="fade-up" style={{
        width: "100%",
        maxWidth: 380,
        background: "#ffffff",
        borderRadius: 24,
        padding: "40px 28px",
        boxShadow: "0 10px 25px -5px rgba(0,0,0,0.05), 0 8px 10px -6px rgba(0,0,0,0.01)",
        textAlign: "center",
        border: "1px solid #e2e8f0",
      }}>
        {/* App Logo */}
        <div style={{
          width: 64,
          height: 64,
          borderRadius: 20,
          background: "#4f46e5",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 20px",
          boxShadow: "0 8px 20px rgba(79, 70, 229, 0.3)",
        }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
            <path
              d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
              fill="#ffffff"
            />
          </svg>
        </div>

        <h1 style={{ fontSize: 26, fontWeight: 800, color: "#0f172a", margin: 0, tracking: "-0.03em" }}>
          LETS CHAT
        </h1>
        <p style={{ fontSize: 13, color: "#64748b", marginTop: 6, marginBottom: 28, lineHeight: 1.5 }}>
          Modern real-time messaging.<br />Sign in with Google to get started.
        </p>

        {error && (
          <div style={{
            marginBottom: 20,
            padding: "10px 14px",
            borderRadius: 12,
            background: "#fef2f2",
            border: "1px solid #fecaca",
            color: "#dc2626",
            fontSize: 13,
            textAlign: "left",
          }}>
            ⚠️ {error}
          </div>
        )}

        <button
          type="button"
          id="google-signin-btn"
          onClick={handleGoogleSignIn}
          disabled={busy}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            width: "100%",
            padding: "13px 18px",
            borderRadius: 14,
            border: "1px solid #cbd5e1",
            background: "#ffffff",
            color: "#0f172a",
            fontSize: 14,
            fontWeight: 600,
            cursor: busy ? "not-allowed" : "pointer",
            opacity: busy ? 0.7 : 1,
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => {
            if (!busy) {
              e.currentTarget.style.background = "#f8fafc";
              e.currentTarget.style.borderColor = "#94a3b8";
            }
          }}
          onMouseLeave={(e) => {
            if (!busy) {
              e.currentTarget.style.background = "#ffffff";
              e.currentTarget.style.borderColor = "#cbd5e1";
            }
          }}
        >
          {busy ? (
            <div style={{
              width: 18,
              height: 18,
              border: "2px solid #94a3b8",
              borderTopColor: "#4f46e5",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
            }} />
          ) : (
            <GoogleIcon />
          )}
          {busy ? "Signing in…" : "Sign in with Google"}
        </button>

        <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 24, margin: "24px 0 0", lineHeight: 1.4 }}>
          Protected by Google Sign-In authentication.
        </p>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.63-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.91c1.7-1.57 2.69-3.88 2.69-6.62z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.91-2.26c-.81.54-1.84.86-3.05.86-2.34 0-4.32-1.58-5.03-3.71H.96v2.33A9 9 0 0 0 9 18z"/>
      <path fill="#FBBC05" d="M3.97 10.71A5.41 5.41 0 0 1 3.69 9c0-.59.1-1.17.28-1.71V4.96H.96A9 9 0 0 0 0 9c0 1.45.35 2.82.96 4.04l3.01-2.33z"/>
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.34l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.96l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z"/>
    </svg>
  );
}
