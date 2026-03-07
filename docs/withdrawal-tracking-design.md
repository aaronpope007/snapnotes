# Withdrawal Tracking — Design & Implementation Plan

## Problem
Today, session profit is inferred from start/end bankroll. If you withdraw winnings, your end bankroll drops and the system treats that as a loss. Total "profit" becomes distorted because it reflects account balance changes, not actual poker winnings.

## Goal
- **Total winnings** = actual money won from poker (sum of session profits)
- **Withdrawals** = money taken out of the account (tracked separately)
- **Current account** = what’s in the account now (or derived as total winnings − total withdrawals)

---

## Data Model Changes

### New: Withdrawal entity
| Field | Type | Notes |
|-------|------|-------|
| `userId` | string | Same as sessions |
| `date` | ISO string | When the withdrawal happened |
| `amount` | number | Positive; money withdrawn |
| `notes` | string? | Optional memo |

### Sessions
Keep as-is for now. `dailyNet` stays as “profit for that session” (from hand/session data or user input). The session model does **not** need to change; we just stop using “end bankroll − start bankroll” as the sole source of profit once we have explicit session net.

### Summary metrics (computed)
- **Total winnings** = sum of `dailyNet` across all sessions
- **Total withdrawn** = sum of `amount` across all withdrawals
- **Current account** = last session’s `endBankroll` (or a dedicated “current balance” field if we add it)

---

## API

### Withdrawals
- `GET /api/results/withdrawals?userId=...` — list withdrawals
- `POST /api/results/withdrawals` — create withdrawal
- `PATCH /api/results/withdrawals/:id` — edit
- `DELETE /api/results/withdrawals/:id` — delete

---

## UI Changes

### Results / Summary
- Add a **Withdrawals** section (similar to sessions): list, add, edit, delete
- Summary cards:
  - **Total winnings** — sum of session profits (does not include withdrawals)
  - **Total withdrawn** — sum of all withdrawals
  - **Current account** — last `endBankroll` (or explicit balance if we add it)

### Bankroll chart
- Option A: Keep current “bankroll over time” (cumulative from sessions) and add a separate **“Total winnings vs withdrawn”** chart
- Option B: Two lines — cumulative winnings (sessions only) and cumulative withdrawals

### End Session modal
- Unchanged. `dailyNet` is still the session profit. Withdrawals are logged separately.

---

## Implementation Order

1. **Backend**: Add `Withdrawal` model and routes
2. **API / types**: Add withdrawal types and client API helpers
3. **UI**: Withdrawals tab/section (CRUD)
4. **UI**: Update Summary to show Total winnings, Total withdrawn, Current account
5. **UI**: Chart options for winnings vs withdrawals (optional)

---

## Open Questions

- Do we need an explicit “current account balance” field, or is “last session’s end bankroll” enough?
- Should deposits be tracked too (for completeness), or only withdrawals?
- Any integration with external sites (e.g. auto-import)?
