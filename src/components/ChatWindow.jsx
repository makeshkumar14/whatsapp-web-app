import { useEffect, useRef, useState, useMemo } from "react";
import {
  addDoc,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  Timestamp,
} from "firebase/firestore";
import EmojiPicker from "emoji-picker-react";
import emailjs from "@emailjs/browser";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { getChatId } from "../utils/getChatId";
import { dateSeparatorLabel } from "../utils/relativeTime";
import MessageBubble from "./MessageBubble";
import MessageInfoModal from "./MessageInfoModal";

export default function ChatWindow({ peer, onBack }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [peerLastRead, setPeerLastRead] = useState(null);
  const [isPeerTyping, setIsPeerTyping] = useState(false);

  // Search states
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);

  // Message Info modal state
  const [infoModalMessage, setInfoModalMessage] = useState(null);

  // Local deleted message IDs stored in localStorage as fallback
  const [localDeletedForMe, setLocalDeletedForMe] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(`deleted_for_me_${user.uid}`) || "[]");
    } catch {
      return [];
    }
  });

  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const searchInputRef = useRef(null);
  const emojiRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const chatId = getChatId(user.uid, peer.uid);

  // Mark chat as read on open, when new messages arrive, or on focus
  const markAsRead = () => {
    setDoc(
      doc(db, "users", user.uid),
      { lastRead: { [chatId]: Timestamp.now() } },
      { merge: true }
    ).catch(console.error);
  };

  useEffect(() => {
    markAsRead();
  }, [chatId, user.uid, messages.length]);

  useEffect(() => {
    const handleFocus = () => markAsRead();
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [chatId, user.uid]);

  // Listen to peer's user doc to get real-time read receipt updates & typing state
  useEffect(() => {
    if (!peer?.uid) return;
    const unsub = onSnapshot(doc(db, "users", peer.uid), (snap) => {
      const data = snap.data();
      const lr = data?.lastRead?.[chatId] || null;
      setPeerLastRead(lr);
      setIsPeerTyping(Boolean(data?.typing?.[chatId]));
    });
    return () => unsub();
  }, [peer?.uid, chatId]);

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

  // Auto-scroll on new message if not searching
  useEffect(() => {
    if (!searchQuery.trim()) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, searchQuery]);

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

  // Typing emitter
  const emitTyping = () => {
    setDoc(
      doc(db, "users", user.uid),
      { typing: { [chatId]: true } },
      { merge: true }
    ).catch(console.error);

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setDoc(
        doc(db, "users", user.uid),
        { typing: { [chatId]: false } },
        { merge: true }
      ).catch(console.error);
    }, 2500);
  };

  const stopTyping = () => {
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    setDoc(
      doc(db, "users", user.uid),
      { typing: { [chatId]: false } },
      { merge: true }
    ).catch(console.error);
  };

  useEffect(() => {
    return () => {
      stopTyping();
    };
  }, [chatId]);

  function onEmojiClick(emojiData) {
    setText((prev) => prev + emojiData.emoji);
    emitTyping();
    inputRef.current?.focus();
  }

  async function sendMessage(e) {
    e?.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    stopTyping();
    setSending(true);
    try {
      await addDoc(collection(db, "chats", chatId, "messages"), {
        senderId: user.uid,
        text: trimmed,
        timestamp: serverTimestamp(),
      });
      setText("");

      // Send EmailJS email notification to peer if email exists
      if (peer?.email) {
        const serviceId =
          import.meta.env.VITE_EMAILJS_SERVICE_ID || "service_rwli3eg";
        const templateId =
          import.meta.env.VITE_EMAILJS_TEMPLATE_ID || "template_89u4hos";
        const publicKey =
          import.meta.env.VITE_EMAILJS_PUBLIC_KEY || "KhzjJWfsEY9u2NeI9";

        const templateParams = {
          to_email: peer.email,
          email: peer.email,
          recipient_email: peer.email,
          to_name: peer.name || "there",
          recipient_name: peer.name || "there",
          from_name: user.displayName || user.email?.split("@")[0] || "Someone",
          sender_name: user.displayName || user.email?.split("@")[0] || "Someone",
          from_email: user.email,
          sender_email: user.email,
          message: trimmed,
          message_text: trimmed,
          reply_to: user.email,
        };

        emailjs.send(serviceId, templateId, templateParams, publicKey).catch((err) => {
          console.warn("EmailJS notification skipped or failed:", err);
        });
      }
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

  // Delete message handlers
  async function handleDeleteForEveryone(msg) {
    // 1. Instant optimistic local UI update
    setMessages((prev) =>
      prev.map((m) =>
        m.id === msg.id
          ? { ...m, deleted: true, text: "This message was deleted" }
          : m
      )
    );

    try {
      // 2. Try Firestore updateDoc
      await updateDoc(doc(db, "chats", chatId, "messages", msg.id), {
        deleted: true,
        text: "This message was deleted",
      });
    } catch (err) {
      console.warn("updateDoc failed, trying setDoc or deleteDoc...", err);
      try {
        await setDoc(
          doc(db, "chats", chatId, "messages", msg.id),
          { deleted: true, text: "This message was deleted" },
          { merge: true }
        );
      } catch (err2) {
        console.warn("setDoc failed, trying deleteDoc...", err2);
        try {
          await deleteDoc(doc(db, "chats", chatId, "messages", msg.id));
        } catch (err3) {
          console.warn("Firestore delete rejected by Firebase Cloud security rules.", err3);
        }
      }
    }
  }

  async function handleDeleteForMe(msg) {
    // 1. Save to local storage for immediate persistence
    const updated = [...new Set([...localDeletedForMe, msg.id])];
    setLocalDeletedForMe(updated);
    try {
      localStorage.setItem(`deleted_for_me_${user.uid}`, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }

    // 2. Optimistic UI update
    setMessages((prev) => prev.filter((m) => m.id !== msg.id));

    // 3. Try to sync with Firestore
    try {
      await updateDoc(doc(db, "chats", chatId, "messages", msg.id), {
        deletedFor: arrayUnion(user.uid),
      });
    } catch (err) {
      console.warn("Firestore updateDoc for deletedFor skipped or failed:", err);
    }
  }

  // Filter messages for "Delete for me" (both Firestore field and localStorage)
  const visibleMessages = useMemo(() => {
    return messages.filter(
      (m) =>
        !m.deletedFor?.includes(user.uid) &&
        !localDeletedForMe.includes(m.id)
    );
  }, [messages, user.uid, localDeletedForMe]);

  // Search logic
  const matchingMessageIds = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return visibleMessages
      .filter((m) => !m.deleted && m.text?.toLowerCase().includes(q))
      .map((m) => m.id);
  }, [visibleMessages, searchQuery]);

  useEffect(() => {
    setCurrentMatchIndex(0);
  }, [searchQuery]);

  const currentFocusedMessageId = matchingMessageIds[currentMatchIndex] || null;

  useEffect(() => {
    if (currentFocusedMessageId) {
      const el = document.getElementById(`msg-${currentFocusedMessageId}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [currentFocusedMessageId]);

  const handleNextMatch = () => {
    if (matchingMessageIds.length === 0) return;
    setCurrentMatchIndex((prev) => (prev + 1) % matchingMessageIds.length);
  };

  const handlePrevMatch = () => {
    if (matchingMessageIds.length === 0) return;
    setCurrentMatchIndex((prev) => (prev - 1 + matchingMessageIds.length) % matchingMessageIds.length);
  };

  const grouped = buildGroups(visibleMessages);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
        background: "#f8fafc",
        position: "relative",
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
              background: isPeerTyping ? "#16a34a" : "#22c55e",
              border: "2px solid #ffffff",
            }}
          />
        </div>

        {/* User Name & Status / Typing Indication */}
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

          {isPeerTyping ? (
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 1 }}>
              <span style={{ fontSize: 12, color: "#16a34a", fontWeight: 700 }}>
                typing
              </span>
              <span className="typing-dots" style={{ display: "inline-flex", gap: 2 }}>
                <span className="typing-dot" />
                <span className="typing-dot" style={{ animationDelay: "0.2s" }} />
                <span className="typing-dot" style={{ animationDelay: "0.4s" }} />
              </span>
            </div>
          ) : (
            <p style={{ fontSize: 12, color: "#16a34a", fontWeight: 500, margin: 0 }}>
              Active now
            </p>
          )}
        </div>

        {/* Search In Chat Toggle Button */}
        <button
          type="button"
          onClick={() => {
            setShowSearch((v) => {
              const next = !v;
              if (next) {
                setTimeout(() => searchInputRef.current?.focus(), 100);
              } else {
                setSearchQuery("");
              }
              return next;
            });
          }}
          aria-label="Search messages"
          style={{
            background: showSearch ? "#eef2ff" : "none",
            border: "1px solid",
            borderColor: showSearch ? "#c7d2fe" : "transparent",
            borderRadius: 10,
            padding: "8px",
            color: showSearch ? "#4f46e5" : "#64748b",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.15s ease",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </button>
      </header>

      {/* ── IN-CHAT SEARCH BAR ── */}
      {showSearch && (
        <div
          style={{
            background: "#ffffff",
            padding: "8px 16px",
            borderBottom: "1px solid #e2e8f0",
            display: "flex",
            alignItems: "center",
            gap: 8,
            boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
            animation: "slideDown 0.15s ease",
          }}
        >
          <div style={{ position: "relative", flex: 1 }}>
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search in chat…"
              style={{
                width: "100%",
                padding: "7px 12px",
                borderRadius: 10,
                border: "1px solid #cbd5e1",
                fontSize: 13,
                outline: "none",
                background: "#f8fafc",
                color: "#0f172a",
              }}
            />
          </div>

          {searchQuery.trim() && (
            <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600, flexShrink: 0 }}>
              {matchingMessageIds.length > 0
                ? `${currentMatchIndex + 1} of ${matchingMessageIds.length}`
                : "No matches"}
            </span>
          )}

          {matchingMessageIds.length > 1 && (
            <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
              <button
                type="button"
                onClick={handlePrevMatch}
                title="Previous match"
                style={{
                  background: "#f1f5f9",
                  border: "1px solid #cbd5e1",
                  borderRadius: 6,
                  padding: "4px 8px",
                  cursor: "pointer",
                  color: "#334155",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="18 15 12 9 6 15" />
                </svg>
              </button>
              <button
                type="button"
                onClick={handleNextMatch}
                title="Next match"
                style={{
                  background: "#f1f5f9",
                  border: "1px solid #cbd5e1",
                  borderRadius: 6,
                  padding: "4px 8px",
                  cursor: "pointer",
                  color: "#334155",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              setShowSearch(false);
              setSearchQuery("");
            }}
            title="Close search"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 4,
              color: "#94a3b8",
              display: "flex",
              alignItems: "center",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}

      {/* ── MESSAGES CONTAINER (Scrollable) ── */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          minHeight: 0,
          padding: "16px 16px 8px 16px",
        }}
      >
        {visibleMessages.length === 0 && (
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
          {grouped.map((item, idx) =>
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
                isRead={checkIsRead(item, peerLastRead, user.uid)}
                isLast={idx >= grouped.length - 2}
                searchQuery={searchQuery}
                isSearchFocused={item.id === currentFocusedMessageId}
                onDeleteForEveryone={() => handleDeleteForEveryone(item)}
                onDeleteForMe={() => handleDeleteForMe(item)}
                onOpenInfo={() => setInfoModalMessage(item)}
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
            emitTyping();
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

      {/* Message Info Modal */}
      {infoModalMessage && (
        <MessageInfoModal
          message={infoModalMessage}
          isRead={checkIsRead(infoModalMessage, peerLastRead, user.uid)}
          readTimestamp={peerLastRead}
          onClose={() => setInfoModalMessage(null)}
        />
      )}

      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes slideDown{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
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

function checkIsRead(msg, peerLastRead, currentUserId) {
  if (!msg || msg.senderId !== currentUserId) return false;
  if (!peerLastRead || !msg.timestamp) return false;

  const peerMillis = peerLastRead.toMillis ? peerLastRead.toMillis() : (peerLastRead.seconds ? peerLastRead.seconds * 1000 : 0);
  const msgMillis = msg.timestamp.toMillis ? msg.timestamp.toMillis() : (msg.timestamp.seconds ? msg.timestamp.seconds * 1000 : 0);

  return peerMillis > 0 && msgMillis > 0 && peerMillis >= msgMillis;
}
