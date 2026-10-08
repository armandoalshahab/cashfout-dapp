/* cashfout — app (Monad Testnet 10143) */
(function () {
'use strict';
const $ = id => document.getElementById(id);
const APP = Object.assign({}, window.CF, window.CF.app);
let P = null;                    // eip1193 provider
let acct = null;                 // checksum-ish address
let monBal = 0n, usdcBal = 0n;   // wei / base-units
let rates = { fiats: {}, cryptos: {}, live: false, src: 'snapshot' };
let from = asset('MON'), to = asset('USD');
let methods = load('cf.methods', []);
let hist = load('cf.hist', []);
let fiatLedger = load('cf.fiatd', { USD: 0 }); // demo fiat cash account (usd-normalised)
let pickSide = 'from', pickTab = 'crypto', pmType = APP.pmTypes[0].id;

function asset(id) {
  return window.CF.cryptos.find(c => c.id === id) ? { kind: 'crypto', ref: window.CF.cryptos.find(c => c.id === id) }
       : { kind: 'fiat',   ref: window.CF.fiats.find(f => f.id === id) };
}
function load(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } }
function save(k, v) { localStorage.setItem(k, JSON.stringify(v)); }
function fmt(n, dp) { return n.toLocaleString('en-US', { maximumFractionDigits: dp ?? 2, minimumFractionDigits: 0 }); }
function toast(msg, cls) {
  const t = document.createElement('div'); t.className = 'toast ' + (cls || '');
  t.textContent = msg; $('toastBox').appendChild(t);
  setTimeout(() => t.remove(), 4200);
}

/* ---------- rates ---------- */
async function jfetch(url, ms) {
  const c = new AbortController(); const t = setTimeout(() => c.abort(), ms || 9000);
  try { const r = await fetch(url, { cache: 'no-store', signal: c.signal }); clearTimeout(t); return await r.json(); }
  finally { clearTimeout(t); }
}
async function loadRates() {
  try {
    const j = await jfetch(APP.ratesApi.fiat, 9000);
    if (j && j.rates) {
      window.CF.fiats.forEach(f => { rates.fiats[f.id] = f.id === 'USD' ? 1 : j.rates[f.id]; });
      rates.src = 'open.er-api';
    }
  } catch (e) { fallbackFiats(); }
  try {
    const j = await jfetch(APP.ratesApi.crypto, 9000);
    rates.cryptos.MON = { usd: j.monad.usd, chg: j.monad.usd_24h_change };
    rates.cryptos.WMON = { usd: j.monad.usd, chg: j.monad.usd_24h_change };
    rates.cryptos.USDC = { usd: j['usd-coin'].usd, chg: j['usd-coin'].usd_24h_change };
    rates.live = true; rates.src += ' + CoinGecko';
    setStatus('live', 'Live FX + crypto prices · ' + rates.src);
  } catch (e) {
    setStatus(rates.live ? 'live' : 'warn', 'using snapshot rates (live feed timeout)');
  }
  renderTicker(); updateQuote(); renderPortfolio();
}
function fallbackFiats() {
  window.CF.fiats.forEach(f => { rates.fiats[f.id] = rates.fiats[f.id] || f.usd; });
  rates.src = 'snapshot';
}
function usdPer(assetRef) {
  if (assetRef.kind === 'fiat') return 1 / (rates.fiats[assetRef.ref.id] || assetRef.ref.usd);
  const c = rates.cryptos[assetRef.ref.id];
  return c ? c.usd : assetRef.ref.usd;
}
function renderTicker() {
  const row = $('tickerRow');
  const items = [
    ...window.CF.cryptos.map(c => ({ e: c.emoji, s: c.id, p: usdPer({kind:'crypto',ref:c}), ch: (rates.cryptos[c.id]||{chg:c.snap24h}).chg, dp: c.id==='USDC'?4:6 })),
    ...window.CF.fiats.map(f => ({ e: flagHtml(f.id, 16), s: f.id, p: rates.fiats[f.id] || f.usd, ch: 0, dp: (f.id==='IDR'||f.id==='VND'||f.id==='KRW'||f.id==='COP')?0:3 }))
  ];
  if (!row.dataset.built) {
    // build structure once; marquee loop = two identical halves
    row.innerHTML = [0,1].map(() => items.map(it =>
      `<span class="tk" data-tk="${it.s}"><b>${it.e} ${it.s}</b> <span class="v">${fmt(it.p, it.dp)}</span>${it.ch ? ` <span class="c"></span>` : ''}</span>`
    ).join('')).join('');
    row.dataset.built = '1';
  } else {
    items.forEach(it => row.querySelectorAll(`[data-tk="${it.s}"]`).forEach(el => {
      el.querySelector('.v').textContent = fmt(it.p, it.dp);
      const c = el.querySelector('.c');
      if (c && it.ch) { const up = it.ch >= 0; c.textContent = `${up?'▲':'▼'} ${Math.abs(it.ch).toFixed(2)}%`; c.className = 'c ' + (up?'up':'dn'); }
    }));
  }
  $('lastRefresh').textContent = 'rates: ' + rates.src + ' · ' + new Date().toLocaleTimeString();
}
function setStatus(kind, txt) {
  $('statusStrip').querySelector('.dot').className = 'dot ' + (kind === 'live' ? 'live' : kind === 'warn' ? 'warn' : 'off');
  $('statusTxt').textContent = txt;
}

/* ---------- quote ---------- */
function updateQuote() {
  const upFrom = usdPer(from), upTo = usdPer(to);
  const cashout = from.kind === 'crypto';               // crypto → fiat
  const fee = cashout ? APP.feeBps / 10000 : 0;
  const a = parseFloat($('amtFrom').value) || 0;
  const rate = (upFrom / upTo) * (1 - fee);
  $('amtTo').value = a ? (a * rate).toFixed(to.ref.id === 'IDR' ? 0 : 2) : '';
  $('usdFrom').textContent = '≈ $' + fmt(a * upFrom);
  $('rateLine').textContent = a ? `1 ${from.ref.id} = ${fmt(rate, from.kind==='fiat'?6:8)} ${to.ref.id}` : 'rate auto-updates';
  const hr = $('heroRate'); if (hr) hr.textContent = `1 MON ≈ ${fmt((rates.cryptos.MON?.usd ?? .033) * (rates.fiats.IDR || 17970), 0)} IDR`;
  $('qRate').textContent = `1 ${from.ref.id} → ${fmt(upFrom / upTo, 8)} ${to.ref.id}`;
  const feeAmt = a * upFrom * fee / upTo;
  $('qFee').textContent = cashout ? `${fmt(feeAmt, to.ref.id==='IDR'?0:4)} ${to.ref.id} (${(APP.feeBps/100).toFixed(2)}%)` : 'none (top-up free)';
  $('qFeePct').textContent = (APP.feeBps/100).toFixed(2) + '%';
  $('feeNote').textContent = cashout ? `fee ${(APP.feeBps/100).toFixed(2)}%` : 'no fee';
  $('recvNote').textContent = cashout ? 'credited after on-chain settlement' : 'MON for gas included in route';
  const m = methods[0];
  $('qDest').textContent = cashout ? (m ? `${m.label || m.type} · ${m.fiat}` : '⚠ add a payment method') : '→ your wallet';
  $('qDest').style.color = (cashout && !m) ? 'var(--amb)' : '';
  $('qRoute').textContent = cashout
    ? `${from.ref.id} → vault → ${to.ref.id} via ${m ? m.label : '—'}`
    : `${to.ref.id} → vault → ${from.ref.id} on-chain`;
  $('convertBtn').textContent = !acct ? 'Connect wallet to convert'
    : cashout ? `Cash out ${from.ref.id} → ${to.ref.id}` : `Top up ${from.ref.id} → ${to.ref.id}`;
  $('convertBtn').disabled = !acct || !a;
}
function flip() { const t = from; from = to; to = t; $('amtFrom').value = $('amtTo').value === '' ? '' : ''; syncAssetBtns(); updateQuote(); }
function flagHtml(id, w) {
  const r = window.CF.regions[id];
  return r ? `<img class="fl" style="width:${w||20}px;height:${(w||20)*0.667}px" src="https://flagcdn.com/w40/${r}.png" alt="">` : (window.CF.fiats.find(f=>f.id===id)||{}).emoji || '';
}
function syncAssetBtns() {
  [['pickFrom', from], ['pickTo', to]].forEach(([id, a]) => {
    const em = $(id).querySelector('.a-emoji');
    if (a.kind === 'fiat') em.innerHTML = flagHtml(a.ref.id, 20);
    else em.textContent = a.ref.emoji;
    $(id).querySelector('.a-sym').textContent = a.ref.id;
  });
  const bf = $('balFrom');
  if (from.kind === 'crypto') {
    const bal = from.ref.id === 'MON' ? Number(monBal) / 1e18 : from.ref.id === 'WMON' ? 0 : Number(usdcBal) / 1e6;
    bf.textContent = 'Balance: ' + fmt(bal, 4) + ' ' + from.ref.id;
    bf.onclick = () => { $('amtFrom').value = String(from.ref.id === 'MON' ? Number(monBal)/1e18 : Number(usdcBal)/1e6); updateQuote(); };
  } else {
    const led = (fiatLedger.USD || 0) / usdPer(from);
    bf.textContent = 'Balance: ' + fmt(led, 2) + ' ' + from.ref.id + ' (FIAT-d)';
    bf.onclick = () => { $('amtFrom').value = String(led); updateQuote(); };
  }
}

/* ---------- picker ---------- */
function openPicker() {
  $('pickOverlay').classList.remove('hidden');
  renderPickList();
}
function pickAsset(a) {
  if (pickSide === 'from') from = a; else to = a;
  $('pickOverlay').classList.add('hidden'); syncAssetBtns(); updateQuote();
}
function renderPickList() {
  const list = $('pkList'); list.innerHTML = '';
  $('pkCrypto').classList.toggle('active', pickTab === 'crypto');
  $('pkFiat').classList.toggle('active', pickTab === 'fiat');
  if (pickTab === 'fiat') {
    // switchere-style grid: flag + code → Crypto, with search
    const wrap = document.createElement('div');
    wrap.innerHTML = `<input class="pk-search" placeholder="Search currency… (USD, Rupiah, Yen…)" autocomplete="off">`;
    const search = wrap.firstElementChild; list.appendChild(search);
    const grid = document.createElement('div'); grid.className = 'pk-grid'; list.appendChild(grid);
    const draw = () => {
      const q = search.value.toLowerCase().trim();
      grid.innerHTML = '';
      window.CF.fiats
        .filter(f => !q || f.id.toLowerCase().includes(q) || f.name.toLowerCase().includes(q))
        .forEach(f => {
          const a = { kind: 'fiat', ref: f };
          const b = document.createElement('button'); b.className = 'pk-pill';
          b.innerHTML = `<img class="fl" src="https://flagcdn.com/w40/${window.CF.regions[f.id]}.png" alt=""> <b>${f.id}</b>`;
          b.title = f.name;
          b.onclick = () => pickAsset(a);
          grid.appendChild(b);
        });
      if (!grid.children.length) grid.innerHTML = '<div class="pm-empty" style="grid-column:1/-1">No currency matches "' + search.value + '"</div>';
    };
    search.oninput = draw; draw();
    search.focus();
    return;
  }
  const src = window.CF.cryptos.map(r => ({ kind: 'crypto', ref: r }));
  src.forEach(a => {
    const price = usdPer(a);
    const b = document.createElement('button'); b.className = 'pk-row';
    b.innerHTML = `<span class="n">${a.ref.emoji}</span><span><b>${a.ref.id}</b><i>${a.ref.name}</i></span><span class="r">$${fmt(price,6)}</span>`;
    b.onclick = () => pickAsset(a);
    list.appendChild(b);
  });
}

/* ---------- wallet ---------- */
const PROVIDERS = [
  { id: 'metamask', label: 'MetaMask', icon: '🦊', hint: 'browser extension', get: () => window.ethereum },
  { id: 'rabby', label: 'Rabby', icon: '🐰', hint: 'browser extension', get: () => window.rabby },
  { id: 'okx', label: 'OKX Wallet', icon: '⬛', hint: 'browser extension', get: () => window.okxWallet },
  { id: 'bitget', label: 'Bitget Wallet', icon: '💠', hint: 'browser extension', get: () => window.bitkeep?.ethereum },
  { id: 'coinbase', label: 'Coinbase Wallet', icon: '🔵', hint: 'CDP / extension', get: () => window.coinbaseWalletExtension },
  { id: 'trust', label: 'Trust Wallet', icon: '🛡', hint: 'browser extension', get: () => window.trustWallet },
  { id: 'ledger', label: 'Ledger', icon: '🔐', hint: 'USB · open Ethereum app, confirm on device', hwFn: () => ledgerConnect() },
  { id: 'trezor', label: 'Trezor', icon: '🌳', hint: 'USB · confirm on device', hwFn: () => trezorConnect() },
  { id: 'injected', label: 'Other injected', icon: '🪪', hint: 'any EIP-1193', get: () => window.ethereum }
];
function openWallet() {
  const list = $('walletList'); list.innerHTML = '';
  if (acct) {
    list.innerHTML = `<div class="pm-empty">${acct.slice(0,10)}…${acct.slice(-8)} connected<br><br><button class="btn" id="wmSign">Sign out</button></div>`;
    $('wmSign').onclick = signOut; return;
  }
  PROVIDERS.forEach(p => {
    const b = document.createElement('button'); b.className = 'pk-row';
    b.innerHTML = `<span class="n">${p.icon}</span><span><b>${p.label}</b><i>${p.hint}</i></span>`;
    b.onclick = () => p.hwFn ? connectHW(p) : connect(p);
    list.appendChild(b);
  });
  $('walletOverlay').classList.remove('hidden');
}
async function connectHW(p) {
  if (!navigator.usb) { toast('WebUSB needs Chrome or Edge (desktop)', 'err'); return; }
  showFloat(`opening ${p.label}…`);
  if (window.HW) HW.ui = (msg) => msg ? showFloat(msg) : hideFloat();
  try {
    const prov = await p.hwFn();
    hideFloat();
    P = prov; acct = (await prov.request({ method: 'eth_accounts' }))[0];
    $('walletOverlay').classList.add('hidden');
    $('connectBtn').textContent = acct.slice(0, 6) + '…' + acct.slice(-4);
    $('pfAddr').textContent = acct;
    await refreshBalances();
    toast(`${p.label} connected ⚡`, 'ok');
  } catch (e) { hideFloat(); toast(p.label + ': ' + (e.message || e).toString().slice(0, 70), 'err'); }
}
async function connect(p) {
  const eth = p.get && p.get();
  if (!eth || !eth.request) { toast(`${p.label} not detected in this browser`, 'err'); return; }
  P = eth;
  try {
    let accs = await P.request({ method: 'eth_requestAccounts' });
    if (!accs.length) accs = await P.request({ method: 'eth_accounts' });
    if (!accs.length) { toast('no accounts returned', 'err'); return; }
    let cid;
    try { cid = await P.request({ method: 'eth_chainId' }); } catch (e) { cid = '0x'; }
    if (String(cid).toLowerCase() !== APP.chainIdHex) {
      try {
        await P.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: APP.chainIdHex }] });
      } catch (err) {
        if (err?.code === 4902 || /Unrecognized/i.test(err?.message || '')) {
          await P.request({ method: 'wallet_addEthereumChain', params: [{
            chainId: APP.chainIdHex, chainName: APP.chainName, nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 },
            rpcUrls: [APP.rpc], blockExplorerUrls: ['https://testnet.monadvision.com'] }] });
        } else { toast('wallet rejected chain switch', 'err'); return; }
      }
    }
    acct = accs[0];
    $('walletOverlay').classList.add('hidden');
    $('connectBtn').textContent = acct.slice(0, 6) + '…' + acct.slice(-4);
    $('pfAddr').textContent = acct;
    await refreshBalances();
    toast('Connected on Monad Testnet ⚡', 'ok');
  } catch (e) { toast('connect rejected: ' + (e.message || e).toString().slice(0, 60), 'err'); }
}
function signOut() { acct = null; P = null; monBal = usdcBal = 0n; $('walletOverlay').classList.add('hidden'); $('connectBtn').textContent = 'Connect wallet'; $('pfAddr').textContent = 'not connected'; syncAssetBtns(); updateQuote(); renderPortfolio(); }
async function refreshBalances() {
  if (!P || !acct) return;
  try {
    monBal = BigInt(await P.request({ method: 'eth_getBalance', params: [acct, 'latest'] }));
    const data = '0x70a08231' + acct.slice(2).toLowerCase().padStart(64, '0');
    const t = window.CF.cryptos.find(c => c.id === 'USDC');
    usdcBal = BigInt(await P.request({ method: 'eth_call', params: [{ to: t.addr, data }, 'latest'] }));
  } catch (e) { setStatus('warn', 'RPC busy — balances may be stale'); }
  syncAssetBtns(); renderPortfolio(); updateQuote();
}

