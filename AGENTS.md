# DelChat Standalone Mobile Application — Agent Instructions

> **MANDATORY MASTER BLUEPRINT PROTOCOL**:
> Before writing or modifying any code or configuration in this repository, you MUST read:
> 1. [`DELCHAT_500K_CCU_GO_LIVE_OPERATIONAL_PLAN.md`](file:///c:/Users/alfre/OneDrive/Desktop/delchat/DELCHAT_500K_CCU_GO_LIVE_OPERATIONAL_PLAN.md) (The active 3-stage operational go-live deployment plan: Stage 1 Infrastructure -> Stage 2 Credentials -> Stage 3 Native Compilation)
> 2. [`DELCHAT_500K_CCU_ENTERPRISE_REMEDIATION_PLAN.md`](file:///c:/Users/alfre/OneDrive/Desktop/delchat/DELCHAT_500K_CCU_ENTERPRISE_REMEDIATION_PLAN.md) (The completed 5-phase architectural remediation plan)
> 3. [`DELCHAT_ENGINEERING_BLUEPRINT.md`](file:///c:/Users/alfre/OneDrive/Desktop/delchat/DELCHAT_ENGINEERING_BLUEPRINT.md) (The comprehensive engineering architecture and failure inventory)
>
> **Senior Engineer Live Smoke Test Protocol (Mandatory Before and After Any Change)**:
> Every agent in every thread MUST execute a live smoke test before and after making any change:
> 1. Static Typecheck: `cmd /c npx tsc --noEmit` (exit code 0 required)
> 2. Comprehensive Audit: `node C:\Users\alfre\.gemini\antigravity\brain\d6cd6fe4-de65-4945-8630-cb2fb8b65b2c\scratch\run_comprehensive_audit.js` (40/40 tests pass required)
>
> **Mandatory Update Protocol**:
> After completing any phase or sub-phase, you MUST update `DELCHAT_500K_CCU_GO_LIVE_OPERATIONAL_PLAN.md`, `DELCHAT_500K_CCU_ENTERPRISE_REMEDIATION_PLAN.md`, and `DELCHAT_ENGINEERING_BLUEPRINT.md` detailing:
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

