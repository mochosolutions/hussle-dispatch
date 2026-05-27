# Auth Login & Session Refresh Fix — Tasks
_Last updated: 2026-05-27 07:00_
_Contract: .planning/auth-login-fix/contract.yaml_
_Shared types: .planning/auth-login-fix/types.ts_
_Plan: .planning/auth-login-fix/plan.md_
_Patterns: .planning/auth-login-fix/PATTERNS.md_

---

## US-01: Backend auth foundation — env-configurable TTLs, rememberMe, read-through grace, accessTokenExpiresAt
_Priority: P0 | Services: hussle-app-dispatch-api | Agent: backend | Status: todo_

**Plain English:** All backend changes in one coherent story. Make `rememberMe` real (7d/30d configurable TTLs); make rotation idempotent under concurrent calls (10s read-through grace); expose `accessTokenExpiresAt` on every authenticated response. **All timing constants become env-var-configurable** so we can run the system in "fast mode" (JWT expires in 10s, refresh TTL 60s, grace 5s) for local exploration and Playwright tests.

must_haves:
  truths:
    - "All timing constants (JWT_EXPIRES_IN, REFRESH_TTL_BASE_SECONDS, REFRESH_TTL_EXTENDED_SECONDS, ROTATION_GRACE_TTL_SECONDS) read from process.env with the production values as defaults."
    - "With fast-mode envs (JWT_EXPIRES_IN=10s, REFRESH_TTL_BASE_SECONDS=60, REFRESH_TTL_EXTENDED_SECONDS=180, ROTATION_GRACE_TTL_SECONDS=5), the API behaves correctly with those values — verifiable via redis-cli TTL and Set-Cookie maxAge inspection."
    - "Login without rememberMe → Redis TTL and refresh cookie maxAge match the configured base TTL."
    - "Login with rememberMe: true → both match the configured extended TTL; the flag is persisted on the Redis session blob."
    - "Every rotation preserves session.rememberMe and applies the corresponding TTL."
    - "Two POST /auth/token/refresh calls within ROTATION_GRACE_TTL_SECONDS carrying the same OLD refresh cookie return 200 with the SAME new refresh-token value; a third call after the grace window returns 401."
    - "Login, /auth/token/refresh, /auth/me, /auth/signup-org, /auth/invite/accept, /auth/switch-org, /auth/password-challenge responses all include accessTokenExpiresAt: ISO-8601 string."
  artifacts:
    - path: hussle-app-dispatch-api/src/auth/constants/index.ts
      provides: "Env-driven REFRESH_TTL_BASE_SECONDS, REFRESH_TTL_EXTENDED_SECONDS, ROTATION_GRACE_TTL_SECONDS, JWT_EXPIRES_IN with production defaults + getRefreshTtlSeconds(rememberMe) helper"
    - path: hussle-app-dispatch-api/src/shared/utils/cookieUtils.ts
      provides: "setRefreshTokenCookie accepts an optional maxAgeMs override"
    - path: hussle-app-dispatch-api/src/auth/types/tokenProvider.ts
      provides: "SessionData and CreateSessionInput carry rememberMe: boolean"
    - path: hussle-app-dispatch-api/src/auth/providers/jwtTokenProvider/createSessionRedis.ts
      provides: "Accepts rememberMe, picks TTL, persists flag on SessionData"
    - path: hussle-app-dispatch-api/src/auth/providers/jwtTokenProvider/rotateSessionRedis.ts
      provides: "Read-through grace: detects grace packet on lookup and re-issues same tokens; on legacy pointer lookup, performs rotation that preserves session.rememberMe TTL and writes refresh:OLD as grace packet with EX ROTATION_GRACE_TTL_SECONDS"
    - path: hussle-app-dispatch-api/src/auth/providers/jwtTokenProvider/tokenHelpers.ts
      provides: "extractAccessTokenExpAsIso(jwt) helper"
    - path: hussle-app-dispatch-api/src/auth/controllers/auth/loginController.ts
      provides: "Threads rememberMe to setRefreshTokenCookie + includes accessTokenExpiresAt in response"
    - path: hussle-app-dispatch-api/src/auth/controllers/auth/refreshTokenController.ts
      provides: "rememberMe-aware cookie maxAge + accessTokenExpiresAt in response"
    - path: hussle-app-dispatch-api/src/auth/controllers/auth/getCurrentUserController.ts
      provides: "accessTokenExpiresAt decoded from request JWT"
  key_links:
    - from: loginController
      to: setRefreshTokenCookie
      via: "Passes rememberMe-derived maxAgeMs override"
    - from: createSessionRedis
      to: SessionData
      via: "Writes rememberMe into JSON blob for rotation to read back"
    - from: rotateSessionRedis (grace branch)
      to: existing newRefreshToken + freshly-signed access JWT
      via: "Detects { kind: 'grace', ... } shape on refresh:OLD lookup; no second rotation"
    - from: rotateSessionRedis (legacy branch)
      to: 10s grace packet
      via: "Replaces destructive DEL of refresh:OLD with SET to JSON grace packet, EX ROTATION_GRACE_TTL_SECONDS"
    - from: all 7 authenticated controllers
      to: response JSON
      via: "extractAccessTokenExpAsIso(accessToken) → accessTokenExpiresAt field"

**Acceptance Criteria:**
- [ ] All four timing constants read from process.env with production defaults.
- [ ] Login without RM → refresh cookie maxAge = REFRESH_TTL_BASE_SECONDS * 1000; Redis TTL ≈ REFRESH_TTL_BASE_SECONDS.
- [ ] Login with RM → both = REFRESH_TTL_EXTENDED_SECONDS.
- [ ] Login + refresh + /auth/me + 4 other controllers all return accessTokenExpiresAt as ISO 8601.
- [ ] Two refresh calls in rapid succession with same starting cookie both return 200, resolve to the **same** new refresh token; after grace expiry a third returns 401.
- [ ] Rotation preserves session.rememberMe and applies the matching TTL.
- [ ] signinSchema accepts optional rememberMe without breaking existing clients.

