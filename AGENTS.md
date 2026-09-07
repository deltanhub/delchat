# DelChat Standalone Mobile Application — Agent Instructions

> **MANDATORY MASTER BLUEPRINT PROTOCOL**:
> Before writing or modifying any code or configuration in this repository, you MUST read:
> 1. [`DELCHAT_MASTER_LEADS_AND_ASSIGNED_LEADS_ARCHITECTURE_PLAN.md`](file:///c:/Users/alfre/OneDrive/Desktop/delchat/DELCHAT_MASTER_LEADS_AND_ASSIGNED_LEADS_ARCHITECTURE_PLAN.md) (The active master blueprint for Master Leads, Assigned Leads, and CRM data partitioning)
> 2. [`DELCHAT_REALTIME_LIFECYCLE_AND_CALL_LOGS_REMEDIATION_PLAN.md`](file:///c:/Users/alfre/OneDrive/Desktop/delchat/DELCHAT_REALTIME_LIFECYCLE_AND_CALL_LOGS_REMEDIATION_PLAN.md) (The active blueprint for Supabase Realtime channel deduplication, lifecycle immunity & call logs CDC collision guard)
> 3. [`DELCHAT_500K_CCU_VOIP_AND_CALLING_MASTER_PLAN.md`](file:///c:/Users/alfre/OneDrive/Desktop/delchat/DELCHAT_500K_CCU_VOIP_AND_CALLING_MASTER_PLAN.md) (The active master blueprint for 500k CCU VoIP calling, WebRTC media engine & calling UI/UX)
> 4. [`DELCHAT_ANTI_SPAGHETTI_AND_CLEAN_ARCHITECTURE_MASTER_PLAN.md`](file:///c:/Users/alfre/OneDrive/Desktop/delchat/DELCHAT_ANTI_SPAGHETTI_AND_CLEAN_ARCHITECTURE_MASTER_PLAN.md) (The active master blueprint for Anti-Spaghetti code, Clean Architecture & screen deconstruction)
> 5. [`DELCHAT_ROLE_BASED_AUTHENTICATION_AND_PERMISSIONS_PLAN.md`](file:///c:/Users/alfre/OneDrive/Desktop/delchat/DELCHAT_ROLE_BASED_AUTHENTICATION_AND_PERMISSIONS_PLAN.md) (The active blueprint for Role-Based Authentication, Profile Identity & Granular Permissions)
> 6. [`DELCHAT_CLEAN_ARCHITECTURE_REFACTORING_PLAN.md`](file:///c:/Users/alfre/OneDrive/Desktop/delchat/DELCHAT_CLEAN_ARCHITECTURE_REFACTORING_PLAN.md) (The active 5-phase Clean Architecture & Anti-Spaghetti refactoring blueprint)
> 7. [`DELCHAT_500K_CCU_GO_LIVE_OPERATIONAL_PLAN.md`](file:///c:/Users/alfre/OneDrive/Desktop/delchat/DELCHAT_500K_CCU_GO_LIVE_OPERATIONAL_PLAN.md) (The active 3-stage operational go-live deployment plan: Stage 1 Infrastructure -> Stage 2 Credentials -> Stage 3 Native Compilation)
> 8. [`DELCHAT_500K_CCU_ENTERPRISE_REMEDIATION_PLAN.md`](file:///c:/Users/alfre/OneDrive/Desktop/delchat/DELCHAT_500K_CCU_ENTERPRISE_REMEDIATION_PLAN.md) (The completed 5-phase architectural remediation plan)
> 9. [`DELCHAT_ENGINEERING_BLUEPRINT.md`](file:///c:/Users/alfre/OneDrive/Desktop/delchat/DELCHAT_ENGINEERING_BLUEPRINT.md) (The comprehensive engineering architecture and failure inventory)
>
> **Senior Engineer Live Smoke Test Protocol (Mandatory Before and After Any Change)**:
> Every agent in every thread MUST execute a live smoke test before making any modification AND before declaring any change complete:
> 1. Static Typecheck: `cmd /c npx tsc --noEmit` (exit code 0 required)
> 2. Comprehensive Audit: `node scripts/run_comprehensive_audit.js` (62/62 tests pass required)
> 3. Clean Architecture Audit: `node scripts/test_clean_architecture.js` (54/54 tests pass required)
> 4. Presence Sync Audit: `node scripts/test_presence_sync.js` (100% pass required)
> 5. Role & Permissions Audit: `node scripts/test_role_permissions.js` (10/10 tests pass required)
> 6. Master System Verification: `node scripts/run_master_system_audit.js` (all tests pass required)
>
> **Mandatory Update Protocol**:
> After completing any phase or sub-phase, you MUST update `DELCHAT_REALTIME_LIFECYCLE_AND_CALL_LOGS_REMEDIATION_PLAN.md`, `DELCHAT_MASTER_LEADS_AND_ASSIGNED_LEADS_ARCHITECTURE_PLAN.md`, `DELCHAT_ANTI_SPAGHETTI_AND_CLEAN_ARCHITECTURE_MASTER_PLAN.md`, `DELCHAT_CLEAN_ARCHITECTURE_REFACTORING_PLAN.md`, `DELCHAT_ROLE_BASED_AUTHENTICATION_AND_PERMISSIONS_PLAN.md`, `DELCHAT_500K_CCU_GO_LIVE_OPERATIONAL_PLAN.md`, `DELCHAT_500K_CCU_ENTERPRISE_REMEDIATION_PLAN.md`, and `DELCHAT_ENGINEERING_BLUEPRINT.md` detailing:
> - **What was done** (specific files and line numbers modified)
> - **Why it was done** (technical rationale and architectural justification)
> - **Smoke test results & proof** (exact command output, exit code 0)
> - **What is left to be done** (immediate next phase items)
>
> All future threads MUST read and update these documents so subsequent threads can seamlessly continue without context loss.

This document defines the strict, non-negotiable frontend design, typography, color theme, and animation guidelines for the standalone **DelChat** React Native (Expo) app.

---

## 1. Unified Identity & Brand Theme

DelChat is to DeltanHub exactly as Messenger is to Facebook. The branding, colors, and overall feel must match the main DeltanHub platform.

### Curated Color Palette
- **Wine Brand Direction**:
  - `winePrimary`: `#4a0f1f` (DeltanHub signature brand color)
  - `wineDark`: `#3a0b18`
  - `wineSoft`: `#f4e7eb` (Accent highlights)
  - `wineMuted`: `#8c4154`
- **Light Theme**:
  - `background`: `#f4f7fb`
  - `card`: `#ffffff`
  - `text`: `#050505`
  - `border`: `#e5e7eb`
- **Dark Theme (Cinema Call Mode)**:
  - `background`: `#000000` (Pure black for calls)
  - `card`: `#121212` (Cards/drawers)
  - `text`: `#ffffff`
  - `border`: `#262626`

---

## 2. Typography Guidelines

Use native platform fonts for a premium, fast-rendering experience:
- **iOS**: SF Pro (`System` font with weight styling)
- **Android**: Roboto (`System` font)
- **Font Sizing & Weights**: Refer to [`constants/Typography.ts`](file:///c:/Users/alfre/OneDrive/Desktop/delchat/constants/Typography.ts) for sizing metrics.

---

## 3. Apple-Style Motion Physics & Micro-Animations

Every transition and user action must feel alive, tactile, and natural. Never use basic linear transitions.

### Spring Dynamics
- **Standard Apple Spring Settings**:
  - `mass`: `1`
  - `stiffness`: `100`
  - `damping`: `15`
- **Press Interactions**:
  - All button presses and active states must downscale slightly (`scale: 0.97`) and snap back smoothly using the spring parameters.
  - Utilize `ScalePressable` wrapper for all interactive controls.
- **Haptic Feedback**:
  - Provide light tactile haptic feedback (`expo-haptics`) upon button press events.

### Page Transitions
- Every web route/page transition must use the `AnimatedPageWrapper` component to fade and slide up/down uniformly.
- Respect `prefers-reduced-motion` media queries when applicable.

---

## 4. Edge-to-Edge Display Rule (Mandatory)

Every screen in this app uses **edge-to-edge / full-bleed** layout. This is a non-negotiable standard.

### The Pattern
**Never** wrap the root of a screen in `<SafeAreaView>`. Instead:
1. Use a plain `<View style={{ flex: 1 }}>` as the root container.
2. Import `useSafeAreaInsets` from `react-native-safe-area-context` and call it inside the component.
3. Apply `paddingTop: insets.top` (plus design spacing) **only** to the first content/header element.
4. Set `<StatusBar translucent backgroundColor="transparent" />` on every screen.

---

## 5. WebRTC Calls & Liquid Glass Chrome

- **Liquid Glass Materials**: Use translucent backgrounds (`rgba(255,255,255,0.15)` or frosted blur) selectively for call control bars, headers, floating menus, and search panels.
- Do NOT apply glassmorphism to chat bubbles or standard message list feeds.

---

## 6. REQUIRED: The 4-Step UI Verification Loop

Before you finalize, submit, or consider any UI component or screen "complete," you MUST execute the following verification loop. You must output your answers to this checklist in the chat so the user can see you have verified the layout.

### Step 1: Source Identification
* Identify the exact DeltanHub web mobile component/screen you are replicating.

### Step 2: Component Mapping
* List the HTML/CSS structure of the source web mobile view.
* Map those exact elements to their React Native equivalents (e.g., `div.flex-row` -> `<View style={{flexDirection: 'row'}}>`).

### Step 3: The Redesign Audit
* Ask yourself: Did I introduce any new layout structures, change the visual hierarchy, or move elements to different positions compared to the web mobile view?
* If YES: Delete your code and start over. You are hallucinating a redesign.
* If NO: Proceed to Step 4.

### Step 4: Final Sign-Off
Output this exact checklist and fill in the brackets with an [X]:
- [ ] Layout perfectly matches the web mobile source of truth.
- [ ] CSS and web DOM elements were translated natively without structural redesigns.
- [ ] Native enhancements (Apple/Material fonts, physics, safe areas, Liquid Glass chrome) were applied ONLY to appropriate system areas.
- [ ] Ready for review.

---

## 7. Role-Based Authentication & Permissions Protocol

DelChat is strictly role-aware and mirrors the DeltanHub role foundation (`deltanhub/lib/auth/foundation.ts`).

### Roles Supported
- `Agency` (Firm / Brokerage)
- `Developer` (Real Estate Developer)
- `Agent` (Licensed Broker / Agent)
- `Landlord/Owner` (Property Host)
- `Buyer` (Consumer Client)

### Strict Permission Directives
1. **Never Show Brokerage Availability to Consumers**: If the authenticated profile has role `Buyer`, "BROKERAGE AVAILABILITY" must NEVER be shown on Settings.
2. **Never Show Leads CRM Tab to Consumers**: Bottom tabs must dynamically filter out the `leads` tab for `Buyer` accounts.
3. **Always Display Real Identity**: Query `profiles` table to render `full_name`, avatar, and dynamic role badge (`formatRoleLabel()`).
4. **Master Resume Prompt for Future Threads (Role-Based Auth)**:
```markdown
Resume the DelChat Role-Based Authentication and Permissions implementation by strictly consulting:
1. `DELCHAT_ROLE_BASED_AUTHENTICATION_AND_PERMISSIONS_PLAN.md`
2. `DELCHAT_CLEAN_ARCHITECTURE_REFACTORING_PLAN.md`
3. `AGENTS.md`

Before making any changes:
1. Run the Senior Engineer Live Smoke Test:
   - `cmd /c npx tsc --noEmit`
   - `node scripts/run_comprehensive_audit.js`
   - `node scripts/test_clean_architecture.js`
   - `node scripts/test_presence_sync.js`
   - `node scripts/test_role_permissions.js`
   - `node scripts/run_master_system_audit.js`

Check the "What is Left To Be Done" section in `DELCHAT_ROLE_BASED_AUTHENTICATION_AND_PERMISSIONS_PLAN.md` and execute the next pending phase without introducing spaghetti code or breaking existing clean architecture contracts. After execution, re-run all smoke tests, verify exit code 0, and update the plan detailing what was done, why it was done, smoke test proof, and next steps.
```

---

## 8. Master Resume Prompt for Anti-Spaghetti & Clean Architecture

Whenever opening a new chat thread to continue or verify the Anti-Spaghetti and Clean Architecture refactoring, copy and paste this exact prompt:

```markdown
Resume the DelChat Anti-Spaghetti & Clean Architecture implementation by strictly consulting:
1. `DELCHAT_ANTI_SPAGHETTI_AND_CLEAN_ARCHITECTURE_MASTER_PLAN.md`
2. `DELCHAT_CLEAN_ARCHITECTURE_REFACTORING_PLAN.md`
3. `AGENTS.md`

Before making any changes:
1. Act as the Senior Engineer and run the Mandatory Live Smoke Test Suite:
   - `cmd /c npx tsc --noEmit`
   - `node scripts/run_comprehensive_audit.js`
   - `node scripts/test_clean_architecture.js`
   - `node scripts/test_presence_sync.js`
   - `node scripts/test_role_permissions.js`
   - `node scripts/run_master_system_audit.js`

Check the "What Is Left To Be Done" section in `DELCHAT_ANTI_SPAGHETTI_AND_CLEAN_ARCHITECTURE_MASTER_PLAN.md` and execute the next pending phase without introducing spaghetti code, breaking existing clean architecture contracts, or regressing any UI/calling features. After execution, re-run all smoke tests, verify exit code 0, and update `DELCHAT_ANTI_SPAGHETTI_AND_CLEAN_ARCHITECTURE_MASTER_PLAN.md` detailing what was done, why it was done, smoke test proof, and next steps.
```

---

## 9. Master Resume Prompt for 500k CCU VoIP & Audio/Video Calling

Whenever opening a new chat thread to continue or verify the 500k CCU VoIP & Audio/Video Calling remediation, copy and paste this exact prompt:

```markdown
Resume the DelChat 500k CCU VoIP & Audio/Video Calling implementation by strictly consulting:
1. `DELCHAT_500K_CCU_VOIP_AND_CALLING_MASTER_PLAN.md`
2. `DELCHAT_ANTI_SPAGHETTI_AND_CLEAN_ARCHITECTURE_MASTER_PLAN.md`
3. `AGENTS.md`

Before making any changes:
1. Act as the Senior Engineer and run the Mandatory Live Smoke Test Suite:
   - `cmd /c npx tsc --noEmit`
   - `node scripts/run_comprehensive_audit.js`
   - `node scripts/test_clean_architecture.js`
   - `node scripts/test_presence_sync.js`
   - `node scripts/test_role_permissions.js`
   - `node scripts/run_master_system_audit.js`

```

---

## 10. Master Resume Prompt for Master Leads & Assigned Leads Architecture

Whenever opening a new chat thread to continue or verify Master Leads and Assigned Leads architecture, copy and paste this exact prompt:

```markdown
Resume the DelChat Master Leads and Assigned Leads implementation by strictly consulting:
1. `DELCHAT_MASTER_LEADS_AND_ASSIGNED_LEADS_ARCHITECTURE_PLAN.md`
2. `DELCHAT_ROLE_BASED_AUTHENTICATION_AND_PERMISSIONS_PLAN.md`
3. `DELCHAT_ANTI_SPAGHETTI_AND_CLEAN_ARCHITECTURE_MASTER_PLAN.md`
4. `AGENTS.md`

Before making any changes:
1. Act as the Senior Engineer and run the Mandatory Live Smoke Test Suite:
   - `cmd /c npx tsc --noEmit`
   - `node scripts/run_comprehensive_audit.js`
   - `node scripts/test_clean_architecture.js`
   - `node scripts/test_presence_sync.js`
   - `node scripts/test_role_permissions.js`
   - `node scripts/test_master_leads_architecture.js`
   - `node scripts/run_master_system_audit.js`

Check the "What Is Left To Be Done" section in `DELCHAT_MASTER_LEADS_AND_ASSIGNED_LEADS_ARCHITECTURE_PLAN.md` and execute the next pending phase without introducing spaghetti code, breaking existing clean architecture contracts, or regressing any UI/calling features. After execution, re-run all smoke tests, verify exit code 0, and update `DELCHAT_MASTER_LEADS_AND_ASSIGNED_LEADS_ARCHITECTURE_PLAN.md` detailing what was done, why it was done, smoke test proof, and next steps.
```


