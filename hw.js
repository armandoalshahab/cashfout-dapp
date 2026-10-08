/* ---------- Hardware wallets: Ledger & Trezor over WebUSB ---------- */
/* Sign-on-device flow: build tx via RPC (CORS-open Monad testnet), sign on
   device, broadcast eth_sendRawTransaction. Provider exposes the same
   EIP-1193 request() the rest of the app already uses. */

const HW = { ui: null };  // app.js sets HW.ui = (msg) => showFloat(msg)
const APP = Object.assign({}, window.CF, window.CF.app);

function h2b(h) {
  h = String(h).replace(/^0x/i, '');
  if (h.length % 2) h = '0' + h;
  const a = new Uint8Array(h.length / 2);
  for (let i = 0; i < a.length; i++) a[i] = parseInt(h.slice(2 * i, 2 * i + 2), 16);
  return a;
}
const strip0x = h => String(h || '').replace(/^0x/i, '');
const bemin = h => { const b = h2b(h); let i = 0; while (i < b.length - 1 && b[i] === 0) i++; return b.slice(i); }
const bezero = h => { const s = strip0x(h).replace(/^(00)+/, '').replace(/^0+/, ''); return s ? h2b(s) : new Uint8Array(0); };
const cat = (...arr) => { const o = new Uint8Array(arr.reduce((s, x) => s + x.length, 0)); let p = 0; for (const x of arr) { o.set(x, p); p += x.length; } return o; };

function rlp(item) {
  if (!(item instanceof Uint8Array)) return rlpList(item);
  if (item.length === 1 && item[0] < 0x80) return item;
  if (item.length < 56) return cat(new Uint8Array([0x80 + item.length]), item);
  const l = bemin(item.length.toString(16));
  return cat(new Uint8Array([0xb7 + l.length]), l, item);
}
function rlpList(arr) {
  const pl = cat(...arr.map(rlp));
  if (pl.length < 56) return cat(new Uint8Array([0xc0 + pl.length]), pl);
  const l = bemin(pl.length.toString(16));
  return cat(new Uint8Array([0xf7 + l.length]), l, pl);
}
const bytesToHex = b => '0x' + [...b].map(x => x.toString(16).padStart(2, '0')).join('');

async function jrpc(method, params) {
  const res = await fetch(APP.rpc, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: Date.now(), method, params: params || [] })
  }).then(r => r.json());
  if (res.error) throw new Error((res.error.message || JSON.stringify(res.error)).slice(0, 90));
  return res.result;
}

function normalizeV(v) {
  const cid = parseInt(APP.chainIdHex, 16);
  let n = typeof v === 'number' ? v : parseInt(strip0x(String(v)) || '0', 16);
  if (n === 0 || n === 1) return cid * 2 + 35 + n;
  if (n === 27 || n === 28) return cid * 2 + 35 + (n - 27);
  return n;
}

function rawLegacy(tx, v, r, s) {
  return bytesToHex(rlpList([
    bezero(tx.nonce), bezero(tx.gasPrice), bezero(tx.gasLimit),
    h2b(strip0x(tx.to)), bezero(tx.value || '0x0'), h2b(strip0x(tx.data || '')),
    bezero('0x' + v.toString(16)), bezero(r), bezero(s)
  ]));
}

/* EIP-1193-shaped provider backed by an on-device signer */
function hwProvider(kind, addr, signer) {
  return {
    isHardware: true, kind,
    async request({ method, params }) {
      switch (method) {
        case 'eth_chainId': return APP.chainIdHex;
        case 'eth_requestAccounts': case 'eth_accounts': return [addr];
        case 'eth_getBalance': case 'eth_call': case 'eth_gasPrice':
        case 'eth_getTransactionCount': case 'eth_getTransactionReceipt':
        case 'eth_blockNumber': return jrpc(method, params);
        case 'wallet_switchEthereumChain': case 'wallet_addEthereumChain':
        case 'wallet_requestPermissions': return null;
        case 'eth_sendTransaction': {
          const t = params[0];
          const tx = {
            to: t.to,
            value: t.value || '0x0',
            data: t.data || '0x',
            gasLimit: t.gas || t.gasLimit || (t.data && t.data !== '0x' ? '0x186a0' : '0x5208'),
            nonce: await jrpc('eth_getTransactionCount', [t.from || addr, 'latest']),
            gasPrice: t.gasPrice || await jrpc('eth_gasPrice', [])
          };
          try { HW.ui && HW.ui(`Confirm on your ${kind === 'ledger' ? 'Ledger' : 'Trezor'} 🔐`); } catch (e) {}
          const sig = await signer(tx);
          try { HW.ui && HW.ui(null); } catch (e) {}
          const raw = rawLegacy(tx, normalizeV(sig.v), String(sig.r), String(sig.s));
          return jrpc('eth_sendRawTransaction', [raw]);
        }
        default: throw new Error(method + ' not supported over hardware wallet');
      }
    }
  };
}

