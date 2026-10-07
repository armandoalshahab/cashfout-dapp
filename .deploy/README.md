# cashfout — crypto ⇄ fiat, no middleman

Testnet DApp for the **Monad Developer Hackathon** ([hackathon.monad.xyz](https://hackathon.monad.xyz/)).

**Utility:** convert crypto to conventional money (USD, JPY, IDR, EUR…) — and back — without intermediaries. Sell MON/USDC on-chain, fiat lands at your bank/e-wallet; top up from a payment method, crypto credits to your wallet.

## Stack
- Vanilla HTML/CSS/JS (zero build step)
- Monad Testnet · chain id `10143` · RPC `https://testnet-rpc.monad.xyz`
- Live FX: `open.er-api.com` · crypto pricing: CoinGecko (both CORS-open, refresh 60s)
- On-chain legs: native MON transfer + ERC-20 `transfer` to the settlement vault (`eth_sendTransaction` via EIP-1193, receipt-checked)

## Tabs
1. **Swap** — switcher-style converter (see switchere.com): FROM ⇄ TO with crypto/fiat picker, live rate, 0.5% cashout fee, quote box, route line.
2. **Portfolio** — real on-chain MON + USDC balances, FIAT-d demo cash account, conversion history with explorer links.
3. **Payment Method** — bank / e-wallet / PayPal / card, stored in localStorage only (masked numbers, default payout method feeds the Swap route line).

## Honest testnet boundary
Fiat rails do not exist on a testnet: the crypto→vault leg is **real on-chain**, the vault→bank leg is simulated by a labeled `FIAT-d` ledger (mainnet: licensed payout partner). The UI says so in-product — no fake pretenses.

## Run locally
```
python3 -m http.server 8790
# optionally load mock-provider.js in <script> for wallet-less testing
```

## Config
All addresses/feats in `config.js` — including `defaultVault` (replaceable via ⚙ vault button at runtime, no redeploy).
