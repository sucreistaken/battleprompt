const acct = process.env.CLOUDFLARE_ACCOUNT_ID, token = process.env.CLOUDFLARE_API_TOKEN;
const MODEL = process.env.CLOUDFLARE_IMAGE_MODEL || '@cf/black-forest-labs/flux-1-schnell';
const MAX = 40; // ~2 saat (40 x 3dk)
(async () => {
  for (let i = 1; i <= MAX; i++) {
    try {
      const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${acct}/ai/run/${MODEL}`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: 'a small red apple', steps: 4 }),
      });
      if (res.ok) { console.log(`CLOUDFLARE_OPEN ✅ (deneme ${i})`); process.exit(0); }
      const tx = await res.text();
      console.log(`[${new Date().toLocaleTimeString()}] deneme ${i}: HTTP ${res.status} ${tx.includes('neurons')?'(hala kapali)':tx.slice(0,80)}`);
    } catch (e) { console.log(`deneme ${i}: ERR ${String(e.message||e).slice(0,80)}`); }
    await new Promise(r => setTimeout(r, 180000));
  }
  console.log('CLOUDFLARE_STILL_CLOSED ⏱️ 2 saat doldu, hala acilmadi');
})();
