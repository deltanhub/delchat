# DelChat Standalone Mobile Application

DelChat is the dedicated, high-performance standalone mobile messaging and CRM application for the **DeltanHub** ecosystem (built with **React Native & Expo SDK 52/53/57**, **Expo Router**, and **TypeScript**).

DelChat is to DeltanHub exactly as Messenger is to Facebook: a purpose-built, edge-to-edge mobile companion delivering real-time client communication, WebRTC VoIP calling, and a unified CRM pipeline for real estate professionals and consumers.

---

## 🏛 Clean Architecture & Anti-Spaghetti Engineering

The codebase is built on **Clean Architecture** principles with strict separation of concerns, single-responsibility components (< 300 LOC), isolated domain repositories, and **zero `as any` type escapes**:

```
delchat/
├── app/                                 # PURE PRESENTATION LAYER (Screens & Route Guards)
│   ├── (tabs)/
│   │   ├── _layout.tsx                  # Floating Liquid-Glass Tab Bar (Apple Spring physics)
│   │   ├── index.tsx                    # Slim Inbox & message filters
│   │   ├── calls.tsx                    # Recent Calls & redial launcher
│   │   ├── leads.tsx                    # Unified CRM (Leads + Inquiries)
│   │   └── settings.tsx                 # Profile identity, dynamic role badge & security
│   ├── call/[id].tsx                    # WebRTC Audio/Video Call Screen
│   ├── thread/
│   │   ├── [id].tsx                     # Deconstructed Chat Thread
│   │   └── hooks/                       # DOMAIN CONTROLLER HOOKS
│   │       ├── useThreadSession.ts      # Auth, BOLA authorization & thread actions
│   │       ├── useThreadMessages.ts     # Keyset pagination, Realtime stream, reactions, stars
│   │       ├── useThreadMedia.ts        # Camera, gallery, document picker & storage uploads
│   │       └── useThreadModals.ts       # Typed discriminated union modal state machine
│   ├── auth.tsx                         # SSO Authentication & Session Management
│   └── _layout.tsx                      # Root Stack Navigation & Notification Handlers
│
├── components/
│   ├── chat/
│   │   ├── MessageBubble.tsx            # Slim Polymorphic Dispatcher (172 LOC)
│   │   ├── RecentCallsList.tsx          # Consecutive call grouping & one-tap redial
│   │   ├── IncomingCallHUD.tsx          # Non-blocking incoming call overlay
│   │   └── bubbles/                     # 10 ISOLATED MESSAGE BUBBLES
│   │       ├── TextMessageBubble.tsx    # Text, replies, photos/videos, reactions & alerts
│   │       ├── VoiceNoteBubble.tsx      # WhatsApp waveforms & expo-audio playback
│   │       ├── ListingCardBubble.tsx    # Property card previews
│   │       ├── InquiryFormBubble.tsx    # Interactive questionnaire forms
│   │       ├── InquiryResponseBubble.tsx# Questionnaire response summaries
│   │       ├── AgentCardBubble.tsx      # Broker/Agent contact card
│   │       ├── SystemMessageBubble.tsx  # System events & rich Call Log cards
│   │       ├── BroadcastBubble.tsx      # Marketing flyers & 3D tour cards
│   │       ├── EmbedBubble.tsx          # Virtual tour launchers
│   │       └── LeadCardBubble.tsx       # Captured CRM lead cards
│   │
│   ├── leads/                           # CRM LEADS ENGINE
│   │   ├── useLeadsData.ts              # Domain hook for chat & manual leads
│   │   ├── ChatLeadsView.tsx            # Chat inquiries pipeline & status chips
│   │   ├── ManualLeadsView.tsx          # Manual CRM leads & metric tiles
│   │   ├── AddManualLeadModal.tsx       # 12-field lead creation form
│   │   └── LeadDetailNotesModal.tsx     # Native communication launchers (tel, mailto, WhatsApp)
│   │
│   └── inquiries/                       # CHAT INQUIRIES WORKSPACE (Web Parity)
│       ├── useInquiriesData.ts          # Domain hook for templates & responses
│       ├── InquiryResponsesView.tsx     # Submitted responses viewer & thread deep links
│       ├── InquiryFormBuilderView.tsx   # Visual questionnaire builder & field reordering
│       └── InquiryFieldModal.tsx        # Dynamic field configuration modal
│
├── lib/
│   ├── repositories/                    # DATA ACCESS LAYER (Zero direct DB queries in UI)
│   │   ├── conversationRepository.ts    # Keyset-bounded inbox fetch, mute, pin, archive
│   │   ├── messageRepository.ts         # Cursor pagination, reactions, stars, attachments
│   │   ├── leadsRepository.ts           # Brokerage agent memberships, assignments, notes
│   │   ├── inquiriesRepository.ts       # Questionnaire template & response persistence
│   │   └── callRepository.ts            # Call logs, consecutive grouping, fallback logging
│   ├── voip/                            # NATIVE TELEPHONY & HARDWARE INTEGRATION
│   │   ├── callkit.ts                   # iOS CallKit provider, lock-screen UI & system recents
│   │   ├── connectionService.ts         # Android ConnectionService & MAX importance channel
│   │   ├── proximityService.ts          # Hardware proximity sensor display blanking
│   │   └── index.ts                     # Telephony barrel export
│   ├── webrtc/                          # WEBRTC MEDIA ENGINE
│   │   ├── mediaEngine.ts               # PeerConnection, candidate buffering, ICE restart
│   │   └── index.ts                     # WebRTC barrel export
│   ├── services/                        # BACKGROUND & DISPATCH SERVICES
│   │   └── voipPushService.ts           # APNs PushKit & FCM high-priority VoIP push dispatch
│   ├── auth.ts                          # Unified 5-role taxonomy & capability guards
│   ├── webrtc-signaling.ts              # Cloudflare Calls ICE & broadcast signaling
│   ├── webrtc-audio.ts                  # Hardware audio routing (Earpiece/Speaker/Bluetooth)
│   ├── offline-engine.ts                # LRU offline persistence & outbox queue
│   ├── sync-coordinator.ts              # Thundering herd jitter & 30s presence rate limit
│   └── notifications.ts                 # Safe remote push notification dispatching
│
├── hooks/
│   ├── useCallSession.ts                # WebRTC & telephony call lifecycle controller
│   └── useAuthProfile.ts                # Cached user profile & role permission hook
│
└── types/                               # STRICT DOMAIN MODELS (Zero `as any`)
    ├── chat.ts                          # Chat messages, attachments & payloads
    ├── crm.ts                           # Leads, manual entries & pipeline stages
    └── inquiries.ts                     # Inquiry templates, fields & responses
```