**Tasks:**
[x] T-01 [TYPES] Env-configurable timing constants with production defaults
         └─ Detail: In `hussle-app-dispatch-api/src/auth/constants/index.ts`, replace the
            existing hardcoded constants with env-driven exports:
            ```
            export const REFRESH_TTL_BASE_SECONDS =
              Number(process.env.REFRESH_TTL_BASE_SECONDS) || 7 * 24 * 60 * 60;
            export const REFRESH_TTL_EXTENDED_SECONDS =
              Number(process.env.REFRESH_TTL_EXTENDED_SECONDS) || 30 * 24 * 60 * 60;
            export const ROTATION_GRACE_TTL_SECONDS =
              Number(process.env.ROTATION_GRACE_TTL_SECONDS) || 10;
            export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
            export const getRefreshTtlSeconds = (rememberMe: boolean): number =>
              rememberMe ? REFRESH_TTL_EXTENDED_SECONDS : REFRESH_TTL_BASE_SECONDS;
            ```
            Backward compat: grep for `REFRESH_TTL_SECONDS` (the old name); if anything imports
            it, add `export const REFRESH_TTL_SECONDS = REFRESH_TTL_BASE_SECONDS;` for
            transition. Confirm Number(undefined) is NaN — the `|| default` falls through, so
            this is safe.
         └─ Files: [hussle-app-dispatch-api/src/auth/constants/index.ts]
         └─ Depends on: —
         └─ Output:

[x] T-02 [TYPES] Add rememberMe to SessionData + CreateSessionInput
         └─ Detail: In `hussle-app-dispatch-api/src/auth/types/tokenProvider.ts`, add
            `rememberMe: boolean` to both interfaces. Comment: "Pre-deploy sessions written
            without this field read as undefined → falsy → 7d TTL on next rotation. Graceful
            downgrade is intentional."
         └─ Files: [hussle-app-dispatch-api/src/auth/types/tokenProvider.ts]
         └─ Depends on: —
         └─ Output:

[x] T-03 [INFRA] Extend setRefreshTokenCookie with optional maxAge override
         └─ Detail: In `hussle-app-dispatch-api/src/shared/utils/cookieUtils.ts`, change
            `setRefreshTokenCookie(res, refreshToken)` to
            `setRefreshTokenCookie(res, refreshToken, maxAgeMs?: number)`. Default to
            `REFRESH_TTL_BASE_SECONDS * 1000`. Import the constant from `auth/constants`. The
            hard-coded 30-day value at line 53 goes away.
         └─ Files: [hussle-app-dispatch-api/src/shared/utils/cookieUtils.ts]
         └─ Depends on: T-01
         └─ Output:

[x] T-04 [VALIDATOR] Accept optional rememberMe in signin schema
         └─ Detail: In `hussle-app-dispatch-api/src/auth/validators/signinValidator.ts`, add
            `rememberMe: Yup.boolean().optional().default(false)` to the body schema. Ensure
            stripUnknown does not remove it.
         └─ Files: [hussle-app-dispatch-api/src/auth/validators/signinValidator.ts]
         └─ Depends on: —
         └─ Output:

[x] T-05 [WIRE] Thread rememberMe through mapLoginRequest → service → createSession
         └─ Detail:
            (a) `controllers/auth/mappers/mapLoginRequest.ts`: surface rememberMe (default false).
            (b) `services/auth/authenticateUserService.ts`: accept rememberMe, pass to
                `tokenProvider.createSession` (inspect existing signature first to confirm).
            (c) `providers/jwtTokenProvider/createSessionRedis.ts`:
                  - Destructure rememberMe (default false).
                  - Replace all uses of `REFRESH_TTL_SECONDS` with `getRefreshTtlSeconds(rememberMe)`
                    in the four Redis EX writes (lines 103–106 today).
                  - Persist rememberMe on the SessionData JSON.
         └─ Files: [
              hussle-app-dispatch-api/src/auth/controllers/auth/mappers/mapLoginRequest.ts,
              hussle-app-dispatch-api/src/auth/services/auth/authenticateUserService.ts,
              hussle-app-dispatch-api/src/auth/providers/jwtTokenProvider/createSessionRedis.ts
            ]
         └─ Depends on: T-01, T-02
         └─ Output:

[x] T-06 [INFRA] Add extractAccessTokenExpAsIso helper
         └─ Detail: In `auth/providers/jwtTokenProvider/tokenHelpers.ts`, add
            `extractAccessTokenExpAsIso(jwt: string): string`. Decode (don't verify — auth
            middleware verified upstream). Returns
            `new Date(payload.exp * 1000).toISOString()`. Throw a typed error if exp is missing.
         └─ Files: [hussle-app-dispatch-api/src/auth/providers/jwtTokenProvider/tokenHelpers.ts]
         └─ Depends on: —
         └─ Output:

[x] T-07 [API] Read-through grace + TTL preservation in rotateSessionRedis
         └─ Detail: In `providers/jwtTokenProvider/rotateSessionRedis.ts`:
            (a) After reading `redisClient.get(refreshTokenKey)`, attempt JSON.parse. If the
                value is `{ kind: 'grace', newSessionKey, newRefreshToken }`, this is a
                grace-window hit:
                  - Read the new session blob from `newSessionKey` (sanity check).
                  - Generate a fresh access token for the new session (use existing
                    `generateAccessToken` helper).
                  - Return `{ accessToken, refreshToken: newRefreshToken }` — NO second rotation.
            (b) If the value is the legacy string `session:refresh:<id>` pointer, proceed
                with the existing rotation logic — EXCEPT:
                  - Read `session.rememberMe` (default false for pre-deploy sessions).
                  - Use `getRefreshTtlSeconds(session.rememberMe)` for all new EX values.
                  - REPLACE the destructive `redisClient.del(refreshTokenKey)` at line 75 with:
                    `redisClient.set(refreshTokenKey, JSON.stringify({
                       kind: 'grace', newSessionKey, newRefreshToken
                     }), 'EX', ROTATION_GRACE_TTL_SECONDS)`.
                  - KEEP the `del(sessionKey)` and `del('session:index:'+oldSessionId)` calls.
                  - Persist rememberMe on the new session JSON.
         └─ Files: [hussle-app-dispatch-api/src/auth/providers/jwtTokenProvider/rotateSessionRedis.ts]
         └─ Depends on: T-01, T-02
         └─ Output:

[x] T-08 [API] loginController: rememberMe-aware cookie + accessTokenExpiresAt
         └─ Detail: In `controllers/auth/loginController.ts`:
            (a) After T-05, `loginInput.rememberMe` is available. Compute
                `maxAgeMs = getRefreshTtlSeconds(rememberMe) * 1000`.
            (b) Pass `maxAgeMs` to `setRefreshTokenCookie(res, token.refreshToken, maxAgeMs)`
                at line 61 (and the alternate authenticated branch ~line 71 if it also calls
                this — verify during read).
            (c) Call `extractAccessTokenExpAsIso(token.accessToken)` and include
                `accessTokenExpiresAt` in the JSON response body for BOTH the
                AuthenticatedResponse with refresh token (line 78) and the alternate without
                refresh token (line 88).
         └─ Files: [hussle-app-dispatch-api/src/auth/controllers/auth/loginController.ts]
         └─ Depends on: T-03, T-05, T-06
         └─ Output:

[x] T-09 [API] refreshTokenController: rememberMe-aware cookie + accessTokenExpiresAt
         └─ Detail: In `controllers/auth/refreshTokenController.ts`:
            (a) After `refreshUserTokenService` returns the new tokens, look up the new
                session blob in Redis (via tokenProvider or directly using the sessionId from
                the new JWT) to retrieve `rememberMe`.
            (b) Compute `maxAgeMs = getRefreshTtlSeconds(rememberMe) * 1000`.
            (c) Call `setRefreshTokenCookie(res, newRefreshToken, maxAgeMs)`.
            (d) Call `extractAccessTokenExpAsIso(accessToken)` and add the result to the
                response body.
            (e) Update `controllers/auth/transformers/refreshTokenTransformer.ts` —
                `RefreshTokenSuccessResponse` adds `accessTokenExpiresAt: string`.
         └─ Files: [
              hussle-app-dispatch-api/src/auth/controllers/auth/refreshTokenController.ts,
              hussle-app-dispatch-api/src/auth/controllers/auth/transformers/refreshTokenTransformer.ts
            ]
         └─ Depends on: T-01, T-03, T-06, T-07
         └─ Output:

[x] T-10 [API] /auth/me returns accessTokenExpiresAt (decoded from request JWT)
         └─ Detail: In `controllers/auth/getCurrentUserController.ts`, read the access-token
            JWT from `req.cookies.accessToken` (already validated by appAuth middleware) and
            decode via `extractAccessTokenExpAsIso`. Add `accessTokenExpiresAt` to the
            `CurrentUserResponse` shape in `transformers/currentUserTransformer.ts`. The
            transformer accepts the new field; the controller passes it in. /auth/me does
            NOT mint a new token.
         └─ Files: [
              hussle-app-dispatch-api/src/auth/controllers/auth/getCurrentUserController.ts,
              hussle-app-dispatch-api/src/auth/controllers/auth/transformers/currentUserTransformer.ts
            ]
         └─ Depends on: T-06
         └─ Output:

[x] T-11 [API] AuthenticatedResponse on signup-org / accept-invite / switch-org / password-challenge
         └─ Detail: For each of the four controllers below, call
            `extractAccessTokenExpAsIso(accessToken)` after receiving tokens and add
            `accessTokenExpiresAt` to the JSON response. ALSO: pass `maxAgeMs = base TTL * 1000`
            (rememberMe defaults to false for these flows per plan decision) as the third arg
            to `setRefreshTokenCookie`. Don't bother threading rememberMe — these flows always
            issue base-TTL sessions.
         └─ Files: [
              hussle-app-dispatch-api/src/auth/controllers/auth/signupOrgController.ts,
              hussle-app-dispatch-api/src/auth/controllers/invite/acceptInviteController.ts,
              hussle-app-dispatch-api/src/auth/controllers/auth/switchOrgController.ts,
              hussle-app-dispatch-api/src/auth/controllers/auth/passwordChallengeController.ts
            ]
         └─ Depends on: T-03, T-06
         └─ Output:

[x] T-12 [TEST] createSessionRedis + rotateSessionRedis + refreshController unit tests
         └─ Detail: Mock ioredis. Cover:
            - createSessionRedis: rememberMe=false → all four SET EX = base; rememberMe=true →
              all four = extended. SessionData JSON includes rememberMe.
            - rotateSessionRedis: legacy pointer lookup → rotation happens, refresh:OLD is
              rewritten as grace packet (verify the SET call), TTL respects session.rememberMe.
            - rotateSessionRedis: grace-packet lookup → no DEL or SET of session keys; only
              a fresh access token is generated, same newRefreshToken returned.
            - refreshTokenController: response body contains accessTokenExpiresAt matching
              the issued JWT's exp claim.
         └─ Files: [
              hussle-app-dispatch-api/src/auth/providers/jwtTokenProvider/__tests__/createSessionRedis.test.ts,
              hussle-app-dispatch-api/src/auth/providers/jwtTokenProvider/__tests__/rotateSessionRedis.test.ts,
              hussle-app-dispatch-api/src/auth/controllers/auth/__tests__/refreshTokenController.test.ts
            ]
         └─ Depends on: T-05, T-07, T-09
         └─ Output:

[x] T-13 [DOCS] Document fast-mode env vars in .env.example or README
         └─ Detail: Add an "Auth fast mode (local + E2E testing)" section to either
            `hussle-app-dispatch-api/.env.example` (if it exists) or a new
            `hussle-app-dispatch-api/docs/auth-fast-mode.md`:
            ```
            # Auth fast mode — overrides timing constants for end-to-end testing
            # Defaults are production values; set these to short values to exercise
            # the full token lifecycle in seconds.
            JWT_EXPIRES_IN=10s
            REFRESH_TTL_BASE_SECONDS=60
            REFRESH_TTL_EXTENDED_SECONDS=180
            ROTATION_GRACE_TTL_SECONDS=5
            ```
         └─ Files: [hussle-app-dispatch-api/docs/auth-fast-mode.md]
         └─ Depends on: T-01
         └─ Output:

---

## US-02: Frontend refreshScheduler — env-configurable lead time, timer + visibility-aware refresh
_Priority: P0 | Services: hussle-app-dispatch-ui | Agent: frontend | Status: todo_

**Plain English:** New singleton owning the proactive refresh lifecycle. Schedules `setTimeout` to fire ~5 minutes before access-token expiry (configurable via `VITE_PROACTIVE_REFRESH_LEAD_MS` for fast mode), and listens for `visibilitychange` / `focus` for mobile backgrounding.

