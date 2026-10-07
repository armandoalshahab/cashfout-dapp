/* flame-wrap — faithful port of canvasui.dev FlameWrap WebGL2 shader.
   GLSL copied verbatim (uHasContent=0 branch), defaults copied from source,
   color recolored purple for the Monad theme. Canvas overlays the card;
   fire rises from the card's top rounded-rect border just like the reference. */
(() => {
  const card = document.querySelector('.conv-card');
  if (!card) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const VERT = `#version 300 es
precision highp float;
out vec2 vUv;
void main () {
  vec2 P[3] = vec2[3](vec2(-1.0, -1.0), vec2(3.0, -1.0), vec2(-1.0, 3.0));
  vUv = P[gl_VertexID] * 0.5 + 0.5;
  gl_Position = vec4(P[gl_VertexID], 0.0, 1.0);
}`;

  const FRAG = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 outColor;
uniform vec2 uResolution;
uniform float uTime;
uniform vec2 uRectCenter;
uniform vec2 uRectHalf;
uniform float uCorner;
uniform vec3 uColor;
uniform float uIntensity;
uniform float uHeight;
uniform float uSpread;
uniform float uScale;
uniform float uTurbulence;
uniform float uTurbScale;
uniform float uTurbReach;
uniform float uSparks;
uniform float uSparkSize;
uniform float uSparkDensity;
uniform float uSparkSpeed;
uniform float uRim;
uniform float uMelt;
uniform float uSmoke;
uniform float uEmber;
uniform float uScorch;

#define S(a, b, t) smoothstep(a, b, t)

vec3 permute (vec3 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }

float snoise (vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz; x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m; m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

float fbm (vec2 p) {
  mat2 m = mat2(0.8, -0.6, 0.6, 0.8);
  float v = 0.5 * snoise(p);
  p = m * p * 2.03 + vec2(11.3, 7.1); v += 0.27 * snoise(p);
  p = m * p * 1.97 + vec2(3.7, 19.1); v += 0.15 * snoise(p);
  p = m * p * 2.01 + vec2(8.3, 2.9);  v += 0.08 * snoise(p);
  return v * 0.5 + 0.5;
}

float fbm2 (vec2 p) {
  float v = 0.62 * snoise(p);
  v += 0.31 * snoise(mat2(0.8, -0.6, 0.6, 0.8) * p * 2.13 + vec2(5.2, 1.3));
  return v * 0.54 + 0.5;
}

vec2 turbulence (vec2 p) {
  float freq = 12.0 * clamp(uScale, 0.05, 1.0) * clamp(uTurbScale, 0.2, 3.0);
  mat2 rot = mat2(0.6, -0.8, 0.8, 0.6);
  for (float i = 0.0; i < 7.0; i++) {
    float phase = freq * (p * rot).y + 6.0 * uTime + i;
    p += uTurbulence * rot[0] * sin(phase) / freq;
    rot *= mat2(0.6, -0.8, 0.8, 0.6);
    freq *= 1.2;
  }
  return p;
}

vec3 hash3 (vec2 p) {
  vec3 q = vec3(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)), dot(p, vec2(419.2, 371.9)));
  return fract(sin(q) * 43758.5453);
}

float sdRoundRect (vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

void main () {
  vec2 frag = vUv * uResolution;
  vec2 rel = frag - uRectCenter;
  float unit = max(uHeight, 24.0);
  float corner = min(uCorner, min(uRectHalf.x, uRectHalf.y));
  float spreadPx = max(uSpread, 8.0);
  float t = uTime;
  float detail = clamp(uScale, 0.05, 1.0);

  float d0 = sdRoundRect(rel, uRectHalf, corner);
  float px = rel.x / unit;
  float py = rel.y / unit;

  float yA = max(rel.y - uRectHalf.y, 0.0) / unit;
  float sway = snoise(vec2(px * 1.1, t * 0.5)) * 0.55 + snoise(vec2(px * 2.4, t * 0.9 + 41.0)) * 0.25;
  float sx = px + yA * sway;
  float env = fbm2(vec2(sx * 1.6 * detail + 3.7, t * 0.55 - yA * 0.4));
  float env2 = fbm2(vec2(sx * 3.6 * detail, t * 0.85 + 17.0 - yA * 0.6));
  float tongue = clamp(0.75 * S(0.3, 0.9, env) + 0.5 * S(0.4, 0.95, env2), 0.0, 1.0);

  float meltPx = max(uMelt, 1.0);
  float biteTop = (3.0 + meltPx * 1.4) * (0.35 + 0.65 * tongue) + 2.0 * snoise(vec2(px * 5.0 * detail, t * 1.1 + 5.0));
  float yF = uRectHalf.y - biteTop;
  float frontTop = rel.y - yF;

  float perim = fbm2(rel * (1.9 / unit) * detail + vec2(0.0, t * 0.4) + 31.0);
  float biteSB = 3.0 + meltPx * (0.25 + 0.75 * perim);
  float frontSB = d0 + biteSB;

  float wTop = S(-0.62 * unit, -0.1 * unit, rel.y - uRectHalf.y)
    * S(10.0, -30.0, abs(rel.x) - (uRectHalf.x - corner));
  float front = mix(frontSB, frontTop, wTop);

  float reach = mix(spreadPx * 0.9, unit * (0.2 + 0.45 * tongue), wTop);
  float q = front / reach;

  vec2 np = vec2(px * 2.3, py * 1.25 - t * 1.85) * detail;
  np = turbulence(np);
  float n = fbm(np);

  float win = S(-0.08, 0.02, q);
  float root = exp(-abs(q) * 5.0);
  float ridge = 1.0 - abs(2.0 * n - 1.0);
  float flameH = mix(1.0, 0.5 + 0.6 * tongue, wTop);
  float g = max(q, 0.0) / flameH;
  float shred = fbm2(np * 1.9 + 63.0);
  g *= 1.0 + 0.7 * (shred - 0.5) * S(0.2, 0.8, g);
  float dens = n * 0.95 + ridge * 0.45 - 0.18 + (1.0 - min(g, 1.0)) * 0.3 - g * (0.9 + 0.25 * n);
  dens = clamp(dens * 2.4, 0.0, 1.0) * win;
  dens *= mix(1.0 - S(0.32, 1.05, q), 1.0 - S(0.9, 1.2, g), wTop);
  float body = dens * dens * (3.0 - 2.0 * dens);
  float emis = clamp(uIntensity, 0.0, 2.0);
  float e = body * (0.55 + 0.75 * root) * (0.45 + 0.55 * n) + win * root * (0.1 + 0.4 * n);
  e *= mix(0.45, 1.0, wTop) * max(emis, 0.001);

  vec3 hot = mix(uColor, vec3(1.0), 0.35);
  vec3 deep = mix(uColor, uColor * uColor, 0.5) * 0.9;
  float ramp = 1.0 - exp(-e * 2.4);
  vec3 fireCol = mix(deep, uColor, S(0.0, 0.55, ramp));
  float core = ramp * (0.45 + 0.55 * exp(-g * 2.2)) * (0.5 + 0.5 * n);
  fireCol = mix(fireCol, hot, S(0.7, 1.05, core));
  fireCol *= 0.8 + 0.4 * ramp;
  float fireA = clamp(1.0 - exp(-e * 3.4), 0.0, 1.0);

  float halo = exp(-max(front, 0.0) / (spreadPx * 1.2)) * S(0.0, 3.0, front)
    * (0.5 + 0.5 * n) * 0.3 * clamp(uRim, 0.0, 2.0) * mix(1.0, 0.45, wTop);
  vec3 glow = uColor * halo * clamp(uIntensity, 0.0, 2.0);

  if (uSparks > 0.001) {
    float sSpeed = max(uSparkSpeed, 0.05);
    float sCells = 5.0 * clamp(uSparkDensity, 0.3, 2.5);
    float sSize = clamp(uSparkSize, 0.2, 3.0);
    float gate = S(-0.05, 0.1, q) * (1.0 - S(1.3, 2.2, q)) * wTop;
    float spark = 0.0;
    for (float L = 0.0; L < 2.0; L++) {
      float speed = 1.5 * sSpeed * (0.75 + 0.5 * L);
      vec2 ps = vec2(px, py - t * speed);
      ps.x += 0.08 * snoise(vec2(py * 0.9 + L * 5.0, t * 0.5));
      float cells = sCells * (1.0 + 0.6 * L);
      vec2 cl = floor(ps * cells) + L * 19.0;
      vec2 fr = fract(ps * cells);
      vec3 rnd = hash3(cl);
      vec3 rnd2 = hash3(cl + 7.3);
      float on = step(rnd2.x, 0.42);
      float life = fract(rnd.z + t * sSpeed * (0.3 + 0.5 * rnd2.x));
      vec2 ppos = vec2(0.5) + 0.56 * (rnd.xy - 0.5);
      ppos.x += 0.14 * sin(t * (0.7 + rnd.z * 2.8) + rnd.y * 6.2832)
        + 0.1 * snoise(vec2(t * 0.6 + rnd.x * 9.0, cl.y * 0.7))
        + (life - 0.5) * 0.5 * (rnd2.y - 0.5);
      ppos.y += (life - 0.5) * 0.3 * rnd2.y;
      float tw = S(0.02, 0.2, life) * S(1.0, 0.55, life);
      tw *= 0.75 + 0.25 * sin(t * (6.0 + rnd2.z * 9.0) + rnd.x * 6.2832);
      vec2 pd = (fr - ppos) / cells * unit;
      pd.y *= 0.55 + 0.3 * rnd2.z;
      float dp = length(pd);
      float r = (0.004 + 0.014 * rnd.y * rnd.y) * unit * sSize * mix(1.15, 0.55, life);
      float bmask = S(0.5, 0.32, max(abs(fr.x - 0.5), abs(fr.y - 0.5)));
      float sbody = exp(-dp * dp / (r * r));
      float sbloom = exp(-dp * dp / (r * r * 6.0)) * 0.3;
      spark += (sbody + sbloom) * tw * tw * on * bmask * (1.0 - 0.35 * L);
    }
    spark *= gate * uSparks;
    fireCol += mix(uColor, vec3(1.0), 0.55) * spark * 1.6;
    fireA = clamp(fireA + spark * 0.85, 0.0, 1.0);
  }

  vec2 edgePx = min(frag, uResolution - frag);
  float fadeW = max(24.0, spreadPx * 0.75);
  float fade = S(0.0, fadeW, edgePx.x) * S(0.0, fadeW, edgePx.y);
  fireA *= fade; glow *= fade; halo *= fade;

  float wisp = S(0.45, 0.9, fbm2(np * 0.55 + vec2(0.0, 17.0)));
  float smoke = S(1.55, 1.05, g) * S(0.85, 1.15, g) * (1.0 - body) * wTop
    * wisp * 0.055 * clamp(uSmoke, 0.0, 2.0) * fade;
  vec3 smokeCol = mix(vec3(0.5), uColor, 0.5);

  // no-content canvas OVER the card: fire + the signature ember rim line & scorch
  // (content-branch effects painted directly: white-hot line hugging the SDF border, charred band under it)
  float burn = clamp(uIntensity, 0.0, 1.0);
  float inMask = S(3.0, 0.0, d0);                       // inside card rect, feathered
  float depth = max(-front, 0.0);
  float emberW = mix(2.5, 5.5, wTop);
  float emberN = 0.3 + 0.7 * fbm2(np * 2.2 + 73.0);
  float ember = exp(-depth / emberW) * emberN * clamp(uEmber, 0.0, 2.0) * burn;
  float whiteHot = exp(-depth / (emberW * 0.4)) * emberN * emberN * clamp(uEmber, 0.0, 2.0) * burn;
  float charPatch = 0.5 + 0.5 * fbm2(rel * (2.6 / unit) * detail + 57.0);
  float charW = mix(4.0, 6.0 + meltPx * 1.6, wTop) * charPatch;
  float charT = 1.0 - S(charW, charW * 2.4, depth);
  float charA = clamp(charT * 0.85 * burn * max(uScorch, 0.0), 0.0, 1.0);

  float sA = clamp(smoke, 0.0, 1.0);
  float a = clamp(fireA + sA * (1.0 - fireA), 0.0, 1.0);
  vec3 rgb = fireCol * fireA + glow + smokeCol * sA * (1.0 - fireA);

  float under = inMask * (1.0 - fireA);                 // only where fire doesn't already cover
  vec3 emberCol = mix(uColor * 1.2, mix(uColor, vec3(1.0), 0.3) * 1.35, clamp(whiteHot, 0.0, 1.0));
  float eA = clamp(ember, 0.0, 1.0) * under;
  float cA = charA * under * (1.0 - eA);
  rgb += emberCol * eA + vec3(0.021, 0.018, 0.026) * cA;
  a = clamp(a + eA + cA, 0.0, 1.0);
  outColor = vec4(rgb, clamp(a + halo * 0.6, 0.0, 1.0));
}`;

  const cv = document.createElement('canvas');
  let gl = null;
  try { gl = cv.getContext('webgl2'); } catch (e) {}
  if (!gl) return;                       // graceful: no WebGL2, keep the old css glow
  cv.className = 'flame-canvas';
  card.appendChild(cv);

  function sh(type, src) {
    const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.warn('flame:', gl.getShaderInfoLog(s)); return null; }
    return s;
  }
  const vs = sh(gl.VERTEX_SHADER, VERT), fs = sh(gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) { cv.remove(); return; }
  const prog = gl.createProgram();
  gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { cv.remove(); return; }
  gl.useProgram(prog);
  gl.bindVertexArray(gl.createVertexArray());
  const U = {};
  ('uResolution uTime uRectCenter uRectHalf uCorner uColor uIntensity uHeight uSpread uScale ' +
   'uTurbulence uTurbScale uTurbReach uSparks uSparkSize uSparkDensity uSparkSpeed uRim uMelt uSmoke uEmber uScorch')
    .split(' ').forEach(n => U[n] = gl.getUniformLocation(prog, n));

  // reference DEFAULTS, color → purple (#9B4DFF-ish)
  const P = { color: [0.608, 0.302, 1.0], intensity: 0.95, height: 130, spread: 10, radius: 20,
              scale: 1.0, turbulence: 0.75, turbulenceScale: 0.9, turbulenceReach: 25,
              sparks: 2.2, sparkSize: 0.55, sparkDensity: 1.5, sparkSpeed: 1.2,
              rim: 2.8, melt: 5.5, smoke: 1.6, ember: 2.4, scorch: 0.7 };
  const SPEED = 0.25;                      // reference default

  const MX = 70, MT = 230, MB = 80;        // canvas margin around the card (device px handled via dpr)
  let dpr = 1, W = 0, H = 0;

  function layout() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = card.offsetWidth + MX * 2;
    H = card.offsetHeight + MT + MB;
    const maxT = Math.min(gl.getParameter(gl.MAX_TEXTURE_SIZE), 4096);
    if (Math.max(W, H) * dpr > maxT) dpr = maxT / Math.max(W, H);
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    gl.viewport(0, 0, cv.width, cv.height);
    // card rect in GL pixel coords (y-up, gl_FragCoord space)
    const cx = (W / 2) * dpr;
    const cy = (MB + card.offsetHeight / 2) * dpr;      // CSS y from bottom = MB + h/2
    gl.uniform2f(U.uRectCenter, cx, cy);
    gl.uniform2f(U.uRectHalf, (card.offsetWidth / 2) * dpr, (card.offsetHeight / 2) * dpr);
    gl.uniform1f(U.uCorner, P.radius * dpr);
    // pixel-unit params must scale with dpr too
    gl.uniform1f(U.uHeight, P.height * dpr);
    gl.uniform1f(U.uSpread, P.spread * dpr);
    gl.uniform1f(U.uTurbReach, P.turbulenceReach * dpr);
    gl.uniform1f(U.uMelt, P.melt * dpr);
  }
  function params() {
    gl.uniform3fv(U.uColor, P.color);
    gl.uniform1f(U.uIntensity, P.intensity);
    gl.uniform1f(U.uScale, P.scale);
    gl.uniform1f(U.uTurbulence, P.turbulence);
    gl.uniform1f(U.uTurbScale, P.turbulenceScale);
    gl.uniform1f(U.uSparks, P.sparks);
    gl.uniform1f(U.uSparkSize, P.sparkSize);
    gl.uniform1f(U.uSparkDensity, P.sparkDensity);
    gl.uniform1f(U.uSparkSpeed, P.sparkSpeed);
    gl.uniform1f(U.uRim, P.rim);
    gl.uniform1f(U.uSmoke, P.smoke);
    gl.uniform1f(U.uEmber, P.ember);
    gl.uniform1f(U.uScorch, P.scorch);
  }
  function draw(t) {
    gl.uniform2f(U.uResolution, cv.width, cv.height);
    gl.uniform1f(U.uTime, t);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  gl.clearColor(0, 0, 0, 0);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  layout(); params();
  new ResizeObserver(() => { layout(); if (reduced) { gl.clear(gl.COLOR_BUFFER_BIT); draw(0.8); } }).observe(card);
  window.addEventListener('resize', layout);

  let t0 = performance.now();
  (function loop() {
    gl.clear(gl.COLOR_BUFFER_BIT);
    draw(((performance.now() - t0) / 1000) * SPEED);
    if (!reduced) requestAnimationFrame(loop);
  })();
})();