/* ---------- convert ---------- */
async function convert() {
  const a = parseFloat($('amtFrom').value);
  if (!acct || !a || a <= 0) return;
  const cashout = from.kind === 'crypto';
  // balance guard
  const avail = from.kind === 'crypto'
    ? (from.ref.id === 'MON' ? Number(monBal) / 1e18 : Number(usdcBal) / 10 ** from.ref.decimals)
    : (fiatLedger.USD || 0) / usdPer(from);
  if (a > avail) { toast(`amount exceeds balance (${fmt(avail,4)} ${from.ref.id}${from.kind==='fiat'?' FIAT-d':''})`, 'err'); return; }
  const outVal = parseFloat($('amtTo').value) || 0;
  if (cashout) {
    // 1) on-chain: move crypto to vault (native MON transfer, or ERC-20 transfer for USDC)
    const to_ = to.ref.id;
    showFloat(`sending ${from.ref.id} to vault on Monad…`);
    try {
      let hash;
      if (from.ref.kind === 'native') {
        hash = await P.request({ method: 'eth_sendTransaction', params: [{ from: acct, to: APP.defaultVault, value: '0x' + BigInt(Math.floor(a * 1e18)).toString(16) }] });
      } else if (from.ref.kind === 'erc20') {
        const data = '0xa9059cbb' + APP.defaultVault.slice(2).toLowerCase().padStart(64, '0') + BigInt(Math.floor(a * 10 ** from.ref.decimals)).toString(16).padStart(64, '0');
        hash = await P.request({ method: 'eth_sendTransaction', params: [{ from: acct, to: from.ref.addr, data }] });
      } else { // WMON demo leg — no pool on testnet yet
        setStatus('warn', 'WMON leg: route pending (no on-chain venue yet on testnet)');
      }
      if (hash) {
        showFloat('confirming…');
        await waitReceipt(hash);
        fiatLedger.USD = (fiatLedger.USD || 0) + outVal * usdPer(to);
        save('cf.fiatd', fiatLedger);
        pushHist({ type: `CASHOUT ${from.ref.id} → ${to_}`, hash, amt: `${fmt(a,6)} ${from.ref.id} → ${fmt(outVal, to_==='IDR'?0:2)} ${to_}` });
        hideFloat();
        $('txNote').className = 'note txok';
        $('txNote').innerHTML = `✅ on-chain ${from.ref.id} → vault settled · ${fmt(outVal, to_==='IDR'?0:2)} ${to_} marked ${methods[0] ? 'for payout via ' + (methods[0].label || methods[0].type) : 'as FIAT-d (add payout method)'} · <a href="${APP.explorerTx}${hash}" target="_blank" rel="noopener">view on explorer</a>`;
        toast('Cashout settled on-chain ✓', 'ok');
      } else {
        hideFloat();
        pushHist({ type: `CASHOUT ${from.ref.id} → ${to_} (demo leg)`, hash: null, amt: `${fmt(a,6)} ${from.ref.id} → ${fmt(outVal, to_==='IDR'?0:2)} ${to_}` });
        $('txNote').innerHTML = `ℹ️ ${from.ref.id} leg is indicative on testnet (no venue yet) — fiat credit shown as FIAT-d in Portfolio.`;
      }
    } catch (e) { hideFloat(); toast('tx rejected/cancelled: ' + (e.message || '').slice(0, 70), 'err'); }
  } else {
    // fiat → crypto top-up: debit FIAT-d ledger (no real fiat rail exists on testnet)
    const usdNeed = a * usdPer(from);
    if ((fiatLedger.USD || 0) < usdNeed) {
      $('txNote').innerHTML = '⚠️ FIAT-d balance too low for this top-up. Cash out first, or wait for a fiat partner on mainnet. <button class="btn" id="demoFund" style="padding:4px 10px;font-size:11px;margin-left:8px">demo fund $100</button>';
      $('demoFund').onclick = () => { fiatLedger.USD = (fiatLedger.USD || 0) + 100; save('cf.fiatd', fiatLedger); renderPortfolio(); $('txNote').textContent = ''; updateQuote(); };
      return;
    }
    fiatLedger.USD -= usdNeed; save('cf.fiatd', fiatLedger);
    if (to.ref.id === 'MON') { monBal += BigInt(Math.floor(a * 1e18)); }   // demo credit; mainnet: partner mints/sends MON
    pushHist({ type: `TOPUP ${from.ref.id} → ${to.ref.id}`, hash: null, amt: `${fmt(a,2)} ${from.ref.id} → ${fmt(outVal,6)} ${to.ref.id}` });
    $('txNote').innerHTML = `ℹ️ Top-up simulated in FIAT-d ledger + wallet balance (testnet has no real fiat rails — this is the honest part: on mainnet this leg runs through the payout partner).`;
    toast('Top-up recorded (demo)', 'ok');
  }
  $('amtFrom').value = '';
  await refreshBalances(); renderPortfolio(); updateQuote();
}
function showFloat(t) { $('txFloat').classList.remove('hidden'); $('txFloatTxt').textContent = t; }
function hideFloat() { $('txFloat').classList.add('hidden'); }
async function waitReceipt(hash) {
  for (let i = 0; i < 40; i++) {
    try { const r = await P.request({ method: 'eth_getTransactionReceipt', params: [hash] }); if (r) { if (r.status === '0x0') throw new Error('tx reverted'); return r; } } catch (e) { if (/revert/.test(e.message)) throw e; }
    await new Promise(rs => setTimeout(rs, 1200));
  }
  return null;
}
function pushHist(h) { h.time = new Date().toISOString(); hist.unshift(h); hist = hist.slice(0, 30); save('cf.hist', hist); }

