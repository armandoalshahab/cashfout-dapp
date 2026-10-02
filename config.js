/* cashfout — config (Monad Testnet) */
window.CF = {
  app: {
    name: 'cashfout',
    tagline: 'cashing fiat out — crypto ⇄ real money, no middleman',
    chainIdHex: '0x279f',           // 10143
    chainIdDec: 10143,
    chainName: 'Monad Testnet',
    currency: 'MON',
    rpc: 'https://testnet-rpc.monad.xyz',
    explorerTx: 'https://testnet.monadvision.com/tx/',
    explorerAddr: 'https://testnet.monadvision.com/address/',
    faucetMon: 'https://faucet.monad.xyz',
    faucetUsdc: 'https://faucet.circle.com',
    feeBps: 50,                     // 0.5% cashout fee
    updated: '2026-10-03'
  },
  // reserve/vault that "holds" fiat on the other side (placeholder = replaceable in UI)
  defaultVault: '0x000000000000000000000000000000000000dEaD',
  cryptos: [
    { id: 'MON',  name: 'Monad',    kind: 'native', decimals: 18, cg: 'monad',    emoji: '🟣', usd: 0.033,   snap24h: 2.1 },
    { id: 'WMON', name: 'Wrapped MON', kind: 'erc20', addr: '0xFb8bf4c1CC7a94c73D209a149eA2AbEa852BC541', decimals: 18, cg: 'monad', emoji: '⚙️', usd: 0.033, snap24h: 2.1 },
    { id: 'USDC', name: 'USD Coin (Circle)', kind: 'erc20', addr: '0x534b2f3A21130d7a60830c2Df862319e593943A3', decimals: 6, cg: 'usd-coin', emoji: '💵', usd: 1.0, snap24h: 0.0 }
  ],
  fiats: [
    { id: 'USD', name: 'US Dollar',    emoji: '🇺🇸', locale: 'en-US', usd: 1 },
    { id: 'IDR', name: 'Indonesian Rupiah', emoji: '🇮🇩', locale: 'id-ID', usd: 17970 },
    { id: 'JPY', name: 'Japanese Yen', emoji: '🇯🇵', locale: 'ja-JP', usd: 157.9 },
    { id: 'EUR', name: 'Euro',         emoji: '🇪🇺', locale: 'de-DE', usd: 0.887 },
    { id: 'GBP', name: 'Pound Sterling', emoji: '🇬🇧', locale: 'en-GB', usd: 0.749 },
    { id: 'SGD', name: 'Singapore Dollar', emoji: '🇸🇬', locale: 'en-SG', usd: 1.35 },
    { id: 'MYR', name: 'Malaysian Ringgit', emoji: '🇲🇾', locale: 'ms-MY', usd: 4.21 },
    { id: 'CNY', name: 'Chinese Yuan', emoji: '🇨🇳', locale: 'zh-CN', usd: 7.11 },
    { id: 'AUD', name: 'Australian Dollar', emoji: '🇦🇺', locale: 'en-AU', usd: 1.52 }
  ],
  pmTypes: [
    { id: 'bank',    label: 'Bank Transfer', emoji: '🏦', fields: [
        { k: 'bank', label: 'Bank', placeholder: 'BCA / Mandiri / BNI', type: 'select', options: ['BCA','Mandiri','BNI','BRI','CIMB'] },
        { k: 'holder', label: 'Account holder', placeholder: 'Full name' },
        { k: 'number', label: 'Account number', placeholder: '1234567890', masked: true } ],
      eta: '1×24h' },
    { id: 'ewallet', label: 'E-Wallet', emoji: '📲', fields: [
        { k: 'wallet', label: 'Wallet', type: 'select', options: ['GoPay','OVO','DANA','ShopeePay'] },
        { k: 'number', label: 'Phone number', placeholder: '08xxxxxxxxxx', masked: true } ],
      eta: 'instant' },
    { id: 'paypal',  label: 'PayPal', emoji: '🅿️', fields: [
        { k: 'email', label: 'PayPal email', placeholder: 'you@mail.com' } ],
      eta: '< 1h' },
    { id: 'card',    label: 'Visa / Mastercard', emoji: '💳', fields: [
        { k: 'holder', label: 'Name on card', placeholder: 'Full name' },
        { k: 'number', label: 'Card number', placeholder: '•••• •••• •••• 1234', masked: true } ],
      eta: '1–3 days' }
  ],
  ratesApi: {
    crypto: 'https://api.coingecko.com/api/v3/simple/price?ids=monad,usd-coin&vs_currencies=usd&include_24h_change=true',
    fiat: 'https://open.er-api.com/v6/latest/USD'
  },
  docs: 'https://docs.monad.xyz/developer-essentials/testnet.md'
};
