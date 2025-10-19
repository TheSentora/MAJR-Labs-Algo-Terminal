# MAJR-Labs-Algo-Terminal
Algorand Security Scanner and Liquidity Burner made by MAJR Labs

# Liquid Burn Platform

> Algorand-powered burn engine that rewards users for permanently removing an ASA from circulation.



---

## Demo Video
[Watch the demo]()
https://youtu.be/4AUWNBLcY4o


## Demo PowerPoint

https://www.canva.com/design/DAG2OasJ4DM/xTqSdNZSYtWYYAWmekWmrA/edit?utm_content=DAG2OasJ4DM&utm_campaign=designshare&utm_medium=link2&utm_source=sharebutton

---



## Smart Contract Overview
The contract lives at `liquid_burn_contract/projects/liquid_burn_contract/smart_contracts/liquid_burn_app/contract.py` and follows the ARC-4 ABI standard.

- **initialize(asset_id, admin)**: Creator locks in the target ASA, records the admin account, and zeros total counters so the app starts from a clean state.
- **fund()**: Admin pairs an Algo payment with the call to top up the reward pool kept in global state.
- **burn(amount)**: Caller atomically transfers the ASA to the app address, receives matching “shares,” and increments total burned supply tracking.
- **claim()**: Users redeem Algo rewards proportional to their shares; the contract issues an inner payment and clears the caller’s share balance.

The deploy script in `smart_contracts/liquid_burn_app/deploy_config.py` wires the environment accounts, chooses the ASA ID, and pre-funds the app address after creation.


---

## Token Creator
- Scripted workflow for launching a fresh ASA, capturing the asset ID, and registering it with the burn app.
- Optional metadata helpers for naming, supplying decimals, and seeding the initial circulating supply before burns begin.
- Integrates with the deploy scripts so test deployments can mint, burn, and reward in a single pass.

## Token Trading
- Wallet-connected UI module that lets users list, swap, and retire ASAs alongside the burn incentives.
- Aggregates on-chain liquidity data so traders can see price impact before committing a trade.
- Hooks directly into `burn()` and `claim()` so trading and burning remain synchronized for reward calculations.

---

## Project Snapshot
- Network: Algorand / ARC-4 smart contract
- Purpose: Burn ASA tokens while distributing Algo incentives
- Stack: React + Vite frontend, AlgoKit-powered Python contracts

---

## Team

| Andy | Maks | Max | Riad | Jammie |
| --- | --- | --- | --- | --- |

---

## Repository Map

| Path | Description |
| --- | --- |
| `Frontend/` | Vite + React UI talking to Algorand with `algosdk` |
| `liquid_burn_contract/` | ARC-4 smart contract, deployment scripts, artifacts |
| `Library/` | Supporting resources such as environment templates |

---

## How Liquid Burn Works

| Phase | What Happens | Key Contract Logic |
| --- | --- | --- |
| Initialize | Deployer locks in target ASA and admin; counters reset | `initialize` |
| Fund | Admin pairs Algo payment with app call, filling the reward pool | `fund` |
| Burn | User atomically transfers ASA and receives proportional shares | `burn` |
| Claim | Share holders cash out Algo rewards; shares cleared | `claim` |

Further reading: `liquid_burn_contract/projects/liquid_burn_contract/smart_contracts/liquid_burn_app/contract.py`

---

## Quick Start

### Prerequisites
- Node.js 18+, plus `npm`, `yarn`, or `pnpm`
- Python 3.12+, Poetry, and AlgoKit CLI 2.0.0 or newer
- Docker (optional) for running an Algorand LocalNet

### Frontend Workflow
```bash
cd Frontend
npm install
npm run dev
```
Visit `http://localhost:5173` and connect your Algorand wallet.

### Smart Contract Workflow
```bash
cd liquid_burn_contract/projects/liquid_burn_contract
poetry install
algokit project run build
```

Deploy to LocalNet after generating `.env.localnet`:
```bash
algokit project deploy localnet
```

---

## Helpful Links
- Algorand Developer Portal: https://developer.algorand.org/
- AlgoKit CLI documentation: https://github.com/algorandfoundation/algokit-cli
- Algorand Python (Puya): https://github.com/algorandfoundation/puya

