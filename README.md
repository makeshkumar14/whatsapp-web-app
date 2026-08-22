# Mini WhatsApp (React + Firebase)

Real-time 1:1 chat with Google Sign-In, Firestore, and a mobile-first UI.

## Setup

1. Create a Firebase project and enable **Google** under Authentication → Sign-in method.
2. Create a **Firestore** database (start in test mode while developing, or paste `firestore.rules`).
3. Register a **Web** app and copy the config keys.
4. Copy `.env.example` to `.env` and fill in the `VITE_FIREBASE_*` values.
5. Add `localhost` under Authentication → Settings → Authorized domains (it is there by default).

```bash
npm install
npm run dev
```

Sign in from two different Google accounts (two browsers / incognito) to test a conversation.

## Data model

- `users/{uid}` → `{ uid, name, email, photoURL }`
- `chats/{uidA_uidB}/messages/{messageId}` → `{ senderId, text, timestamp }`

`chatId` is both UIDs sorted and joined with `_`, so either person opens the same thread.
