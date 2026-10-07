/* purple flame-wrap — rising flame tongues licking the top edge of .conv-card */
(() => {
  const card = document.querySelector('.conv-card');
  if (!card || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const cv = document.createElement('canvas');
  cv.className = 'flame-canvas';
  card.appendChild(cv);
  const ctx = cv.getContext('2d');
  const H = 150, OVERLAP = 10, DPR = Math.min(window.devicePixelRatio || 1, 2);
  let W = 0, parts = [];

  function size() {
    W = card.offsetWidth + 12;
    cv.width = W * DPR; cv.height = H * DPR;
    cv.style.width = W + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  size(); new ResizeObserver(size).observe(card);

  // vertical tongue: one particle drawn as a stretched ellipse, hot core → cool tip
  function spawn(x) {
    return {
      x, y: H - OVERLAP,
      vx: (Math.random() - 0.5) * 0.35,
      vy: -(1.6 + Math.random() * 2.6),
      len: 14 + Math.random() * 26,
      wid: 3 + Math.random() * 4.5,
      t: 0, life: 26 + Math.random() * 30,
      hue: Math.random(), wob: Math.random() * 6.28
    };
  }
  let last = 0, flick = 0;
  function frame(ts) {
    requestAnimationFrame(frame);
    if (ts - last < 33) return; last = ts;
    flick = 0.85 + Math.random() * 0.3;                       // global flicker
    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter';

    // emission density varies along edge (hot spots) via slow noise
    const rate = Math.floor(W / 34);
    for (let i = 0; i < rate; i++) {
      const x = Math.random() * W;
      const hot = 0.55 + 0.45 * Math.sin(x * 0.02 + ts * 0.0012 + Math.sin(x * 0.09 + ts * 0.002));
      if (Math.random() < hot) parts.push(spawn(x));
    }
    if (parts.length > 320) parts.splice(0, parts.length - 320);

    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.t++;
      p.x += p.vx + Math.sin((p.t + p.wob) * 0.22) * 0.6;
      p.y += p.vy;
      p.vy *= 0.978;                                            // decelerate upward
      const k = p.t / p.life;
      if (k >= 1 || p.y < -20) { parts.splice(i, 1); continue; }
      const shrink = 1 - k * 0.65;
      const alpha = Math.pow(1 - k, 1.6) * 0.5 * flick;
      ctx.save();
      ctx.translate(p.x, p.y);
      // vertical tongue gradient: bottom white-violet core → magenta → transparent tip
      const g = ctx.createLinearGradient(0, 0, 0, -p.len * shrink);
      g.addColorStop(0,   `rgba(240,190,255,${alpha})`);        // hottest at base line
      g.addColorStop(0.28,`rgba(216,120,255,${alpha * 0.85})`); // violet body
      g.addColorStop(0.6, `rgba(255,94,200,${alpha * 0.5})`);   // pink lick
      g.addColorStop(1,   'rgba(120,60,255,0)');                // cool tip dissolves
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(0, -p.len * shrink * 0.5, p.wid * shrink, p.len * shrink * 0.5, 0, 0, 6.283);
      ctx.fill();
      ctx.restore();
    }

    // molten base line hugging the card edge (flame origin, brightest)
    const baseY = H - OVERLAP + 3;
    const bg = ctx.createLinearGradient(0, baseY - 7, 0, baseY + 4);
    bg.addColorStop(0, 'rgba(120,60,255,0)');
    bg.addColorStop(0.55, `rgba(205,130,255,${0.22 * flick})`);
    bg.addColorStop(1, `rgba(245,205,255,${0.4 * flick})`);
    ctx.fillStyle = bg;
    ctx.fillRect(0, baseY - 7, W, 11);
    ctx.globalCompositeOperation = 'source-over';
  }
  requestAnimationFrame(frame);
})();
