# DelChat Apple Push Notification service (APNs) Deployment Specification

> **Application**: DelChat Standalone iOS Mobile Client  
> **Bundle Identifier**: `com.deltanhub.delchat`  
> **Target Concurrency**: 500,000 Concurrent Active Users  
> **Document Version**: 1.0 (2026-09-04)

---

## 1. APNs Token-Based Authentication Architecture

DelChat uses Apple's HTTP/2-based APNs provider API with token-based (`.p8`) authentication. Unlike legacy certificates (`.p12`) that expire annually, `.p8` authentication keys:
- Never expire unless explicitly revoked in Apple Developer Portal.
- Authenticate all push notification topics for the team.
- Support both standard alert notifications and high-priority VoIP / Background pushes.

---

## 2. Step-by-Step Provisioning Guide

### Step 1: Generate `.p8` Key in Apple Developer Portal
1. Navigate to [developer.apple.com](https://developer.apple.com) -> **Certificates, Identifiers & Profiles** -> **Keys**.
2. Click **(+)** to create a new key.
3. Key Name: `DelChat APNs Production Key`.
4. Enable checkbox: **Apple Push Notifications service (APNs)**.
5. Click **Continue** -> **Register**.
6. Download the key file: `AuthKey_XXXXXXXXXX.p8` (Note: Can only be downloaded once).
7. Record the **Key ID** (10 characters, e.g. `ABC1234567`) and your **Apple Team ID** (10 characters, e.g. `DEF8901234`).

### Step 2: Configure Credentials in Expo EAS
Execute the following CLI command from the `delchat/` root:
```bash
eas credentials -p ios
```
1. Select **Push Notifications** -> **Apple Push Notifications service (APNs) Key**.
2. Upload the downloaded `.p8` file.
3. Enter the **Key ID** and **Team ID**.
4. EAS securely encrypts and stores the key for production builds.

*Alternatively, upload directly via the EAS Web Dashboard:*
- Navigate to `https://expo.dev/accounts/[YOUR-ACCOUNT]/projects/delchat/credentials/ios`.
- Under **Push Notifications**, upload the `.p8` file.

---

## 3. iOS Entitlements & Background Modes Verification

In [`delchat/app.json`](file:///c:/Users/alfre/OneDrive/Desktop/delchat/app.json):
- **APS Environment**: Set to `"production"` in `ios.entitlements.aps-environment`.
- **Background Modes**: Configured in `ios.infoPlist.UIBackgroundModes`:
  - `"audio"` (Background VoIP voice calls)
  - `"voip"` (VoIP push wakeups)
  - `"remote-notification"` (Standard APNs push delivery)
  - `"fetch"` (Background message synchronization)
- **Universal Links**: Associated domain configured as `"applinks:deltanhub.com"`.

---

## 4. End-to-End Push Dispatch Verification

When a user receives a message or call:
1. Sender dispatches message via DelChat mobile or DeltanHub web.
2. Server triggers `/api/chats/push-dispatch` with payload:
   ```json
   {
     "recipientUserIds": ["..."],
     "title": "New message from Sarah",
     "body": "Hi, is the Lekki Phase 1 duplex still available?",
     "data": {
       "url": "delchat://thread/conv_12345",
       "conversationId": "conv_12345"
     }
   }
   ```
3. The dispatcher looks up `public.user_device_tokens` (indexed by `idx_user_device_tokens_user_updated`).
4. EAS Push Service formats the APNs packet and delivers to Apple's gateways:
   - APNs headers: `apns-topic: com.deltanhub.delchat`, `apns-priority: 10`, `apns-push-type: alert`.
5. Device wakes up, displays system banner, and tapping routes directly to `delchat://thread/conv_12345`.
