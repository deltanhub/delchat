# DelChat Role-Based Authentication & Permissions Master Plan

> **MANDATORY MASTER BLUEPRINT DIRECTIVE**:
> This document is the **Single Source of Truth (SSOT)** for Role-Based Authentication, User Profile Identity, and Granular Role Permissions across the standalone DelChat React Native application.
>
> **MANDATORY PROTOCOL FOR EVERY AI AGENT IN EVERY THREAD**:
> 1. **Consult This Document First**: Whenever a new thread begins or role/auth work continues, you MUST read this document to understand the active status, architectural boundaries, and remaining tasks.
> 2. **Senior Engineer Live Smoke Test Protocol (Mandatory Before and After Any Change)**:
>    Every agent in every thread MUST execute a live smoke test before making any modification AND before declaring any phase complete:
>    - Static Typecheck: `cmd /c npx tsc --noEmit` (exit code 0 required)
>    - Comprehensive Audit: `node scripts/run_comprehensive_audit.js` (62/62 tests pass required)
>    - Clean Architecture Audit: `node scripts/test_clean_architecture.js` (54/54 tests pass required)
>    - Presence Sync Audit: `node scripts/test_presence_sync.js` (100% pass required)
>    - Role & Permissions Audit: `node scripts/test_role_permissions.js` (100% pass required)
>    *Never assume code works without live proof.*
> 3. **Mandatory Post-Execution Update Protocol**:
>    Immediately after completing any phase or sub-phase, you MUST update this document (`DELCHAT_ROLE_BASED_AUTHENTICATION_AND_PERMISSIONS_PLAN.md`) detailing:
>    - **What was done** (specific files created, modified, or deleted, with exact line references)
>    - **Why it was done** (technical rationale and architectural justification)
>    - **Smoke test results & proof** (exact command output, exit code 0)
>    - **What is left to be done** (exact next phase and checklist items)
>
> All future threads MUST read and update this document so subsequent threads can seamlessly continue without context loss or regressions.

---

## 1. Master Thread Resume Prompt

Whenever starting a new chat thread to continue or verify this task, copy and paste this prompt:

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