must_haves:
  truths:
    - "PROACTIVE_REFRESH_LEAD_MS reads from import.meta.env.VITE_PROACTIVE_REFRESH_LEAD_MS with production default 5*60*1000."
    - "After schedule(accessTokenExpiresAt, refreshFn), setTimeout fires (expiry - now - lead) ms later and invokes refreshFn."
    - "Calling schedule again cancels prior timer and registers new one."
    - "visibilitychange to 'visible' AND time-to-expiry < lead → refreshFn fires immediately."
    - "cancel() removes both timer and visibility listener."
  artifacts:
    - path: hussle-app-dispatch-ui/src/features/auth/refreshScheduler.ts
      provides: "schedule(expiresAt, refreshFn) / cancel() singleton"
    - path: hussle-app-dispatch-ui/src/features/auth/refreshConstants.ts
      provides: "PROACTIVE_REFRESH_LEAD_MS + TRANSIENT_RETRY_BACKOFF_MS, both env-overridable"
    - path: hussle-app-dispatch-ui/src/features/auth/__tests__/refreshScheduler.test.ts
      provides: "Unit tests with fake timers + simulated visibility events"
  key_links:
    - from: refreshScheduler.schedule
      to: refreshFn callback
      via: "Invoked when timer fires OR visibilitychange + near-expiry"

**Acceptance Criteria:**
- [ ] PROACTIVE_REFRESH_LEAD_MS configurable via Vite env.
- [ ] schedule() registers a setTimeout based on accessTokenExpiresAt.
- [ ] visibilitychange to 'visible' within lead window triggers refreshFn.
- [ ] cancel() cleans up both timer and listener.

**Tasks:**
[ ] T-14 [UI] refreshConstants module with env overrides
         └─ Detail: New file `features/auth/refreshConstants.ts`:
            ```
            export const PROACTIVE_REFRESH_LEAD_MS =
              Number(import.meta.env.VITE_PROACTIVE_REFRESH_LEAD_MS) || 5 * 60 * 1000;
            export const TRANSIENT_RETRY_BACKOFF_MS: readonly number[] =
              (import.meta.env.VITE_TRANSIENT_RETRY_BACKOFF_MS ?? '500,1500,4000')
                .split(',').map(Number);
            ```
            Document in a comment that Vite reads env at BUILD time, not runtime — so changing
            these for tests requires restarting `vite dev`. Playwright config will pass these
            envs to webServer.
         └─ Files: [hussle-app-dispatch-ui/src/features/auth/refreshConstants.ts]
         └─ Depends on: —
         └─ Output:

[ ] T-15 [UI] refreshScheduler singleton
         └─ Detail: `features/auth/refreshScheduler.ts`. Module-level state:
            ```
            let timeoutHandle: ReturnType<typeof setTimeout> | null = null;
            let visibilityListener: (() => void) | null = null;
            let nextExpiresAt: Date | null = null;
            let activeRefreshFn: (() => Promise<void>) | null = null;
            ```
            Exports:
              - schedule(expiresAt: string, refreshFn: () => Promise<void>): void
                  • Clear existing timer + listener via cancel().
                  • Compute delayMs = max(0, expiresAtTime - now - PROACTIVE_REFRESH_LEAD_MS).
                  • setTimeout(refreshFn, delayMs) → store handle.
                  • Install visibilitychange listener: if document.visibilityState === 'visible'
                    AND timeToExpiry < PROACTIVE_REFRESH_LEAD_MS → call refreshFn().
                  • Store nextExpiresAt + activeRefreshFn.
              - cancel(): void — clearTimeout, document.removeEventListener, null state.
              - __test_getState() — internal hook for tests (NODE_ENV !== 'production' gate is
                fine here per the testing-conventions skill since this is test-only access,
                not production behavior).
            Must NOT import utils/axios.ts (avoid circular dep). Caller provides refreshFn.
         └─ Files: [hussle-app-dispatch-ui/src/features/auth/refreshScheduler.ts]
         └─ Depends on: T-14
         └─ Output:

[ ] T-16 [TEST] refreshScheduler unit tests
         └─ Detail: `features/auth/__tests__/refreshScheduler.test.ts`. Jest fake timers.
            Cases:
              (a) schedule(1h-future, fn) → fn not called; advance time → fn called once.
              (b) schedule called twice → first timer is canceled.
              (c) document.visibilityState='visible' + visibilitychange event when near-expiry
                  → fn fires immediately.
              (d) cancel() → timer cleared, listener removed.
         └─ Files: [hussle-app-dispatch-ui/src/features/auth/__tests__/refreshScheduler.test.ts]
         └─ Depends on: T-15
         └─ Output:

---

## US-03: Redux actions + sagas — sessionExpired, schedule on init/login
_Priority: P0 | Services: hussle-app-dispatch-ui | Agent: frontend | Status: todo_

**Plain English:** Redux machinery for the new auth-failure routing. Add `sessionExpired({ context })`, a saga that handles routing for `main` context (and lets the portal context drive UI separately), and wire init/login success to call `refreshScheduler.schedule`.

must_haves:
  truths:
    - "Dispatching sessionExpired({ context: 'main' }) → sessionExpiredSaga calls navigate('/login') OR logs warning if getNavigate throws."
    - "Dispatching sessionExpired({ context: 'portal' }) → state.auth.portalSessionExpired = true; no navigation."
    - "initSaga and loginSaga call refreshScheduler.schedule with accessTokenExpiresAt from response (when present)."
  artifacts:
    - path: hussle-app-dispatch-ui/src/features/auth/store/authSlice.ts
      provides: "sessionExpired action + portalSessionExpired state field"
    - path: hussle-app-dispatch-ui/src/features/auth/store/sagas/sessionExpiredSaga.ts
      provides: "Routing saga for main vs portal context"
    - path: hussle-app-dispatch-ui/src/features/auth/store/sagas/initSaga.ts
      provides: "Reads accessTokenExpiresAt and schedules refresh"
    - path: hussle-app-dispatch-ui/src/features/auth/store/sagas/loginSaga.ts
      provides: "Same scheduling hook on login success"
    - path: hussle-app-dispatch-ui/src/features/auth/refreshFn.ts
      provides: "Shared refreshFn used by both sagas + scheduler"
  key_links:
    - from: sessionExpiredSaga (main)
      to: getNavigate
      via: "Calls navigate('/login') inside try; on throw logs warning; AuthGuard rescues via Redux state"
    - from: initSaga / loginSaga
      to: refreshScheduler.schedule
      via: "Passes accessTokenExpiresAt + a refreshFn that POSTs /auth/token/refresh via axiosInstance"