/* ---------- Lazy-load local vendor bundles ---------- */
function loadScript(src) {
  return new Promise((ok, no) => {
    if (document.querySelector(`script[src="${src}"]`)) return ok();
    const t = document.createElement('script'); t.src = src;
    t.onload = ok; t.onerror = () => no(new Error('failed to load ' + src.split('/').pop()));
    document.head.appendChild(t);
  });
}

/* ---------- Ledger (WebUSB APDU via @ledgerhq) ---------- */
const L_PATH = "44'/60'/0'/0/0";
async function ledgerConnect() {
  await loadScript('vendor/ledger-bundle.js');
  const { TransportWebUSB, Eth } = window.LedgerLibs || {};
  if (!navigator.usb) throw new Error('WebUSB needs Chrome/Edge');
  const t = await TransportWebUSB.create();
  const eth = new Eth(t);
  let a;
  try {
    a = await eth.getAddress(L_PATH, { chunk: true });
  } catch (e) {
    const m = String(e && e.message || e);
    if (/0x6e01|not found|app|Open i/i.test(m)) throw new Error('open the Ethereum app on your Ledger first');
    if (/User rejected|0x6985/i.test(m)) throw new Error('address confirmation rejected on device');
    throw new Error(m.slice(0, 60));
  }
  const signer = async (tx) => {
    const cid = parseInt(APP.chainIdHex, 16);
    try {
      return await eth.signTransaction(L_PATH, {
        chainId: cid,
        nonce: bezero(tx.nonce).length ? bytesToHex(bezero(tx.nonce)) : '0x00',
        gasPrice: bytesToHex(bezero(tx.gasPrice)),
        gasLimit: bytesToHex(bezero(tx.gasLimit)),
        to: strip0x(tx.to),
        value: bytesToHex(bezero(tx.value)),
        data: strip0x(tx.data)
      });
    } catch (e) {
      const m = String(e && e.message || e);
      if (/0x6d00|INS|unknown/i.test(m)) throw new Error('Ledger refused this chain — update Ledger Live / enable clear signing');
      if (/User rejected|0x6985/i.test(m)) throw new Error('transaction rejected on Ledger');
      throw new Error(m.slice(0, 70));
    }
  };
  return hwProvider('ledger', a.address, signer);
}

/* ---------- Trezor (official connect loader, WebUSB popup) ---------- */
function withGuard(p, ms, why) {
  let done = false;
  const timer = new Promise((_, rej) => setTimeout(() => { if (!done) rej(new Error(why)); }, ms));
  return Promise.race([p.then(v => { done = true; return v; }), timer]);
}
const T_PATH = "m/44'/60'/0'/0/0";
let _trezorInit = false;
async function trezorConnect() {
  await loadScript('https://connect.trezor.io/9/trezor-connect.js');
  const TC = window.TrezorConnect;
  if (!TC || typeof TC.ethereumGetAddress !== 'function') throw new Error('Trezor Connect failed to load');
  if (!_trezorInit) {
    TC.init({ manifest: { email: 'dev@cashfout.app', appUrl: location.origin }, debug: false, lazyLoad: false });
    if (typeof TC.renderWebUSBPopup === 'function') TC.renderWebUSBPopup({ link: true, target: '_self' });
    _trezorInit = true;
  }
  const g = await withGuard(TC.ethereumGetAddress({ path: T_PATH }),
    40000, 'waiting for Trezor popup/device — allow popups for this site and unlock your Trezor');
  if (!g.success) {
    const err = String(g.payload && g.payload.error || 'Trezor unavailable');
    if (/not.*found|NoDevice|transport|WebUSB/i.test(err)) throw new Error('no Trezor found over USB (Chrome/Edge, unlocked)');
    if (/Popup closed|user action/i.test(err)) throw new Error('Trezor popup closed');
    throw new Error(err.slice(0, 70));
  }
  const addr = g.payload.address;
  const cid = parseInt(APP.chainIdHex, 16);
  const signer = async (tx) => {
    const r = await withGuard(TC.ethereumSignTransaction({ path: T_PATH, transaction: {
        to: tx.to, nonce: strip0x(tx.nonce), gasPrice: strip0x(tx.gasPrice), gasLimit: strip0x(tx.gasLimit),
        value: strip0x(tx.value) || '0', data: strip0x(tx.data), chainId: cid
    } }), 60000, 'waiting for Trezor confirmation on device');
    if (!r.success) throw new Error(String(r.payload && r.payload.error || 'signing rejected on Trezor').slice(0, 70));
    return r.payload;
  };
  return hwProvider('trezor', addr, signer);
}
