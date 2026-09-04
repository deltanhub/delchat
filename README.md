# DelChat Standalone Mobile Application

This is the standalone **DelChat** messaging client built with **Expo & React Native**. It authenticates and syncs data directly with your **DeltanHub** portal backend using a Single Sign-On (SSO) structure (exactly how Facebook Messenger communicates with Facebook).

---

## Folder Structure

```
delchat/
├── app/                  # Expo Router screens
│   ├── (tabs)/           # Tab layout (Inbox & CRM Leads)
│   ├── call/             # WebRTC voice/video call signaling
│   ├── thread/           # Active message thread feed
│   ├── auth.tsx          # DeltanHub SSO Authentication
│   └── _layout.tsx       # Root layout stack navigation
├── assets/               # Splash screens, icons, & fonts
├── components/           # Reusable native UI elements & animations
├── constants/            # Curated color tokens & typography presets
└── lib/                  # Shared API & Supabase JS client plumbing
```

---

## Setup & Running Instructions

To start the DelChat client locally, run the following commands in your terminal:

1. **Navigate to the DelChat directory**:
   ```bash
   cd c:\Users\alfre\OneDrive\Desktop\delchat
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the Expo server**:
   ```bash
   npx expo start
   ```

4. **Launch the simulator**:
   - Press **`a`** to launch on an Android Emulator.
   - Press **`i`** to launch on the iOS Simulator.
   - Scan the QR code with your phone's camera (iOS) or Expo Go app (Android) to run on your physical device.

---

## Core Features Setup & Configuration

- **Authentication (SSO)**: Connects to your live Supabase DB configuration. Enter your regular DeltanHub user credentials on the login screen to sign in.
- **Realtime Listener**: Automatically opens a websocket listener channel to `chat_messages` for instant text transmission.
- **R2 Attachments**: Automatically queries and fetches signed media urls via `/api/chats/messages` endpoint.
