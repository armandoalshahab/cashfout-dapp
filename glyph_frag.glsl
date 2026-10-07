#version 300 es
precision highp float;
in vec2 vUv;
out vec4 outColor;
uniform sampler2D uContent;
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
uniform float uDim;
uniform float uLight;
uniform float uLightRadius;
uniform float uLightHeight;
uniform float uRelief;
uniform float uStir;
uniform float uScroll;
uniform float uPageLum;
uniform float uHasContent;

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

float lum(vec3 c) {
  return dot(c, vec3(0.299, 0.587, 0.114));
}

void main () {
  vec2 frag = vec2(gl_FragCoord.x, uResolution.y - gl_FragCoord.y + uScroll);
  vec2 cuv = vec2(vUv.x, 1.0 - vUv.y);
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
    g += m * b * flick * weights[l] * (1.0 + head * uGlow * 1.4) *
      (1.0 + exc * 1.6);
    headG += m * head * weights[l] * uGlow * (1.0 + exc * 1.1);
  }
  g = max(g, 0.0);

  if (uHasContent < 0.5) {
    vec3 rainCol = mix(uColor, uHeadColor, clamp(headG, 0.0, 1.0));
    float a = clamp(g, 0.0, 1.0);
    outColor = vec4(rainCol * a, a);
    return;
  }

  vec2 e = vec2(3.0, 0.0) / uResolution;
  vec4 content = texture(uContent, cuv);
  float lC = lum(content.rgb);
  float lX1 = lum(texture(uContent, clamp(cuv - e.xy, 0.0, 1.0)).rgb);
  float lX2 = lum(texture(uContent, clamp(cuv + e.xy, 0.0, 1.0)).rgb);
  float lY1 = lum(texture(uContent, clamp(cuv - e.yx, 0.0, 1.0)).rgb);
  float lY2 = lum(texture(uContent, clamp(cuv + e.yx, 0.0, 1.0)).rgb);
  vec3 N = normalize(vec3(
    -(lX2 - lX1) * uRelief * 4.0,
    -(lY2 - lY1) * uRelief * 4.0,
    1.0
  ));
  float reliefMix = clamp(uRelief, 0.0, 1.0);
  vec2 e2 = vec2(30.0, 0.0) / uResolution;
  float bgL = (lC
    + lum(texture(uContent, clamp(cuv - e2.xy, 0.0, 1.0)).rgb)
    + lum(texture(uContent, clamp(cuv + e2.xy, 0.0, 1.0)).rgb)
    + lum(texture(uContent, clamp(cuv - e2.yx, 0.0, 1.0)).rgb)
    + lum(texture(uContent, clamp(cuv + e2.yx, 0.0, 1.0)).rgb)) * 0.2;
  float bright = smoothstep(0.55, 0.8, uPageLum) * smoothstep(0.2, 0.45, bgL);

  float lightSum = 0.0;
  float sigma2 = uLightRadius * uLightRadius * 0.5;
  float reach = uLightRadius * 1.6;
  float stride = max(1.0, ceil((uLightRadius * 1.7) / (uCell * 12.0)));
  float baseCol = floor(floor(frag.x / uCell) / stride);
  for (int o = -12; o <= 12; o++) {
    float c = (baseCol + float(o)) * stride;
    if (c < 0.0) continue;
    float dx = (c + 0.5) * uCell - frag.x;
    float wx = 1.0 - smoothstep(reach * 0.7, reach, abs(dx));
    if (wx <= 0.0) continue;
    float sp = colSpeed(c, 0.0);
    float off = colOffset(c, 0.0);
    vec2 wk = uStir > 0.0 ? wakeAt((c + 0.5) * uCell) : vec2(0.0);
    float lampBoost = 1.0 + uStir * wk.y * 1.4;
    float T = uTime * sp + off + sp * wk.x;
    float s = 1.0 - frag.y / uResolution.y + T;
    float k0 = floor(s);
    for (int h = 0; h < 2; h++) {
      float k = k0 + float(h);
      float gate = step(hash21(vec2(c, k)), uDensity);
      if (gate < 0.5) continue;
      float lamp = 0.6 + 0.4 * hash11(c * 3.97 + k * 0.713);
      float headDocY = (1.0 - (k - T)) * uResolution.y;
      vec3 dv = vec3(dx, headDocY - frag.y, uLightHeight);
      float d2 = dot(dv, dv);
      float att = exp(-d2 / sigma2);
      vec3 L = dv * inversesqrt(max(d2, 1.0));
      float dif = mix(1.0, 0.25 + 0.75 * max(dot(N, L), 0.0), reliefMix);
      lightSum += att * dif * wx * lamp * lampBoost;
    }
  }
  float ls = lightSum * uLight * (0.6 + 0.4 * uGlow);
  float lit = 2.2 * ls / (ls + 1.1);

  float dimEff = uDim * (1.0 - bright);
  float shade = mix(
    clamp(1.0 - dimEff, 0.0, 1.0),
    1.0,
    smoothstep(0.0, 1.0, lit)
  );
  vec3 col = content.rgb * shade;
  col += uColor * lit * 0.14 * (1.0 - lC * 0.75) * (1.0 - bright);
  col += uColor * clamp(lit - 1.0, 0.0, 1.0) * 0.1 * (1.0 - bright);

  vec3 glyphCol = mix(uColor, uColor * 0.24 + vec3(0.02), lC * (1.0 - bright));
  glyphCol = mix(glyphCol, uHeadColor, clamp(headG, 0.0, 1.0));
  glyphCol = mix(glyphCol, vec3(1.0), bright * clamp(headG - 0.6, 0.0, 0.4));
  float gA = clamp(g, 0.0, 1.0);
  float knock = gA * mix(mix(0.3, 0.88, lC), 1.0, bright);
  float paint = min(g, 1.5) * mix(1.0, mix(0.92, 1.0, bright), lC);
  col = col * (1.0 - knock) + glyphCol * paint;

  float alpha = max(content.a, gA);
  col = clamp(col, vec3(0.0), vec3(alpha));
  outColor = vec4(col, alpha);
}