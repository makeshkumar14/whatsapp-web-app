import { useEffect, useRef, useState } from "react";
import { collection, doc, onSnapshot, query, orderBy, limit } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { getChatId } from "../utils/getChatId";
import { relativeTime } from "../utils/relativeTime";

export default function ChatList({ onSelectUser }) {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [lastMessages, setLastMessages] = useState({});
  const [unreadCounts, setUnreadCounts] = useState({});

  const lastReadRef = useRef({});
  const latestDocsRef = useRef({});

  // Subscribe to own user doc for lastRead timestamps
  useEffect(() => {
    return onSnapshot(doc(db, "users", user.uid), (snap) => {
      lastReadRef.current = snap.data()?.lastRead ?? {};
      setUnreadCounts((p) => ({ ...p }));
    }, () => {});
  }, [user.uid]);

  // Load all other registered users
  useEffect(() => {
    return onSnapshot(query(collection(db, "users")),
      (snap) => {
        setUsers(snap.docs.map((d) => d.data()).filter((p) => p.uid !== user.uid));
        setLoading(false);
        setError("");
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );
  }, [user.uid]);

  // Listen to per-chat last message & calculate unread counts
  useEffect(() => {
    if (!users.length) return;
    const unsubs = users.map((peer) => {
      const chatId = getChatId(user.uid, peer.uid);
      const q = query(
        collection(db, "chats", chatId, "messages"),
        orderBy("timestamp", "desc"),
        limit(30)
      );
      return onSnapshot(q, (snap) => {
        const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        latestDocsRef.current[chatId] = docs;
        if (docs.length > 0) {
          const latest = docs[0];
          setLastMessages((p) => ({
            ...p,
            [peer.uid]: {
              text: latest.text || null,
              timestamp: latest.timestamp,
              senderId: latest.senderId,
            },
          }));
        }
        setUnreadCounts((p) => ({
          ...p,
          [peer.uid]: countUnread(docs, peer.uid, lastReadRef.current[chatId]),
        }));
      });
    });
    return () => unsubs.forEach((u) => u());
  }, [users, user.uid]);

  // Recalculate unread counts when lastRead updates
  useEffect(() => {
    if (!users.length) return;
    setUnreadCounts((prev) => {
      const next = { ...prev };
      users.forEach((peer) => {
        const chatId = getChatId(user.uid, peer.uid);
        const docs = latestDocsRef.current[chatId];
        if (docs) next[peer.uid] = countUnread(docs, peer.uid, lastReadRef.current[chatId]);
      });
      return next;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [users, user.uid]);

  const sorted = [...users].sort((a, b) => {
    const ta = lastMessages[a.uid]?.timestamp?.toDate?.()?.getTime() ?? 0;
    const tb = lastMessages[b.uid]?.timestamp?.toDate?.()?.getTime() ?? 0;
    return tb - ta;
  });

  const filtered = sorted.filter((u) =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, background: "#ffffff" }}>
      {/* Header & Search */}
      <div style={{ padding: "16px 16px 12px 16px", borderBottom: "1px solid #f1f5f9" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", margin: 0, tracking: "-0.02em" }}>
            Messages
          </h2>
          <span style={{
            fontSize: 12,
            fontWeight: 600,
            color: "#64748b",
            background: "#f1f5f9",
            padding: "4px 10px",
            borderRadius: 20,
          }}>
            {users.length} {users.length === 1 ? "Contact" : "Contacts"}
          </span>
        </div>

        {/* Search input */}
        <div style={{ position: "relative" }}>
          <svg
            style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
            width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.2"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations..."
            className="msg-input"
            style={{
              width: "100%",
              padding: "9px 14px 9px 38px",
              border: "1px solid #e2e8f0",
              borderRadius: 14,
              background: "#f8fafc",
              fontSize: 14,
              color: "#0f172a",
              outline: "none",
              fontFamily: "inherit",
              transition: "all 0.15s ease",
            }}
          />
        </div>
      </div>

      {/* User list */}
      <ul style={{ flex: 1, overflowY: "auto", margin: 0, padding: 0, listStyle: "none" }}>
        {loading && (
          <li style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "48px 0" }}>
            <div style={{
              width: 32,
              height: 32,
              border: "2px solid #4f46e5",
              borderTopColor: "transparent",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
            }} />
            <p style={{ color: "#64748b", fontSize: 13, margin: 0 }}>Loading chats...</p>
          </li>
        )}

        {!loading && error && (
          <li style={{ margin: 16, padding: "12px 16px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12, color: "#dc2626", fontSize: 13 }}>
            ⚠️ {error}
          </li>
        )}

        {!loading && !error && filtered.length === 0 && (
          <li style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "48px 0" }}>
            <div style={{
              width: 56,
              height: 56,
              borderRadius: 20,
              background: "#f1f5f9",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.8">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div style={{ textAlign: "center" }}>
              <p style={{ color: "#334155", fontSize: 14, fontWeight: 600, margin: 0 }}>
                {search ? "No matches found" : "No contacts yet"}
              </p>
              <p style={{ color: "#94a3b8", fontSize: 12, marginTop: 4 }}>
                {search ? "Try searching another name" : "Sign in from another account to chat"}
              </p>
            </div>
          </li>
        )}

        {filtered.map((profile, i) => {
          const last = lastMessages[profile.uid];
          const unread = unreadCounts[profile.uid] ?? 0;
          const isUnread = unread > 0;
          const chatId = getChatId(user.uid, profile.uid);
          const isOwnLast = last?.senderId === user.uid;
          const isLastRead = isOwnLast && checkIsRead(last, profile.lastRead?.[chatId], user.uid);
          const isPeerTyping = Boolean(profile.typing?.[chatId]);
          const isLastDeleted = Boolean(last?.deleted);

          let preview = "";
          if (last?.text) {
            preview = isLastDeleted ? "🚫 This message was deleted" : last.text;
          }

          return (
            <li key={profile.uid} className="fade-up" style={{ animationDelay: `${i * 30}ms` }}>
              <button
                type="button"
                id={`chat-user-${profile.uid}`}
                onClick={() => onSelectUser(profile)}
                className="user-row"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  width: "100%",
                  padding: "12px 16px",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  textAlign: "left",
                  borderBottom: "1px solid #f8fafc",
                }}
              >
                {/* User Avatar */}
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <img
                    src={profile.photoURL || avatarFallback(profile.name)}
                    alt=""
                    referrerPolicy="no-referrer"
                    style={{ height: 48, width: 48, borderRadius: "50%", objectFit: "cover" }}
                  />
                  <span
                    className="online-dot"
                    style={{
                      position: "absolute",
                      bottom: 0,
                      right: 0,
                      height: 11,
                      width: 11,
                      borderRadius: "50%",
                      background: isPeerTyping ? "#16a34a" : "#22c55e",
                      border: "2px solid #ffffff",
                    }}
                  />
                </div>

                {/* Contact Name & Last Message */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", borderBottom: "none", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                    <p
                      style={{
                        fontSize: 15,
                        fontWeight: isUnread ? 700 : 600,
                        color: "#0f172a",
                        margin: 0,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {profile.name || "User"}
                    </p>
                    {last?.timestamp && (
                      <span
                        style={{
                          fontSize: 11,
                          flexShrink: 0,
                          color: isUnread ? "#4f46e5" : "#94a3b8",
                          fontWeight: isUnread ? 700 : 500,
                        }}
                      >
                        {relativeTime(last.timestamp)}
                      </span>
                    )}
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginTop: 3 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, minWidth: 0, flex: 1 }}>
                      {isPeerTyping ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <span style={{ fontSize: 13, color: "#16a34a", fontWeight: 700 }}>
                            typing
                          </span>
                          <span className="typing-dots" style={{ display: "inline-flex", gap: 2 }}>
                            <span className="typing-dot" />
                            <span className="typing-dot" style={{ animationDelay: "0.2s" }} />
                            <span className="typing-dot" style={{ animationDelay: "0.4s" }} />
                          </span>
                        </div>
                      ) : (
                        <>
                          {isOwnLast && last?.text && !isLastDeleted && (
                            <span
                              title={isLastRead ? "Read by recipient" : "Delivered"}
                              style={{ display: "inline-flex", alignItems: "center", flexShrink: 0 }}
                            >
                              <svg
                                width="14"
                                height="10"
                                viewBox="0 0 16 11"
                                fill="none"
                                style={{
                                  transition: "stroke 0.2s ease",
                                }}
                              >
                                <path
                                  d="M1 5.5L5 9.5L15 1.5"
                                  stroke={isLastRead ? "#0284c7" : "#94a3b8"}
                                  strokeWidth="1.8"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                                <path
                                  d="M5 5.5L9 9.5"
                                  stroke={isLastRead ? "#0284c7" : "#94a3b8"}
                                  strokeWidth="1.8"
                                  strokeLinecap="round"
                                />
                              </svg>
                            </span>
                          )}
                          <p
                            style={{
                              fontSize: 13,
                              margin: 0,
                              color: isLastDeleted
                                ? "#94a3b8"
                                : isUnread
                                ? "#1e293b"
                                : "#64748b",
                              fontWeight: isUnread && !isLastDeleted ? 600 : 400,
                              fontStyle: isLastDeleted ? "italic" : "normal",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {preview || <span style={{ fontStyle: "italic", color: "#cbd5e1" }}>No messages yet</span>}
                          </p>
                        </>
                      )}
                    </div>

                    {isUnread && (
                      <span
                        style={{
                          flexShrink: 0,
                          minWidth: 20,
                          height: 20,
                          borderRadius: 10,
                          background: "#4f46e5",
                          color: "#ffffff",
                          fontSize: 11,
                          fontWeight: 700,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          padding: "0 6px",
                          boxShadow: "0 2px 6px rgba(79, 70, 229, 0.35)",
                        }}
                      >
                        {unread > 9 ? "9+" : unread}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        .typing-dot {
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: #16a34a;
          animation: bounceDot 1.2s infinite ease-in-out;
        }
        @keyframes bounceDot {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1.2); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

function countUnread(docs, peerUid, lastReadTimestamp) {
  if (!lastReadTimestamp) return 0;
  const lr = lastReadTimestamp.toDate?.() ?? null;
  if (!lr) return 0;
  return docs.filter((m) => {
    if (m.senderId !== peerUid) return false;
    if (!m.timestamp?.toDate) return false;
    return m.timestamp.toDate() > lr;
  }).length;
}

function checkIsRead(msg, peerLastRead, currentUserId) {
  if (!msg || msg.senderId !== currentUserId) return false;
  if (!peerLastRead || !msg.timestamp) return false;

  const peerMillis = peerLastRead.toMillis ? peerLastRead.toMillis() : (peerLastRead.seconds ? peerLastRead.seconds * 1000 : 0);
  const msgMillis = msg.timestamp.toMillis ? msg.timestamp.toMillis() : (msg.timestamp.seconds ? msg.timestamp.seconds * 1000 : 0);

  return peerMillis > 0 && msgMillis > 0 && peerMillis >= msgMillis;
}

function avatarFallback(name) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent((name || "U").charAt(0))}&background=4f46e5&color=fff`;
}
