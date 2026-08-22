export default function MessageBubble({ message, isOwn }) {
  const timeLabel = formatTime(message.timestamp);

  return (
    <div
      className="msg-in"
      style={{
        display: "flex",
        justifyContent: isOwn ? "flex-end" : "flex-start",
        marginBottom: 6,
      }}
    >
      <div
        style={{
          maxWidth: "78%",
          borderRadius: isOwn ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
          padding: "10px 14px 6px 14px",
          background: isOwn ? "var(--color-sent-bg)" : "var(--color-recv-bg)",
          color: isOwn ? "var(--color-sent-text)" : "var(--color-recv-text)",
          boxShadow: isOwn
            ? "0 2px 8px rgba(79, 70, 229, 0.2)"
            : "0 1px 3px rgba(0,0,0,0.05)",
          position: "relative",
        }}
      >
        {/* Message Text */}
        <p
          style={{
            margin: 0,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            fontSize: 14,
            lineHeight: 1.45,
            fontWeight: 400,
          }}
        >
          {message.text}
        </p>

        {/* Time & Read Indicator */}
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
            <svg width="14" height="10" viewBox="0 0 16 11" fill="none">
              <path
                d="M1 5.5L5 9.5L15 1.5"
                stroke="rgba(255, 255, 255, 0.85)"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M5 5.5L9 9.5"
                stroke="rgba(255, 255, 255, 0.85)"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          )}
        </div>
      </div>
    </div>
  );
}

function formatTime(timestamp) {
  if (!timestamp?.toDate) return "";
  return timestamp.toDate().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
