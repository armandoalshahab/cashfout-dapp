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
    { id: 'USD', name: 'US Dollar', emoji: '🇺🇸', locale: 'en-US', usd: 1 },
    { id: 'EUR', name: 'Euro', emoji: '🇪🇺', locale: 'de-DE', usd: 0.887 },
    { id: 'GBP', name: 'Pound Sterling', emoji: '🇬🇧', locale: 'en-GB', usd: 0.749 },
    { id: 'JPY', name: 'Japanese Yen', emoji: '🇯🇵', locale: 'ja-JP', usd: 157.9 },
    { id: 'IDR', name: 'Indonesian Rupiah', emoji: '🇮🇩', locale: 'id-ID', usd: 17970 },
    { id: 'CHF', name: 'Swiss Franc', emoji: '🇨🇭', locale: 'de-CH', usd: 0.797 },
    { id: 'CAD', name: 'Canadian Dollar', emoji: '🇨🇦', locale: 'en-CA', usd: 1.39 },
    { id: 'AUD', name: 'Australian Dollar', emoji: '🇦🇺', locale: 'en-AU', usd: 1.52 },
    { id: 'SGD', name: 'Singapore Dollar', emoji: '🇸🇬', locale: 'en-SG', usd: 1.35 },
    { id: 'MYR', name: 'Malaysian Ringgit', emoji: '🇲🇾', locale: 'ms-MY', usd: 4.21 },
    { id: 'CNY', name: 'Chinese Yuan', emoji: '🇨🇳', locale: 'zh-CN', usd: 7.11 },
    { id: 'HKD', name: 'Hong Kong Dollar', emoji: '🇭🇰', locale: 'zh-HK', usd: 7.81 },
    { id: 'KRW', name: 'South Korean Won', emoji: '🇰🇷', locale: 'ko-KR', usd: 1369 },
    { id: 'INR', name: 'Indian Rupee', emoji: '🇮🇳', locale: 'en-IN', usd: 83.4 },
    { id: 'THB', name: 'Thai Baht', emoji: '🇹🇭', locale: 'th-TH', usd: 32.3 },
    { id: 'PHP', name: 'Philippine Peso', emoji: '🇵🇭', locale: 'en-PH', usd: 57.8 },
    { id: 'VND', name: 'Vietnamese Dong', emoji: '🇻🇳', locale: 'vi-VN', usd: 25420 },
    { id: 'BRL', name: 'Brazilian Real', emoji: '🇧🇷', locale: 'pt-BR', usd: 5.42 },
    { id: 'MXN', name: 'Mexican Peso', emoji: '🇲🇽', locale: 'es-MX', usd: 18.4 },
    { id: 'COP', name: 'Colombian Peso', emoji: '🇨🇴', locale: 'es-CO', usd: 4130 },
    { id: 'ARS', name: 'Argentine Peso', emoji: '🇦🇷', locale: 'es-AR', usd: 975 },
    { id: 'CLP', name: 'Chilean Peso', emoji: '🇨🇱', locale: 'es-CL', usd: 945 },
    { id: 'PEN', name: 'Peruvian Sol', emoji: '🇵🇪', locale: 'es-PE', usd: 3.71 },
    { id: 'UYU', name: 'Uruguayan Peso', emoji: '🇺🇾', locale: 'es-UY', usd: 39.1 },
    { id: 'ZAR', name: 'South African Rand', emoji: '🇿🇦', locale: 'en-ZA', usd: 18.0 },
    { id: 'NGN', name: 'Nigerian Naira', emoji: '🇳🇬', locale: 'en-NG', usd: 1530 },
    { id: 'KES', name: 'Kenyan Shilling', emoji: '🇰🇪', locale: 'en-KE', usd: 129 },
    { id: 'GHS', name: 'Ghanaian Cedi', emoji: '🇬🇭', locale: 'en-GH', usd: 15.0 },
    { id: 'EGP', name: 'Egyptian Pound', emoji: '🇪🇬', locale: 'ar-EG', usd: 47.5 },
    { id: 'MAD', name: 'Moroccan Dirham', emoji: '🇲🇦', locale: 'ar-MA', usd: 9.95 },
    { id: 'AED', name: 'UAE Dirham', emoji: '🇦🇪', locale: 'ar-AE', usd: 3.67 },
    { id: 'SAR', name: 'Saudi Riyal', emoji: '🇸🇦', locale: 'ar-SA', usd: 3.75 },
    { id: 'QAR', name: 'Qatari Riyal', emoji: '🇶🇦', locale: 'ar-QA', usd: 3.64 },
    { id: 'KWD', name: 'Kuwaiti Dinar', emoji: '🇰🇼', locale: 'ar-KW', usd: 0.308 },
    { id: 'TRY', name: 'Turkish Lira', emoji: '🇹🇷', locale: 'tr-TR', usd: 41.6 },
    { id: 'PLN', name: 'Polish Zloty', emoji: '🇵🇱', locale: 'pl-PL', usd: 3.80 },
    { id: 'CZK', name: 'Czech Koruna', emoji: '🇨🇿', locale: 'cs-CZ', usd: 22.5 },
    { id: 'HUF', name: 'Hungarian Forint', emoji: '🇭🇺', locale: 'hu-HU', usd: 355 },
    { id: 'RON', name: 'Romanian Leu', emoji: '🇷🇴', locale: 'ro-RO', usd: 4.45 },
    { id: 'SEK', name: 'Swedish Krona', emoji: '🇸🇪', locale: 'sv-SE', usd: 9.62 },
    { id: 'NOK', name: 'Norwegian Krone', emoji: '🇳🇴', locale: 'nb-NO', usd: 10.5 },
    { id: 'DKK', name: 'Danish Krone', emoji: '🇩🇰', locale: 'da-DK', usd: 6.62 },
    { id: 'ILS', name: 'Israeli Shekel', emoji: '🇮🇱', locale: 'he-IL', usd: 3.36 },
    { id: 'NZD', name: 'New Zealand Dollar', emoji: '🇳🇿', locale: 'en-NZ', usd: 1.68 },
    { id: 'PKR', name: 'Pakistani Rupee', emoji: '🇵🇰', locale: 'en-PK', usd: 278 },
    { id: 'BDT', name: 'Bangladeshi Taka', emoji: '🇧🇩', locale: 'bn-BD', usd: 117 },
    { id: 'LKR', name: 'Sri Lankan Rupee', emoji: '🇱🇰', locale: 'en-LK', usd: 321 },
    { id: 'NPR', name: 'Nepalese Rupee', emoji: '🇳🇵', locale: 'ne-NP', usd: 133.4 }
  ],
  pmTypes: [
    { id: 'bank',     label: 'Bank Account', emoji: '🏦', fields: [
        { k: 'bank', label: 'Bank', placeholder: 'BCA / Mandiri / BNI', type: 'select', options: ['BCA','Mandiri','BNI','BRI','CIMB','Other'] },
        { k: 'holder', label: 'Account holder', placeholder: 'Full name' },
        { k: 'number', label: 'Account number', placeholder: '1234567890', masked: true } ],
      eta: '1×24h' },
    { id: 'applepay', label: 'Apple Pay', emoji: '🍎', fields: [
        { k: 'email', label: 'Apple ID', placeholder: 'you@icloud.com' } ],
      eta: 'instant' },
    { id: 'googlepay', label: 'Google Pay', emoji: '🇬', fields: [
        { k: 'email', label: 'Google account', placeholder: 'you@gmail.com' } ],
      eta: 'instant' },
    { id: 'debitcard', label: 'Debit Card', emoji: '💳', fields: [
        { k: 'holder', label: 'Name on card', placeholder: 'Full name' },
        { k: 'number', label: 'Card number', placeholder: '•••• •••• •••• 1234', masked: true } ],
      eta: '1–3 days' },
    { id: 'creditcard', label: 'Credit Card', emoji: '🪪', fields: [
        { k: 'holder', label: 'Name on card', placeholder: 'Full name' },
        { k: 'number', label: 'Card number', placeholder: '•••• •••• •••• 1234', masked: true } ],
      eta: '1–3 days' },
    { id: 'neteller', label: 'Neteller', emoji: '🌐', fields: [
        { k: 'acct', label: 'Neteller ID', placeholder: '12345678', masked: true },
        { k: 'code', label: 'Security code', placeholder: '••••', masked: true } ],
      eta: 'instant' },
    { id: 'paypal',   label: 'PayPal', emoji: '🅿️', fields: [
        { k: 'email', label: 'PayPal email', placeholder: 'you@mail.com' } ],
      eta: '< 1h' },
    { id: 'revolut',  label: 'Revolut', emoji: '🔵', fields: [
        { k: 'email', label: 'Email / phone', placeholder: 'you@mail.com' },
        { k: 'handle', label: 'Revolut tag', placeholder: '@username' } ],
      eta: 'instant' },
    { id: 'skrill',   label: 'Skrill', emoji: '💰', fields: [
        { k: 'email', label: 'Skrill email', placeholder: 'you@mail.com' } ],
      eta: 'instant' },
    { id: 'astropay', label: 'AstroPay', emoji: '🅰️', fields: [
        { k: 'number', label: 'Virtual card number', placeholder: '•••• •••• •••• 1234', masked: true } ],
      eta: 'instant' },
    { id: 'trustly',  label: 'Trustly', emoji: '🛂', fields: [
        { k: 'bank', label: 'Bank', placeholder: 'Your bank name' },
        { k: 'holder', label: 'Account holder', placeholder: 'Full name' } ],
      eta: '< 1h' },
    { id: 'pix',      label: 'Pix', emoji: '🇧🇷', fields: [
        { k: 'key', label: 'Pix key', placeholder: 'CPF / email / phone / EVP', masked: true } ],
      eta: 'instant' },
    { id: 'spei',     label: 'SPEI', emoji: '🇲🇽', fields: [
        { k: 'bank', label: 'Bank', placeholder: 'Bank name' },
        { k: 'clabe', label: 'CLABE (18 digits)', placeholder: '012345678901234567', masked: true } ],
      eta: '< 1h' },
    { id: 'klarna',   label: 'Klarna', emoji: '🩷', fields: [
        { k: 'email', label: 'Klarna email', placeholder: 'you@mail.com' } ],
      eta: '< 24h' },
    { id: 'ewallet',  label: 'ID E-Wallet', emoji: '📲', fields: [
        { k: 'wallet', label: 'Wallet', type: 'select', options: ['GoPay','OVO','DANA','ShopeePay'] },
        { k: 'number', label: 'Phone number', placeholder: '08xxxxxxxxxx', masked: true } ],
      eta: 'instant' }
  ],
  ratesApi: {
    crypto: 'https://api.coingecko.com/api/v3/simple/price?ids=monad,usd-coin&vs_currencies=usd&include_24h_change=true',
    fiat: 'https://open.er-api.com/v6/latest/USD'
  },
  docs: 'https://docs.monad.xyz/developer-essentials/testnet.md'
};
