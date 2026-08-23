# 💬 LETS CHAT — Mini WhatsApp Web Application

A full-stack, real-time 1:1 messaging web application built with **React 19**, **Vite**, **Firebase (Firestore & Authentication)**, and **EmailJS**. Features a modern, mobile-first interface inspired by WhatsApp Web with instant synchronization, read receipts, message deletion, search, and email notifications.

🚀 **Live Demo:** [https://mini-whatsapp-9ec1c.web.app](https://mini-whatsapp-9ec1c.web.app)

---

## 🌟 Key Features

| Feature | Description |
| :--- | :--- |
| 🔐 **Google Authentication** | Secure one-click login with Google OAuth via Firebase Auth. |
| ⚡ **Real-Time 1:1 Messaging** | Instant message delivery with sub-second synchronization via Firestore live listeners. |
| 👁️ **Read Receipts (Blue Ticks)** | WhatsApp-style single tick *(Sent)* $\rightarrow$ double grey tick *(Delivered)* $\rightarrow$ **vibrant double cyan-blue ticks** *(Read by recipient)*. |
| ⌨️ **Live Typing Indicators** | Real-time animated green *"typing..."* indicator with pulsing dots in the header & sidebar when the peer is composing a message. |
| 🗑️ **Message Deletion** | **"Delete for everyone"** *(updates chat for all participants in real time)* & **"Delete for me"** *(persisted locally & in cloud)*. |
| 🔍 **In-Chat Message Search** | Live keyword search inside active conversations with match counters (e.g. *"2 of 5"*), previous/next navigation buttons, and text highlighting. |
| ℹ️ **Message Info Modal** | View exact timestamps for when a message was **Sent** and when it was **Read/Seen** by the recipient. |
| 👥 **Smart Contact Search** | Clean home screen showing only active chats, with an instant search bar to find and message any registered user by their **Gmail address** or **Name**. |
| 📧 **Email Notifications** | Automatically sends an email notification via **EmailJS** to the recipient's Gmail inbox when they receive a new message. |
| 😀 **Emoji Picker Integration** | Rich emoji selector support directly inside the message composer. |
| 📱 **Responsive Modern UI** | Sleek interface with Plus Jakarta Sans typography, smooth micro-animations, and glassmorphic elements. |

---

## 🧭 How to Test & Use the App (Interviewer's Guide)

Follow these quick steps to test all real-time features:

### Step 1: Open Two Chat Windows
1. Open the live app: **[https://mini-whatsapp-9ec1c.web.app](https://mini-whatsapp-9ec1c.web.app)** in your main browser window.
2. Open a second window in **Incognito Mode** (or a different browser like Edge / Chrome / Safari).
3. Sign in with **Google Account A** on Window 1, and **Google Account B** on Window 2.

### Step 2: Start a Conversation
1. On Window 1, in the top search bar, type the **Gmail address or Name** of Account B.
2. Click on the contact card to open the chat window.
3. Send your first message — the contact will automatically appear in your permanent active chats list!

### Step 3: Test Real-Time Features
- **Typing Indicator**: Start typing in Window 1 $\rightarrow$ observe the animated green *"typing..."* indicator live on Window 2's header and chat list.
- **Read Receipts (Blue Checkmarks)**: 
  - Send a message from Window 1 while Window 2 is in another chat $\rightarrow$ observe the double grey tick.
  - Open the chat in Window 2 $\rightarrow$ observe the ticks on Window 1 instantly turn into **cyan-blue checkmarks**!
- **Message Info**: Click the dropdown arrow on your sent message $\rightarrow$ select **Message Info** to see the exact Sent and Seen date/time.
- **In-Chat Search**: Click the 🔍 search icon in the chat header $\rightarrow$ type any keyword $\rightarrow$ use the ▲ / ▼ arrows to jump between matching messages with yellow highlights.
- **Delete for Everyone**: Click the dropdown arrow on any sent message $\rightarrow$ choose **"Delete for everyone"** $\rightarrow$ the message updates instantly to *"This message was deleted"* on both screens.
- **Email Notification**: The recipient receives an automated email notification in their Gmail inbox with the message preview and sender details.

---

## 🏗️ Architecture & Technical Design

### Deterministic 1:1 Chat Rooms
Instead of storing duplicate room channels, room IDs are generated deterministically by sorting both user UIDs alphabetically:
```javascript
export function getChatId(uidA, uidB) {
  return [uidA, uidB].sort().join("_");
}
```
This guarantees that regardless of who initiates the conversation, both users always connect to the exact same Firestore document path (`chats/{uidA_uidB}`).

### Database Schema (Cloud Firestore)

#### 1. `users/{uid}`
```json
{
  "uid": "USER_UID",
  "name": "Alex Doe",
  "email": "alex@gmail.com",
  "photoURL": "https://...",
  "lastRead": {
    "uidA_uidB": "2026-08-23T11:45:00Z"
  },
  "typing": {
    "uidA_uidB": true
  }
}
```

#### 2. `chats/{chatId}/messages/{messageId}`
```json
{
  "senderId": "USER_UID",
  "text": "Hello there!",
  "timestamp": "ServerTimestamp",
  "deleted": false,
  "deletedFor": ["USER_UID"]
}
```

---

## 🛠️ Tech Stack

- **Frontend:** React 19, JavaScript (ES6+), Vanilla CSS & TailwindCSS
- **Build Tool:** Vite
- **Backend / BaaS:** Firebase Cloud Firestore (Database) & Firebase Authentication
- **Notifications:** EmailJS REST API
- **Icons & UI:** Custom SVGs, Emoji Picker React, Google Fonts (Plus Jakarta Sans)
- **Hosting:** Firebase Hosting

---

## 💻 Local Development Setup

If you wish to run this project locally on your machine:

### 1. Clone Repository
```bash
git clone https://github.com/makeshkumar14/whatsapp-web-app.git
cd whatsapp-web-app
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env` file in the root directory and add your Firebase and EmailJS credentials:
```env
VITE_FIREBASE_API_KEY="your_api_key"
VITE_FIREBASE_AUTH_DOMAIN="your_project_id.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="your_project_id"
VITE_FIREBASE_STORAGE_BUCKET="your_project_id.firebasestorage.app"
VITE_FIREBASE_MESSAGING_SENDER_ID="your_messaging_sender_id"
VITE_FIREBASE_APP_ID="your_app_id"

VITE_EMAILJS_SERVICE_ID="your_service_id"
VITE_EMAILJS_TEMPLATE_ID="your_template_id"
VITE_EMAILJS_PUBLIC_KEY="your_public_key"
```

### 4. Run Development Server
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

### 5. Build & Deploy
```bash
npm run build
npm run deploy
```

---

## 🛡️ Security Rules

The Firestore security rules enforce authenticated participation so users can only read and modify chats they belong to:
```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null;
      allow create, update: if request.auth != null && request.auth.uid == userId;
      allow delete: if false;
    }

    match /chats/{chatId}/messages/{messageId} {
      allow read, create, update, delete: if request.auth != null;
    }
  }
}
```

---

## 👨‍💻 Author
- **Makesh Kumar**
- Project: Mini WhatsApp Web Application
- Live App: [https://mini-whatsapp-9ec1c.web.app](https://mini-whatsapp-9ec1c.web.app)
