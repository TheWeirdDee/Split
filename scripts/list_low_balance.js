const fs = require('fs');
const path = require('path');
const fetch = global.fetch || require('node-fetch');
const RPC = process.env.CELO_RPC_URL || 'https://forno.celo.org';
const CSV = path.join(process.cwd(), 'private', 'scripts', 'divine-keys.csv');
const THRESHOLD_CELO = parseFloat(process.argv[2] || '0.03');

function hexToBigInt(hex) {
  if (!hex) return BigInt(0);
  return BigInt(hex);
}

(async function() {
  const raw = fs.readFileSync(CSV, 'utf8');
  const lines = raw.split(/\r?\n/).filter(l => l.trim() && !l.startsWith('index,'));
  console.log('Checking', lines.length, 'wallets, threshold=', THRESHOLD_CELO, 'CELO');
  const low = [];
  for (const line of lines) {
    const [, addrRaw] = line.split(',').map(s => s.trim());
    const addr = addrRaw;
    if (!addr) continue;
    const body = JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_getBalance', params: [addr, 'latest'] });
    try {
      const res = await fetch(RPC, { method: 'POST', body, headers: { 'Content-Type': 'application/json' } });
      const j = await res.json();
      const bal = hexToBigInt(j.result || '0x0');
      const balCelo = Number(bal) / 1e18;
      if (balCelo < THRESHOLD_CELO) low.push({ addr, bal: balCelo });
    } catch (err) {
      console.error('rpc error', err.message || err);
    }
  }
  console.log('Low-balance wallets:', low.length);
  for (const w of low) console.log(w.addr, w.bal.toFixed(6));
})();