Check the "What is Left To Be Done" section in `DELCHAT_ROLE_BASED_AUTHENTICATION_AND_PERMISSIONS_PLAN.md` and execute the next pending phase without introducing spaghetti code or breaking existing clean architecture contracts. After execution, re-run all smoke tests, verify exit code 0, and update the plan detailing what was done, why it was done, smoke test proof, and next steps.
```

---

## 2. Context & Root-Cause Failure Inventory

### Problem Statement
In previous builds of DelChat, every authenticated user was treated as a generic "Agent" with identical permissions and UI presentation. 
Specifically:
1. **Settings Screen Identity Vacuum**: In `app/(tabs)/settings.tsx`, the UI called `supabase.auth.getUser()`, displayed the user's raw email instead of their real `full_name`, and rendered a hardcoded subtitle `"DeltanHub Member"`.
2. **Hardcoded Professional Controls for All Users**: The Settings screen unconditionally rendered `"BROKERAGE AVAILABILITY"` (toggle for receiving inquiries, auto-responder, office hours) for every user, even consumers (`Buyer`) who have no brokerage.
3. **Leads CRM Tab Exposed to Consumers**: In `app/(tabs)/_layout.tsx`, the `"leads"` CRM tab was statically mounted in the bottom tab navigator for all accounts, confusing Buyers who should only see messaging and calling capabilities.
4. **Lack of Reactive Role State**: `lib/auth.ts` provided basic authentication helpers but lacked a reactive hook (`useAuthProfile`) that exposes the user's real database `main_role`, verification status, and organization affiliation.

### Ground Truth Database Verification
Inspection of the production PostgreSQL database (`profiles` table) confirmed:
- User `trustgold00@gmail.com`:
  - `user_id`: `'ae191844-5b28-403b-8449-e75743e1d9f2'`
  - `full_name`: `'DeltanHub User'`
  - `main_role`: `'Agency'`
  - `is_verified`: `true`
  - `email`: `'trustgold00@gmail.com'`
This user is a registered **Agency** (brokerage organization) on DeltanHub, yet the DelChat mobile app displayed them as a generic "Member" and failed to showcase their Agency status.

---

## 3. DeltanHub Unified Role Taxonomy & Permission Matrix

Per DeltanHub's foundation (`deltanhub/lib/auth/foundation.ts`), the system recognizes 5 primary user roles:

| Role | Category | Bottom Tabs | Brokerage Availability | Leads CRM Access | Can Assign Agents | Can View/Add Internal Notes |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| **Agency** | Professional / Firm | Inbox, Calls, Leads, Settings | YES | YES | YES | YES |
| **Developer** | Professional / Enterprise | Inbox, Calls, Leads, Settings | YES | YES | YES | YES |
| **Agent** | Professional / Solo Broker | Inbox, Calls, Leads, Settings | YES | YES | NO (Self only) | YES |
| **Landlord / Owner** | Property Host | Inbox, Calls, Inquiries, Settings | YES | YES (Inquiries) | NO | NO |
| **Buyer** | Consumer / Client | Inbox, Calls, Settings | NO | NO | NO | NO |

### Role Classification Helpers (`lib/auth.ts`)
- `isProfessionalRole(role)`: Returns `true` if role is `'Agency'`, `'Developer'`, `'Agent'`, or `'Landlord/Owner'`.
- `canReceiveLeads(role)`: Returns `true` if role is `'Agency'`, `'Developer'`, `'Agent'`, or `'Landlord/Owner'`.
- `canAssignAgents(role)`: Returns `true` if role is `'Agency'` or `'Developer'`.
- `formatRoleLabel(role)`: Formats database string into human-readable brand label (e.g. `'Agency'` -> `"Agency Brokerage"`, `'Developer'` -> `"Property Developer"`, `'Buyer'` -> `"Verified Buyer"`).

---

## 4. Architectural Execution Roadmap

### Phase 1: Foundation & Reactive Profile Hook
- **Files**: `lib/auth.ts`, `hooks/useAuthProfile.ts`
- **Tasks**:
  1. Add typed role definitions (`DeltanHubRole = 'Agency' | 'Developer' | 'Agent' | 'Landlord/Owner' | 'Buyer' | string`).
  2. Implement `isProfessionalRole`, `canReceiveLeads`, `canAssignAgents`, `formatRoleLabel` in `lib/auth.ts`.
  3. Ensure `getCurrentProfile()` queries `profiles` table with fallbacks and in-memory TTL caching.
  4. Create `hooks/useAuthProfile.ts` with SWR-style caching, automatic background revalidation on app foreground, and manual `refreshProfile()` trigger.

### Phase 2: Dynamic Role-Aware Bottom Navigation
- **File**: `app/(tabs)/_layout.tsx`
- **Tasks**:
  1. Consume `useAuthProfile()`.
  2. Dynamically filter `visibleRoutes` in the custom tab bar:
     - If user is `Buyer`: omit `leads` from the visible tab bar (3 tabs: Inbox, Calls, Settings).
     - If user is `Agency`, `Developer`, `Agent`, or `Landlord/Owner`: display all 4 tabs (Inbox, Calls, Leads, Settings).
  3. Customize the Leads tab label: `"Leads"` for Agency/Developer/Agent, `"Inquiries"` for Landlord/Owner.

### Phase 3: Dynamic Profile & Settings Parity
- **File**: `app/(tabs)/settings.tsx`
- **Tasks**:
  1. Consume `useAuthProfile()`.
  2. Replace raw email title with `profile?.fullName || user?.email`.
  3. Replace `"DeltanHub Member"` with dynamic role badge displaying `formatRoleLabel(profile?.mainRole)` and verification icon if `profile?.isVerified`.
  4. Conditionally render `"BROKERAGE AVAILABILITY"` section ONLY when `isProfessionalRole(profile?.mainRole)`.
  5. For Buyers, replace Brokerage Availability with consumer-friendly sections: Notification Preferences, Account Security & Chat PIN, and Help / Support.

### Phase 4: Route Guards & Action Isolation
- **Files**: `app/(tabs)/leads.tsx`, `app/thread/[id].tsx`
- **Tasks**:
  1. Add defensive guard in `leads.tsx`: if a `Buyer` attempts to navigate to `/leads` directly via deep link or stale state, gracefully redirect them back to `/(tabs)` or render an informative consumer empty state.
  2. Ensure internal broker notes modal and agent assignment buttons in `thread/[id].tsx` are only rendered for authorized roles (`canAssignAgents` / `isProfessionalRole`).

### Phase 5: Verification Suite & Automated Testing
- **File**: `scripts/test_role_permissions.js`
- **Tasks**:
  1. Automated test verifying `isProfessionalRole`, `canReceiveLeads`, `canAssignAgents`, and `formatRoleLabel` across all 5 roles.
  2. Test tab visibility logic for Buyers vs. Professionals.
  3. Test Settings screen conditional rendering rules.
  4. Add to `run_master_system_audit.js` to ensure permanent CI/CD regression protection.

---

## 5. Senior Engineer Live Smoke Test Protocol

Before modifying ANY file, and immediately after completing any change:
```bash
# 1. Static Typecheck (Strict Zero-Error Policy)
cmd /c npx tsc --noEmit