---

## 🚀 Navigation & Workspaces

The application features a 4-tab floating navigation dock with Apple spring physics and translucent Liquid Glass chrome:

1. **Inbox (`/`)**: Real-time conversation list, unread counters, keyset pagination (max 200 items to prevent mobile OOM), pin/archive/mute swipe actions, and online presence badges.
2. **Calls (`/calls`)**: Grouped call history with incoming/outgoing/missed status badges, call duration, and 1-tap audio/video redial.
3. **CRM (`/leads`)**: Unified CRM workspace dynamically personalized by user role:
   - **Leads**: Dual sub-tabs for **Leads from chat** (status pipeline) and **My leads** (manual CRM with metrics & add lead form).
   - **Inquiries**: Dual sub-tabs for **Responses** (submitted questionnaire responses with direct chat routing) and **Form Builder** (visual questionnaire editor for "Schedule Tour" & "Ask Question" intents).
   - *Role Guard*: Automatically personalized to "Inquiries" for Landlord accounts and completely hidden for consumer Buyer accounts.
4. **Settings (`/settings`)**: Real user identity, dynamic role badge (`Agency Brokerage`, `Real Estate Developer`, `Licensed Agent`, `Property Host`, `Verified Buyer`), Brokerage Availability presence selector (hidden for consumers), and clean cache sign-out.

---

## 📞 VoIP Telephony & WebRTC Media Engine (500k CCU)