**Acceptance Criteria:**
- [ ] sessionExpired({context:'main'}) → /login redirect via saga OR AuthGuard.
- [ ] sessionExpired({context:'portal'}) → flag set; no /login redirect.
- [ ] init + login schedule refresh on success.

**Tasks:**
[ ] T-17 [UI] Add sessionExpired action + portalSessionExpired state
         └─ Detail: In `features/auth/store/authSlice.ts`, add new action and reducer.
            Behavior matches plan: 'main' clears isLoggedIn like logoutSuccess; 'portal' sets
            `portalSessionExpired: true` without touching isLoggedIn. Add field to
            defaultAuthState. Add SessionExpiredContext enum to `features/auth/types.ts`
            (mirror `.planning/auth-login-fix/types.ts`).
         └─ Files: [
              hussle-app-dispatch-ui/src/features/auth/store/authSlice.ts,
              hussle-app-dispatch-ui/src/features/auth/types.ts
            ]
         └─ Depends on: —
         └─ Output:

[ ] T-18 [UI] sessionExpiredSaga + watcher registration
         └─ Detail: `features/auth/store/sagas/sessionExpiredSaga.ts`:
            - context='portal' → return (reducer already set the flag).
            - context='main' → put(resetPopups), call(closeSnackbar), try getNavigate +
              navigate('/login'). On catch → console.warn("sessionExpiredSaga: navigate
              unavailable; relying on AuthGuard", err).
            Register watcher: `takeLatest(sessionExpired.type, sessionExpiredSaga)`.
         └─ Files: [
              hussle-app-dispatch-ui/src/features/auth/store/sagas/sessionExpiredSaga.ts,
              hussle-app-dispatch-ui/src/features/auth/store/index.ts,
              hussle-app-dispatch-ui/src/features/auth/store/sagas/index.ts
            ]
         └─ Depends on: T-17
         └─ Output:

[ ] T-19 [UI] Shared refreshFn + scheduler hooks in init/loginSaga
         └─ Detail:
            (a) Create `features/auth/refreshFn.ts` — exports `createRefreshFn(axiosInstance)`
                returning a function that POSTs /auth/token/refresh and lets the interceptor
                handle rescheduling (the interceptor itself will call schedule on success
                per US-04; refreshFn just initiates the request).
            (b) In `initSaga.ts`, after initSuccess, read accessTokenExpiresAt from
                userResponse.data and call refreshScheduler.schedule (guard: skip if absent).
            (c) In `loginSaga.ts`, after the authenticated branch, same hook.
         └─ Files: [
              hussle-app-dispatch-ui/src/features/auth/refreshFn.ts,
              hussle-app-dispatch-ui/src/features/auth/store/sagas/initSaga.ts,
              hussle-app-dispatch-ui/src/features/auth/store/sagas/loginSaga.ts
            ]
         └─ Depends on: T-15
         └─ Output:

[ ] T-20 [TEST] Saga unit tests
         └─ Detail: redux-saga-test-plan based.
            - sessionExpiredSaga main → call(getNavigate) + call(navigate, '/login').
            - sessionExpiredSaga main with getNavigate throwing → no navigate call; warn logged.
            - sessionExpiredSaga portal → returns early; no nav.
            - initSaga calls refreshScheduler.schedule when expiresAt present; not when absent.
         └─ Files: [
              hussle-app-dispatch-ui/src/features/auth/store/sagas/__tests__/sessionExpiredSaga.test.ts,
              hussle-app-dispatch-ui/src/features/auth/store/sagas/__tests__/initSaga.test.ts
            ]
         └─ Depends on: T-18, T-19
         └─ Output:

---

## US-04: Axios interceptor overhaul — exponential retry, dispatch sessionExpired, scheduler hook
_Priority: P0 | Services: hussle-app-dispatch-ui | Agent: frontend | Status: todo_

**Plain English:** Replace `handleAuthFailure` with: classify error → retry transient with exponential backoff and "Reconnecting…" toast → dispatch `sessionExpired({ context })` instead of imperative nav → reschedule from successful refresh response → no bare `catch {}`.

must_haves:
  truths:
    - "Network error on refresh → up to 3 retries with backoff from TRANSIENT_RETRY_BACKOFF_MS; toast shown then dismissed on success."
    - "HTTP 401 on refresh → sessionExpired dispatched immediately, no retry."
    - "HTTP 5xx on refresh → treated as transient, retried."
    - "Successful refresh response → refreshScheduler.schedule(response.data.accessTokenExpiresAt, ...)."
    - "Refresh URL context classification: /carrier-portal or /driver-portal prefix → 'portal'; else 'main'. Actually: classify the ORIGINAL failing request's URL, not the refresh URL."
    - "Bare `catch {}` at axios.ts:66-68 is gone; any caught error in auth path is logged."
  artifacts:
    - path: hussle-app-dispatch-ui/src/utils/axios.ts
      provides: "Rewritten interceptor"
    - path: hussle-app-dispatch-ui/src/utils/__tests__/axios.test.ts
      provides: "MSW-based tests for retry + dispatch + scheduler hook"
  key_links:
    - from: axios interceptor (refresh success)
      to: refreshScheduler.schedule
      via: "Parses response.data.accessTokenExpiresAt"
    - from: axios interceptor (refresh terminal failure)
      to: sessionExpired Redux action
      via: "Context derived from originalRequest.url"

**Acceptance Criteria:**
- [ ] Network error → 3-attempt exponential backoff with toast.
- [ ] HTTP 401 → sessionExpired immediate, no retry.
- [ ] Bare `catch {}` removed.
- [ ] Successful refresh → scheduler.schedule called.

**Tasks:**
[ ] T-21 [UI] Rewrite axios response interceptor
         └─ Detail: Substantial rewrite of `utils/axios.ts` per plan capabilities. Key changes:
            (a) Remove `handleAuthFailure`'s navigate call + bare catch.
            (b) New `classifyContext(url)`: returns 'portal' if url contains /carrier-portal or
                /driver-portal, else 'main'.
            (c) New `dispatchSessionExpired(originalRequestUrl)`: removes rememberMe from
                localStorage, dispatches `sessionExpired({ context })` via store.dispatch.
                Surround in try/catch with console.error (no silent swallow).
            (d) Replace single refresh POST with `tryRefreshWithRetry()` that:
                  - Shows 'Reconnecting…' toast on first attempt.
                  - Loops over TRANSIENT_RETRY_BACKOFF_MS attempts.
                  - On 401 response → throw immediately (no retry).
                  - On network error or 5xx → wait per backoff schedule, retry.
                  - On success → dismiss toast, parse response.data.accessTokenExpiresAt,
                    call refreshScheduler.schedule(...).
                  - On exhaustion → throw last error.
            (e) Reshape the 401 path: if isRefreshing → queue (existing behavior); else
                try tryRefreshWithRetry, on success retry original request, on terminal
                failure call dispatchSessionExpired(originalRequest.url).
            (f) Keep CSRF request interceptor, AUTH_BYPASS_PATHS, loggingOut flag unchanged.
            Import refreshScheduler from features/auth/refreshScheduler. Import sessionExpired
            from features/auth/store/authSlice.
         └─ Files: [hussle-app-dispatch-ui/src/utils/axios.ts]
         └─ Depends on: T-15, T-17
         └─ Output:

[ ] T-22 [TEST] axios interceptor tests with MSW
         └─ Detail: `utils/__tests__/axios.test.ts`. Stub /auth/token/refresh with MSW:
            - 200 with accessTokenExpiresAt → scheduler.schedule called.
            - 401 → sessionExpired dispatched, NO retry (verify only 1 refresh request fired).
            - Network error then 200 → exactly 1 retry, original succeeds.
            - 3 network errors then network error → sessionExpired dispatched after retries.
            - 5xx → treated as transient.
            - Context classification: /carrier-portal/loads call → portal; /loads call → main.
         └─ Files: [hussle-app-dispatch-ui/src/utils/__tests__/axios.test.ts]
         └─ Depends on: T-21
         └─ Output:

---

## US-05: PortalSessionGuard + portal session-expired screen + route wiring
_Priority: P0 | Services: hussle-app-dispatch-ui | Agent: frontend | Status: todo_

**Plain English:** Portal subtree (carrier-portal + driver-portal) wrapped in a guard that reads `portalSessionExpired` and renders a portal-appropriate "session expired" screen instead of the route content. No /login redirect for portal users.

must_haves:
  truths:
    - "When state.auth.portalSessionExpired flips to true, PortalSessionGuard renders SessionExpiredPortalScreen instead of <Outlet />."
    - "Effect is observable from BOTH /carrier-portal/* and /driver-portal/* URLs."
    - "Screen offers portal-appropriate CTA (not a /login link)."
  artifacts:
    - path: hussle-app-dispatch-ui/src/features/auth/components/PortalSessionGuard.tsx
      provides: "Guard component"
    - path: hussle-app-dispatch-ui/src/features/auth/components/SessionExpiredPortalScreen.tsx
      provides: "Portal session-expired UI"
    - path: hussle-app-dispatch-ui/src/routes/index.tsx
      provides: "PortalShell wraps <Outlet /> in PortalSessionGuard"
  key_links:
    - from: PortalSessionGuard
      to: state.auth.portalSessionExpired
      via: "useSelector reads slice flag"
    - from: PortalShell
      to: PortalSessionGuard
      via: "Wraps route subtree's <Outlet />"

**Acceptance Criteria:**
- [ ] Portal context sessionExpired renders the expired-screen, NOT /login.

**Tasks:**
[ ] T-23 [UI] PortalSessionGuard
         └─ Detail: `features/auth/components/PortalSessionGuard.tsx`:
            ```
            export const PortalSessionGuard: React.FC<{ children: ReactNode }> = ({ children }) => {
              const expired = useSelector(portalSessionExpiredSelector);
              if (expired) return <SessionExpiredPortalScreen />;
              return <>{children}</>;
            };
            ```
            Add `portalSessionExpiredSelector` in `features/auth/store/selectors/portalSelectors.ts`.
         └─ Files: [
              hussle-app-dispatch-ui/src/features/auth/components/PortalSessionGuard.tsx,
              hussle-app-dispatch-ui/src/features/auth/store/selectors/portalSelectors.ts
            ]
         └─ Depends on: T-17
         └─ Output:

[ ] T-24 [UI] SessionExpiredPortalScreen
         └─ Detail: `features/auth/components/SessionExpiredPortalScreen.tsx`. Centered MUI Card,
            heading "Your session has expired", body explaining magic-link sessions are time-limited,
            primary CTA "Request a new link" (placeholder href + comment for follow-up). Use
            mocho/ui components per CLAUDE.md component selection rules. data-testid="portal-session-expired"
            for Playwright assertions.
         └─ Files: [hussle-app-dispatch-ui/src/features/auth/components/SessionExpiredPortalScreen.tsx]
         └─ Depends on: —
         └─ Output:

[ ] T-25 [UI] Wrap PortalShell with PortalSessionGuard
         └─ Detail: In `src/routes/index.tsx`, change the PortalShell's `<Outlet />` to
            `<PortalSessionGuard><Outlet /></PortalSessionGuard>`. Import the guard. Verify
            main App route subtree is unaffected.
         └─ Files: [hussle-app-dispatch-ui/src/routes/index.tsx]
         └─ Depends on: T-23
         └─ Output:

[ ] T-26 [TEST] PortalSessionGuard render test
         └─ Detail: RTL test — portalSessionExpired=false renders children; =true renders
            SessionExpiredPortalScreen regardless of route.
         └─ Files: [hussle-app-dispatch-ui/src/features/auth/components/__tests__/PortalSessionGuard.test.tsx]
         └─ Depends on: T-23, T-24
         └─ Output:

---

## INT-01: Wire dispatch-api ↔ dispatch-ui auth integration
_Auto-generated | Services: hussle-app-dispatch-api, hussle-app-dispatch-ui | Agent: review_

**Verification Checklist:**
- [ ] All 7 auth responses include accessTokenExpiresAt as ISO 8601; frontend parses correctly.
- [ ] LoginRequest.rememberMe round-trips: form → axios body → validator → mapper → service → createSessionRedis → SessionData blob.
- [ ] Cookie maxAge on refreshToken matches Redis TTL for both rememberMe states.
- [ ] Read-through grace: two refresh calls within ROTATION_GRACE_TTL_SECONDS converge.
- [ ] Axios context classification matches portal URL prefixes.
- [ ] sessionExpiredSaga handles both contexts; getNavigate-throw fallback works.
- [ ] CSRF behavior unchanged (refresh exempt; others require X-CSRF-Token).
- [ ] No regressions on existing auth flows.

**Tasks:**
[ ] T-27 [WIRE] Verify backend ↔ frontend auth integration
         └─ Detail: Read contract.yaml + types.ts. Then read backend (7 controllers,
            transformers, createSessionRedis, rotateSessionRedis, cookieUtils, constants) and
            frontend (utils/axios.ts, refreshScheduler.ts, sessionExpiredSaga.ts, initSaga.ts,
            loginSaga.ts, authSlice.ts, PortalSessionGuard.tsx). Compare against contract.
            Report mismatches — do not fix.
         └─ Agent: review
         └─ Depends on: T-01 through T-26
         └─ Output:

---

## VER-01: End-to-end verification
_Auto-generated | Read-only | Agent: review_

**Tasks:**
[ ] T-28 [VERIFY] Trace all 8 contract data flows + check all ACs
         └─ Detail: For each x-data-flow in contract.yaml, trace each step in code with
            file:line refs. Confirm every truths/key_links across all stories is satisfied.
            Cross-check ACs from plan.md. Report PASS / FAIL / QUESTIONS.
         └─ Agent: review
         └─ Depends on: T-27
         └─ Output:

---

## E2E-01: Playwright end-to-end token-lifecycle tests with fast-mode TTLs
_Priority: P0 | Services: hussle-app-dispatch-api, hussle-app-dispatch-ui | Agent: frontend | Status: todo_

**Plain English:** Real Playwright tests exercising the full auth token lifecycle using fast-mode env overrides (JWT 10s, refresh base 60s, extended 180s, grace 5s, proactive lead 3s). Each test runs in seconds, exercises real Redis + real API + real browser. Covers all the edge cases from the plan's user flows.

must_haves:
  truths:
    - "Playwright config spawns the API with JWT_EXPIRES_IN=10s, REFRESH_TTL_BASE_SECONDS=60, REFRESH_TTL_EXTENDED_SECONDS=180, ROTATION_GRACE_TTL_SECONDS=5 and the UI with VITE_PROACTIVE_REFRESH_LEAD_MS=3000."
    - "Every test in this story passes against the real stack (no mocks of API or Redis)."
    - "Test suite completes in under 5 minutes wall-clock."
  artifacts:
    - path: hussle-app-dispatch-ui/playwright.config.ts
      provides: "Updated config with auth-fast webServer block injecting fast-mode env vars"
    - path: hussle-app-dispatch-ui/e2e/auth/helpers.ts
      provides: "Reusable helpers — login(page, opts), expectSessionExpired(page), forceTokenExpiry(page), readRefreshCookie(page)"
    - path: hussle-app-dispatch-ui/e2e/auth/proactive-refresh.spec.ts
      provides: "Tests that proactive refresh fires near expiry and user never sees 401"
    - path: hussle-app-dispatch-ui/e2e/auth/multi-tab-race.spec.ts
      provides: "Read-through grace test with two browser contexts"
    - path: hussle-app-dispatch-ui/e2e/auth/refresh-failure-routing.spec.ts
      provides: "Failure 4 tests — main → /login, portal → SessionExpiredPortalScreen"
    - path: hussle-app-dispatch-ui/e2e/auth/transient-retry.spec.ts
      provides: "Network-error retry tests with route interception"
    - path: hussle-app-dispatch-ui/e2e/auth/remember-me.spec.ts
      provides: "Tests for base vs extended TTL behaviors"
  key_links:
    - from: Playwright webServer config
      to: API + UI processes
      via: "env section injects fast-mode vars at process start"
    - from: e2e tests
      to: real API + Redis
      via: "Tests hit running stack; no mocks beyond route interception for failure injection"

**Acceptance Criteria:**
- [ ] E2E-AC1: Fast-mode env config documented and wired into playwright.config.ts.
- [ ] E2E-AC2: Proactive refresh test — login, wait for timer fire (~7s), assert refresh POST occurred, page still works.
- [ ] E2E-AC3: Reactive refresh test — login, force access expiry (>10s wait), trigger an API call, assert refresh occurs, API call retried, succeeds.
- [ ] E2E-AC4: Multi-tab race — 2 contexts share cookies, both fire refresh near-simultaneously, both succeed, no logout.
- [ ] E2E-AC5: Refresh fails with 401 on main app → user lands on /login.
- [ ] E2E-AC6: Refresh fails with 401 on /carrier-portal/* → SessionExpiredPortalScreen rendered, URL NOT changed to /login.
- [ ] E2E-AC7: Network error on refresh (2 attempts) then success → Reconnecting toast shown then dismissed, user stays logged in.
- [ ] E2E-AC8: 3 consecutive network errors → sessionExpired dispatched, user routed appropriately.
- [ ] E2E-AC9: Login with rememberMe checked → wait past 60s (base TTL) → next request succeeds (still within 180s extended TTL).
- [ ] E2E-AC10: Login without rememberMe → wait past 60s → next request fails, user redirected to /login.
- [ ] E2E-AC11: Logout clears cookies; subsequent /auth/me returns 401.
- [ ] E2E-AC12: Visibility-change refresh — backgrounded tab near expiry, dispatch visibilitychange to visible → refresh fires before next API call.

**Tasks:**
[ ] T-29 [TEST] Wire fast-mode webServer config in playwright.config.ts
         └─ Detail: Extend `hussle-app-dispatch-ui/playwright.config.ts`. Add a webServer block
            (or modify existing) that spawns BOTH the API and UI with fast-mode envs:
            ```ts
            webServer: [
              {
                command: 'npm run dev --prefix ../hussle-app-dispatch-api',
                url: 'http://localhost:3001/healthz',
                env: {
                  JWT_EXPIRES_IN: '10s',
                  REFRESH_TTL_BASE_SECONDS: '60',
                  REFRESH_TTL_EXTENDED_SECONDS: '180',
                  ROTATION_GRACE_TTL_SECONDS: '5',
                  // Plus existing required envs (DATABASE_URL, REDIS_URL, JWT_SECRET, etc.)
                },
                reuseExistingServer: !process.env.CI,
                timeout: 60000,
              },
              {
                command: 'npm run dev',
                url: 'http://localhost:5173',
                env: {
                  VITE_API_URL: 'http://localhost:3001',
                  VITE_PROACTIVE_REFRESH_LEAD_MS: '3000',
                  VITE_TRANSIENT_RETRY_BACKOFF_MS: '300,800,2000',
                },
                reuseExistingServer: !process.env.CI,
                timeout: 60000,
              },
            ],
            ```
            Verify existing healthz endpoint or substitute the actual API readiness path.
         └─ Files: [hussle-app-dispatch-ui/playwright.config.ts]
         └─ Depends on: T-01, T-14
         └─ Output:

[ ] T-30 [TEST] e2e/auth/helpers.ts — shared helpers
         └─ Detail: New file `hussle-app-dispatch-ui/e2e/auth/helpers.ts`. Exports:
            - `login(page, { email, password, rememberMe?: boolean })` — fills the login form,
              waits for navigation to /dashboard (or returnTo).
            - `readRefreshCookieMaxAge(context)` — reads the refreshToken cookie from context
              and returns its expires field; used to assert TTL.
            - `forceAccessTokenExpiry(context)` — deletes the accessToken cookie from context.
              Use to simulate access expiry without waiting 10s.
            - `expectMainSessionExpired(page)` — waits for URL to match /login.
            - `expectPortalSessionExpired(page)` — waits for
              `[data-testid="portal-session-expired"]` to be visible.
            - `stubRefreshEndpoint(page, response)` — wraps page.route('**/auth/token/refresh')
              to inject a response (401, network failure, 500, etc.).
            Use existing test creds from .env.e2e or a fixture. If no test user exists yet,
            create one in a beforeAll fixture and clean up afterwards.
         └─ Files: [hussle-app-dispatch-ui/e2e/auth/helpers.ts]
         └─ Depends on: T-29
         └─ Output:

[ ] T-31 [TEST] proactive-refresh.spec.ts
         └─ Detail: Tests E2E-AC2 + E2E-AC3 + E2E-AC11 + E2E-AC12:
            (a) Login, wait 7s (JWT lead time: 10s - 3s = 7s), capture network requests via
                page.on('request'), assert POST /auth/token/refresh fired automatically.
            (b) Login, forceAccessTokenExpiry, navigate to a protected route, assert the
                interceptor performed refresh + retry; page loaded successfully.
            (c) Logout test: click logout, assert refreshToken/accessToken cookies cleared,
                /auth/me returns 401.
            (d) Visibility test: login, page.goto a protected route, wait 5s, dispatch
                visibilitychange via page.evaluate, capture network, assert refresh fired
                before next route navigation.
         └─ Files: [hussle-app-dispatch-ui/e2e/auth/proactive-refresh.spec.ts]
         └─ Depends on: T-30
         └─ Output:

[ ] T-32 [TEST] multi-tab-race.spec.ts
         └─ Detail: Tests E2E-AC4 (read-through grace). Create TWO browser contexts sharing
            storage state (cookies). Both navigate to a protected page. Use page.evaluate +
            Promise.all to fire two near-simultaneous POST /auth/token/refresh requests with
            the same starting refresh cookie. Assert both return 200; capture both response
            bodies and assert the issued refresh-token values are IDENTICAL (read-through
            grace). Assert neither tab is redirected to /login.
            Variant: wait > ROTATION_GRACE_TTL_SECONDS (~6s) between calls; third call returns 401.
         └─ Files: [hussle-app-dispatch-ui/e2e/auth/multi-tab-race.spec.ts]
         └─ Depends on: T-30
         └─ Output:

[ ] T-33 [TEST] refresh-failure-routing.spec.ts
         └─ Detail: Tests E2E-AC5 + E2E-AC6:
            (a) Login, navigate to /dashboard, stubRefreshEndpoint to return 401,
                forceAccessTokenExpiry, trigger an API call. Assert URL becomes /login.
            (b) Different test: navigate to a /carrier-portal/* route (use an invite-token
                fixture if needed, or temporarily set portalSessionExpired=false via a known
                test path), stub refresh to 401, trigger 401. Assert
                [data-testid="portal-session-expired"] visible; URL still on /carrier-portal/*.
         └─ Files: [hussle-app-dispatch-ui/e2e/auth/refresh-failure-routing.spec.ts]
         └─ Depends on: T-30
         └─ Output:

[ ] T-34 [TEST] transient-retry.spec.ts
         └─ Detail: Tests E2E-AC7 + E2E-AC8:
            (a) Login, forceAccessTokenExpiry, stub refresh to fail with network error TWICE
                then succeed. Trigger an API call. Assert "Reconnecting…" toast appeared then
                dismissed; user remains logged in; original API call succeeded.
            (b) Stub refresh to fail with network error 3+ times in a row. Trigger 401.
                Assert sessionExpired routing (URL /login if main).
         └─ Files: [hussle-app-dispatch-ui/e2e/auth/transient-retry.spec.ts]
         └─ Depends on: T-30
         └─ Output:

[ ] T-35 [TEST] remember-me.spec.ts
         └─ Detail: Tests E2E-AC9 + E2E-AC10:
            (a) Login with rememberMe CHECKED. Read refreshToken cookie via
                context.cookies(); assert expires - now ≈ 180s (within 5s tolerance).
                Wait 65s (past base TTL but within extended). Navigate to a protected route.
                Assert load succeeded — proves Redis still has the session under extended TTL.
            (b) Login with rememberMe UNCHECKED. Read cookie; assert expires ≈ 60s.
                Wait 65s. Navigate. Assert redirect to /login (cookie + Redis both expired).
            Note: these are the longest tests (~70s each). Mark them with @slow tag.
         └─ Files: [hussle-app-dispatch-ui/e2e/auth/remember-me.spec.ts]
         └─ Depends on: T-30
         └─ Output:

[ ] T-36 [TEST] Run full E2E suite; capture pass/fail report
         └─ Detail: `npm run test:e2e --prefix hussle-app-dispatch-ui` (or whatever command
            the project uses — verify via package.json). Output to
            /tmp/build-e2e-{timestamp}.log. Report counts per spec file. Total suite
            should run under 5 minutes.
         └─ Files: []
         └─ Depends on: T-31, T-32, T-33, T-34, T-35
         └─ Output:

---

## Summary
| Story | Tasks | Done | Blocked | AC Met |
|-------|-------|------|---------|--------|
| US-01 | 13    | 0    | 0       | 0/7    |
| US-02 | 3     | 0    | 0       | 0/4    |
| US-03 | 4     | 0    | 0       | 0/3    |
| US-04 | 2     | 0    | 0       | 0/4    |
| US-05 | 4     | 0    | 0       | 0/1    |
| INT-01 | 1    | 0    | 0       | —      |
| VER-01 | 1    | 0    | 0       | —      |
| E2E-01 | 8    | 0    | 0       | 0/12   |
| **All** | **36** | **0** | **0** | **0/31** |
