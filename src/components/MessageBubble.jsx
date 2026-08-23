import { useState, useRef, useEffect } from "react";

export default function MessageBubble({
  message,
  isOwn,
  isRead,
  isLast = false,
  searchQuery = "",
  isSearchFocused = false,
  onDeleteForEveryone,
  onDeleteForMe,
  onOpenInfo,
}) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  const isDeleted = Boolean(message.deleted);
  const timeLabel = formatTime(message.timestamp);
  const isPending = !message.timestamp;

  useEffect(() => {
    if (!showMenu) return;
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showMenu]);

  return (
    <div
      id={`msg-${message.id}`}
      className="msg-in group"
      style={{
        display: "flex",
        justifyContent: isOwn ? "flex-end" : "flex-start",
        marginBottom: 6,
        position: "relative",
        zIndex: showMenu ? 9999 : 1,
      }}
    >
      <div
        style={{
          maxWidth: "78%",
          borderRadius: isOwn ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
          padding: "10px 14px 6px 14px",
          background: isDeleted
            ? isOwn
              ? "rgba(79, 70, 229, 0.08)"
              : "#f1f5f9"
            : isOwn
            ? "var(--color-sent-bg)"
            : "var(--color-recv-bg)",
          color: isDeleted
            ? "#64748b"
            : isOwn
            ? "var(--color-sent-text)"
            : "var(--color-recv-text)",
          boxShadow: isDeleted
            ? "none"
            : isOwn
            ? "0 2px 8px rgba(79, 70, 229, 0.2)"
            : "0 1px 3px rgba(0,0,0,0.05)",
          border: isSearchFocused
            ? "2px solid #f59e0b"
            : isDeleted
            ? "1px dashed #cbd5e1"
            : "2px solid transparent",
          position: "relative",
          zIndex: showMenu ? 9999 : "auto",
          transition: "border-color 0.2s ease, transform 0.2s ease",
          transform: isSearchFocused ? "scale(1.02)" : "scale(1)",
        }}
      >
        {/* Actions Dropdown Toggle Button */}
        <div
          ref={menuRef}
          style={{
            position: "absolute",
            top: 4,
            right: isOwn ? 4 : "auto",
            left: isOwn ? "auto" : 4,
            zIndex: 10000,
          }}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu((v) => !v);
            }}
            aria-label="Message options"
            style={{
              background: isOwn ? "rgba(0, 0, 0, 0.22)" : "rgba(0, 0, 0, 0.08)",
              border: "none",
              borderRadius: "50%",
              width: 22,
              height: 22,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              padding: 0,
              color: isOwn ? "#ffffff" : "#475569",
              opacity: showMenu ? 1 : 0.75,
              transition: "all 0.15s ease",
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {/* Menu Popover - Opens upwards if isLast, otherwise downwards */}
          {showMenu && (
            <div
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              style={{
                position: "absolute",
                top: isLast ? "auto" : "28px",
                bottom: isLast ? "28px" : "auto",
                right: isOwn ? 0 : "auto",
                left: isOwn ? "auto" : 0,
                backgroundColor: "#ffffff",
                borderRadius: 14,
                boxShadow: "0 12px 28px -4px rgba(0, 0, 0, 0.25), 0 6px 12px -2px rgba(0, 0, 0, 0.12)",
                border: "1px solid #cbd5e1",
                padding: "6px 0",
                minWidth: 180,
                zIndex: 99999,
                animation: "fadeIn 0.15s ease",
              }}
            >
              {/* Info Option */}
              {isOwn && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                    onOpenInfo?.();
                  }}
                  className="menu-item"
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    background: "none",
                    border: "none",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#334155",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2.2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                  Message Info
                </button>
              )}

              {/* Delete for Everyone */}
              {isOwn && !isDeleted && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                    onDeleteForEveryone?.();
                  }}
                  className="menu-item"
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    background: "none",
                    border: "none",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#dc2626",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.2">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                  Delete for everyone
                </button>
              )}

              {/* Delete for Me */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(false);
                  onDeleteForMe?.();
                }}
                className="menu-item"
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  background: "none",
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#64748b",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
                Delete for me
              </button>
            </div>
          )}
        </div>

        {/* Message Text / Deleted Notice */}
        <div
          style={{
            margin: 0,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            fontSize: 14,
            lineHeight: 1.45,
            fontWeight: 400,
            paddingRight: 18,
          }}
        >
          {isDeleted ? (
            <span style={{ fontStyle: "italic", display: "inline-flex", alignItems: "center", gap: 5 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
              </svg>
              This message was deleted
            </span>
          ) : (
            renderHighlightedText(message.text, searchQuery)
          )}
        </div>

        {/* Time & Read Indicator */}
        {!isDeleted && (
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              gap: 4,
              marginTop: 4,
            }}
          >
            <span
              style={{
                fontSize: 10,
                color: isOwn ? "rgba(255, 255, 255, 0.75)" : "#94a3b8",
                fontWeight: 500,
              }}
            >
              {timeLabel}
            </span>

            {isOwn && (
              <span
                title={isPending ? "Sending…" : isRead ? "Read by recipient" : "Delivered"}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  lineHeight: 1,
                  cursor: "pointer",
                }}
                onClick={onOpenInfo}
              >
                {isPending ? (
                  <svg width="13" height="10" viewBox="0 0 16 11" fill="none">
                    <path
                      d="M1 5.5L5 9.5L15 1.5"
                      stroke="rgba(255, 255, 255, 0.6)"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  <svg
                    width="15"
                    height="11"
                    viewBox="0 0 16 11"
                    fill="none"
                    style={{
                      transition: "all 0.3s ease",
                      filter: isRead ? "drop-shadow(0 0 2px rgba(56, 189, 248, 0.6))" : "none",
                    }}
                  >
                    <path
                      d="M1 5.5L5 9.5L15 1.5"
                      stroke={isRead ? "#38bdf8" : "rgba(255, 255, 255, 0.75)"}
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M5 5.5L9 9.5"
                      stroke={isRead ? "#38bdf8" : "rgba(255, 255, 255, 0.75)"}
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  </svg>
                )}
              </span>
            )}
          </div>
        )}
      </div>
      <style>{`
        .menu-item:hover {
          background: #f8fafc !important;
        }
      `}</style>
    </div>
  );
}

function renderHighlightedText(text = "", query = "") {
  if (!query.trim()) return text;
  const parts = text.split(new RegExp(`(${escapeRegExp(query)})`, "gi"));
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <mark
        key={i}
        style={{
          background: "#fef08a",
          color: "#0f172a",
          padding: "0 2px",
          borderRadius: 3,
          fontWeight: 600,
        }}
      >
        {part}
      </mark>
    ) : (
      part
    )
  );
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function formatTime(timestamp) {
  if (!timestamp?.toDate) return "";
  return timestamp.toDate().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
