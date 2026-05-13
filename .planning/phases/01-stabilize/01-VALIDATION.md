---
phase: 1
slug: stabilize
status: draft
nyquist_compliant: false
wave_0_complete: true
created: 2026-05-13
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Derived from `01-RESEARCH.md` § Validation Architecture.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework (unit/component)** | Jest 30.x + React Testing Library 16.x + `jest-environment-jsdom` |
| **Framework (saga)** | `redux-saga-test-plan` 4.x |
| **Framework (e2e)** | Playwright 1.59.x |
| **Config file** | `hussle-app-dispatch-ui/jest.config.*` (existing) · `hussle-app-dispatch-ui/playwright.config.ts` (existing) |
| **Quick run command** | `cd hussle-app-dispatch-ui && npm test -- --testPathPattern=carrier-portal` |
| **Full suite command** | `cd hussle-app-dispatch-ui && npm run validate && npm run test:e2e` |
| **Estimated runtime** | ~30s quick · ~3min full · ~2min e2e |

---

## Sampling Rate

- **After every task commit:** Run the quick command (`npm test -- --testPathPattern=carrier-portal`)
- **After every plan wave:** Run `npm run validate` (lint + lint:deps + check-ts + test)
- **Before `/gsd-verify-work`:** Full suite + e2e must be green
- **Max feedback latency:** 30 seconds for the quick command

---

## Per-Task Verification Map

> Task IDs filled in by the planner. Requirements map to `STAB-01..STAB-15`.

| Req ID | Behavior | Test Type | Automated Command | File Exists | Status |
|--------|----------|-----------|-------------------|-------------|--------|
| STAB-01 | Save & Continue dispatches phase-save saga; advance on save-success | saga unit + component | `npm test -- savePhaseDataSaga.test.ts` · `npm test -- CarrierPortalPage.test.tsx` | ❌ W0 | ⬜ pending |
| STAB-02 | Validation errors fire notistack + scroll to first error field | component | `npm test -- CarrierPortalPage.test.tsx` (assert `enqueueSnackbar` + `scrollIntoView`) | ❌ W0 | ⬜ pending |
| STAB-03 | Final phase dispatches `completeOnboarding`, not `sessionCompleted` | saga unit + component | `npm test -- CarrierPortalPage.test.tsx` | ❌ W0 | ⬜ pending |
| STAB-04 | `PHASE_LABELS` / `TOTAL_PHASES` consumed from `features/carrier-portal/constants.ts` only | compile | `npm run check-ts` | ✅ existing | ⬜ pending |
| STAB-05 | `setCurrentPhase` no longer silently guards on `state.session` | reducer unit | `npm test -- carrierPortalSlice.test.ts` | ❌ W0 | ⬜ pending |
| STAB-06 | `costAnalysisQuestions` exports questions with presets | shape | `npm test -- costAnalysisQuestions.test.ts` | ❌ W0 | ⬜ pending |
| STAB-07 | `PresetTileSelector` renders chips, click selects, "custom" reveals input | component | `npm test -- PresetTileSelector.test.tsx` | ❌ W0 | ⬜ pending |
| STAB-08 | `CostResultCard` renders break-even + minimum rate; respects `prefers-reduced-motion` | component | `npm test -- CostResultCard.test.tsx` | ❌ W0 | ⬜ pending |
| STAB-09 | `lanePreferencesQuestions` exports ≥1 `stateGrid` question | shape | `npm test -- lanePreferencesQuestions.test.ts` (optional) | ❌ | ⬜ pending |
| STAB-10 | `StateGrid` cycles state on click; aria attrs present | component | `npm test -- StateGrid.test.tsx` | ❌ W0 | ⬜ pending |
| STAB-11 | `SubQuestion` renders with 16/600 typography, correct border color | component | `npm test -- SubQuestion.test.tsx` | ❌ W0 | ⬜ pending |
| STAB-12 | `InputRenderer` routes `presetTiles → PresetTileSelector` and `stateGrid → StateGrid` | component | `npm test -- InputRenderer.test.tsx` | ❌ W0 | ⬜ pending |
| STAB-13 | `TOTAL_PHASES === 6` | compile | `npm run check-ts` | ✅ existing | ⬜ pending |
| STAB-14 | Full 6-phase flow `invite → portal → all 6 phases → submit → completion` | Playwright e2e | `npm run test:e2e -- carrier-portal-full.spec.ts` | ❌ W0 | ⬜ pending |
| STAB-15 | Manual smoke checklist filled in | manual | (none — see Manual-Only Verifications) | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Test scaffolding to create **before** business logic tasks run, so per-task verification can sample green/red continuously.

- [ ] `hussle-app-dispatch-ui/src/features/carrier-portal/store/sagas/__tests__/savePhaseDataSaga.test.ts` — saga unit harness (covers existing 3 + new 2 workers)
- [ ] `hussle-app-dispatch-ui/src/features/carrier-portal/store/slices/__tests__/carrierPortalSlice.test.ts` — reducer tests (STAB-05 setCurrentPhase, new save actions)
- [ ] `hussle-app-dispatch-ui/src/features/carrier-portal/pages/CarrierPortalPage/CarrierPortalPage.test.tsx` — page-level test (dispatch + advance + snackbar + scroll)
- [ ] `hussle-app-dispatch-ui/src/features/carrier-portal/components/CostResultCard/CostResultCard.test.tsx`
- [ ] `hussle-app-dispatch-ui/src/features/carrier-portal/components/PresetTileSelector/PresetTileSelector.test.tsx`
- [ ] `hussle-app-dispatch-ui/src/features/carrier-portal/components/StateGrid/StateGrid.test.tsx`
- [ ] `hussle-app-dispatch-ui/src/components/ConversationalForm/__tests__/InputRenderer.test.tsx`
- [ ] `hussle-app-dispatch-ui/src/components/ConversationalForm/__tests__/SubQuestion.test.tsx`
- [ ] `hussle-app-dispatch-ui/e2e/carrier-portal-full.spec.ts` — Playwright STAB-14, mirrors `e2e/driver-portal-smoke.spec.ts`

No framework install needed — Jest, RTL, `redux-saga-test-plan`, and Playwright are all already configured in `hussle-app-dispatch-ui/package.json`.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Mobile-device walk-through of 6-phase flow | STAB-15 | Real-device sensory confirmation (touch targets, keyboard, viewport, transitions) not reliably captured by Playwright headless emulation | Open invite link on iPhone Safari and Android Chrome. Complete Company → Equipment → Drivers → Cost → Lane → Documents → Submit. Confirm completion view renders. Record outcome in `SMOKE-CHECKLIST.md` committed in phase dir. |

---

## Validation Sign-Off

- [ ] All tasks have automated verify or Wave 0 dependency
- [ ] Sampling continuity: no 3 consecutive tasks without an automated verify command
- [ ] Wave 0 covers all `❌ W0` references in the verification map
- [ ] No watch-mode flags in CI commands
- [ ] Feedback latency < 30s for the quick command
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