/* ---------- portfolio ---------- */
function renderPortfolio() {
  const rows = $('pfRows'); rows.innerHTML = '';
  const holdings = [
    { ref: { id: 'MON', emoji: '🟣', name: 'Monad' }, bal: Number(monBal) / 1e18, live: acct },
    { ref: { id: 'USDC', emoji: '💵', name: 'USD Coin' }, bal: Number(usdcBal) / 1e6, live: acct },
    { ref: { id: 'FIAT-d', emoji: '🏦', name: 'Fiat cash (demo)' }, bal: (fiatLedger.USD || 0), demo: true }
  ];
  let total = 0;
  holdings.forEach(h => {
    const price = h.ref.id === 'MON' ? (rates.cryptos.MON?.usd ?? 0.033)
                : h.ref.id === 'USDC' ? 1 : 1;
    const val = (h.bal || 0) * price; total += val;
    rows.insertAdjacentHTML('beforeend',
      `<div class="pf-row"><span class="as">${h.ref.emoji}<span>${h.ref.id}<i>${h.ref.name}${h.demo?' · demo':''}</i></span></span><span class="v">${fmt(h.bal||0,4)}</span><span class="v">$${fmt(price,6)}</span><span class="v">$${fmt(val,2)}</span><span>${h.ref.id!=='VAULT'?`<button class="conv" data-c="${h.ref.id}">Convert</button>`:''}</span></div>`);
  });
  $('pfTotal').textContent = '$' + fmt(total, 2);
  rows.querySelectorAll('.conv').forEach(b => b.onclick = () => {
    const id = b.dataset.c === 'FIAT-d' ? 'USD' : b.dataset.c;
    from = asset(id); to = asset(id === 'MON' ? 'USD' : 'MON');
    switchView('swap'); syncAssetBtns(); updateQuote();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  const hb = $('histBox');
  if (!hist.length) { hb.innerHTML = '<p class="empty">No conversions yet — your first cashout will show up here.</p>'; }
  else hb.innerHTML = hist.map(h =>
    `<div class="h-row"><span><span class="h-type">${h.type}</span> <small>${new Date(h.time).toLocaleString()}</small></span><span>${h.amt} ${h.hash ? `<a href="${APP.explorerTx}${h.hash}" target="_blank" rel="noopener">tx ↗</a>` : '<small>(demo)</small>'}</span></div>`).join('');
}

/* ---------- payment methods ---------- */
function renderPM() {
  const list = $('pmList'); list.innerHTML = '';
  if (!methods.length) list.innerHTML = '<div class="pm-empty">No payout methods yet.<br>Add a bank / e-wallet / card on the right →</div>';
  methods.forEach((m, i) => {
    const pt = APP.pmTypes.find(t => t.id === m.type) || { label: m.type, emoji: '💳', fields: [] };
    const div = document.createElement('div'); div.className = 'pm-item';
    div.innerHTML = `<span class="pe">${pt.emoji}</span><span class="pi-b"><b>${m.label || pt.label}${i===0?'<span class="def">DEFAULT</span>':''}</b><small>${masked(m)} · ${pt.label} · ETA ${pt.eta} · fiat ${m.fiat}</small></span><button class="del" title="remove">✕</button>`;
    div.querySelector('.del').onclick = () => { methods.splice(i, 1); save('cf.methods', methods); renderPM(); updateQuote(); toast('method removed'); };
    list.appendChild(div);
  });
}
function masked(m) {
  return Object.entries(m.data).filter(([k,v])=>v).map(([k,v]) => {
    const ptm = APP.pmTypes.find(t=>t.id===m.type) || {fields:[]};
    const f = (ptm.fields.find(x=>x.k===k) || {});
    return `${k}: ${f.masked ? '••••' + String(v).slice(-4) : v}`;
  }).join(' · ');
}
function renderPMForm() {
  const box = $('pmFields'); box.innerHTML = '';
  const pt = APP.pmTypes.find(t => t.id === pmType);
  (pt.fields || []).forEach(f => {
    const lab = document.createElement('label'); lab.className = 'fl';
    if (f.type === 'select') {
      lab.innerHTML = `${f.label}<select data-k="${f.k}">${f.options.map(o=>`<option>${o}</option>`).join('')}</select>`;
    } else {
      lab.innerHTML = `${f.label}<input data-k="${f.k}" placeholder="${f.placeholder||''}" ${f.masked?'inputmode="numeric"':''}>`;
    }
    box.appendChild(lab);
  });
  $('pmHint').textContent = '🔒 stored in localStorage only — testnet demo, nothing is transmitted.';
  validatePM();
}
function validatePM() {
  const pt = APP.pmTypes.find(t => t.id === pmType);
  const ok = pt.fields.every(f => (document.querySelector(`[data-k="${f.k}"]`)?.value || '').trim());
  $('pmSave').disabled = !ok;
}
function savePM() {
  const pt = APP.pmTypes.find(t => t.id === pmType);
  const data = {}; pt.fields.forEach(f => data[f.k] = document.querySelector(`[data-k="${f.k}"]`).value.trim());
  methods.push({ type: pmType, label: $('pmLabel').value.trim(), fiat: $('pmFiat').value, data });
  save('cf.methods', methods); renderPM(); updateQuote(); toast('payout method saved ✓', 'ok');
  $('pmLabel').value = ''; renderPMForm();
}

/* ---------- wiring ---------- */
function switchView(v) {
  document.querySelectorAll('.view').forEach(s => s.classList.toggle('active', s.id === 'view-' + v));
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.view === v));
}
$('tabs').addEventListener('click', e => { const t = e.target.closest('.tab'); if (t) { switchView(t.dataset.view); if (t.dataset.view === 'portfolio') renderPortfolio(); } });
$('connectBtn').onclick = openWallet;
$('walletOverlay').addEventListener('click', e => { if (e.target === $('walletOverlay')) $('walletOverlay').classList.add('hidden'); });
$('pickFrom').onclick = () => { pickSide = 'from'; pickTab = from.kind === 'crypto' ? 'crypto' : 'fiat'; $('pickTitle').textContent = 'Convert FROM…'; openPicker(); };
$('pickTo').onclick = () => { pickSide = 'to'; pickTab = to.kind === 'crypto' ? 'crypto' : 'fiat'; $('pickTitle').textContent = 'Convert INTO…'; openPicker(); };
$('pickOverlay').addEventListener('click', e => { if (e.target === $('pickOverlay')) $('pickOverlay').classList.add('hidden'); });
$('pkCrypto').onclick = () => { pickTab = 'crypto'; renderPickList(); };
$('pkFiat').onclick = () => { pickTab = 'fiat'; renderPickList(); };
$('flipBtn').onclick = flip;
$('amtFrom').addEventListener('input', updateQuote);
$('convertBtn').onclick = convert;
$('quickFrom').innerHTML = [25,50,100].map(q => `<button data-pct="${q}">${q}%</button>`).join('');
$('quickFrom').querySelectorAll('button').forEach(b => b.onclick = () => {
  const avail = from.kind === 'crypto'
    ? (from.ref.id === 'MON' ? Number(monBal) / 1e18 : from.ref.id === 'WMON' ? 0 : Number(usdcBal) / 10 ** from.ref.decimals)
    : (fiatLedger.USD || 0) / usdPer(from);
  $('amtFrom').value = String(Math.floor(avail * Number(b.dataset.pct) / 100 * 1e8) / 1e8);
  updateQuote();
});
APP.pmTypes.forEach(t => {
  const b = document.createElement('button'); b.textContent = `${t.emoji} ${t.label}`; b.dataset.t = t.id;
  if (t.id === pmType) b.classList.add('on');
  b.onclick = () => { pmType = t.id; document.querySelectorAll('.pm-types button').forEach(x => x.classList.toggle('on', x === b)); renderPMForm(); };
  $('pmTypes').appendChild(b);
});
$('pmFiat').innerHTML = window.CF.fiats.map(f => `<option value="${f.id}">${f.id} — ${f.name}</option>`).join('');
$('pmSave').onclick = savePM;
$('pmFields').addEventListener('input', validatePM);

