# cashfout — crypto ⇄ real money, no middleman

A testnet dApp for the **Monad Developer Hackathon** ([hackathon.monad.xyz](https://hackathon.monad.xyz/)).

**Live demo:** https://cashfout.pages.dev/

**Demo video (3 min, English narration):** [`demo.mp4`](https://cashfout.pages.dev/demo.mp4) — a real, end-to-end on-chain cashout (MON → vault → IDR payout) recorded live on Monad Testnet.

## What it does

Convert crypto to conventional money (USD, JPY, IDR, EUR…) — and back — without intermediaries:

- **Cashout:** sell MON / USDC on-chain; the crypto leg is a *real* on-chain transfer to the settlement vault on **Monad Testnet (chain id 10143)**; the payout leg credits your selected payment method (15 rails: bank, e-wallet, PayPal, cards, PIX, SPEI…).
- **Top-up:** debit a funded FIAT-d balance; crypto is credited to your wallet.
- Live quotes across **48 fiat currencies** (open.er-api.com) + crypto prices (CoinGecko), refreshed every 60 s. 0.5 % cashout fee, top-up free.
- **Hardware-wallet support:** connect via browser wallets (MetaMask, Rabby, OKX, Bitget, Coinbase, Trust) *or* sign with **Ledger / Trezor over WebUSB** — private keys never leave the device (EIP-155 legacy tx built via RPC, signed on-device, broadcast with `eth_sendRawTransaction`).

## Stack

- Vanilla HTML/CSS/JS — **zero build step, zero framework**
- Monad Testnet · chain id `10143` · RPC `https://testnet-rpc.monad.xyz`
- Live FX: `open.er-api.com` · crypto pricing: CoinGecko (both CORS-open, refresh 60 s)
- On-chain legs: native MON transfer + ERC-20 `transfer` to the settlement vault (`eth_sendTransaction` via EIP-1193, receipt-checked)

| File | Role |
|---|---|
| `index.html` | page shell, 3 tabs (Swap / Portfolio / Payment Method) |
| `style.css` | dark Monad theme, flame canvas placement, responsive/short-screen rules |
| `config.js` | chain params, 48 fiats, 3 cryptos, 15 payment rails, vault address |
| `app.js` | quote engine, ticker, on-chain flow, portfolio, payment methods |
| `hw.js` | Ledger/Trezor hardware-wallet provider (RLP + EIP-155, WebUSB, lazy-loaded) |
| `flame.js` | WebGL2 flame-wrap effect (canvasui port — see attribution) |
| `vendor/*.js` | prebuilt browser bundles for the Ledger / Trezor libraries |

## Tabs

1. **Swap** — switcher-style converter: FROM ⇄ TO with crypto/fiat picker, live rate, 0.5 % cashout fee, quote box, route line, flame-wrap highlight on the converter card.
2. **Portfolio** — real on-chain MON + USDC balances, FIAT-d demo cash account, conversion history with explorer links.
3. **Payment Method** — bank / e-wallet / PayPal / card, stored in localStorage only (masked numbers; the default payout method feeds the Swap route line).

## Honest testnet boundary

Fiat rails do not exist on a testnet: the crypto→vault leg is **real on-chain**, the vault→bank leg is simulated by a labeled `FIAT-d` ledger (on mainnet this would be a licensed payout partner). The UI says so in-product — no fake pretenses.

## Setup / run locally

No installs required:

```bash
git clone https://github.com/armandoalshahab/cashfout.git
cd cashfout
python3 -m http.server 8790        # or: npx serve .
# open http://127.0.0.1:8790/
```

Requirements: a Chromium-based browser (for the wallet / WebUSB flow). Hardware wallets: plug in the device, unlock it, open the Ethereum app (Ledger) — the browser will prompt for USB access.

### Deploy

Static hosting of the repo root works anywhere. The live site runs on Cloudflare Pages:

```bash
wrangler pages deploy . --project-name cashfout
```

## Configuration

Everything lives in `config.js`: RPC, chain id, explorer URLs, fee (bps), settlement vault address (`defaultVault`), currency list, payment rails. Point `defaultVault` at your own contract to receive cashout transfers.

## Hackathon submission checklist

- [x] Public GitHub repository containing the complete source code
- [x] README with setup instructions (this file)
- [x] Open-source license: MIT (`LICENSE`)
- [x] Clear attribution of external code/libraries (below)
- [x] Commit history covering the build window (Sep–Oct 2026)
- [x] Live URL: https://cashfout.pages.dev/

## Attribution of external code & libraries

1. **`flame.js` — FlameWrap (WebGL2 fragment shader).**
   Ported from the component `FlameWrap` at <https://canvasui.dev/docs/components/flame-wrap>. The GLSL fragment shader (simplex noise, fbm, domain warping, SDF rounded-rect, tongue envelope, melt, sparks, halo, smoke, ember rim, scorch) is taken from that component's source and adapted to a dependency-free vanilla WebGL2 canvas. Adaptations only: color → Monad purple, corner radius matched to this card, uniform plumbing. canvasui components are MIT-licensed per <https://canvasui.dev>.

2. **`vendor/ledger-bundle.js`** — esbuild bundle of:
   - `@ledgerhq/hw-transport-webusb` 6.29.4 — Apache-2.0
   - `@ledgerhq/hw-app-eth` 6.34.2 — Apache-2.0
   - transitive deps: `@ledgerhq/devices`, `@ledgerhq/errors` (Apache-2.0), `js-sha3` (MIT), `bignumber.js` (MIT), `buffer` polyfill (MIT).
   Built locally from npm sources. Rebuild recipe: bundle an entry importing both libs as IIFE with browser-platform shims for `Buffer`/`process`, expose `window.LedgerLibs`.

3. **`vendor/trezor-bundle.js`** — esbuild bundle of `@trezor/connect-web` 9.4.1 — license: See <https://github.com/trezor/connect/blob/develop/LICENSE>. In production the Trezor path lazy-loads the **official** hosted loader from `https://connect.trezor.io/9/trezor-connect.js`; the local bundle is the offline fallback.

4. **Live data APIs (no code copied):** exchange rates from <https://open.er-api.com>, crypto prices from <https://www.coingecko.com> (free endpoints), country flag images from <https://flagcdn.com>.

5. **Fonts/icons:** system font stack and emoji glyphs only; no icon packages.

All other code — app logic, UI, the vanilla-WebGL2 plumbing, the hardware-wallet transaction builder and RLP encoder, the quote engine — is original, written for this project during the hackathon window, and released under the MIT license.

## License

MIT — see `LICENSE`.
