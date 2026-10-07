# cashfout — builder report (Monad Developer Hackathon)

**Project:** cashfout (cashing fiat out)
**Utility:** convert crypto to conventional money (dollar, yen, rupiah, …) — and the other way — without a middleman. DApp runs on **Monad Testnet** (chain id 10143).
**Website:** https://cashfout.netlify.app
**Reference UX:** switchere.com/converter (currency converter layout), Monad-flavoured dark fintech theme.

## Tabs
1. **Swap** — switcher-style converter: FROM ⇄ TO asset picker (crypto side: MON / WMON / USDC on-chain; fiat side: **48 currencies** — USD, IDR, JPY, EUR, GBP, CHF, CAD, AUD, SGD, MYR, CNY, HKD, KRW, INR, THB, PHP, VND, BRL, MXN, COP, ARS, CLP, PEN, UYU, ZAR, NGN, KES, GHS, EGP, MAD, AED, SAR, QAR, KWD, TRY, PLN, CZK, HUF, RON, SEK, NOK, DKK, ILS, NZD, PKR, BDT, LKR, NPR — rendered as a flag-pill grid ("USD ⇄ Crypto") with live search), live rate line, one-click flip direction, 0.5% cashout fee quoted explicitly, route summary ("MON → vault → USD via BCA personal"), quick-amount chips, MAX-from-balance.
2. **Portfolio** — real on-chain balances (native MON via `eth_getBalance`, USDC via ERC-20 `balanceOf` eth_call), labelled `FIAT-d` demo cash account, total value, conversion history with MonadVision explorer links per tx, per-asset Convert shortcut.
3. **Payment method** — bank transfer (BCA/Mandiri/BNI/BRI/CIMB), e-wallet (GoPay/OVO/DANA/ShopeePay), PayPal, Visa/MC. Numbers masked in UI, stored in browser localStorage only. First method = default destination shown in the Swap quote box.

## What is real vs simulated (honest boundary)
- **Real on-chain:** every crypto→vault leg is a genuine `eth_sendTransaction` on Monad Testnet — native MON transfer or ERC-20 `transfer` — and the app waits for a receipt (`status 0x1`) before showing the settled badge + explorer link. USDC address is Circle's official Monad testnet USDC (`0x534b…43A3`, faucet.circle.com), vault address editable live (⚙ vault, no redeploy).
- **Real live data:** FX from open.er-api.com + crypto prices from CoinGecko, both CORS-open, refresh every 60s, snapshot fallback + status strip tells the user which mode is active.
- **Simulated:** the vault→bank leg. No fiat rails exist on a testnet; the app credits a clearly labelled FIAT-d ledger and the UI says so in-product. Mainnet design: licensed payout partner (this is the hackathon thesis — the crypto half is already end-to-end).
- Perps/derivatives: none — scope is pure convert in/out.

## Verified end-to-end this session
- Boot: 8-pair live ticker, rates status "Live FX + crypto prices · open.er-api + CoinGecko"
- Cashout MON→USD: quote 100 MON → 3.22 USD, tx sent, receipt confirmed, FIAT-d ledger credited, history + explorer link shown
- Top-up USD→MON: guarded by FIAT-d balance (rejects overdraw, offers demo fund), settles to ledger+wallet
- USDC→JPY via ERC-20 transfer path: 30 USDC → 4,713.83 JPY, on-chain tx ✓
- IDR leg: 50 MON → 28,882 IDR quote with 0.5% fee line ✓
- Payment methods persist across reload; default flows into quote route; masked display verified
- Wallet modal: 7 providers, auto chain-switch to 10143, addEthereumChain fallback; sign-out; accountsChanged/chainChanged listeners

## Deploy
Static, zero build (vanilla HTML/CSS/JS). `config.js` holds all chain constants, fee bps, token/fiat lists.
Run: `python3 -m http.server` → open /. Local wallet-less testing via optional `mock-provider.js` (not linked in index.html).

## Network facts (verified from docs.monad.xyz, 2026-10-03)
| | |
|---|---|
| Chain ID | 10143 (0x279f) |
| Currency | MON |
| RPC | https://testnet-rpc.monad.xyz |
| Explorer | https://testnet.monadvision.com |
| MON faucet | https://faucet.monad.xyz |
| USDC faucet | https://faucet.circle.com (select Monad Testnet) |
| Testnet USDC | 0x534b2f3A21130d7a60830c2Df862319e593943A3 |
