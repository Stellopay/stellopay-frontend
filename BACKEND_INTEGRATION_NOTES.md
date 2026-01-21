## Backend base URL

- **Default (dev)**: `http://localhost:4002/api/v1`
- **Override**: set `NEXT_PUBLIC_BACKEND_URL` (example: `http://localhost:4002/api/v1`)

## Wallet verification (implemented)

Backend expects a 2-step flow:

- **1) Issue challenge**
  - `POST /auth/challenge`
  - body: `{ "address": "0x..." }`
  - response includes: `typed_data` + `nonce`

- **2) Verify signature**
  - `POST /auth/verify`
  - body: `{ "address": "0x...", "signature": ["0xR","0xS"] }`
  - response includes: `session_token`

Frontend implementation:
- Implemented in `context/wallet-context.tsx` as part of `connectWallet()`.
- Stores `stellopay_session_token` + `stellopay_wallet_address` in `localStorage`.

## Backend routes inventory

### System
- `GET /network/chain_id`
  - returns `{ chain_id, spec_version }`
- `GET /account/:address/nonce`
  - returns `{ address, nonce }`

### Escrow (PayrollEscrow contract)
- **Defaults**
  - `GET /escrow/defaults` → `{ address }`
- **View calls (no session required)**
  - `GET /escrow/:address/get_employer`
  - `GET /escrow/:address/get_agreement`
  - `GET /escrow/:address/get_token`
- **Prepare calls (require session)**
  - `POST /prepare/escrow/:address/initialize`
  - `POST /prepare/escrow/:address/set_agreement`
  - `POST /prepare/escrow/:address/deposit`
  - `POST /prepare/escrow/:address/release`
  - `POST /prepare/escrow/:address/refund_remaining`
  - All expect `{ wallet_address, session_token, ... }`
  - Return `{ call, wallet_address, nonce, chain_id }` (frontend should submit `call` via wallet)

### Agreement (WorkAgreement contract)
- **Defaults**
  - `GET /agreement/defaults` → `{ address }`
- **View calls (no session required)**
  - `GET /agreement/:address/get_employer`
  - `GET /agreement/:address/get_contributor`
  - `GET /agreement/:address/get_token`
  - `GET /agreement/:address/get_escrow`
  - `GET /agreement/:address/get_total_amount`
  - `GET /agreement/:address/get_paid_amount`
- **Prepare calls (require session)**
  - `POST /prepare/agreement/:address/initialize_time_based`
  - `POST /prepare/agreement/:address/initialize_milestone_based`
  - `POST /prepare/agreement/:address/add_milestone`
  - `POST /prepare/agreement/:address/approve_milestone`
  - `POST /prepare/agreement/:address/claim_milestone`
  - `POST /prepare/agreement/:address/activate`
  - `POST /prepare/agreement/:address/pause`
  - `POST /prepare/agreement/:address/resume`
  - `POST /prepare/agreement/:address/cancel`
  - `POST /prepare/agreement/:address/claim_time_based`
  - All expect `{ wallet_address, session_token, ... }`
  - Return `{ call, wallet_address, nonce, chain_id }` (frontend should submit `call` via wallet)

## Frontend integration status (high-level)

### Already wired
- **Wallet connect + backend verification**: done
  - Connect wallet triggers backend challenge + wallet signature + verify to get `session_token`.

### Not wired yet (current UI is mock / static)
- **Dashboard “Send Payment / Request Payment”** buttons
  - Backend does **not** have payment request/transfer APIs.
  - Closest backend functionality is **escrow deposit/release/refund** and **work agreement claims**.
  - Recommendation: rename these buttons to actions that exist (e.g. “Deposit to Escrow”, “Release to Contributor”, “Create Agreement”, “Claim Payment”), or add new backend routes for “payment requests”.

- **Transactions page + filters/pagination**
  - Current UI appears to use mock transaction data; backend has **no transaction history** endpoints.
  - Options:
    - add backend indexer/storage for transfers & contract events, or
    - keep as mock UI until indexer exists.

- **Auth pages (email/password)**
  - Backend currently authenticates by **wallet signature only** (no email/password endpoints).
  - Recommendation: remove/disable email auth flows, or implement backend user auth.

## Backend/frontend adjustments to consider

- **CORS**
  - backend `CORS_ORIGIN` should allow the frontend origin (e.g. `http://localhost:3000`).
- **Session token transport**
  - backend currently expects `{ wallet_address, session_token }` in request body for protected endpoints.
  - Consider moving to `Authorization: Bearer <token>` header for consistency, but not required.
- **Session persistence**
  - `session_token` is in-memory on backend (`Map`) → restarting backend logs everyone out.
  - If you want persistence, store sessions/challenges in Redis/DB.