# 2. Comprehensive 500k CCU QA Audit (62/62 Tests)
node scripts/run_comprehensive_audit.js

# 3. Clean Architecture Verification (54/54 Tests)
node scripts/test_clean_architecture.js

# 4. Realtime Presence & Last Seen Sync Audit (100% Pass)
node scripts/test_presence_sync.js

# 5. Role & Permissions Verification
node scripts/test_role_permissions.js
```

---

## 6. Execution History & Status Log

### Phase 0: Baseline Verification & Blueprint Initialization (COMPLETED)
- **What Was Done**:
  1. Verified existing system health: static typecheck passed (0 errors), comprehensive audit passed (62/62 tests), clean architecture passed (54/54 tests), presence sync passed (100% pass).
  2. Created `DELCHAT_ROLE_BASED_AUTHENTICATION_AND_PERMISSIONS_PLAN.md` with complete architecture, permission matrix, execution phases, and resume prompts.
  3. Updated `AGENTS.md` and created `agents.md` with the Mandatory Master Blueprint Protocol header referencing this plan.
- **Why It Was Done**:
  To guarantee that every AI agent in any conversation thread has an unshakeable Single Source of Truth for roles and permissions, prevents regression of clean architecture contracts, and mandates live smoke testing before and after all changes.
- **Smoke Test Results & Proof**:
  - `cmd /c npx tsc --noEmit`: Exit Code 0 (zero errors)
  - `node scripts/run_comprehensive_audit.js`: Exit Code 0 (62/62 PASSED)
  - `node scripts/test_clean_architecture.js`: Exit Code 0 (54/54 PASSED)
  - `node scripts/test_presence_sync.js`: Exit Code 0 (100% PASSED)

### Phase 1: Foundation & Reactive Profile Hook (COMPLETED)
- **What Was Done**:
  1. `lib/auth.ts`: Implemented `DeltanHubRole` union (`'Agency' | 'Developer' | 'Agent' | 'Landlord/Owner' | 'Buyer'`), `AppProfile`, and pure role helpers: `normalizeRole`, `isProfessionalRole`, `canReceiveLeads`, `canAssignAgents`, `formatRoleLabel`, `clearProfileCache`.
  2. `lib/auth.ts`: Upgraded `getCurrentProfile(forceRefresh)` with dual-tier fallback (`user_profiles` table -> `get_public_user_profiles` RPC -> auth metadata) and 60-second in-memory TTL caching.
  3. `hooks/useAuthProfile.ts`: Created reactive hook tracking profile, reactive role, `isProfessional`, `canReceiveLeads`, `canAssignAgents`, `roleLabel`, and auto-revalidating on auth state changes and app foreground.
- **Why It Was Done**:
  To establish a reliable domain layer for user identity that accurately honors PostgreSQL database roles, shields against RLS edge cases, and provides components with reactive permissions.

### Phase 2: Dynamic Role-Aware Bottom Navigation (COMPLETED)
- **What Was Done**:
  1. `app/(tabs)/_layout.tsx`: Integrated `useAuthProfile()`.
  2. Dynamically filtered `visibleRoutes`: if user has `mainRole === 'Buyer'` (`!canReceiveLeads`), the `leads` tab is completely omitted from the tab bar (leaving 3 tabs: Inbox, Calls, Settings).
  3. For `Landlord/Owner`, customized the Leads tab label to `"Inquiries"`.
  4. Added defensive route redirect to bounce unauthorized users to `'index'` if `leads` is active.
- **Why It Was Done**:
  Buyers should never be presented with CRM brokerage pipelines; their mobile interface is focused strictly on communication and browsing.

### Phase 3: Dynamic Profile & Settings Parity (COMPLETED)
- **What Was Done**:
  1. `app/(tabs)/settings.tsx`: Integrated `useAuthProfile()` and `resolveAvatarUrl`.
  2. Profile Card: Displays the user's real `full_name` (or `displayName`), user avatar (or initial letter), formatted brand role badge (`formatRoleLabel`), verified shield badge (`isVerified`), and user email.
  3. Brokerage Availability: Wrapped in `{isProfessional && ( ... )}` guard so it is strictly hidden from `Buyer` accounts.
  4. Sign Out: Automatically clears the in-memory profile cache via `clearProfileCache()` before executing `supabase.auth.signOut()`.
- **Why It Was Done**:
  Eliminated the generic "DeltanHub Member" and hardcoded brokerage availability controls for consumer accounts. Real estate organizations like `trustgold00@gmail.com` now proudly display `"Agency Brokerage"`, and buyers see their clean consumer profile.

### Phase 4: Route Guards & Action Isolation (COMPLETED)
- **What Was Done**:
  1. `app/(tabs)/leads.tsx`: Added `canReceiveLeads` check on mount with automatic redirect to `/(tabs)`.
  2. `app/(tabs)/leads.tsx`: Added defensive restricted-access fallback view if a non-privileged user lands on `/leads`.
  3. `app/thread/[id].tsx`: Confirmed lead management strip, agent reassignment, and confidential notes are strictly protected via `canAssignAgents` and `isProfessionalRole`.
- **Why It Was Done**:
  Guarantees enterprise defense-in-depth: unauthorized users cannot view or manipulate lead data even if they attempt direct URL/deep-link access.

### Phase 5: Verification Suite & Automated Testing (COMPLETED)
- **What Was Done**:
  1. Created `scripts/test_role_permissions.js` with 10 comprehensive tests validating role taxonomy, capability matrix, navigation filtering, Settings isolation, and leads route guards.
  2. Integrated Tier 7 into `scripts/run_master_system_audit.js` (bringing master test count to 106/106 tests).
  3. Executed all 5 live smoke test suites.
- **Why It Was Done**:
  To ensure permanent automated regression prevention across CI/CD and future agent threads.
- **Smoke Test Results & Proof**:
  - Static Typecheck: `cmd /c npx tsc --noEmit` -> Exit Code 0
  - Comprehensive QA: `node scripts/run_comprehensive_audit.js` -> 62/62 PASSED (Exit Code 0)
  - Clean Architecture: `node scripts/test_clean_architecture.js` -> 54/54 PASSED (Exit Code 0)
  - Realtime Presence Sync: `node scripts/test_presence_sync.js` -> 100% PASSED (Exit Code 0)
  - Role & Permissions: `node scripts/test_role_permissions.js` -> 10/10 PASSED (Exit Code 0)
  - Master System Audit: `node scripts/run_master_system_audit.js` -> 106/106 PASSED (Exit Code 0)

### Phase 6: Inquiries From Chat & Unified CRM Tab Parity (COMPLETED)
- **What Was Done**:
  1. Updated `app/(tabs)/_layout.tsx`: Updated tab title and label to `CRM` with `briefcase` icon, while dynamically maintaining personalized `'Inquiries'` label for `Landlord/Owner` and hiding CRM tab completely for `Buyer` accounts via `canReceiveLeads`.
  2. `app/(tabs)/leads.tsx`: Preserved strict `canReceiveLeads` route guard redirecting unauthorized users (e.g. `Buyer`) back to `/(tabs)` or displaying the restricted access fallback screen.
  3. Integrated inquiry templates and responses management for professionals and landlords.
  4. Updated `scripts/test_role_permissions.js` and `scripts/run_master_system_audit.js` to assert `CRM` tab naming parity.
- **Why It Was Done**:
  Provides seamless unification of chat inquiry questionnaires and lead pipeline for real estate professionals while strictly adhering to the 5-role permission taxonomy.
- **Smoke Test Results & Proof**:
  - `cmd /c npx tsc --noEmit` -> Exit Code 0
  - `node scripts/run_comprehensive_audit.js` -> 62/62 PASSED (Exit Code 0)
  - `node scripts/test_clean_architecture.js` -> 54/54 PASSED (Exit Code 0)
  - `node scripts/test_presence_sync.js` -> 100% PASSED (Exit Code 0)
  - `node scripts/test_role_permissions.js` -> 10/10 PASSED (Exit Code 0)
  - `node scripts/run_master_system_audit.js` -> 106/106 PASSED (Exit Code 0)

### Phase 7: Master Leads & Assigned Leads Role Synchronization (COMPLETED)
- **What Was Done**:
  1. `lib/repositories/conversationRepository.ts`: Enforced viewer role guard (`isViewerProfessional = canReceiveLeads(currentProfile?.mainRole)`) to suppress `assignmentObj` for Buyer accounts.
  2. `components/chat/ConversationRow.tsx`: Integrated role-aware badge titling (`conversation.canAssignAgents ? 'Master Lead' : 'Assigned Lead'`) and agent chip rendering.
  3. `components/leads/ChatLeadsView.tsx`: Fixed sub-tab partitioning (Master Leads = delegated leads, My Leads = unassigned/direct).
  4. `scripts/test_master_leads_architecture.js`: Created and executed 16/16 test suite.
- **Why It Was Done**:
  Guarantees real estate agency leadership and assigned agents see exact role-segregated leads with zero data leaks to consumer buyers.
- **Smoke Test Results & Proof**:
  - `cmd /c npx tsc --noEmit` &rarr; Exit Code 0
  - `node scripts/test_master_leads_architecture.js` &rarr; 16/16 PASSED (Exit Code 0)
  - `node scripts/run_master_system_audit.js` &rarr; 132/132 PASSED (Exit Code 0)

### Phase 8: Master Lead Thread Workspace & Buyer Privacy Guard (COMPLETED)
- **What Was Done**:
  1. `hooks/thread/useThreadSession.ts`: Added `canReceiveLeads(profile?.mainRole)` guard to prevent exposing internal lead inquiry data or agent assignment state to consumer buyers.
  2. `components/chat/crm/MasterLeadSubHeader.tsx` & `components/chat/crm/MasterLeadDetailsView.tsx`: Built dedicated thread workspace controls visible only when viewer is a real estate professional (`session.assignment != null`).
  3. `scripts/test_master_leads_architecture.js`: Expanded to 21 tests with Suite 6 verifying thread workspace and privacy suppression.
- **Why It Was Done**:
  Guarantees consumer buyers cannot inspect internal agency CRM assignment status, response times, or staff notes while interacting with an agency or developer.
- **Smoke Test Results & Proof**:
  - `cmd /c npx tsc --noEmit` &rarr; Exit Code 0
  - `node scripts/test_master_leads_architecture.js` &rarr; 21/21 PASSED (Exit Code 0)
  - `node scripts/test_role_permissions.js` &rarr; 10/10 PASSED (Exit Code 0)
  - `node scripts/run_master_system_audit.js` &rarr; 136/136 PASSED (Exit Code 0)

### Phase 9: Buyer Agent Moderation Reporting & Chat Reveal Consent (COMPLETED)
- **What Was Done**:
  1. `components/chat/ReportModal.tsx`: Added `messagesConsent` state, `agencyName` context, and dynamic switch card allowing the buyer to toggle whether their chat history is revealed (`messages_consent = true`) to company management for review or kept private (`messages_consent = false`).
  2. `hooks/thread/useThreadSession.ts`: Handled report submission directly to `master_lead_reports` with `messages_consent`, `messages_consent_at`, and `report_status: 'pending'`, while preserving legacy API fallbacks. Surfaced `canReportAgent` dynamically.
  3. `components/chat/bubbles/AgentCardBubble.tsx`: Added an interactive inline "Report" button with red flag icon on assigned agent introduction cards.
  4. `components/chat/ChatHeader.tsx` & `components/chat/ChatInfoModal.tsx`: Exposed intuitive "Report Agent" actions in header menus and chat info drawers.
  5. `scripts/test_master_leads_architecture.js` & `scripts/run_master_system_audit.js`: Added Suite 9 and master audit assertions (36/36 and 140/140 tests pass).
- **Why It Was Done**:
  Empowers consumer buyers in assigned chats to report misconduct directly to supervising agency/developer leadership while maintaining strict privacy control over their conversation transcripts, matching DeltanHub web architecture and `canReadMasterLeadMessages` access invariants.
- **Smoke Test Results & Proof**:
  - `cmd /c npx tsc --noEmit` &rarr; Exit Code 0
  - `node scripts/test_master_leads_architecture.js` &rarr; 36/36 PASSED (100%)
  - `node scripts/test_role_permissions.js` &rarr; 10/10 PASSED (100%)
  - `node scripts/run_master_system_audit.js` &rarr; 140/140 PASSED (100%)
  - `node scripts/run_comprehensive_audit.js` &rarr; 62/62 PASSED (100%)
  - `node scripts/test_clean_architecture.js` &rarr; 64/64 PASSED (100%)
  - `node scripts/test_presence_sync.js` &rarr; 100% PASSED

---

## 7. What Is Left To Be Done

All core Role-Based Authentication, Granular Permissions, Master Leads, Assigned Leads, and Buyer Moderation features are **100% complete and certified operational**:
1. Leads CRM & Chat Inquiries Screen Decomposition ([`app/(tabs)/leads.tsx`](file:///c:/Users/alfre/OneDrive/Desktop/delchat/app/(tabs)/leads.tsx)) is **100% COMPLETED** into modular sub-components under `components/leads/` and `components/inquiries/` with route guards strictly preserved.
2. Strict Domain Typing & Zero-Any Cleanliness is **100% COMPLETED** with zero `as any` type escapes across all role and permissions handling.
3. Master Lead & Assigned Lead Thread Workspace Parity is **100% COMPLETED** with strict buyer privacy protection.
4. Buyer Agent Reporting & Chat Reveal Consent is **100% COMPLETED** with database persistence and UI integration.
5. Proceed to Stage 3 App Store Native Compilation (`DELCHAT_500K_CCU_GO_LIVE_OPERATIONAL_PLAN.md`).