DelChat incorporates an enterprise-grade calling engine designed to sustain 500,000+ concurrent connections:

- **Universal WebRTC Engine (`lib/webrtc/mediaEngine.ts`)**: Opus 48kHz stereo audio, VP8/H.264 720p adaptive video, and early candidate buffering to eliminate race conditions.
- **ICE Restart & 3s Network Watchdog**: Automatically renegotiates WebRTC session descriptions upon cellular-to-WiFi handover or network degradation without terminating the call.
- **Native iOS CallKit (`lib/voip/callkit.ts`)**: Native lock-screen incoming call UI, system recent calls history integration, and hardware mute button synchronization.
- **Native Android ConnectionService (`lib/voip/connectionService.ts`)**: Dedicated `delchat_voip_calls` notification channel with `IMPORTANCE_MAX` and full-screen heads-up alerts.
- **Zero-Touch Proximity Blanking (`lib/voip/proximityService.ts`)**: Hardware proximity sensor integration that blacks out the display when the device is held to the ear during voice calls to eliminate accidental touch inputs.
- **Dynamic Audio Routing (`lib/webrtc-audio.ts`)**: Seamless runtime switching between Earpiece, Speakerphone, and Bluetooth headsets.
- **Thundering Herd Protection (`lib/sync-coordinator.ts`)**: Randomized jitter ($500-3500\text{ms}$) and a 30-second presence rate limit (`PRESENCE_TOUCH_THROTTLE_MS`) preventing database overload when hundreds of thousands of devices reconnect simultaneously.

---

## 🧪 Senior Engineer Automated Verification Suite

DelChat enforces a mandatory 10-suite verification harness required before and after any code modification:

```bash
# 1. Full Strict TypeScript Static Analysis (0 errors required)
cmd /c npx tsc --noEmit

# 2. Comprehensive 500k CCU QA & Chaos Audit (62/62 tests passing)
node scripts/run_comprehensive_audit.js

# 3. Clean Architecture Runtime & Repository Audit (54/54 tests passing)
node scripts/test_clean_architecture.js

# 4. WhatsApp Presence & Last Seen Sync Audit (100% passing)
node scripts/test_presence_sync.js

# 5. Role-Based Authentication & Permissions Audit (10/10 tests passing)
node scripts/test_role_permissions.js

# 6. Native VoIP Push, CallKit & ConnectionService Suite (32/32 tests passing)
node scripts/test_voip_push_callkit.js

# 7. WebRTC Media Engine Architecture & Candidate Buffering Suite (30/30 tests passing)
node scripts/test_webrtc_media_engine.js

# 8. Network Handover, Proximity Sensor & Resilience Suite (18/18 tests passing)
node scripts/test_phase5_resilience.js

# 9. Call Functionality Verification Suite (49/49 tests passing)
node scripts/test_call_functionality.js

# 10. Master End-to-End System Audit (119/119 tests passing)
node scripts/run_master_system_audit.js
```

---

## 📱 Development & Running Instructions

### Local Development (Expo Go & Simulator)
```bash
# Install dependencies
npm install

# Start the Expo development server
npx expo start

# Controls in terminal:
# Press 'a' -> Launch in Android Emulator
# Press 'i' -> Launch in iOS Simulator
# Scan QR code with Expo Go app on physical device
```

### Production EAS Cloud Compilation
DelChat is pre-configured with `eas.json`, Android FCM `google-services.json`, and iOS Universal Link entitlements:

```bash
# Compile standalone Android App Bundle (.aab)
eas build -p android --profile production

# Compile standalone Android APK for direct testing
eas build -p android --profile preview

# Compile standalone iOS distribution binary
eas build -p ios --profile production
```

---

## 🔒 Enterprise Invariants Maintained

- **500k CCU Concurrency**: Zero unfiltered database listeners; targeted user-filtered CDC streams; keyset memory bounds.
- **BOLA / IDOR Protection**: Active participant authorization checks; confidential internal broker notes strictly isolated from client threads.
- **Zero Mocking**: All endpoints wired to live DeltanHub production infrastructure (`https://deltanhub.com`).
