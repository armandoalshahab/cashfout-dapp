/* glyph-rain — faithful vanilla port of canvasui.dev GlyphRain (WebGL2).
   GLSL FRAG/VERT + atlas builder + wake field copied from the reference source;
   colors swapped to purple. Rain overlays the whole page; cursor through the
   stream makes it surge (stir). reduced-motion: single static frame. */
(() => {
  if (document.getElementById('grain-canvas')) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const out = document.createElement('canvas');
  out.id = 'grain-canvas';
  document.body.appendChild(out);
  const gl = out.getContext('webgl2', { alpha: true, depth: false, stencil: false, antialias: false, premultipliedAlpha: true });
  if (!gl) return;

  const VERT = `#version 300 es
precision highp float;
layout(location = 0) in vec2 aPos;
out vec2 vUv;
void main () {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

  const FRAG = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 outColor;
uniform sampler2D uAtlas;
uniform sampler2D uWake;
uniform vec2 uResolution;
uniform float uTime;
uniform float uCell;
uniform float uGlyphCount;
uniform float uAtlasGrid;
uniform vec3 uColor;
uniform vec3 uHeadColor;
uniform float uSpeed;
uniform float uSpeedVar;
uniform float uDensity;
uniform float uTrail;
uniform float uGlow;
uniform float uMutate;
uniform float uFlicker;
uniform float uLayers;
uniform float uStir;

float hash11(float p) {
  p = fract(p * 0.1031);
  p *= p + 33.33;
  p *= p + p;
  return fract(p);
}
float hash21(vec2 p) {
  vec3 q = fract(vec3(p.xyx) * 0.1031);
  q += dot(q, q.yzx + 33.33);
  return fract((q.x + q.y) * q.z);
}
float glyphMask(vec2 px, float cell, float seed) {
  vec2 id = floor(px / cell);
  vec2 f = fract(px / cell);
  f = f * 0.74 + 0.13;
  f.x = 1.0 - f.x;
  float tick = floor(uTime * uMutate * 1.6 + hash21(id + seed) * 9.0);
  float idx = floor(
    hash21(id * 1.71 + vec2(seed + tick * 7.31, tick * 0.613)) * uGlyphCount
  );
  float gx = mod(idx, uAtlasGrid);
  float gy = floor(idx / uAtlasGrid);
  vec2 auv = (vec2(gx, gy) + f) / uAtlasGrid;
  return texture(uAtlas, auv).a;
}
float colSpeed(float col, float seed) {
  float variance = mix(0.35, 1.0, hash11(col * 0.37 + seed + 3.1));
  return uSpeed * mix(1.0, variance, uSpeedVar) * 0.5;
}
float colOffset(float col, float seed) {
  return hash11(col * 1.713 + seed) * 9.0;
}
vec2 wakeAt(float xpx) {
  float u = clamp(xpx / max(uResolution.x, 1.0), 0.0, 1.0);
  return texture(uWake, vec2(u, 0.5)).rg;
}
void main () {
  vec2 frag = vec2(gl_FragCoord.x, uResolution.y - gl_FragCoord.y);
  float yn = 1.0 - frag.y / uResolution.y;

  const float scales[3] = float[3](1.0, 1.5, 2.2);
  const float weights[3] = float[3](1.0, 0.45, 0.22);
  const float seeds[3] = float[3](0.0, 19.7, 41.3);

  float g = 0.0;
  float headG = 0.0;
  for (int l = 0; l < 3; l++) {
    if (float(l) >= uLayers) break;
    float cell = uCell * scales[l];
    float col = floor(frag.x / cell);
    float sp = colSpeed(col, seeds[l]);
    float off = colOffset(col, seeds[l]);
    vec2 wk = uStir > 0.0 ? wakeAt((col + 0.5) * cell) : vec2(0.0);
    float exc = uStir * wk.y;
    float T = uTime * sp + off + sp * wk.x;
    float phase = fract(yn + T);
    float cyc = floor(yn + T);
    float gate = step(hash21(vec2(col, cyc) + seeds[l]), uDensity);
    float b = clamp(uTrail / (phase * 22.0), 0.0, 1.3) - 0.04;
    if (b <= 0.0 || gate < 0.5) continue;
    float flick = 1.0 + uFlicker * 0.6 *
      sin(uTime * 14.0 + hash21(vec2(col, cyc)) * 40.0 + phase * 30.0);
    float m = glyphMask(frag, cell, seeds[l] + cyc * 0.173);
    float cellYn = cell / uResolution.y;
    float head = 1.0 - smoothstep(0.0, cellYn * 1.2, phase);
    g += m * b * flick * weights[l] * (1.0 + head * uGlow * 1.4) * (1.0 + exc * 1.6);
    headG += m * head * weights[l] * uGlow * (1.0 + exc * 1.1);
  }
  g = max(g, 0.0);
  vec3 rainCol = mix(uColor, uHeadColor, clamp(headG, 0.0, 1.0));
  float a = clamp(g, 0.0, 1.0);
  outColor = vec4(rainCol * a, a);
}`;

  function sh(type, srcCode) {
    const s = gl.createShader(type); gl.shaderSource(s, srcCode); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.warn('glyph:', gl.getShaderInfoLog(s)); return null; }
    return s;
  }
  const vs = sh(gl.VERTEX_SHADER, VERT), fs = sh(gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) { out.remove(); return; }
  const prog = gl.createProgram();
  gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { out.remove(); return; }
  gl.useProgram(prog);

  const U = {};
  ('uResolution uTime uCell uGlyphCount uAtlasGrid uColor uHeadColor uSpeed uSpeedVar ' +
   'uDensity uTrail uGlow uMutate uFlicker uLayers uStir uAtlas uWake')
    .split(' ').forEach(n => U[n] = gl.getUniformLocation(prog, n));

  // reference defaults, recolored purple
  const CFG = {
    cell: 15,
    color: [0.55, 0.28, 0.95],       // violet rain
    headColor: [0.87, 0.66, 1.0],    // hot pale-violet head
    speed: 0.2, speedVariance: 0.5, density: 0.22, trail: 0.8, glow: 1.9,
    mutate: 0, flicker: 0, layers: 2, stir: 0.7, stirRadius: 260, settle: 0.9,
  };
  const CHARSET = "0123456789Z*+-<>¦=:.ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ";

  // ---- atlas (reference buildAtlas verbatim) ----
  const glyphs = Array.from(new Set(Array.from(CHARSET))).filter(g => g.trim().length > 0);
  const count = glyphs.length, grid = Math.max(Math.ceil(Math.sqrt(count)), 1), cellPx = 64;
  const ac = document.createElement('canvas');
  ac.width = grid * cellPx; ac.height = grid * cellPx;
  const actx = ac.getContext('2d');
  actx.clearRect(0, 0, ac.width, ac.height);
  actx.fillStyle = '#ffffff';
  actx.textAlign = 'center'; actx.textBaseline = 'middle';
  actx.font = `600 ${Math.round(cellPx * 0.72)}px ui-monospace, SFMono-Regular, Menlo, monospace`;
  glyphs.forEach((g, i) => {
    actx.fillText(g, ((i % grid) + 0.5) * cellPx, (Math.floor(i / grid) + 0.5) * cellPx);
  });
  const atlasTex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, atlasTex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, ac);

  // ---- wake field (reference verbatim) ----
  const WAKE_RES = 512;
  const wakeCharge = new Float32Array(WAKE_RES);
  const wakeField = new Float32Array(WAKE_RES * 2);
  let wakeLive = false, pointerX = 0, tracking = false;
  const EXT = gl.getExtension('EXT_color_buffer_float');
  const wakeTex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, wakeTex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RG32F, WAKE_RES, 1, 0, gl.RG, gl.FLOAT, wakeField);

  window.addEventListener('pointermove', e => {
    pointerX = Math.min(Math.max(e.clientX / Math.max(out.clientWidth, 1), 0), 1);
    tracking = true;
  }, { passive: true });
  window.addEventListener('pointerleave', () => { tracking = false; });

  function wakeSpan() {
    const width = Math.max(out.clientWidth, 1);
    const px = Math.min(Math.max(CFG.stirRadius, 8), 2000);
    return Math.max(px / width, 1 / WAKE_RES);
  }
  function stepWake(delta) {
    const stir = Math.min(Math.max(CFG.stir, 0), 1);
    const settleT = Math.min(Math.max(CFG.settle, 0.05), 8);
    const decay = Math.exp(-delta / settleT);
    const span = wakeSpan();
    const drive = stir > 0.001 && !reduced;
    const track = drive && tracking;
    let live = false;
    for (let i = 0; i < WAKE_RES; i++) {
      let charge = wakeCharge[i] * decay;
      if (track) {
        const d = Math.abs((i + 0.5) / WAKE_RES - pointerX) / span;
        if (d < 1) {
          const t = 1 - d;
          const target = t * t * (3 - 2 * t);
          if (target > charge) charge = target;
        }
      }
      if (charge < 1e-4) charge = 0;
      wakeCharge[i] = charge;
      if (charge > 0) {
        live = true;
        if (drive) wakeField[i * 2] += delta * stir * 2.2 * charge;
      }
      wakeField[i * 2 + 1] = charge;
    }
    if (!live && !wakeLive) return;
    wakeLive = live;
    gl.bindTexture(gl.TEXTURE_2D, wakeTex);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, WAKE_RES, 1, gl.RG, gl.FLOAT, wakeField);
  }

  // ---- fullscreen tri ----
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  let dpr = 1;
  function size() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.round(out.clientWidth * dpr), h = Math.round(out.clientHeight * dpr);
    const maxT = Math.min(gl.getParameter(gl.MAX_TEXTURE_SIZE), 4096);
    if (Math.max(w, h) > maxT) { dpr = dpr * maxT / Math.max(w, h); }
    const W = Math.round(out.clientWidth * dpr), H = Math.round(out.clientHeight * dpr);
    if (out.width !== W || out.height !== H) { out.width = W; out.height = H; }
    gl.viewport(0, 0, out.width, out.height);
    gl.useProgram(prog);
    gl.uniform1f(U.uCell, Math.min(Math.max(CFG.cell, 8), 64) * dpr);
    gl.uniform2f(U.uResolution, out.width, out.height);
    gl.uniform1f(U.uGlyphCount, count);
    gl.uniform1f(U.uAtlasGrid, grid);
    gl.uniform3fv(U.uColor, CFG.color);
    gl.uniform3fv(U.uHeadColor, CFG.headColor);
    gl.uniform1f(U.uSpeed, CFG.speed);
    gl.uniform1f(U.uSpeedVar, CFG.speedVariance);
    gl.uniform1f(U.uDensity, CFG.density);
    gl.uniform1f(U.uTrail, CFG.trail);
    gl.uniform1f(U.uGlow, CFG.glow);
    gl.uniform1f(U.uMutate, CFG.mutate);
    gl.uniform1f(U.uFlicker, CFG.flicker);
    gl.uniform1f(U.uLayers, CFG.layers);
    gl.uniform1f(U.uStir, Math.min(Math.max(CFG.stir, 0), 1));
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, atlasTex); gl.uniform1i(U.uAtlas, 0);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, wakeTex); gl.uniform1i(U.uWake, 1);
  }
  size();
  window.addEventListener('resize', size);
  gl.clearColor(0, 0, 0, 0);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);   // premultiplied

  let last = performance.now(), t0 = last;
  function render() {
    const now = performance.now();
    const delta = Math.min((now - last) / 1000, 0.05); last = now;
    stepWake(delta);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform1f(U.uTime, (now - t0) / 1000);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (!reduced) requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
})();
