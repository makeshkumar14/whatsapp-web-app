import { useEffect, useRef, useState } from "react";
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
} from "firebase/firestore";
import EmojiPicker from "emoji-picker-react";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { getChatId } from "../utils/getChatId";
import { dateSeparatorLabel } from "../utils/relativeTime";
import MessageBubble from "./MessageBubble";

export default function ChatWindow({ peer, onBack }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);

  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const emojiRef = useRef(null);

  const chatId = getChatId(user.uid, peer.uid);

  // Mark chat as read on open
  useEffect(() => {
    setDoc(
      doc(db, "users", user.uid),
      { lastRead: { [chatId]: Timestamp.now() } },
      { merge: true }
    ).catch(console.error);
  }, [chatId, user.uid]);

  // Listen to chat messages
  useEffect(() => {
    const q = query(
      collection(db, "chats", chatId, "messages"),
      orderBy("timestamp", "asc")
    );
    return onSnapshot(q, (snap) => {
      setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, [chatId]);

  // Auto-scroll on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Close emoji picker on outside click
  useEffect(() => {
    if (!showEmoji) return;
    function handleOutsideClick(e) {
      if (emojiRef.current && !emojiRef.current.contains(e.target)) {
        setShowEmoji(false);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [showEmoji]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function onEmojiClick(emojiData) {
    setText((prev) => prev + emojiData.emoji);
    inputRef.current?.focus();
  }

  async function sendMessage(e) {
    e?.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    setSending(true);
    try {
      await addDoc(collection(db, "chats", chatId, "messages"), {
        senderId: user.uid,
        text: trimmed,
        timestamp: serverTimestamp(),
      });
      setText("");
    } catch (err) {
      console.error("Send failed", err);
      setText(trimmed);
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(e);
    }
  }

  const grouped = buildGroups(messages);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
        background: "#f8fafc",
      }}
    >
      {/* ── HEADER ── */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "12px 16px",
          flexShrink: 0,
          background: "#ffffff",
          borderBottom: "1px solid #e2e8f0",
          boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
        }}
      >
        {/* ← BACK BUTTON */}
        <button
          type="button"
          id="back-btn"
          onClick={onBack}
          aria-label="Back to contacts"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            flexShrink: 0,
            padding: "8px 12px",
            borderRadius: 12,
            background: "#eef2ff",
            border: "1px solid #c7d2fe",
            color: "#4f46e5",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#e0e7ff";
            e.currentTarget.style.borderColor = "#a5b4fc";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#eef2ff";
            e.currentTarget.style.borderColor = "#c7d2fe";
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12,19 5,12 12,5" />
          </svg>
          Back
        </button>

        {/* User Avatar */}
        <div style={{ position: "relative", flexShrink: 0 }}>
          <img
            src={peer.photoURL || avatarFallback(peer.name)}
            alt=""
            referrerPolicy="no-referrer"
            style={{
              height: 40,
              width: 40,
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

        {/* User Name & Status */}
        <div style={{ minWidth: 0, flex: 1 }}>
          <p
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: "#0f172a",
              margin: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {peer.name || "User"}
          </p>
          <p style={{ fontSize: 12, color: "#16a34a", fontWeight: 500, margin: 0 }}>
            Active now
          </p>
        </div>
      </header>

      {/* ── MESSAGES CONTAINER (Scrollable) ── */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          minHeight: 0,
          padding: "16px 16px 8px 16px",
        }}
      >
        {messages.length === 0 && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
              padding: "60px 0",
              opacity: 0.8,
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 20,
                background: "#eef2ff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                <path
                  d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
                  fill="#4f46e5"
                  opacity="0.85"
                />
              </svg>
            </div>
            <div style={{ textAlign: "center" }}>
              <p style={{ color: "#334155", fontSize: 14, fontWeight: 600, margin: 0 }}>
                No messages yet
              </p>
              <p style={{ color: "#64748b", fontSize: 12, marginTop: 4 }}>
                Send a message to start chatting with {peer.name?.split(" ")[0] || "them"} 👋
              </p>
            </div>
          </div>
        )}

        <div>
          {grouped.map((item) =>
            item.type === "separator" ? (
              <div
                key={item.label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "12px 0",
                }}
              >
                <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
                <span
                  style={{
                    fontSize: 11,
                    color: "#64748b",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    background: "#ffffff",
                    border: "1px solid #e2e8f0",
                    padding: "3px 10px",
                    borderRadius: 99,
                    boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
                  }}
                >
                  {item.label}
                </span>
                <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
              </div>
            ) : (
              <MessageBubble
                key={item.id}
                message={item}
                isOwn={item.senderId === user.uid}
              />
            )
          )}
        </div>

        <div ref={bottomRef} style={{ height: 8 }} />
      </div>

      {/* ── EMOJI PICKER ── */}
      {showEmoji && (
        <div ref={emojiRef} style={{ flexShrink: 0, padding: "0 16px 8px 16px" }}>
          <EmojiPicker
            onEmojiClick={onEmojiClick}
            theme="light"
            skinTonesDisabled
            height={280}
            width="100%"
            previewConfig={{ showPreview: false }}
          />
        </div>
      )}

      {/* ── COMPOSER (Fixed at bottom) ── */}
      <form
        onSubmit={sendMessage}
        style={{
          flexShrink: 0,
          display: "flex",
          alignItems: "flex-end",
          gap: 10,
          padding: "12px 16px",
          background: "#ffffff",
          borderTop: "1px solid #e2e8f0",
        }}
      >
        {/* Emoji Toggle Button */}
        <button
          type="button"
          onClick={() => setShowEmoji((v) => !v)}
          aria-label="Emoji picker"
          style={{
            flexShrink: 0,
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 6,
            marginBottom: 3,
            color: showEmoji ? "#4f46e5" : "#64748b",
            borderRadius: 10,
            transition: "color 0.15s ease",
          }}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M8 13s1.5 2 4 2 4-2 4-2" />
            <line x1="9" y1="9" x2="9.01" y2="9" />
            <line x1="15" y1="9" x2="15.01" y2="9" />
          </svg>
        </button>

        {/* Text Input */}
        <textarea
          ref={inputRef}
          id="message-input"
          value={text}
          rows={1}
          onChange={(e) => {
            setText(e.target.value);
            e.target.style.height = "auto";
            e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
          }}
          onKeyDown={handleKeyDown}
          placeholder="Type a message…"
          className="msg-input"
          style={{
            flex: 1,
            resize: "none",
            border: "1px solid #cbd5e1",
            borderRadius: 20,
            padding: "10px 16px",
            fontSize: 14,
            color: "#0f172a",
            background: "#f8fafc",
            minHeight: 42,
            maxHeight: 120,
            fontFamily: "inherit",
            lineHeight: 1.45,
            transition: "border-color 0.15s ease, box-shadow 0.15s ease",
          }}
          autoComplete="off"
        />

        {/* Send Button */}
        <button
          type="submit"
          id="send-btn"
          disabled={!text.trim() || sending}
          className="btn-send"
          style={{
            flexShrink: 0,
            width: 42,
            height: 42,
            borderRadius: "50%",
            border: "none",
            cursor: !text.trim() || sending ? "not-allowed" : "pointer",
            opacity: !text.trim() || sending ? 0.4 : 1,
            marginBottom: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {sending ? (
            <div
              style={{
                width: 16,
                height: 16,
                border: "2px solid rgba(255,255,255,0.4)",
                borderTopColor: "#ffffff",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
              }}
            />
          ) : (
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2.5"
            >
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22,2 15,22 11,13 2,9" />
            </svg>
          )}
        </button>
      </form>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function buildGroups(messages) {
  const result = [];
  let lastLabel = null;
  for (const msg of messages) {
    const label = dateSeparatorLabel(msg.timestamp);
    if (label && label !== lastLabel) {
      result.push({ type: "separator", label });
      lastLabel = label;
    }
    result.push(msg);
  }
  return result;
}

function avatarFallback(name) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent((name || "U").charAt(0))}&background=4f46e5&color=fff`;
}