// vault settings
const setBtn = document.createElement('button'); setBtn.className = 'btn'; setBtn.textContent = '⚙ vault';
setBtn.style.cssText = 'padding:6px 10px;font-size:12px';
setBtn.onclick = () => {
  const v = prompt('Settlement vault address (where cashouts land on-chain):', $('netChip').dataset.vault || APP.defaultVault);
  if (v && /^0x[a-fA-F0-9]{40}$/.test(v.trim())) { APP.defaultVault = v.trim(); $('netChip').dataset.vault = v; toast('vault updated ✓', 'ok'); }
  else if (v) toast('invalid address — vault unchanged', 'err');
};
document.querySelector('.top-right').appendChild(setBtn);

function boot() {
  if (window.__cfBooted) return;
  window.__cfBooted = true;
  fallbackFiats();
  syncAssetBtns(); renderPM(); renderPMForm(); renderTicker(); updateQuote(); renderPortfolio();
  setStatus('warn', 'connecting price feeds…');
  loadRates(); setInterval(loadRates, 60000);
  setInterval(() => { if (P && acct) refreshBalances().catch(() => {}); }, 45000);
  if (window.ethereum?.on) {
    window.ethereum.on('accountsChanged', a => { a.length ? (acct = a[0], refreshBalances()) : signOut(); });
    window.ethereum.on('chainChanged', c => { if (String(c).toLowerCase() !== APP.chainIdHex) toast('wallet moved off Monad Testnet — switch back to 10143', 'err'); else refreshBalances(); });
  }
}
boot();

/* hero currency rotator — fades through all 48 currencies */
(() => {
  const rot = $('heroRot'); if (!rot) return;
  let i = 0;
  setInterval(() => {
    rot.classList.add('swapout');
    setTimeout(() => {
      i = (i + 1) % window.CF.fiats.length;
      const f = window.CF.fiats[i];
      rot.innerHTML = `<img class="fl" src="https://flagcdn.com/w40/${window.CF.regions[f.id]}.png" alt="">${f.id}`;
      rot.classList.remove('swapout');
    }, 300);
  }, 2600);
})();
})();
