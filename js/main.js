import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { EXRLoader } from 'three/addons/loaders/EXRLoader.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import * as TX from './textures.js?v=20';
import { makeHarezmi, makePlayer, makeScribe, makeScholar } from './characters.js?v=20';
import { ERAS, STORY, BALANCE_LEVELS, QUIZ_BAGDAT, QUIZ_MISIR, SHADOW_LEVELS, AHMES, ANGLE_LEVELS, QUIZ_ISKENDERIYE, ERATO, FINALE, PASS_SCORE, HAREZMI } from './data.js?v=20';
import { apply, isSolved, solve, par, fmt, stepText, stars } from './balance.js?v=20';

const $ = (id) => document.getElementById(id);

/* ---------- Ses efektleri (WebAudio, dosya gerekmez) — M tuşu: sessiz ---------- */
let ac = null, muted = false;
function tone(f, d = 0.15, type = 'sine', v = 0.08, delay = 0) {
  if (!ac || muted) return;
  const t0 = ac.currentTime + delay, o = ac.createOscillator(), g = ac.createGain();
  o.type = type; o.frequency.value = f;
  g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(v, t0 + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
  o.connect(g).connect(ac.destination); o.start(t0); o.stop(t0 + d + 0.05);
}
function sfx(k) {
  try { if (!ac) ac = new (window.AudioContext || window.webkitAudioContext)(); if (ac.state === 'suspended') ac.resume(); } catch (e) { return; }
  if (k === 'ok') { tone(660, 0.12, 'triangle'); tone(880, 0.2, 'triangle', 0.08, 0.1); }
  else if (k === 'bad') tone(190, 0.28, 'sawtooth', 0.05);
  else if (k === 'click') tone(520, 0.05, 'square', 0.03);
  else if (k === 'win') [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.28, 'triangle', 0.08, i * 0.12));
  else if (k === 'portal') { tone(220, 0.7, 'sine', 0.07); tone(440, 0.7, 'sine', 0.05, 0.12); }
}

/* ---------- Çağa göre ortam sesi (WebAudio ile üretilir, dosya gerektirmez) ---------- */
let amb = null;
const _nbuf = {};
function noiseBuf() { if (_nbuf.b) return _nbuf.b; const b = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate), d = b.getChannelData(0); let l = 0; for (let i = 0; i < d.length; i++) { const w = Math.random() * 2 - 1; l = (l + 0.02 * w) / 1.02; d[i] = l * 3.5; } return (_nbuf.b = b); }
function ambience(name) {
  if (!ac) return;
  const now = ac.currentTime;
  if (amb) { const a = amb; a.dead = true; a.g.gain.cancelScheduledValues(now); a.g.gain.setTargetAtTime(0, now, 0.7); setTimeout(() => { a.nodes.forEach((n) => { try { n.stop(); } catch (e) { /* yok say */ } }); try { a.g.disconnect(); } catch (e) { /* yok say */ } }, 3500); }
  const g = ac.createGain(); g.gain.value = 0; g.connect(ac.destination);
  const me = { g, nodes: [], dead: false }; amb = me;
  const osc = (type, f, v, dest = g) => { const o = ac.createOscillator(), gg = ac.createGain(); o.type = type; o.frequency.value = f; gg.gain.value = v; o.connect(gg).connect(dest); o.start(); me.nodes.push(o); return { o, gg }; };
  const wind = (fc, q, v, lfoHz, lfoDepth) => {
    const src = ac.createBufferSource(); src.buffer = noiseBuf(); src.loop = true;
    const f = ac.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = fc; f.Q.value = q;
    const gg = ac.createGain(); gg.gain.value = v; src.connect(f).connect(gg).connect(g); src.start(); me.nodes.push(src);
    const l = ac.createOscillator(), lg = ac.createGain(); l.frequency.value = lfoHz; lg.gain.value = lfoDepth; l.connect(lg).connect(gg.gain); l.start(); me.nodes.push(l);
  };
  const note = (f, v, dur, vib) => {
    if (me.dead) return; const t = ac.currentTime, o = ac.createOscillator(), gg = ac.createGain(), l = ac.createOscillator(), lg = ac.createGain();
    o.type = 'sine'; o.frequency.value = f; l.frequency.value = 5.2; lg.gain.value = vib; l.connect(lg).connect(o.frequency);
    gg.gain.setValueAtTime(0.0001, t); gg.gain.linearRampToValueAtTime(v, t + dur * 0.3); gg.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(gg).connect(g); o.start(t); l.start(t); o.stop(t + dur + 0.1); l.stop(t + dur + 0.1);
  };
  const seq = (arr, vol, durMin, durMax, gapMin, gapMax, vib) => { const go = () => { if (me.dead) return; note(arr[Math.floor(Math.random() * arr.length)], vol, durMin + Math.random() * (durMax - durMin), vib); setTimeout(go, (gapMin + Math.random() * (gapMax - gapMin)) * 1000); }; setTimeout(go, 1500); };
  if (name === 'bagdat') { wind(420, 0.6, 0.05, 0.09, 0.03); osc('sine', 73.4, 0.03); osc('sine', 110, 0.015); seq([293.7, 311.1, 370, 392, 440, 466.2, 587.3], 0.05, 3.5, 5.5, 3, 7, 4); }
  else if (name === 'misir') { wind(520, 0.4, 0.07, 0.13, 0.04); wind(1400, 0.8, 0.012, 0.31, 0.01); osc('sine', 65.4, 0.03); seq([196, 220, 261.6, 293.7], 0.03, 3, 4.5, 4, 9, 2); }
  else if (name === 'iskenderiye') { wind(700, 0.3, 0.06, 0.11, 0.045); wind(2400, 1.2, 0.008, 0.07, 0.006); osc('sine', 98, 0.02); seq([880, 1174.7, 1318.5, 1568], 0.022, 1.6, 2.6, 4, 9, 1.5); }
  else { osc('sine', 110, 0.03); osc('sine', 110.8, 0.03); osc('triangle', 220, 0.012); wind(900, 0.5, 0.012, 0.2, 0.006); seq([523.3, 659.3, 784, 1046.5], 0.018, 2, 3.2, 5, 10, 1); }
  g.gain.setTargetAtTime(muted ? 0 : 1, now, 1.4);
}

/* ---------- Kutlama: konfeti ---------- */
const cfc = $('confetti'), cfx = cfc.getContext('2d'); let cfp = [], cfRun = false;
function confetti(n = 120, ox = 0.5, oy = 0.45, big = false) {
  cfc.width = innerWidth; cfc.height = innerHeight;
  const cols = ['#ffe08a', '#35d0c0', '#ff7d7d', '#7dd8ff', '#b39ddb', '#ffb347', '#7dffb0'];
  for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, v = (big ? 520 : 380) * (0.3 + Math.random() * 0.8); cfp.push({ x: ox * cfc.width, y: oy * cfc.height, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 260, r: Math.random() * 6.3, vr: (Math.random() - 0.5) * 14, w: 6 + Math.random() * 7, h: 3 + Math.random() * 5, c: cols[i % cols.length], life: 1 }); }
  if (!cfRun) { cfRun = true; let last = performance.now(); const step = (now) => { const dt = Math.min(0.05, (now - last) / 1000); last = now; cfx.clearRect(0, 0, cfc.width, cfc.height); cfp = cfp.filter((p) => p.life > 0 && p.y < cfc.height + 30); for (const p of cfp) { p.vy += 760 * dt; p.vx *= 1 - 0.9 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.r += p.vr * dt; p.life -= dt * 0.38; cfx.save(); cfx.globalAlpha = Math.min(1, p.life * 2); cfx.translate(p.x, p.y); cfx.rotate(p.r); cfx.fillStyle = p.c; cfx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); cfx.restore(); } if (cfp.length) requestAnimationFrame(step); else { cfRun = false; cfx.clearRect(0, 0, cfc.width, cfc.height); } }; requestAnimationFrame(step); }
}
const show = (id, on = true) => $(id).classList.toggle('hidden', !on);

/* ---------- Renderer ---------- */
const renderer = new THREE.WebGLRenderer({ canvas: $('game'), antialias: true });
const BASE_DPR = Math.min(devicePixelRatio, 1.5);
renderer.setPixelRatio(BASE_DPR);
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.shadowMap.autoUpdate = false; // gölgeler 2 karede bir güncellenir (loop içinde)

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 400);
camera.position.set(0, 8, 14);

const _pr = renderer.getPixelRatio();
const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(innerWidth * _pr, innerHeight * _pr, { type: THREE.HalfFloatType, samples: 4 })); // MSAA: tırtıklı kenarları yumuşatır
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.5, 0.6, 0.85);
composer.addPass(bloom);
const grade = new ShaderPass({
  uniforms: { tDiffuse: { value: null }, vig: { value: 0.5 }, sat: { value: 1.12 }, warm: { value: 0.04 }, uTime: { value: 0 }, grain: { value: 0.028 }, haze: { value: 0 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `uniform sampler2D tDiffuse; uniform float vig; uniform float sat; uniform float warm; uniform float uTime; uniform float grain; uniform float haze; varying vec2 vUv;
    void main(){
      vec2 uv = vUv;
      float band = exp(-pow((vUv.y - 0.46) * 5.0, 2.0));
      uv.x += haze * band * 0.0042 * sin(vUv.y * 140.0 + uTime * 2.4) + haze * band * 0.0018 * sin(vUv.y * 55.0 - uTime * 1.3);
      uv.y += haze * band * 0.0012 * sin(vUv.x * 90.0 + uTime * 1.7);
      vec4 c = texture2D(tDiffuse, uv);
      float d = distance(vUv, vec2(0.5));
      c.rgb *= 1.0 - vig * smoothstep(0.3, 0.9, d);
      float l = dot(c.rgb, vec3(0.299, 0.587, 0.114));
      c.rgb = mix(vec3(l), c.rgb, sat);
      c.r += warm * l; c.b -= warm * l * 0.7;
      float n = fract(sin(dot(vUv * vec2(1731.0, 1013.0) + fract(uTime) * 91.7, vec2(12.9898, 78.233))) * 43758.5453);
      c.rgb += (n - 0.5) * grain * (0.35 + l);
      gl_FragColor = vec4(c.rgb, 1.0); }`,
});
composer.addPass(grade);
composer.addPass(new OutputPass());
const pmrem = new THREE.PMREMGenerator(renderer);

addEventListener('resize', () => {
  renderer.setSize(innerWidth, innerHeight);
  composer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
});

/* ---------- Oyun durumu ---------- */
let mode = 'title'; // title story walk dialog puzzle quiz result trans
let worldName = 'hub';
const parts = {};
try { Object.assign(parts, JSON.parse(localStorage.getItem('kf_parts') || '{}')); } catch (e) { /* yok say */ }
const prog = { met: false, solvedAll: false, quizPassed: !!parts.bagdat, level: 0, stars: [] };
const progM = { met: false, solvedAll: false, quizPassed: !!parts.misir, level: 0, stars: [] };
const progI = { met: false, solvedAll: false, quizPassed: !!parts.iskenderiye, level: 0, stars: [] };
const QUIZZES = { bagdat: QUIZ_BAGDAT, misir: QUIZ_MISIR, iskenderiye: QUIZ_ISKENDERIYE };
const PROGS = { bagdat: prog, misir: progM, iskenderiye: progI };
const TALK = { bagdat: () => talkHarezmi(), misir: () => talkAhmes(), iskenderiye: () => talkErato() };
let shownParts = 0;

const worlds = {};
const player = makePlayer();
scene.add(player);
const keys = new Set();

/* ---------- Gerçek 3D karakter modelleri (assets/models/*.glb) ----------
   Dosya yoksa ya da yüklenemezse kodla çizilen karakter kalır. */
const gltfLoaderP = import('three/addons/loaders/GLTFLoader.js');
const mixers = []; let skip3D = false;
const walkU = { uWalk: { value: 0 }, uTime: { value: 0 }, uMin: { value: 0 }, uH: { value: 1 }, uCx: { value: 0 } };
/* İskeletsiz modele yürüme: bacak/kol/gövde köşe kaydırma (shader) */
function patchWalk(material, g0) {
  if (!material || material.userData.walkPatched) return;
  material.userData.walkPatched = true;
  const prev = material.onBeforeCompile;
  material.onBeforeCompile = (sh, r) => {
    if (prev) prev(sh, r);
    sh.uniforms.uWalk = walkU.uWalk; sh.uniforms.uTime = walkU.uTime;
    sh.uniforms.uMin = { value: g0.min }; sh.uniforms.uH = { value: g0.H }; sh.uniforms.uCx = { value: g0.cx };
    sh.vertexShader = 'uniform float uWalk; uniform float uTime; uniform float uMin; uniform float uH; uniform float uCx;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
      {
        float hN = (position.y - uMin) / uH;
        float sx = position.x - uCx;
        float side = sx > 0.0 ? 1.0 : -1.0;
        float ph = uTime * 9.0;
        float s1 = sin(ph + (side > 0.0 ? 0.0 : 3.14159265));
        float legW = smoothstep(0.50, 0.0, hN);
        transformed.z += s1 * 0.085 * uH * legW * uWalk;
        transformed.y += max(0.0, s1) * 0.03 * uH * legW * legW * uWalk;
        float armM = smoothstep(0.46, 0.56, hN) * (1.0 - smoothstep(0.80, 0.88, hN)) * smoothstep(0.10, 0.17, abs(sx) / uH);
        float armW = clamp((0.86 - hN) / 0.36, 0.0, 1.0);
        transformed.z += -s1 * 0.075 * uH * armM * armW * uWalk;
        transformed.x += sin(ph) * 0.01 * uH * smoothstep(0.4, 0.6, hN) * uWalk;
      }`);
  };
  material.customProgramCacheKey = () => 'kfwalk';
  material.needsUpdate = true;
}
function attachModel(group, url, height, opt = {}) {
  gltfLoaderP.then(({ GLTFLoader }) => new GLTFLoader().load(url, (gltf) => {
    const m = gltf.scene;
    let box = new THREE.Box3().setFromObject(m);
    const size = box.getSize(new THREE.Vector3());
    const g0 = { min: box.min.y, H: size.y || 1, cx: (box.min.x + box.max.x) / 2 };
    m.scale.setScalar(height / (size.y || 1));
    box = new THREE.Box3().setFromObject(m);
    const c = box.getCenter(new THREE.Vector3());
    m.position.set(-c.x, -box.min.y, -c.z);
    if (opt.rotY) m.rotation.y = opt.rotY;
    m.traverse((o) => {
      if (!o.isMesh) return;
      o.castShadow = !opt.holo; o.receiveShadow = false;
      if (opt.holo) o.material = new THREE.MeshBasicMaterial({ color: 0x4fe3ff, transparent: true, opacity: 0.5, depthWrite: false, blending: THREE.AdditiveBlending });
      else if (o.material && 'envMapIntensity' in o.material) o.material.envMapIntensity = 0.6;
    });
    group.children.forEach((ch) => { if (ch.isMesh || ch.isGroup) ch.visible = false; });
    const piv = new THREE.Group(); piv.add(m); group.add(piv);
    if (!opt.holo) blobShadow(group, height * 0.3, 0.5);
    group.userData.model = piv;
    group.userData.hasModel = true;
    if (opt.walk && !(gltf.animations && gltf.animations.length)) m.traverse((o) => { if (o.isMesh) (Array.isArray(o.material) ? o.material : [o.material]).forEach((mt) => patchWalk(mt, g0)); });
    if (gltf.animations && gltf.animations.length) {
      const mx = new THREE.AnimationMixer(m), acts = {};
      gltf.animations.forEach((c) => { acts[c.name] = mx.clipAction(c); });
      mixers.push(mx);
      const names = Object.keys(acts);
      console.info('[KF] animasyonlar', url, names);
      const find = (re) => names.find((n) => re.test(n));
      let walk = find(/walk|run|y.r.y/i), idle = find(/idle|stand|bekle|breath/i);
      if (!walk && !idle) { idle = names.length > 1 ? names[0] : null; walk = names.length > 1 ? names[1] : names[0]; }
      else if (!idle) idle = names.find((n) => n !== walk) || null;
      else if (!walk) walk = names.find((n) => n !== idle) || null;
      group.userData.walkA = walk ? acts[walk] : null; group.userData.idleA = idle ? acts[idle] : null;
      if (group === player) {
        if (group.userData.idleA) { group.userData.idleA.play(); }
        if (group.userData.walkA) { group.userData.walkA.play(); group.userData.walkA.setEffectiveWeight(0); }
      } else { (group.userData.idleA || group.userData.walkA).play(); }
    }
  }, undefined, () => attachSprite(group, url.replace(/\.glb$/, '.png'), height, opt)));
}
/* GLB yoksa: şeffaf PNG kart (her zaman kameraya dönük) */
function attachSprite(group, url, height, opt = {}) {
  new THREE.TextureLoader().load(url, (tex) => {
    if (group.userData.hasModel) return;
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    const w = height * (tex.image.width / tex.image.height);
    const mt = opt.holo
      ? new THREE.MeshBasicMaterial({ map: tex, color: 0x4fe3ff, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending })
      : new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: 0.45, side: THREE.DoubleSide });
    const card = new THREE.Mesh(new THREE.PlaneGeometry(w, height), mt);
    card.position.y = height / 2;
    const wp = new THREE.Vector3(), q = new THREE.Quaternion(), e = new THREE.Euler();
    card.onBeforeRender = () => {
      card.getWorldPosition(wp);
      group.getWorldQuaternion(q); e.setFromQuaternion(q, 'YXZ');
      card.rotation.y = Math.atan2(camera.position.x - wp.x, camera.position.z - wp.z) - e.y;
    };
    group.children.forEach((ch) => { if (ch.isMesh || ch.isGroup) ch.visible = false; });
    group.add(card);
  }, undefined, () => {});
}
attachModel(player, 'assets/models/ana.glb', 1.8, { walk: true });

/* ---------- Yardımcılar ---------- */
const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.75, metalness: 0.05, ...o });
function mesh(geo, material, x = 0, y = 0, z = 0, parent) {
  const m = new THREE.Mesh(geo, material);
  m.position.set(x, y, z);
  m.castShadow = true; m.receiveShadow = true;
  if (parent) parent.add(m);
  return m;
}
/* =====================================================
   ORGANİK AĞAÇLAR (ortak, tek mesh / ağaç, vertex renkli)
   ===================================================== */
const TREES = (() => {
  let sd = 987654; const R = () => ((sd = (sd * 1664525 + 1013904223) >>> 0) / 4294967296);
  const treeMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.88, metalness: 0, side: THREE.DoubleSide });
  const nz = (x, y, z, s) => Math.sin(x * 2.3 + s) * 0.5 + Math.sin(y * 3.1 + z * 1.7 + s * 2) * 0.3 + Math.sin((x + z) * 5.1 + s * 3) * 0.2;
  const builder = () => {
    const P = [], N = [], C = [];
    const add = (geo, mtx, colFn) => {
      let g0 = geo; if (geo.index) { g0 = geo.clone(); g0.computeVertexNormals(); }
      const g = g0.index ? g0.toNonIndexed() : g0.clone(); g.applyMatrix4(mtx);
      if (!g.attributes.normal) g.computeVertexNormals();
      const p = g.attributes.position, n = g.attributes.normal, v = new THREE.Vector3();
      for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); P.push(v.x, v.y, v.z); N.push(n.getX(i), n.getY(i), n.getZ(i)); const c = colFn(v, i); C.push(c.r, c.g, c.b); }
    };
    const done = () => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); return g; };
    return { add, done };
  };
  const col = (hex, v = 0, j = 0) => { const c = new THREE.Color(hex); c.offsetHSL((R() - 0.5) * j, 0, v); return c; };
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), S1 = new THREE.Vector3(1, 1, 1);
  const mtx = (x, y, z, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), Q.clone().setFromEuler(E.clone().set(rx, ry, rz, 'YXZ')), new THREE.Vector3(sx, sy, sz));

  // ---- Hurma ----
  const frond = (b, base, ry, tilt, L) => {
    const seg = 15, pts = [];
    for (let i = 0; i <= seg; i++) { const u = i / seg; pts.push(new THREE.Vector3(u * L, Math.sin(u * 2.2) * 0.55 * tilt - u * u * L * 0.38 * (1.1 - tilt * 0.5), 0)); }
    const tri = [];
    for (let i = 1; i <= seg; i++) {
      const u = i / seg, p0 = pts[i], tg = pts[i].clone().sub(pts[i - 1]).normalize(), len = (0.95 - u * 0.65) * L * 0.17;
      for (const side of [-1, 1]) {
        const w = len * (0.9 + R() * 0.2), a = pts[i - 1].clone(), c = p0.clone();
        const tip = p0.clone().add(new THREE.Vector3(tg.x * 0.38, -0.32 * len * 1.4 - 0.1, side * w));
        tri.push(a, c, tip);
      }
    }
    // gövde (rachis) şeridi
    for (let i = 1; i <= seg; i++) { const a = pts[i - 1], c = pts[i]; tri.push(a.clone().add(new THREE.Vector3(0, 0, 0.03)), a.clone().add(new THREE.Vector3(0, 0, -0.03)), c.clone()); }
    const g = new THREE.BufferGeometry(); g.setFromPoints(tri);
    const m = mtx(base.x, base.y, base.z, 0, ry, 0);
    b.add(g, m, (v) => { const u = THREE.MathUtils.clamp(Math.hypot(v.x - base.x, v.z - base.z) / L, 0, 1); const c = new THREE.Color().setHSL(0.27 + (R() - 0.5) * 0.02, 0.5, 0.2 + u * 0.14); return c; });
  };
  const palmGeo = (seed) => {
    const b = builder(), H = 5 + R() * 2.4, lean = (R() - 0.5) * 1.1;
    // gövde: halkalı, hafif eğri, tepeye doğru kalınlaşan
    const seg = 14, rad = 8, tg = new THREE.CylinderGeometry(0.2, 0.3, H, rad, seg, true); tg.translate(0, H / 2, 0);
    const p = tg.attributes.position;
    for (let i = 0; i < p.count; i++) { const y = p.getY(i), t = y / H, ring = 1 + 0.12 * Math.sin(y * 7.5 + seed) ** 2; p.setX(i, p.getX(i) * ring * (1 + 0.45 * t * t) + lean * t * t); p.setZ(i, p.getZ(i) * ring); }
    b.add(tg, new THREE.Matrix4(), (v) => col(0x7d5c3a, -0.05 + (Math.sin(v.y * 7.5 + seed) ** 2) * -0.06, 0.02));
    const top = new THREE.Vector3(lean, H, 0), n = 12;
    for (let i = 0; i < n; i++) { const tier = i % 3, tilt = [0.55, 0.9, 0.2][tier]; frond(b, top.clone(), (i / n) * Math.PI * 2 + R() * 0.4, tilt, 3.3 + R() * 1.0 - tier * 0.15); }
    for (let i = 0; i < 5; i++) frond(b, top.clone(), R() * 6.3, 1.4, 1.9);   // küçük iç yapraklar
    for (let i = 0; i < 6; i++) b.add(new THREE.IcosahedronGeometry(0.17, 0), mtx(top.x + (R() - 0.5) * 0.7, top.y - 0.35 - R() * 0.3, top.z + (R() - 0.5) * 0.7), () => col(0xb8742a, 0, 0.03));
    return b.done();
  };
  // ---- Selvi ----
  const cypGeo = (seed, H = 5.8, Rb = 0.95) => {
    const b = builder(), pr = [];
    for (let i = 0; i <= 22; i++) { const y = i / 22; pr.push(new THREE.Vector2(Math.max(0.001, Rb * Math.pow(Math.sin(Math.PI * Math.pow(y, 0.62)), 0.75) * (1 - y * 0.35)), y * H)); }
    const g = new THREE.LatheGeometry(pr, 20), p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), k = 1 + 0.2 * nz(x * 2, y * 1.2, z * 2, seed) + 0.1 * Math.sin(y * 9 + Math.atan2(z, x) * 3 + seed); p.setX(i, x * k); p.setZ(i, z * k); }
    b.add(g, new THREE.Matrix4(), (v) => { const t = v.y / H; return new THREE.Color().setHSL(0.36 + nz(v.x, v.y, v.z, seed) * 0.02, 0.45, 0.095 + t * 0.06 + nz(v.x * 3, v.y, v.z * 3, seed + 4) * 0.025); });
    b.add(new THREE.CylinderGeometry(0.1, 0.17, 0.9, 6), mtx(0, 0.35, 0), () => col(0x5a4026));
    return b.done();
  };
  // ---- Zeytin ----
  const oliveGeo = (seed) => {
    const b = builder(), trunks = 3 + Math.floor(R() * 2);
    const crownCols = [0x7f9560, 0x92a873, 0x6b8456, 0x8aa06a];
    for (let k = 0; k < trunks; k++) {
      const a = (k / trunks) * Math.PI * 2 + R(), lean = 0.18 + R() * 0.3, h = 1.5 + R() * 0.8;
      b.add(new THREE.CylinderGeometry(0.1 + R() * 0.06, 0.22, h, 7, 2), mtx(Math.cos(a) * 0.2, h / 2, Math.sin(a) * 0.2, Math.sin(a) * lean, 0, -Math.cos(a) * lean), (v) => col(0x6e5d48, (R() - 0.5) * 0.06));
      const cx = Math.cos(a) * (0.2 + Math.sin(lean) * h), cz = Math.sin(a) * (0.2 + Math.sin(lean) * h);
      for (let j = 0; j < 3; j++) {
        const r = 0.8 + R() * 0.7, ico = new THREE.SphereGeometry(1, 12, 9), pp = ico.attributes.position;
        for (let i = 0; i < pp.count; i++) { const n = 1 + 0.25 * nz(pp.getX(i), pp.getY(i), pp.getZ(i), seed + j + k * 7); pp.setXYZ(i, pp.getX(i) * n, pp.getY(i) * n, pp.getZ(i) * n); }
        const cc = crownCols[Math.floor(R() * crownCols.length)];
        b.add(ico, mtx(cx + (R() - 0.5) * 1.1, h + 0.1 + R() * 0.9 + j * 0.15, cz + (R() - 0.5) * 1.1, 0, R() * 6, 0, r, r * 0.68, r), (v) => { const c = new THREE.Color(cc); c.offsetHSL(0, 0, (v.y - h) * 0.03 + (R() - 0.5) * 0.03); return c; });
      }
    }
    return b.done();
  };
  const palms = [palmGeo(1), palmGeo(2), palmGeo(3), palmGeo(4)], cyps = [cypGeo(1), cypGeo(2.7, 6.4, 0.85), cypGeo(5.1, 5.2, 1.05)], olives = [oliveGeo(1), oliveGeo(2), oliveGeo(3)];
  const pk = (a) => a[Math.floor(Math.random() * a.length)];
  const place = (parent, geo, x, z, s, shadow, sy = 1) => { const m = new THREE.Mesh(geo, treeMat); m.position.set(x, 0, z); m.rotation.y = Math.random() * 6.28; m.scale.set(s, s * sy, s); m.castShadow = !!shadow; m.receiveShadow = false; parent.add(m); return m; };
  return {
    palm: (parent, x, z, s = 1, shadow = false) => place(parent, pk(palms), x, z, s, shadow),
    cypress: (parent, x, z, s = 1, shadow = true) => place(parent, pk(cyps), x, z, s, shadow, 0.9 + Math.random() * 0.3),
    olive: (parent, x, z, s = 1, shadow = true) => place(parent, pk(olives), x, z, s, shadow),
  };
})();

function makeSky(top, mid, bottom) {
  const s = new THREE.Mesh(new THREE.SphereGeometry(300, 24, 16), new THREE.MeshBasicMaterial({ map: TX.skyTex(top, mid, bottom), side: THREE.BackSide, fog: false, depthWrite: false }));
  s.renderOrder = -10;
  return s;
}
function dust(count, spread, color, size) {
  const g = new THREE.BufferGeometry();
  const arr = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) { arr[i * 3] = (Math.random() - 0.5) * spread; arr[i * 3 + 1] = Math.random() * 9; arr[i * 3 + 2] = (Math.random() - 0.5) * spread; }
  g.setAttribute('position', new THREE.BufferAttribute(arr, 3));
  return new THREE.Points(g, new THREE.PointsMaterial({ color, size, transparent: true, opacity: 0.7, depthWrite: false, blending: THREE.AdditiveBlending }));
}

/* ---------- Konuşma / bildirim ---------- */
let toastTimer;
function toast(text, ms = 2600) {
  $('toast').textContent = text; show('toast');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => show('toast', false), ms);
}
let dlg = null, dlgFocus = null;
const SPEAKERS = [
  { re: /hologram/i, img: 'assets/models/harezmi.png', col: '#4fe3ff', holo: true },
  { re: /harezm/i, img: 'assets/models/harezmi.png', col: '#ffe08a' },
  { re: /ahmes/i, img: 'assets/models/ahmes.png', col: '#ff9f6b' },
  { re: /erato/i, img: 'assets/models/eratosthenes.png', col: '#8fb8ff' },
];
function typeInto(el, text, onDone) {
  let i = 0, stop = false, tm = 0;
  const ctl = { done: false, finish() { if (ctl.done) return; clearTimeout(tm); stop = true; ctl.done = true; el.textContent = text; onDone && onDone(); }, cancel() { clearTimeout(tm); stop = true; ctl.done = true; } };
  el.textContent = '';
  const caret = document.createElement('span'); caret.className = 'caret';
  const step = () => {
    if (stop) return;
    i++; el.textContent = text.slice(0, i); el.appendChild(caret);
    const ch = text[i - 1];
    if (i % 2 === 0 && /\S/.test(ch)) tone(780 + Math.random() * 160, 0.03, 'square', 0.012);
    if (i >= text.length) { ctl.done = true; caret.remove(); onDone && onDone(); return; }
    tm = setTimeout(step, /[.!?…]/.test(ch) ? 260 : /[,;:]/.test(ch) ? 130 : 24);
  };
  tm = setTimeout(step, 60);
  return ctl;
}
function findSpeakerPos(name) {
  const w = worlds[worldName]; if (!w || !w.interact) return null;
  const key = /hologram/i.test(name) ? 'hologram' : (name.match(/Harezm|Ahmes|Eratosthenes/i) || [''])[0];
  if (!key) return null;
  for (const it of w.interact) { try { if (it.label().toLowerCase().includes(key.toLowerCase())) return it.pos.clone(); } catch (e) {} }
  return null;
}
function say(name, lines, done) {
  const sp = SPEAKERS.find((s) => s.re.test(name)) || SPEAKERS[1];
  dlg = { name, lines, i: 0, done, typing: null, focus: findSpeakerPos(name) };
  mode = 'dialog';
  const d = $('dialog');
  d.style.setProperty('--sp', sp.col); d.classList.toggle('holo', !!sp.holo);
  $('dlg-img').src = sp.img; $('dlg-name').textContent = name;
  show('prompt', false); show('dialog');
  d.style.animation = 'none'; void d.offsetWidth; d.style.animation = '';
  $('lb').classList.add('on');
  dlgLine();
}
function dlgLine() {
  const d = $('dialog'); d.classList.add('talking'); $('dlg-next').classList.remove('rdy');
  dlg.typing = typeInto($('dlg-text'), dlg.lines[dlg.i], () => { d.classList.remove('talking'); $('dlg-next').classList.add('rdy'); });
}
function dlgAdvance() {
  if (!dlg) return;
  if (!dlg.typing.done) { dlg.typing.finish(); return; }
  sfx('click');
  dlg.i++;
  if (dlg.i >= dlg.lines.length) {
    show('dialog', false); $('lb').classList.remove('on'); const dn = dlg.done; dlg = null; mode = 'walk';
    if (dn) dn();
  } else dlgLine();
}
function fade(fn) {
  sfx('portal');
  const f = $('fade'); const prev = mode; mode = 'trans';
  f.classList.add('on');
  setTimeout(() => { fn(); f.classList.remove('on'); if (mode === 'trans') mode = prev === 'trans' ? 'walk' : (prev === 'puzzle' || prev === 'quiz' ? 'walk' : prev); }, 600);
}
function refreshParts() {
  document.querySelectorAll('#parts span').forEach((s) => s.classList.toggle('got', !!parts[s.dataset.p]));
  if (worlds.hub) worlds.hub.updateOrbs();
}

/* ---------- Hub dokuları: parlak zemin, zaman platformu, halılar ---------- */
function hubFloorTexture() {
  const S = 512, cv = document.createElement('canvas'); cv.width = cv.height = S; const x = cv.getContext('2d');
  const gr = x.createLinearGradient(0, 0, S, S); gr.addColorStop(0, '#9fb2d0'); gr.addColorStop(1, '#8ca2c4'); x.fillStyle = gr; x.fillRect(0, 0, S, S);
  for (let i = 0; i < 2600; i++) { x.fillStyle = `rgba(${90 + Math.random() * 60},${110 + Math.random() * 60},${150 + Math.random() * 60},${Math.random() * 0.07})`; x.fillRect(Math.random() * S, Math.random() * S, 2 + Math.random() * 6, 1 + Math.random() * 2); }
  x.fillStyle = 'rgba(70,100,150,.16)'; x.fillRect(0, 0, S, 5); x.fillRect(0, 0, 5, S); x.fillRect(0, S - 5, S, 5); x.fillRect(S - 5, 0, 5, S);
  x.strokeStyle = 'rgba(40,200,255,.75)'; x.lineWidth = 2; x.strokeRect(10, 10, S - 20, S - 20);
  x.strokeStyle = 'rgba(255,255,255,.55)'; x.lineWidth = 1; x.strokeRect(14, 14, S - 28, S - 28);
  x.fillStyle = 'rgba(40,200,255,.9)'; [[10, 10], [S - 10, 10], [10, S - 10], [S - 10, S - 10]].forEach(([a, b]) => x.fillRect(a - 4, b - 4, 8, 8));
  const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
function hubPlatformTexture() {
  const S = 1024, cv = document.createElement('canvas'); cv.width = cv.height = S; const x = cv.getContext('2d'), c = S / 2;
  x.clearRect(0, 0, S, S);
  const gr = x.createRadialGradient(c, c, 0, c, c, c); gr.addColorStop(0, 'rgba(8,22,52,.96)'); gr.addColorStop(0.7, 'rgba(14,34,74,.95)'); gr.addColorStop(1, 'rgba(20,44,92,.95)');
  x.fillStyle = gr; x.beginPath(); x.arc(c, c, c - 6, 0, 7); x.fill();
  const ring = (r, col, w, a = 1) => { x.globalAlpha = a; x.strokeStyle = col; x.lineWidth = w; x.beginPath(); x.arc(c, c, r, 0, 7); x.stroke(); x.globalAlpha = 1; };
  ring(c - 10, '#7fe8ff', 6); ring(c - 34, '#e0a82e', 3, 0.9); ring(c - 120, '#7fe8ff', 2, 0.6); ring(c - 220, '#e0a82e', 2, 0.7); ring(130, '#7fe8ff', 2, 0.6);
  for (let i = 0; i < 120; i++) { const a = (i / 120) * Math.PI * 2, big = i % 10 === 0, r0 = c - 34 - (big ? 34 : 16), r1 = c - 34; x.strokeStyle = big ? '#ffe08a' : '#7fe8ff'; x.lineWidth = big ? 3 : 1.5; x.beginPath(); x.moveTo(c + Math.cos(a) * r0, c + Math.sin(a) * r0); x.lineTo(c + Math.cos(a) * r1, c + Math.sin(a) * r1); x.stroke(); }
  x.fillStyle = '#7fe8ff'; x.font = 'bold 34px Cambria Math, Georgia, serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
  ['820', 'MÖ 2500', 'MÖ 240'].forEach((tx, i) => { const a = [-0.55, -Math.PI / 2, Math.PI + 0.55][i]; x.save(); x.translate(c + Math.cos(a) * (c - 90), c + Math.sin(a) * (c - 90)); x.rotate(a + Math.PI / 2); x.globalAlpha = 0.85; x.fillText(tx, 0, 0); x.restore(); });
  x.globalAlpha = 0.35; x.strokeStyle = '#7fe8ff'; x.lineWidth = 1.5;
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; x.beginPath(); x.moveTo(c + Math.cos(a) * 130, c + Math.sin(a) * 130); x.lineTo(c + Math.cos(a) * (c - 120), c + Math.sin(a) * (c - 120)); x.stroke(); }
  x.globalAlpha = 1;
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
function carpetTexture(hex, motif, W, L) {
  const pxu = 130, w = Math.round(W * pxu), h = Math.round(L * pxu), cv = document.createElement('canvas'); cv.width = w; cv.height = h; const x = cv.getContext('2d');
  const col = '#' + hex.toString(16).padStart(6, '0');
  x.fillStyle = '#18285a'; x.fillRect(0, 0, w, h);
  for (let i = 0; i < 1800; i++) { x.fillStyle = `rgba(255,255,255,${Math.random() * 0.035})`; x.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 3, 1); }
  const frame = (ins, c, lw) => { x.strokeStyle = c; x.lineWidth = lw; x.strokeRect(ins, ins, w - ins * 2, h - ins * 2); };
  frame(10, '#e0a82e', 6); frame(26, col, 18); frame(48, '#e0a82e', 3);
  const fx0 = 62, fy0 = 62, fw = w - 124, fh = h - 124;
  x.save(); x.beginPath(); x.rect(fx0, fy0, fw, fh); x.clip();
  x.strokeStyle = col; x.fillStyle = col;
  if (motif === 'star') { // Bağdat: sekiz köşeli yıldız örgüsü
    const cs = 62; for (let cy = fy0; cy < fy0 + fh + cs; cy += cs) for (let cx = fx0; cx < fx0 + fw + cs; cx += cs) { x.globalAlpha = 0.5; x.lineWidth = 2; const m = cx + cs / 2, n = cy + cs / 2; [0, Math.PI / 4].forEach((r) => { x.save(); x.translate(m, n); x.rotate(r); x.strokeRect(-cs * 0.3, -cs * 0.3, cs * 0.6, cs * 0.6); x.restore(); }); }
  } else if (motif === 'zig') { // Mısır: zigzag ve lotus üçgenleri
    x.lineWidth = 3; for (let cy = fy0; cy < fy0 + fh; cy += 34) { x.globalAlpha = 0.55; x.beginPath(); for (let cx = fx0; cx <= fx0 + fw; cx += 26) x.lineTo(cx, cy + ((cx / 26) % 2 ? 14 : 0)); x.stroke(); }
    x.globalAlpha = 0.28; for (let cy = fy0; cy < fy0 + fh; cy += 68) for (let cx = fx0; cx < fx0 + fw; cx += 52) { x.beginPath(); x.moveTo(cx, cy + 26); x.lineTo(cx + 26, cy); x.lineTo(cx + 52, cy + 26); x.closePath(); x.fill(); }
  } else { // İskenderiye: Yunan anahtar (meander) şeritleri
    x.lineWidth = 3; x.globalAlpha = 0.6; const u = 18;
    for (let cy = fy0 + 6; cy < fy0 + fh - u * 4; cy += u * 5) { x.beginPath(); let px = fx0, py = cy + u * 3; x.moveTo(px, py); for (; px < fx0 + fw; px += u * 4) { x.lineTo(px, cy); x.lineTo(px + u * 3, cy); x.lineTo(px + u * 3, cy + u * 2); x.lineTo(px + u, cy + u * 2); x.lineTo(px + u, cy + u * 3); x.lineTo(px + u * 4, cy + u * 3); } x.stroke(); }
  }
  x.restore(); x.globalAlpha = 1;
  const mx = w / 2, my = h / 2;
  x.fillStyle = '#0d1630'; x.beginPath(); x.arc(mx, my, 70, 0, 7); x.fill();
  [[66, '#e0a82e', 3], [54, col, 6], [40, '#e0a82e', 2]].forEach(([r, c2, lw]) => { x.strokeStyle = c2; x.lineWidth = lw; x.beginPath(); x.arc(mx, my, r, 0, 7); x.stroke(); });
  x.fillStyle = col; x.globalAlpha = 0.9; x.beginPath(); for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2, r = i % 2 ? 16 : 34; x.lineTo(mx + Math.cos(a) * r, my + Math.sin(a) * r); } x.closePath(); x.fill(); x.globalAlpha = 1;
  x.strokeStyle = 'rgba(255,255,255,.55)'; x.lineWidth = 2; for (let i = 0; i < w; i += 9) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, 6); x.moveTo(i, h); x.lineTo(i, h - 6); x.stroke(); }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}

/* =====================================================
   DÜNYA 1: ZAMAN MAKİNESİ ODASI (gelecek, 2157)
   ===================================================== */
function buildHub() {
  const g = new THREE.Group();
  const w = { group: g, colliders: [], interact: [], spawn: new THREE.Vector3(0, 0, 9), anim: [], radius: 20.5 };
  g.add(makeSky('#050d24', '#1d4180', '#8ab8ec'));
  const stars = new THREE.Points(
    (() => { const geo = new THREE.BufferGeometry(); const a = new Float32Array(900); for (let i = 0; i < 300; i++) { const v = new THREE.Vector3().randomDirection().multiplyScalar(250); v.y = Math.abs(v.y) * 0.8 + 10; a.set([v.x, v.y, v.z], i * 3); } geo.setAttribute('position', new THREE.BufferAttribute(a, 3)); return geo; })(),
    new THREE.PointsMaterial({ color: 0xbfd8ff, size: 1.6, sizeAttenuation: false, fog: false }));
  g.add(stars);
  g.add(new THREE.HemisphereLight(0xcfe2ff, 0x4a6a9a, 0.75));
  const sun = new THREE.DirectionalLight(0xeaf3ff, 1.7); sun.position.set(10, 18, 8); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -24, right: 24, top: 24, bottom: -24, near: 1, far: 60 }); sun.shadow.bias = -0.0004;
  g.add(sun);

  // Sonsuz zemin: ufka kadar uzanan parlak panel döşeme (sis ile ufukta eriyor)
  const ftex = hubFloorTexture(); ftex.repeat.set(110, 110);
  const floor = mesh(new THREE.PlaneGeometry(660, 660), new THREE.MeshStandardMaterial({ map: ftex, roughness: 0.26, metalness: 0.18, envMapIntensity: 0.9 }));
  floor.rotation.x = -Math.PI / 2; floor.castShadow = false; g.add(floor);
  // Zaman platformu (dönen kadran)
  const platTex = hubPlatformTexture();
  const plat = new THREE.Mesh(new THREE.CircleGeometry(6.2, 96), new THREE.MeshStandardMaterial({ map: platTex, transparent: true, roughness: 0.3, metalness: 0.5, emissive: 0x0a3a66, emissiveMap: platTex, emissiveIntensity: 0.55 }));
  plat.rotation.x = -Math.PI / 2; plat.position.y = 0.035; plat.receiveShadow = true; g.add(plat);
  const rim = mesh(new THREE.TorusGeometry(6.25, 0.07, 10, 120), new THREE.MeshBasicMaterial({ color: 0x7fe8ff }), 0, 0.06, 0, g); rim.rotation.x = Math.PI / 2; rim.castShadow = false;
  // Uzak şehir silueti (derinlik hissi): sisle eriyen kuleler
  {
    const N = 90, tw = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ color: 0x31528c, roughness: 0.5, metalness: 0.4, emissive: 0x14386e, emissiveIntensity: 0.9 }), N), cap = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color: 0x7fe8ff }), N), d = new THREE.Object3D();
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2 + Math.random() * 0.06, r = 70 + Math.random() * 110, wd = 3 + Math.random() * 8, h = 14 + Math.random() * Math.random() * 120;
      d.position.set(Math.cos(a) * r, h / 2, Math.sin(a) * r); d.scale.set(wd, h, wd * (0.7 + Math.random() * 0.6)); d.rotation.y = Math.random() * 3; d.updateMatrix(); tw.setMatrixAt(i, d.matrix);
      d.position.y = h + 0.3; d.scale.set(wd * 0.98, 0.7, wd * 0.98); d.updateMatrix(); cap.setMatrixAt(i, d.matrix);
    }
    tw.frustumCulled = false; cap.frustumCulled = false; g.add(tw); g.add(cap);
  }
  // Çevre konsolları (yürünebilir alanın dışında, zemin sonsuz devam eder)
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * Math.PI * 2 + 0.2, r = 23.2;
    const c = mesh(new THREE.BoxGeometry(2.6, 1.5, 1), mat(0x1c2c52, { metalness: 0.6, roughness: 0.35 }), Math.cos(a) * r, 0.75, Math.sin(a) * r, g);
    c.rotation.y = -a + Math.PI / 2;
    const scr = mesh(new THREE.BoxGeometry(2.2, 0.7, 0.05), new THREE.MeshBasicMaterial({ color: 0x1fd5ff }), 0, 0.45, 0.52, c);
    scr.castShadow = false;
    w.colliders.push({ x: Math.cos(a) * r, z: Math.sin(a) * r, r: 1.2 });
  }
  // Yürüme alanını belli eden ışıklı ayırıcı halka (bariyer değil, ince bir hat)
  const edgeRing = mesh(new THREE.TorusGeometry(21.2, 0.05, 8, 180), new THREE.MeshBasicMaterial({ color: 0x35d0ff, transparent: true, opacity: 0.55 }), 0, 0.05, 0, g); edgeRing.rotation.x = Math.PI / 2; edgeRing.castShadow = false;

  // Zaman makinesi
  const m = new THREE.Group(); g.add(m);
  mesh(new THREE.CylinderGeometry(2.3, 2.6, 0.5, 32), mat(0x1b2745, { metalness: 0.7, roughness: 0.3 }), 0, 0.25, 0, m);
  const core = mesh(new THREE.IcosahedronGeometry(0.7, 1), new THREE.MeshStandardMaterial({ color: 0x103040, emissive: 0x1fd5ff, emissiveIntensity: 0.25 }), 0, 1.7, 0, m);
  const ringA = mesh(new THREE.TorusGeometry(1.7, 0.09, 12, 48), mat(0x7fdcff, { metalness: 0.8, emissive: 0x1fd5ff, emissiveIntensity: 0.4 }), 0, 1.7, 0, m);
  const ringB = mesh(new THREE.TorusGeometry(1.25, 0.07, 12, 48), mat(0xe0a82e, { metalness: 0.8, emissive: 0xe0a82e, emissiveIntensity: 0.3 }), 0, 1.7, 0, m);
  const mLight = new THREE.PointLight(0x1fd5ff, 4, 14); mLight.position.set(0, 2.2, 0); m.add(mLight);
  const beam = mesh(new THREE.CylinderGeometry(0.7, 0.7, 60, 24, 1, true), new THREE.MeshBasicMaterial({ color: 0x7fe8ff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }), 0, 31, 0, m);
  beam.castShadow = false;
  w.colliders.push({ x: 0, z: 0, r: 2.7 });
  const orbs = [];
  ERAS.forEach((e, i) => {
    const a = (i / 3) * Math.PI * 2 + Math.PI / 2;
    const px = Math.cos(a) * 3.6, pz = Math.sin(a) * 3.6;
    mesh(new THREE.CylinderGeometry(0.35, 0.45, 0.8, 16), mat(0x24304f, { metalness: 0.6 }), px, 0.4, pz, g);
    const orb = mesh(new THREE.SphereGeometry(0.26, 18, 14), new THREE.MeshStandardMaterial({ color: 0x333a4a, emissive: e.color, emissiveIntensity: 0.0 }), px, 1.25, pz, g);
    const lb = TX.labelSprite(e.part, '#9fb4d6', 0.5); lb.position.set(px, 1.9, pz); g.add(lb);
    orbs.push({ orb, lb, e });
    w.colliders.push({ x: px, z: pz, r: 0.5 });
  });
  w.updateOrbs = () => orbs.forEach(({ orb, e }) => {
    orb.material.emissiveIntensity = parts[e.id] ? 2.2 : 0;
    orb.material.color.set(parts[e.id] ? e.color : 0x333a4a);
  });
  const nParts = () => ERAS.filter((e) => parts[e.id]).length;
  w.interact.push({ pos: new THREE.Vector3(0, 0, 0), r: 3.6, label: () => 'E: Zaman makinesi', action: () => toast(`Kayıp Formül: ${nParts()} / 3 parça yerinde`) });

  // Portallar
  const portalPos = { bagdat: [8, -5], misir: [0, -11], iskenderiye: [-8, -5] };
  const portals = [];
  ERAS.forEach((e) => {
    const [px, pz] = portalPos[e.id];
    const p = new THREE.Group(); p.position.set(px, 0, pz); p.lookAt(0, 0, 0); g.add(p);
    const ring = mesh(new THREE.TorusGeometry(1.7, 0.16, 14, 48), mat(e.color, { emissive: e.color, emissiveIntensity: e.unlocked ? 1.6 : 0.25, metalness: 0.6 }), 0, 2, 0, p);
    const disc = new THREE.Mesh(new THREE.CircleGeometry(1.6, 40), new THREE.MeshBasicMaterial({ map: TX.portalTex(e.color), transparent: true, opacity: e.unlocked ? 0.95 : 0.25, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    disc.position.set(0, 2, 0); p.add(disc);
    const lb = TX.labelSprite(e.name, e.unlocked ? '#' + e.color.toString(16) : '#7f8aa0', 0.7); lb.position.set(px, 4.5, pz); g.add(lb);
    const sub = TX.labelSprite(e.unlocked ? e.sub : 'yapım aşamasında', '#c9d6ee', 0.42); sub.position.set(px, 3.95, pz); g.add(sub);
    if (e.unlocked) { const l = new THREE.PointLight(e.color, 5, 12); l.position.set(0, 2, 1); p.add(l); }
    {
      const D = Math.hypot(px, pz), len = Math.max(3, D - 5.4), wd = 3.6, motif = { bagdat: 'star', misir: 'zig', iskenderiye: 'key' }[e.id];
      const ct = carpetTexture(e.color, motif, wd, len);
      const carpet = new THREE.Mesh(new THREE.PlaneGeometry(wd, len), new THREE.MeshStandardMaterial({ map: ct, roughness: 0.92, metalness: 0, emissive: e.color, emissiveMap: ct, emissiveIntensity: 0.5 }));
      carpet.rotation.x = -Math.PI / 2; carpet.position.set(0, 0.06, 1.1 + len / 2); carpet.receiveShadow = true; carpet.renderOrder = 2; p.add(carpet);
      const pad = new THREE.Mesh(new THREE.RingGeometry(1.95, 2.3, 56), new THREE.MeshBasicMaterial({ color: e.color, transparent: true, opacity: 0.9, side: THREE.DoubleSide }));
      pad.rotation.x = -Math.PI / 2; pad.position.set(0, 0.075, 0); pad.renderOrder = 3; p.add(pad);
      const padIn = new THREE.Mesh(new THREE.CircleGeometry(1.95, 56), new THREE.MeshStandardMaterial({ color: 0x0d1630, roughness: 0.3, metalness: 0.6, emissive: e.color, emissiveIntensity: 0.08 }));
      padIn.rotation.x = -Math.PI / 2; padIn.position.set(0, 0.065, 0); padIn.renderOrder = 2; p.add(padIn);
      [-2.5, 2.5].forEach((dx) => {
        mesh(new THREE.BoxGeometry(0.45, 4.2, 0.45), mat(0x1c2c52, { metalness: 0.7, roughness: 0.3 }), dx, 2.1, 0, p);
        const strip = mesh(new THREE.BoxGeometry(0.08, 3.4, 0.08), new THREE.MeshBasicMaterial({ color: e.color }), dx, 2.1, 0.25, p); strip.castShadow = false;
        const top = mesh(new THREE.SphereGeometry(0.2, 12, 10), new THREE.MeshBasicMaterial({ color: e.color }), dx, 4.45, 0, p); top.castShadow = false;
      });
    }
    portals.push({ disc, ring, e });
    w.interact.push({
      pos: new THREE.Vector3(px, 0, pz), r: 2.6,
      label: () => (e.unlocked ? `E: ${e.name} çağına yolculuk` : `${e.name} (kilitli)`),
      action: () => (e.unlocked ? gotoEra(e.id) : toast('Bu çağın kapısı bir sonraki güncellemede açılacak.')),
    });
  });

  // Harezmî hologramı
  const holo = makeHarezmi({ holo: true }); holo.position.set(-4.5, 0, 5); holo.rotation.y = 0.5; holo.scale.setScalar(1.15); g.add(holo);
  attachModel(holo, 'assets/models/harezmi.glb', 2.1, { holo: true });
  const hl = new THREE.PointLight(0x4fe3ff, 2.5, 7); hl.position.set(-4.5, 1.6, 5.4); g.add(hl);
  w.colliders.push({ x: -4.5, z: 5, r: 0.7 });
  w.interact.push({ pos: new THREE.Vector3(-4.5, 0, 5), r: 2.8, label: () => 'E: Harezmî (hologram) ile konuş', action: () => talkHoloHarezmi() });
  w.holo = holo;

  const dm = dust(260, 60, 0x9fe8ff, 0.05); g.add(dm);

  w.update = (t, dt) => {
    const f = w.finale ? 5 : 1;
    ringA.rotation.x += dt * 0.8 * f; ringA.rotation.y += dt * 0.4 * f;
    ringB.rotation.y += dt * 1.1 * f; ringB.rotation.z += dt * 0.5 * f;
    beam.material.opacity = w.finale ? Math.min(0.5, beam.material.opacity + dt * 0.25) : 0;
    mLight.intensity = w.finale ? 4 + Math.min(30, (beam.material.opacity) * 60) : 4;
    core.rotation.y = t; core.material.emissiveIntensity = 0.5 + Math.sin(t * 2) * 0.35 + nParts() * 0.5;
    portals.forEach((p, i) => { p.disc.rotation.z = t * (0.6 + i * 0.2); });
    holo.position.y = Math.sin(t * 1.6) * 0.07;
    holo.userData.sym.material.opacity = 0.6 + Math.sin(t * 6) * 0.3;
    const d = player.position.clone().sub(holo.position); holo.rotation.y = THREE.MathUtils.lerp(holo.rotation.y, Math.atan2(d.x, d.z), 0.05);
    dm.rotation.y = t * 0.02; plat.rotation.z = t * 0.03;
  };
  g.visible = false; scene.add(g);
  w.updateOrbs();
  return w;
}

/* =====================================================
   DÜNYA 2: BAĞDAT — BEYTÜLHİKME AVLUSU (820)
   ===================================================== */
let balance = null; // 3D terazi
function buildBagdat() {
  const g = new THREE.Group();
  const w = { group: g, colliders: [], interact: [], spawn: new THREE.Vector3(0, 0, 11), bounds: { x: 15.5, zMin: -14.5, zMax: 16.5 } };
  w.skyMesh = makeSky('#3b6fb0', '#f4b36a', '#ffe3b3'); g.add(w.skyMesh);
  g.add(new THREE.HemisphereLight(0xffe7bd, 0x8a6a3c, 0.9));
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: TX.glowTex(), color: 0xffd9a0, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
  glow.scale.set(140, 140, 1); glow.position.set(-70, 38, -170); g.add(glow);
  const sun = new THREE.DirectionalLight(0xffd29a, 2.6); sun.position.set(-16, 20, 12); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -26, right: 26, top: 26, bottom: -26, near: 1, far: 70 });
  sun.shadow.bias = -0.0004; g.add(sun);

  const ground = mesh(new THREE.PlaneGeometry(90, 90), mat(0xffffff, { map: TX.mosaicTex(16, 16), roughness: 0.55 }));
  ground.rotation.x = -Math.PI / 2; ground.castShadow = false; g.add(ground);

  const brick = mat(0xffffff, { map: TX.brickTex(10, 3) });
  mesh(new THREE.BoxGeometry(46, 9, 1.2), brick, 0, 4.5, -19.5, g);
  const sideL = mesh(new THREE.BoxGeometry(1.2, 9, 40), mat(0xffffff, { map: TX.brickTex(8, 3) }), -22.5, 4.5, -2, g);
  const sideR = mesh(new THREE.BoxGeometry(1.2, 9, 40), mat(0xffffff, { map: TX.brickTex(8, 3) }), 22.5, 4.5, -2, g);

  // Kemerli revaklar
  const marble = mat(0xffffff, { map: TX.marbleTex(), roughness: 0.4 });
  const arcade = (cx, cz, rotY, count) => {
    const a = new THREE.Group(); a.position.set(cx, 0, cz); a.rotation.y = rotY; g.add(a);
    for (let i = 0; i < count; i++) {
      const lx = (i - (count - 1) / 2) * 5;
      mesh(new THREE.CylinderGeometry(0.42, 0.5, 5, 14), marble, lx, 2.5, 0, a);
      mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.3, 14), marble, lx, 0.15, 0, a);
      mesh(new THREE.CylinderGeometry(0.6, 0.45, 0.4, 14), mat(0xe0a82e, { metalness: 0.5 }), lx, 5.1, 0, a);
      w.colliders.push({ x: cx + Math.cos(-rotY) * lx, z: cz + Math.sin(-rotY) * lx, r: 0.6 });
      if (i < count - 1) {
        const arch = mesh(new THREE.TorusGeometry(2.1, 0.32, 10, 28, Math.PI), mat(0xe9dcc0, { roughness: 0.5 }), lx + 2.5, 5.2, 0, a);
        arch.scale.set(1, 1.1, 1);
      }
    }
    mesh(new THREE.BoxGeometry(count * 5 + 1, 0.5, 1.2), mat(0xd9c79a), 0, 7.6, 0, a);
  };
  arcade(0, -17.5, 0, 9);
  arcade(-20.5, -2, Math.PI / 2, 7);
  arcade(20.5, -2, -Math.PI / 2, 7);

  // Kubbe ve minareler
  const dome = mesh(new THREE.SphereGeometry(6.5, 36, 18, 0, Math.PI * 2, 0, Math.PI / 2), mat(0xffffff, { map: TX.domeTex(), roughness: 0.4, metalness: 0.15 }), 0, 8.8, -26, g);
  mesh(new THREE.CylinderGeometry(6.6, 6.6, 3, 36), mat(0xe9dcc0), 0, 7.4, -26, g);
  mesh(new THREE.ConeGeometry(0.25, 2, 10), mat(0xe0a82e, { metalness: 0.7, emissive: 0xe0a82e, emissiveIntensity: 0.3 }), 0, 17.2, -26, g);
  for (const sx of [-1, 1]) {
    mesh(new THREE.CylinderGeometry(0.9, 1.1, 18, 20), mat(0xffffff, { map: TX.brickTex(2, 5) }), sx * 15, 9, -24, g);
    mesh(new THREE.CylinderGeometry(1.4, 1.1, 0.6, 20), mat(0xe9dcc0), sx * 15, 15.5, -24, g);
    mesh(new THREE.ConeGeometry(1.2, 3.6, 20), mat(0x1a8f94, { metalness: 0.2 }), sx * 15, 17.6, -24, g);
  }

  // Çeşme
  const fz = 2;
  mesh(new THREE.CylinderGeometry(2.6, 2.8, 0.6, 8), marble, 0, 0.3, fz, g);
  const water = mesh(new THREE.CylinderGeometry(2.3, 2.3, 0.1, 32), new THREE.MeshPhysicalMaterial({ color: 0x0e5f8e, roughness: 0.04, metalness: 0.0, clearcoat: 1, clearcoatRoughness: 0.03, transparent: true, opacity: 0.88, emissive: 0x0a3a5a, emissiveIntensity: 0.25 }), 0, 0.64, fz, g);
  mesh(new THREE.CylinderGeometry(0.25, 0.35, 1.8, 12), marble, 0, 1.4, fz, g);
  mesh(new THREE.SphereGeometry(0.7, 18, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), marble, 0, 2.2, fz, g).rotation.x = Math.PI;
  w.colliders.push({ x: 0, z: fz, r: 2.9 });

  // Hurma ağaçları
  const palm = (x, z, s = 1) => {
    TREES.palm(g, x, z, s, true);
    w.colliders.push({ x, z, r: 0.5 });
  };
  palm(-13, 8, 1.1); palm(13, 8, 1.0); palm(-13, -10, 1.2); palm(13, -10, 1.1);

  // Halı + yazı masası (Harezmî'nin köşesi)
  const hx = 7, hz = -4;
  const rug = mesh(new THREE.BoxGeometry(6, 0.05, 5), mat(0x8a1f2b, { roughness: 1 }), hx, 0.03, hz, g); rug.castShadow = false;
  mesh(new THREE.BoxGeometry(5.4, 0.06, 4.4), mat(0xe0a82e, { roughness: 0.8 }), hx, 0.02, hz, g).castShadow = false;
  mesh(new THREE.BoxGeometry(5.0, 0.07, 4.0), mat(0x8a1f2b, { roughness: 1 }), hx, 0.04, hz, g).castShadow = false;
  const desk = mesh(new THREE.BoxGeometry(2.6, 0.12, 1.1), mat(0xffffff, { map: TX.woodTex() }), hx + 2.0, 1.0, hz - 1.3, g);
  for (const [dx, dz] of [[-1.2, -0.45], [1.2, -0.45], [-1.2, 0.45], [1.2, 0.45]]) mesh(new THREE.BoxGeometry(0.12, 1, 0.12), mat(0xffffff, { map: TX.woodTex() }), hx + 2.0 + dx, 0.5, hz - 1.3 + dz, g);
  for (let i = 0; i < 4; i++) { const s = mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.8, 10), mat(0xeadfba), hx + 1.3 + i * 0.35, 1.2, hz - 1.3, g); s.rotation.z = Math.PI / 2; }
  const lamp = new THREE.PointLight(0xffb85a, 8, 9); lamp.position.set(hx + 2.4, 2.1, hz - 1.0); g.add(lamp);
  mesh(new THREE.SphereGeometry(0.16, 12, 10), new THREE.MeshBasicMaterial({ color: 0xffd27a }), hx + 2.4, 1.3, hz - 1.0, g).castShadow = false;
  w.colliders.push({ x: hx + 2.0, z: hz - 1.3, r: 1.3 });

  // Harezmî
  const hz1 = makeHarezmi(); hz1.position.set(hx - 0.8, 0, hz + 0.2); hz1.rotation.y = -0.6; hz1.scale.setScalar(1.25); g.add(hz1);
  w.colliders.push({ x: hx - 0.8, z: hz + 0.2, r: 0.8 });
  w.harezmi = hz1;
  attachModel(hz1, 'assets/models/harezmi.glb', 2.1);
  w.interact.push({ pos: new THREE.Vector3(hx - 0.8, 0, hz + 0.2), r: 3.0, label: () => 'E: Harezmî ile konuş', action: () => talkHarezmi() });

  // Terazi
  balance = buildBalance();
  balance.group.position.set(-7, 0, -4); g.add(balance.group);
  [-1.9, 0, 1.9].forEach((dx) => w.colliders.push({ x: -7 + dx, z: -4, r: 1.0 }));
  w.balancePos = new THREE.Vector3(-7, 0, -4);
  w.interact.push({
    pos: new THREE.Vector3(-7, 0, -2), r: 3.0,
    label: () => (prog.met ? 'E: Denklem terazisi' : 'Önce Harezmî ile konuş'),
    action: () => { if (!prog.met) return toast('Önce bilgin Harezmî ile konuşmalısın.'); if (prog.solvedAll) return toast('Teraziyi çözdün! Harezmî seni bekliyor.'); enterPuzzle(); },
  });

  // Dönüş portalı
  const bp = new THREE.Group(); bp.position.set(0, 0, 15.5); g.add(bp);
  mesh(new THREE.TorusGeometry(1.5, 0.14, 12, 40), mat(0x1fd5ff, { emissive: 0x1fd5ff, emissiveIntensity: 1.6 }), 0, 1.8, 0, bp);
  const bdisc = new THREE.Mesh(new THREE.CircleGeometry(1.4, 32), new THREE.MeshBasicMaterial({ map: TX.portalTex(0x1fd5ff), transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
  bdisc.position.set(0, 1.8, 0); bp.add(bdisc);
  const bl = TX.labelSprite('Zaman Makinesi', '#7fe8ff', 0.6); bl.position.set(0, 3.9, 15.5); g.add(bl);
  const bpl = new THREE.PointLight(0x1fd5ff, 4, 10); bpl.position.set(0, 2, 14.5); g.add(bpl);
  w.interact.push({ pos: new THREE.Vector3(0, 0, 15.5), r: 2.4, label: () => 'E: Zaman makinesine dön', action: () => gotoHub() });

  // Havada süzülen sayılar
  const glyphs = ['١ ٢ ٣', 'x', '+', '=', '٤ ٥', '√', 'x²', '٧'];
  const floaters = glyphs.map((t, i) => {
    const s = TX.labelSprite(t, '#ffe08a', 0.7); s.position.set((Math.random() - 0.5) * 30, 4 + Math.random() * 5, -8 + Math.random() * 18); s.userData.b = Math.random() * 6; g.add(s); return s;
  });
  const dm = dust(180, 36, 0xffe0a0, 0.06); g.add(dm);
  const bagdatTick = buildBagdatScenery(g, w);

  w.update = (t, dt) => {
    bagdatTick(t, dt);
    water.position.y = 0.64 + Math.sin(t * 2) * 0.012;
    bdisc.rotation.z = t * 0.7;
    floaters.forEach((s) => { s.position.y += Math.sin(t + s.userData.b) * 0.003; s.material.opacity = 0.55 + Math.sin(t * 1.5 + s.userData.b) * 0.3; });
    dm.rotation.y = t * 0.01;
    hz1.position.y = Math.sin(t * 1.4) * 0.02;
    const d = player.position.clone().sub(hz1.position);
    if (d.length() < 9) hz1.rotation.y = THREE.MathUtils.lerp(hz1.rotation.y, Math.atan2(d.x, d.z), 0.06);
    hz1.userData.sym.position.y = 2.55 + Math.sin(t * 2) * 0.06;
    balance.update(t, dt);
  };
  g.visible = false; scene.add(g);
  return w;
}

/* =====================================================
   3D TERAZİ (Harezmî'nin denklem terazisi)
   ===================================================== */
function buildBalance() {
  const group = new THREE.Group();
  const wood = mat(0xffffff, { map: TX.woodTex() });
  const brass = mat(0xe0a82e, { metalness: 0.8, roughness: 0.3 });
  mesh(new THREE.BoxGeometry(2.4, 0.3, 1.2), wood, 0, 0.15, 0, group);
  mesh(new THREE.CylinderGeometry(0.14, 0.2, 2.6, 14), brass, 0, 1.5, 0, group);
  mesh(new THREE.SphereGeometry(0.22, 16, 12), brass, 0, 2.85, 0, group);
  const beam = new THREE.Group(); beam.position.y = 2.85; group.add(beam);
  mesh(new THREE.BoxGeometry(4.2, 0.14, 0.18), brass, 0, 0, 0, beam);
  const pans = [-1, 1].map((s) => {
    const p = new THREE.Group(); group.add(p);
    mesh(new THREE.CylinderGeometry(1.05, 0.9, 0.1, 28), brass, 0, 0, 0, p);
    mesh(new THREE.TorusGeometry(1.05, 0.04, 8, 28), brass, 0, 0.05, 0, p).rotation.x = Math.PI / 2;
    const chain = mesh(new THREE.CylinderGeometry(0.015, 0.015, 1.3, 6), brass, 0, 0.65, 0, p);
    chain.scale.set(1, 1, 1);
    const items = new THREE.Group(); items.position.y = 0.05; p.add(items);
    return { p, items, s };
  });
  const crateMat = new THREE.MeshStandardMaterial({ map: TX.xCrateTex('x'), roughness: 0.4, metalness: 0.3, emissive: 0xc98a1a, emissiveIntensity: 0.25 });
  const unitMat = new THREE.MeshStandardMaterial({ color: 0x9aa7b8, metalness: 0.8, roughness: 0.3 });
  let wob = 0, popT = 0;

  function fill(items, xc, k) {
    while (items.children.length) items.remove(items.children[0]);
    for (let i = 0; i < xc; i++) {
      const c = mesh(new THREE.BoxGeometry(0.4, 0.4, 0.4), crateMat, (i - (xc - 1) / 2) * 0.46, 0.22, -0.42, items);
      c.userData.pop = true;
    }
    const cols = 6;
    for (let i = 0; i < k; i++) {
      const col = i % cols, row = Math.floor(i / cols);
      const u = mesh(new THREE.BoxGeometry(0.2, 0.2, 0.2), unitMat, (col - (cols - 1) / 2) * 0.25, 0.12, 0.08 + row * 0.25, items);
      u.userData.pop = true;
    }
  }
  return {
    group,
    setState(s, animate = true) {
      fill(pans[0].items, s.a, s.b);
      fill(pans[1].items, s.c, s.d);
      if (animate) { wob = 0.12; popT = 0.35; }
    },
    update(t, dt) {
      wob *= Math.pow(0.04, dt);
      const ang = Math.sin(t * 9) * wob;
      beam.rotation.z = ang;
      pans.forEach(({ p, s }) => {
        p.position.set(s * 1.9 * Math.cos(ang), 2.85 + s * 1.9 * Math.sin(ang) - 1.3, 0);
      });
      if (popT > 0) {
        popT -= dt;
        const k = 1 + Math.sin(Math.max(popT, 0) / 0.35 * Math.PI) * 0.25;
        pans.forEach(({ items }) => items.children.forEach((c) => c.scale.setScalar(k)));
      }
    },
  };
}

/* =====================================================
   TERAZİ BULMACASI
   ===================================================== */
let pz = null; // { s, hist, moves, n, done }
function enterPuzzle() {
  mode = 'puzzle'; show('puzzle'); show('prompt', false);
  loadLevel(prog.level);
}
function loadLevel(i) {
  prog.level = i;
  const l = BALANCE_LEVELS[i];
  pz = { s: { a: l.a, b: l.b, c: l.c, d: l.d }, hist: [], moves: 0, n: 1, par: 0, done: false };
  pz.par = par(pz.s);
  balance.setState(pz.s);
  $('pz-tip').textContent = l.tip;
  show('pz-win', false);
  uiPuzzle();
}
function uiPuzzle() {
  const s = pz.s;
  $('pz-level').textContent = `Bölüm ${prog.level + 1} / ${BALANCE_LEVELS.length}`;
  $('pz-moves').textContent = `Hamle: ${pz.moves}`;
  { const f = fmt(s), k = f.indexOf('='); $('pz-eq').innerHTML = k > 0 ? `<span class="eqL">${esc(f.slice(0, k).trim())}</span><span class="eqM">=</span><span class="eqR">${esc(f.slice(k + 1).trim())}</span>` : esc(f); }
  $('n-val').textContent = pz.n;
  document.querySelectorAll('#pz-ops b').forEach((b) => (b.textContent = pz.n));
  { const sym = { 'op-c': '−' + pz.n, 'op-x': '−' + (pz.n > 1 ? pz.n : '') + 'x', 'op-d': '÷' + pz.n }; Object.keys(sym).forEach((id) => { const i = $(id).querySelector('i'); if (i) i.textContent = sym[id]; }); }
  $('op-c').disabled = pz.done || !apply(s, 'c', pz.n);
  $('op-x').disabled = pz.done || !apply(s, 'x', pz.n);
  $('op-d').disabled = pz.done || !apply(s, 'd', pz.n);
  $('pz-undo').disabled = pz.done || !pz.hist.length;
  $('pz-hint').disabled = pz.done;
}
/* denklemin iki yanında 1 sn'lik uçan "-1" / "÷2" göstergesi */
function eqFloat(txt, op) {
  const fx = $('pz-fx'), box = $('pz-eqbox'); if (!fx || !box) return;
  const bb = box.getBoundingClientRect();
  ['eqL', 'eqR'].forEach((cls, k) => {
    const el = $('pz-eq').querySelector('.' + cls); if (!el) return;
    const r = el.getBoundingClientRect(), d = document.createElement('span');
    d.className = 'fl ' + (op === 'd' ? 'div' : 'sub'); d.textContent = txt;
    d.style.left = (r.left - bb.left + r.width / 2) + 'px'; d.style.animationDelay = (k * 0.06) + 's';
    fx.appendChild(d); setTimeout(() => d.remove(), 1200);
  });
  box.classList.remove('flash'); void box.offsetWidth; box.classList.add('flash');
}
function doOp(op) {
  const t = apply(pz.s, op, pz.n);
  if (!t) return;
  pz.hist.push(pz.s); pz.s = t; pz.moves++;
  balance.setState(t); sfx('click');
  { const n = pz.n; uiPuzzle(); eqFloat(op === 'c' ? '−' + n : op === 'x' ? '−' + (n > 1 ? n : '') + 'x' : '÷' + n, op); }
  if (isSolved(t)) {
    pz.done = true; sfx('win'); confetti(130, 0.72, 0.4);
    const st = stars(pz.moves, pz.par);
    prog.stars[prog.level] = Math.max(prog.stars[prog.level] || 0, st);
    $('pz-win-text').innerHTML = `x = ${t.d} ✓<br>${'★'.repeat(st)}${'☆'.repeat(3 - st)} <small>(${pz.moves} hamle · en iyi ${pz.par})</small>`;
    $('pz-next').textContent = prog.level + 1 < BALANCE_LEVELS.length ? 'Sonraki bölüm ▸' : 'Bitir ▸';
    show('pz-win');
    $('pz-tip').textContent = 'Terazi dengede, x yalnız kaldı!';
  }
  uiPuzzle();
}
$('op-c').onclick = () => doOp('c');
$('op-x').onclick = () => doOp('x');
$('op-d').onclick = () => doOp('d');
$('n-minus').onclick = () => { pz.n = Math.max(1, pz.n - 1); uiPuzzle(); };
$('n-plus').onclick = () => { pz.n = Math.min(9, pz.n + 1); uiPuzzle(); };
$('pz-undo').onclick = () => { if (pz.hist.length) { pz.s = pz.hist.pop(); pz.moves++; balance.setState(pz.s); uiPuzzle(); } };
$('pz-hint').onclick = () => { const p = solve(pz.s); if (p && p[0]) $('pz-tip').textContent = '💡 ' + stepText(p[0]); };
$('pz-exit').onclick = () => { show('puzzle', false); mode = 'walk'; };
$('pz-next').onclick = () => {
  if (prog.level + 1 < BALANCE_LEVELS.length) loadLevel(prog.level + 1);
  else { show('puzzle', false); mode = 'walk'; prog.solvedAll = true; talkHarezmi(); }
};

/* =====================================================
   SINAV
   ===================================================== */
let qz = null;
/* ---------- Öğrenme geçmişi (yanlış sorular, konu istatistikleri) ---------- */
const HIST = (() => { try { return JSON.parse(localStorage.getItem('kf_hist')) || {}; } catch (e) { return {}; } })();
const histSave = () => { try { localStorage.setItem('kf_hist', JSON.stringify(HIST)); } catch (e) { /* yok say */ } };
function histRec(era, q, chosen, ok) {
  const h = HIST[era] || (HIST[era] = { tries: 0, last: null, qs: {} });
  const r = h.qs[q.q] || (h.qs[q.q] = { topic: q.topic, q: q.q, correct: q.options[0], note: q.note, wrong: 0, seen: 0 });
  r.seen++; r.lastOk = ok; if (!ok) { r.wrong++; r.lastChosen = chosen; }
  histSave();
}
const ERA_META = {
  bagdat: { name: 'Bağdat · Cebir', col: '#35d0c0', icon: '🕌' },
  misir: { name: 'Mısır · Oran-Orantı', col: '#ffb347', icon: '🔺' },
  iskenderiye: { name: 'İskenderiye · Geometri', col: '#b39ddb', icon: '📐' },
};
const TOPIC_TIPS = {
  'Birinci Derece Denklem': 'Bilinmeyeni yalnız bırak: önce sabit sayıyı öbür tarafa at (işaret değiştirir), sonra x\'in katsayısına böl.',
  'Kesirli Denklem': 'Kesirden kurtulmak için önce sabiti ayır, sonra iki tarafı paydayla çarp.',
  'İki Yanda x': 'x\'leri bir tarafta, sayıları öbür tarafta topla. İki yandan da aynı şeyi çıkarırsan denge bozulmaz.',
  'Parantezli Denklem': 'Parantezi dağıt ya da iki tarafı parantezin önündeki sayıya böl; sonra normal denklem gibi çöz.',
  'Mutlak Değer': '|A| = k ise iki durum yaz: A = k ve A = −k. İki çözümü de bul.',
  'İkinci Derece Denklem': 'Çarpanlara ayır: toplamı b, çarpımı c olan iki sayıyı bul → (x−m)(x−n) = 0.',
  'Matematik Tarihi': 'Bilginleri katkılarıyla eşleştir: Harezmî → cebir ve algoritma, Ahmes → oran-orantı (Rhind papirüsü), Eratosthenes → Dünya\'nın çevresi.',
  'Oran': 'Oran iki niceliğin bölümüdür; ikisini de aynı birime çevirmeyi unutma.',
  'Doğru Orantı': 'Biri artınca öteki aynı oranda artar: a/b = c/d → içler dışlar çarpımı.',
  'Ters Orantı': 'Biri artınca öteki azalır: çarpımları sabittir (a·b = c·d).',
  'Orantı Çözme': 'İçler dışlar çarpımı: a/b = c/x ise x = (b·c)/a.',
  'Harita Ölçeği': 'Ölçek = harita uzunluğu / gerçek uzunluk. cm ↔ m ↔ km dönüşümüne dikkat et.',
  'Gölge Problemi': 'Aynı anda cismin boyu / gölgesi oranı herkes için aynıdır: h₁/g₁ = h₂/g₂.',
  'Üçgen': 'Üçgenin iç açıları toplamı 180°\'dir; dış açı, kendisine komşu olmayan iki iç açının toplamına eşittir.',
  'Çember': 'Çevre = 2πr, alan = πr². Yarıçap mı çap mı verildiğine dikkat et.',
  'Daire Dilimi': 'Dilimin yayı = (açı / 360°) × çevre. Önce açının tam çemberin kaçta kaçı olduğunu bul.',
  'Çevre Açı': 'Çevre açı, aynı yayı gören merkez açının yarısıdır.',
  'Pisagor': 'Dik üçgende a² + b² = c² (c, dik açının karşısındaki en uzun kenar).',
};
const esc = (t) => String(t).replace(/[&<>"]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));

function startQuiz(era = 'bagdat') {
  const order = [...QUIZZES[era]].sort(() => Math.random() - 0.5);
  qz = { era, order, i: 0, score: 0, locked: false, streak: 0, marks: [] };
  const e = ERAS.find((x) => x.id === era), m = ERA_META[era];
  $('quiz').style.setProperty('--ac', m.col);
  $('qz-era').textContent = m.icon + ' ' + m.name;
  mode = 'quiz'; show('quiz'); show('prompt', false); showQ();
}
function startPractice(scope) {
  const d = karneData(scope);
  const items = d.wrongs.slice().sort((a, b) => (a.lastOk ? 1 : 0) - (b.lastOk ? 1 : 0) || b.wrong - a.wrong).slice(0, 8).map((r) => { const q = QUIZZES[r.era].find((x) => x.q === r.q); return q ? { ...q, _era: r.era } : null; }).filter(Boolean).sort(() => Math.random() - 0.5);
  if (!items.length) return;
  qz = { era: items[0]._era, order: items, i: 0, score: 0, locked: false, streak: 0, marks: [], practice: true };
  show('karne', false); show('result', false); mode = 'quiz'; show('quiz'); show('prompt', false); showQ();
}
function qzDots() {
  $('qz-dots').innerHTML = qz.order.map((_, i) => `<i class="${i < qz.marks.length ? (qz.marks[i] ? 'ok' : 'bad') : i === qz.i ? 'cur' : ''}"></i>`).join('');
  $('qz-score').innerHTML = `Soru <b>${qz.i + 1}</b>/${qz.order.length} · Doğru <b>${qz.score}</b> <span class="need">${qz.practice ? '' : '(geçmek için ' + PASS_SCORE + ')'}</span>`;
}
function showQ() {
  const q = qz.order[qz.i]; qz.locked = false;
  if (qz.practice) { const m = ERA_META[q._era]; $('quiz').style.setProperty('--ac', m.col); $('qz-era').textContent = '🔁 Tekrar Çalış · ' + m.name; }
  const card = $('qz-card'); card.classList.remove('in'); void card.offsetWidth; card.classList.add('in');
  $('qz-topic').textContent = q.topic; $('qz-q').textContent = q.q;
  $('qz-streak').textContent = qz.streak >= 2 ? `🔥 ${qz.streak} seri` : '';
  qzDots(); show('qz-note', false); show('qz-next', false); show('qz-hint');
  const box = $('qz-opts'); box.innerHTML = '';
  q.options.map((t, idx) => ({ t, ok: idx === 0 })).sort(() => Math.random() - 0.5).forEach((o, k) => {
    const b = document.createElement('button'); b.className = 'opt'; b.dataset.ok = o.ok ? '1' : '';
    b.innerHTML = `<span class="ltr">${'ABCD'[k]}</span><span class="otx">${esc(o.t)}</span><span class="ico"></span>`;
    b.onclick = () => {
      if (qz.locked) return; qz.locked = true;
      box.querySelectorAll('.opt').forEach((x) => x.classList.add('dim'));
      b.classList.remove('dim');
      if (o.ok) { qz.score++; qz.streak++; b.classList.add('right'); b.querySelector('.ico').textContent = '✓'; sfx('ok'); { const r = b.getBoundingClientRect(); confetti(qz.streak >= 3 ? 70 : 34, (r.left + r.width / 2) / innerWidth, (r.top + r.height / 2) / innerHeight); } } else {
        qz.streak = 0; sfx('bad'); b.classList.add('wrong'); b.querySelector('.ico').textContent = '✗';
        box.querySelectorAll('.opt').forEach((x) => { if (x.dataset.ok) { x.classList.remove('dim'); x.classList.add('right'); x.querySelector('.ico').textContent = '✓'; } });
      }
      qz.marks[qz.i] = o.ok; histRec(q._era || qz.era, q, o.t, o.ok); qzDots();
      $('qz-note').innerHTML = `<b>${o.ok ? '✔ Doğru!' : '✖ Olmadı.'}</b> <span class="lbl">Çözüm:</span> ${esc(q.note)}`;
      $('qz-note').className = o.ok ? 'good' : 'bad';
      show('qz-note'); show('qz-next'); show('qz-hint', false);
      $('qz-next').textContent = qz.i + 1 < qz.order.length ? 'Devam ▸' : 'Sonucu gör ▸';
    };
    box.appendChild(b);
  });
}
$('qz-next').onclick = () => {
  if (qz.i + 1 < qz.order.length) { qz.i++; showQ(); return; }
  show('quiz', false);
  if (qz.practice) {
    const sc = qz.score, tot = qz.order.length; sfx(sc === tot ? 'win' : 'ok'); if (sc === tot) confetti(200, 0.5, 0.4, true);
    result(sc === tot ? 'HEPSİNİ DÜZELTTİN!' : 'Tekrar çalışma bitti', `${sc}/${tot} doğru.${sc === tot ? '\nBu soruların hepsini artık biliyorsun.' : '\nYanlışlar karnede kalmaya devam ediyor; çözümlere bir kez daha bak.'}`, 'Karneye dön', () => openKarne('all'));
    return;
  }
  const total = qz.order.length; const era = qz.era;
  const hh = HIST[era] || (HIST[era] = { tries: 0, last: null, qs: {} }); hh.tries++; hh.last = { score: qz.score, total, passed: qz.score >= PASS_SCORE, marks: qz.marks.slice() }; histSave();
  const wrongN = total - qz.score;
  if (qz.score >= PASS_SCORE) {
    parts[era] = true; PROGS[era].quizPassed = true; sfx('win'); confetti(220, 0.5, 0.4, true); setTimeout(() => confetti(140, 0.25, 0.5), 350); setTimeout(() => confetti(140, 0.75, 0.5), 600);
    try { localStorage.setItem('kf_parts', JSON.stringify(parts)); } catch (e) { /* yok say */ }
    refreshParts();
    const pn = ERAS.find((e) => e.id === era).part.toLocaleUpperCase('tr-TR');
    result(`${pn} PARÇASI BULUNDU!`, `Sınavı ${qz.score}/${total} ile geçtin.\nKayıp Formül'ün bir parçası daha sende.`, 'Bilginle konuş', TALK[era], wrongN ? era : null);
  } else {
    result('Biraz daha çalış!', `${qz.score}/${total} doğru. Geçmek için en az ${PASS_SCORE} gerekiyor.\nÖnce çözümlere bak, sonra tekrar dene!`, 'Tekrar dene', () => startQuiz(era), era);
  }
};

/* ---------- Karne: yanlışlar, çözümler, odaklanılacak konular ---------- */
let karneBack = 'walk';
function karneData(scope) {
  const eras = scope && scope !== 'all' ? [scope] : ['bagdat', 'misir', 'iskenderiye'];
  const topics = {}, wrongs = [];
  eras.forEach((id) => {
    const h = HIST[id]; if (!h) return;
    Object.values(h.qs).forEach((r) => {
      const t = topics[r.topic] || (topics[r.topic] = { topic: r.topic, wrong: 0, seen: 0, era: id });
      t.wrong += r.wrong; t.seen += r.seen;
      if (r.wrong > 0) wrongs.push({ ...r, era: id });
    });
  });
  return { eras, topics: Object.values(topics).filter((t) => t.wrong > 0).sort((a, b) => b.wrong / b.seen - a.wrong / a.seen || b.wrong - a.wrong), wrongs };
}
function renderKarne(scope) {
  const d = karneData(scope), body = $('kr-body');
  let seen = 0, wrong = 0; d.eras.forEach((id) => Object.values((HIST[id] || { qs: {} }).qs).forEach((r) => { seen += r.seen; wrong += r.wrong; }));
  const acc = seen ? Math.round(((seen - wrong) / seen) * 100) : 0;
  const stars = d.eras.reduce((a, id) => a + PROGS[id].stars.reduce((x, y) => x + (y || 0), 0), 0), maxStars = d.eras.length * 18;
  let html = `<div class="kr-stats"><div><b>${seen ? acc + '%' : '—'}</b><span>Doğru oranı</span></div><div><b>${seen - wrong}/${seen}</b><span>Doğru cevap</span></div><div><b>${stars}/${maxStars}</b><span>Bulmaca yıldızı</span></div><div><b>${d.wrongs.length}</b><span>Çalışılacak soru</span></div></div>`;
  html += '<div class="kr-eras">' + d.eras.map((id) => {
    const m = ERA_META[id], h = HIST[id], l = h && h.last, pct = l ? Math.round((l.score / l.total) * 100) : 0;
    return `<div class="kr-era" style="--ac:${m.col}"><div class="kr-en">${m.icon} ${m.name}</div><div class="kr-bar"><i style="width:${pct}%"></i></div><div class="kr-es">${l ? `Son sınav: <b>${l.score}/${l.total}</b> ${l.passed ? '✔ geçti' : '✖ geçemedi'} · ${h.tries} deneme` : 'Henüz sınava girilmedi'}</div></div>`;
  }).join('') + '</div>';
  if (d.wrongs.length) html += `<button id="kr-practice" data-scope="${scope}">🔁 Yanlışlarımı tekrar çöz <small>(${Math.min(8, d.wrongs.length)} soru)</small></button>`;
  html += '<h3 class="kr-h">🎯 Odaklanman gereken konular</h3>';
  if (!d.topics.length) html += `<div class="kr-empty">${seen ? 'Harika! Yanlış yaptığın konu yok. 🎉' : 'Henüz sınav çözülmedi.'}</div>`;
  else html += '<div class="kr-topics">' + d.topics.map((t) => `<div class="kr-topic" style="--ac:${ERA_META[t.era].col}"><div class="kt-top"><b>${esc(t.topic)}</b><span>${t.wrong} yanlış / ${t.seen} soru</span></div><div class="kr-bar"><i style="width:${Math.min(100, Math.round((t.wrong / t.seen) * 100))}%"></i></div><p>💡 ${esc(TOPIC_TIPS[t.topic] || 'Bu konunun çözümlerine tekrar göz at.')}</p></div>`).join('') + '</div>';
  html += '<h3 class="kr-h">📝 Yanlış yaptığın sorular ve çözümleri</h3>';
  if (!d.wrongs.length) html += '<div class="kr-empty">Çözülecek yanlış soru yok.</div>';
  else html += '<div class="kr-wrongs">' + d.wrongs.map((r) => `<div class="kr-w" style="--ac:${ERA_META[r.era].col}"><div class="kw-top"><span class="kw-tag">${esc(r.topic)}</span>${r.lastOk ? '<span class="kw-fix">Sonradan doğru yaptın ✔</span>' : '<span class="kw-open">Hâlâ çalışılmalı</span>'}</div><div class="kw-q">${esc(r.q)}</div><div class="kw-ans"><span class="no">✗ Senin cevabın: ${esc(r.lastChosen || '—')}</span><span class="yes">✓ Doğru cevap: ${esc(r.correct)}</span></div><div class="kw-sol"><b>Nasıl çözülür?</b> ${esc(r.note)}</div></div>`).join('') + '</div>';
  body.innerHTML = html; body.scrollTop = 0;
  const pb = $('kr-practice'); if (pb) pb.onclick = () => startPractice(pb.dataset.scope);
}
function openKarne(scope = 'all') {
  karneBack = mode; mode = 'karne'; renderKarne(scope); show('karne'); $('kr-title').textContent = scope === 'all' ? 'Öğrenme Karnesi' : ERA_META[scope].name + ' · Karne';
}
$('kr-close').onclick = () => { show('karne', false); mode = karneBack === 'karne' ? 'walk' : karneBack; };
$('btn-karne').onclick = () => { if (mode === 'walk') openKarne('all'); };

function result(title, text, btn, cb, reviewScope = null) {
  mode = 'result';
  $('rs-title').textContent = title; $('rs-text').innerText = text; $('rs-btn').textContent = btn;
  $('rs-btn').onclick = () => { show('result', false); mode = 'walk'; cb && cb(); };
  const rv = $('rs-review'); rv.classList.toggle('hidden', !reviewScope); rv.onclick = () => openKarne(reviewScope);
  show('result');
}

/* =====================================================
   DÜNYA 3: MISIR — GİZE, NİL KIYISI (MÖ 2500)
   ===================================================== */
/* =====================================================
   ORTAK MANZARA ALETLERİ (İskenderiye & Bağdat için)
   ===================================================== */
function sceneryKit(g, seed) {
  let a = seed >>> 0;
  const R = () => ((a = (a * 1664525 + 1013904223) >>> 0) / 4294967296);
  const tick = [];
  const dummy = new THREE.Object3D();
  const crown = new THREE.SphereGeometry(1, 10, 8);
  const trunkMat = mat(0x7a5a33, { roughness: 1 });
  const canopyMat = mat(0x58823a, { roughness: 0.9 });
  const oliveMat = mat(0x7f9560, { roughness: 0.9 });
  const cypMat = mat(0x2f6b3a, { roughness: 0.9 });
  const leafMat = mat(0x3f8a3a, { roughness: 0.8, side: THREE.DoubleSide });
  const trunkGeo = new THREE.CylinderGeometry(0.15, 0.26, 1, 7); trunkGeo.translate(0, 0.5, 0);
  const leafGeo = new THREE.ConeGeometry(0.3, 3.3, 4); leafGeo.translate(0, 1.65, 0);
  const cypGeo = new THREE.ConeGeometry(0.9, 5.2, 9); cypGeo.translate(0, 2.6, 0);
  const jarM = mat(0xb4683a, { roughness: 0.9 });
  const skins = [0xb98560, 0xa87348, 0xc99870, 0x9b6a42, 0xd0a47a, 0xe0b48c];
  const pick = (arr) => arr[Math.floor(R() * arr.length)];

  const instanced = (geo, material, items) => {
    const m = new THREE.InstancedMesh(geo, material, items.length);
    const c = new THREE.Color();
    items.forEach((it, i) => {
      dummy.position.set(it.x, it.y || 0, it.z); dummy.rotation.set(0, it.ry || 0, 0); dummy.scale.set(it.sx, it.sy, it.sz); dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix); m.setColorAt(i, c.set(it.color === undefined ? 0xffffff : it.color));
    });
    m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true;
    m.castShadow = false; m.receiveShadow = false; m.frustumCulled = false; g.add(m); return m;
  };
  const unitBox = new THREE.BoxGeometry(1, 1, 1); unitBox.translate(0, 0.5, 0);
  const unitPyr = new THREE.ConeGeometry(0.7071, 1, 4); unitPyr.rotateY(Math.PI / 4); unitPyr.translate(0, 0.5, 0);
  const unitCyl = new THREE.CylinderGeometry(0.5, 0.5, 1, 12); unitCyl.translate(0, 0.5, 0);
  const unitDome = new THREE.SphereGeometry(1, 18, 9, 0, Math.PI * 2, 0, Math.PI / 2);
  const plain = (extra = {}) => new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.95, ...extra });

  const palm = (x, z, s = 1, shadow = false) => TREES.palm(g, x, z, s, shadow);
  const cypress = (x, z, s = 1) => TREES.cypress(g, x, z, s, false);
  const olive = (x, z, s = 1) => TREES.olive(g, x, z, s, false);
  const bush = (x, z, s = 1) => { const b = mesh(crown, canopyMat, x, 0.35 * s, z, g); b.scale.set(0.8 * s, 0.5 * s, 0.8 * s); b.castShadow = false; };

  // insan: gövde + ayaklar/kollar (animasyon için döndürülebilir)
  const body = ({ skin, cloth, top = null, hair = 0x141008, female = false, long = false, scale = 1, jarHead = false, scarf = null, hat = null, hatColor = 0xf4efe2, cap = null }) => {
    const p = new THREE.Group(), sk = mat(skin, { roughness: 0.8 }), cl = mat(cloth, { roughness: 0.95 });
    const topMat = top !== null ? mat(top, { roughness: 0.95 }) : (female || long ? cl : sk);
    const limb = (r1, r2, len, mt, x, y) => { const gm = new THREE.CylinderGeometry(r1, r2, len, 8); gm.translate(0, -len / 2, 0); const m = new THREE.Mesh(gm, mt); m.position.set(x, y, 0); m.castShadow = true; p.add(m); return m; };
    const legs = [limb(0.075, 0.06, 0.62, sk, -0.1, 0.66), limb(0.075, 0.06, 0.62, sk, 0.1, 0.66)];
    mesh(new THREE.CapsuleGeometry(0.17, 0.34, 4, 10), topMat, 0, 1.12, 0, p);
    if (female || long) mesh(new THREE.CylinderGeometry(0.19, 0.36, female ? 1.0 : 1.05, 12), cl, 0, female ? 0.62 : 0.6, 0, p);
    else mesh(new THREE.CylinderGeometry(0.2, 0.3, 0.5, 12), cl, 0, 0.82, 0, p);
    const arms = [limb(0.05, 0.042, 0.56, female || long ? topMat : sk, -0.24, 1.36), limb(0.05, 0.042, 0.56, female || long ? topMat : sk, 0.24, 1.36)];
    mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.1, 8), sk, 0, 1.42, 0, p);
    const hd = new THREE.Group(); hd.position.y = 1.58; p.add(hd);
    mesh(new THREE.SphereGeometry(0.135, 14, 12), sk, 0, 0, 0, hd);
    if (scarf !== null) { const sc = mesh(new THREE.SphereGeometry(0.15, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.72), mat(scarf, { roughness: 0.95 }), 0, 0.02, -0.01, hd); sc.rotation.x = -0.15; }
    else if (hat === 'turban') { mesh(new THREE.SphereGeometry(0.17, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.62), mat(hatColor, { roughness: 0.95 }), 0, 0.04, 0, hd); const w2 = mesh(new THREE.TorusGeometry(0.15, 0.05, 8, 18), mat(hatColor, { roughness: 0.95 }), 0, 0.06, 0, hd); w2.rotation.x = Math.PI / 2; }
    else if (cap !== null) { mesh(new THREE.SphereGeometry(0.15, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.45), mat(cap, { roughness: 0.95 }), 0, 0.05, 0, hd); }
    else { const hr = mesh(new THREE.SphereGeometry(0.145, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), mat(hair, { roughness: 1 }), 0, 0.02, -0.01, hd); hr.rotation.x = -0.2; }
    if (jarHead) { mesh(new THREE.SphereGeometry(0.2, 12, 10), jarM, 0, 0.27, 0, hd); mesh(new THREE.CylinderGeometry(0.1, 0.14, 0.14, 10), jarM, 0, 0.45, 0, hd); }
    blobShadow(p, 0.42, 0.45);
    p.scale.setScalar(scale); return { g: p, legs, arms, head: hd };
  };
  const walker = (pa, pb, o, speed = 1.1) => {
    const f = body(o); g.add(f.g); const len = Math.hypot(pb[0] - pa[0], pb[1] - pa[1]); const st = { u: R(), dir: 1, wait: 0 };
    tick.push((t, dt) => {
      if (st.wait > 0) { st.wait -= dt; f.legs.forEach((l) => (l.rotation.x *= 0.8)); f.arms.forEach((l) => (l.rotation.x *= 0.8)); return; }
      st.u += (st.dir * speed * dt) / len;
      if (st.u >= 1 || st.u <= 0) { st.u = Math.min(1, Math.max(0, st.u)); st.dir *= -1; st.wait = 1.5 + R() * 3; }
      const x = pa[0] + (pb[0] - pa[0]) * st.u, z = pa[1] + (pb[1] - pa[1]) * st.u;
      f.g.position.set(x, Math.abs(Math.sin(t * 6 * speed)) * 0.02, z);
      f.g.rotation.y = Math.atan2((pb[0] - pa[0]) * st.dir, (pb[1] - pa[1]) * st.dir);
      const sw = Math.sin(t * 6 * speed + st.u * 40) * 0.6;
      f.legs[0].rotation.x = sw; f.legs[1].rotation.x = -sw; f.arms[0].rotation.x = -sw * 0.8; f.arms[1].rotation.x = sw * 0.8;
      if (o.jarHead) { f.arms[0].rotation.z = 0.5; f.arms[0].rotation.x = 0; }
    });
  };
  const stander = (x, z, ry, o) => {
    const f = body(o); f.g.position.set(x, o.y || 0, z); f.g.rotation.y = ry; g.add(f.g); const ph = R() * 6;
    tick.push((t) => { f.head.rotation.y = Math.sin(t * 0.5 + ph) * 0.35; f.arms[0].rotation.x = Math.sin(t * 0.8 + ph) * 0.06; f.arms[1].rotation.x = -Math.sin(t * 0.8 + ph) * 0.06; });
    return f;
  };
  const camelMat = mat(0xb98e55, { roughness: 1 });
  const camel = (x, z, ry) => {
    const c = new THREE.Group(); c.position.set(x, 0, z); c.rotation.y = ry; c.scale.setScalar(1.05);
    const bd = mesh(new THREE.CapsuleGeometry(0.42, 1.2, 6, 12), camelMat, 0, 1.45, 0, c); bd.rotation.z = Math.PI / 2;
    mesh(crown, camelMat, 0.1, 2.0, 0, c).scale.set(0.32, 0.4, 0.3);
    const neck = mesh(new THREE.CylinderGeometry(0.13, 0.2, 1.1, 8), camelMat, 0.95, 2.0, 0, c); neck.rotation.z = -0.5;
    const head = new THREE.Group(); head.position.set(1.28, 2.5, 0); c.add(head);
    mesh(new THREE.BoxGeometry(0.5, 0.25, 0.26), camelMat, 0.1, 0, 0, head); mesh(new THREE.SphereGeometry(0.16, 10, 8), camelMat, -0.05, 0.05, 0, head);
    [[-0.55, 0.22], [-0.55, -0.22], [0.55, 0.22], [0.55, -0.22]].forEach(([lx, lz]) => mesh(new THREE.CylinderGeometry(0.09, 0.065, 1.2, 8), camelMat, lx, 0.62, lz, c));
    const ph = R() * 6; tick.push((t) => { head.rotation.z = Math.sin(t * 0.6 + ph) * 0.12; });
    g.add(c);
  };
  // yelkenli tekne / gemi (suda ilerler, uçta başa sarar)
  const sailBoat = (x0, z, dir, sc, opts = {}) => {
    const b = new THREE.Group(); b.position.set(x0, opts.y0 === undefined ? 0.1 : opts.y0, z); b.scale.setScalar(sc);
    const hullM = mat(opts.hull || 0x8a5a2b, { roughness: 0.9 });
    mesh(new THREE.BoxGeometry(opts.len || 3.6, 0.4, 1.1), hullM, 0, 0.2, 0, b);
    const bow = mesh(new THREE.ConeGeometry(0.55, 1.2, 4), hullM, (opts.len || 3.6) / 2 + 0.4, 0.28, 0, b); bow.rotation.z = -Math.PI / 2; bow.rotation.x = Math.PI / 4;
    mesh(new THREE.CylinderGeometry(0.05, 0.05, 3.6, 6), mat(0x5a3d1f), -0.2, 2.0, 0, b);
    if (opts.square) {
      const sl = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 2.6), new THREE.MeshStandardMaterial({ color: opts.sail || 0xf1e6cc, roughness: 0.9, side: THREE.DoubleSide })); sl.position.set(-0.2, 2.2, 0); sl.rotation.y = Math.PI / 2; sl.castShadow = true; b.add(sl);
    } else {
      const sh = new THREE.Shape(); sh.moveTo(-0.2, 0.5); sh.lineTo(-0.2, 3.7); sh.lineTo(-2.2, 0.7); sh.closePath();
      const sail = new THREE.Mesh(new THREE.ShapeGeometry(sh), new THREE.MeshStandardMaterial({ color: opts.sail || 0xf5ecd8, roughness: 0.9, side: THREE.DoubleSide })); sail.castShadow = true; b.add(sail);
    }
    b.rotation.y = dir > 0 ? 0 : Math.PI; g.add(b);
    const lim = opts.lim || 130, spd = opts.speed || 1.1, y0 = b.position.y;
    const xmin = opts.xmin === undefined ? -lim : opts.xmin, xmax = opts.xmax === undefined ? lim : opts.xmax;
    tick.push((t, dt) => { b.position.x += dir * spd * dt; if (b.position.x > xmax) b.position.x = xmin; if (b.position.x < xmin) b.position.x = xmax; b.rotation.z = Math.sin(t * 0.9 + x0) * 0.025; b.position.y = y0 + Math.sin(t * 1.3 + x0) * 0.025; });
  };
  return { R, tick, crown, trunkMat, canopyMat, jarM, skins, pick, instanced, unitBox, unitPyr, unitCyl, unitDome, plain, palm, cypress, olive, bush, body, walker, stander, camel, sailBoat, run: (t, dt) => { for (const f of tick) f(t, dt); } };
}

/* =====================================================
   BAĞDAT MANZARASI
   ===================================================== */
function buildBagdatScenery(g, w) {
  const K = sceneryKit(g, 8200820); const { R, pick } = K;
  // dış zemin
  const out = new THREE.Mesh(new THREE.PlaneGeometry(900, 900), mat(0xffffff, { map: TX.sandTex(130, 130), roughness: 1 }));
  out.rotation.x = -Math.PI / 2; out.position.y = -0.04; out.receiveShadow = true; g.add(out);

  // --- Şehir: toplu (instanced) evler ---
  const walls = [0xd8bf92, 0xcdb085, 0xe3d0a8, 0xc9a878, 0xdac49a, 0xbfa070, 0xe8d9b4];
  const bodies = [], parapets = [], windows = [], doors = [], domes = [];
  const domeCols = [0x1a8f94, 0xe9dcc0, 0x2a7d9a, 0xd9b45a, 0x3f9a8a];
  for (let r = 46; r < 150; r += 10 + R() * 4) {
    const step = 15 / r;
    for (let an = R() * step; an < Math.PI * 2; an += step * (0.85 + R() * 0.5)) {
      const rr = r + (R() - 0.5) * 6, x = Math.cos(an) * rr * 1.15, z = Math.sin(an) * rr;
      if (Math.abs(x) < 34 && z > -42 && z < 52) continue;      // avlu + kapı önü
      if (x > 84 && x < 124) continue;                          // Dicle nehri
      const wd = 5 + R() * 6, dp = 5 + R() * 6, h = 3.5 + R() * (r < 80 ? 7 : 4), ry = Math.atan2(-x, -z) + (R() - 0.5) * 0.25, col = pick(walls);
      bodies.push({ x, z, sx: wd, sy: h, sz: dp, ry, color: col });
      parapets.push({ x, y: h, z, sx: wd + 0.5, sy: 0.35, sz: dp + 0.5, ry, color: col * 0.92 });
      const fx = Math.sin(ry), fz = Math.cos(ry), px = -fz, pz = fx;
      for (let k = -1; k <= 1; k += 2) windows.push({ x: x + fx * (dp / 2 + 0.03) + px * k * wd * 0.25, y: h * 0.55, z: z + fz * (dp / 2 + 0.03) + pz * k * wd * 0.25, sx: 0.6, sy: 1.1, sz: 0.1, ry, color: 0x2b1d12 });
      doors.push({ x: x + fx * (dp / 2 + 0.03), z: z + fz * (dp / 2 + 0.03), sx: 1.0, sy: 1.9, sz: 0.1, ry, color: 0x2b1d12 });
      if (R() < 0.22) { const dr = Math.min(wd, dp) * (0.3 + R() * 0.12); domes.push({ x, y: h + 0.3, z, sx: dr, sy: dr * 0.9, sz: dr, color: pick(domeCols) }); }
    }
  }
  K.instanced(K.unitBox, K.plain(), bodies); K.instanced(K.unitBox, K.plain(), parapets);
  K.instanced(K.unitBox, K.plain(), windows); K.instanced(K.unitBox, K.plain(), doors);
  K.instanced(K.unitDome, K.plain({ roughness: 0.45, metalness: 0.1 }), domes);
  // minareler + büyük camiler
  const minaret = (x, z, s = 1) => {
    const m = new THREE.Group(); m.position.set(x, 0, z); m.scale.setScalar(s); g.add(m);
    const stone = mat(0xe3d0a8, { roughness: 0.9 });
    mesh(new THREE.CylinderGeometry(1.0, 1.3, 22, 16), stone, 0, 11, 0, m);
    mesh(new THREE.CylinderGeometry(1.7, 1.2, 0.6, 16), stone, 0, 19.5, 0, m);
    mesh(new THREE.CylinderGeometry(0.8, 0.9, 4, 16), stone, 0, 22, 0, m);
    mesh(new THREE.ConeGeometry(1.0, 3.4, 16), mat(0x1a8f94, { roughness: 0.4, metalness: 0.2 }), 0, 25.7, 0, m);
    mesh(new THREE.SphereGeometry(0.22, 10, 8), mat(0xe0a82e, { metalness: 0.8, roughness: 0.3 }), 0, 27.7, 0, m);
  };
  const mosque = (x, z, s = 1) => {
    const m = new THREE.Group(); m.position.set(x, 0, z); m.scale.setScalar(s); g.add(m);
    mesh(new THREE.BoxGeometry(22, 9, 22), mat(0xe3d0a8, { roughness: 0.95 }), 0, 4.5, 0, m);
    const d = mesh(new THREE.SphereGeometry(8.5, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2), mat(0xffffff, { map: TX.domeTex(), roughness: 0.4, metalness: 0.15 }), 0, 9, 0, m); d.castShadow = false;
    mesh(new THREE.ConeGeometry(0.3, 2.4, 8), mat(0xe0a82e, { metalness: 0.8 }), 0, 18.6, 0, m);
    [[-11.5, -11.5], [11.5, 11.5]].forEach(([mx, mz]) => { const q = new THREE.Group(); q.position.set(mx, 0, mz); m.add(q); });
  };
  [[-60, -70], [64, -60], [-92, 22], [-70, 80], [92, 60], [30, -118], [-20, -120]].forEach(([x, z]) => minaret(x, z, 0.9 + R() * 0.3));
  mosque(-52, -96, 1); mosque(58, -102, 1.1); mosque(-84, 50, 0.9);

  // --- Dicle nehri ---
  const bank = new THREE.Mesh(new THREE.PlaneGeometry(40, 420), mat(0x76853f, { roughness: 1 })); bank.rotation.x = -Math.PI / 2; bank.position.set(104, 0.02, 0); g.add(bank);
  const waterMat = new THREE.MeshStandardMaterial({ color: 0x2d7f90, roughness: 0.1, metalness: 0, transparent: true, opacity: 0.93, envMapIntensity: 1.3 });
  const river = new THREE.Mesh(new THREE.PlaneGeometry(18, 420), waterMat); river.rotation.x = -Math.PI / 2; river.position.set(104, 0.07, 0); g.add(river);
  K.tick.push((t) => waterMat.color.setHSL(0.53 + Math.sin(t * 0.4) * 0.008, 0.5, 0.33 + Math.sin(t * 0.9) * 0.02));
  // nehirde tekneler (z ekseninde ilerler)
  [[-60, 1, 98], [30, -1, 109], [120, 1, 100]].forEach(([z0, dir, x]) => {
    const b = new THREE.Group(); b.position.set(x, 0.1, z0); g.add(b);
    const hm = mat(0x7a4a22, { roughness: 0.9 });
    mesh(new THREE.BoxGeometry(1.2, 0.4, 3.6), hm, 0, 0.2, 0, b);
    mesh(new THREE.CylinderGeometry(0.05, 0.05, 3.6, 6), mat(0x5a3d1f), 0, 2.0, 0.2, b).castShadow = false;
    const sh = new THREE.Shape(); sh.moveTo(0.2, 0.5); sh.lineTo(2.6, 0.5); sh.lineTo(0.2, 3.5); sh.closePath();
    const sail = new THREE.Mesh(new THREE.ShapeGeometry(sh), new THREE.MeshStandardMaterial({ color: 0xf5ecd8, roughness: 0.9, side: THREE.DoubleSide }));
    sail.rotation.y = Math.PI / 2; b.add(sail);
    b.rotation.y = dir > 0 ? 0 : Math.PI;
    K.tick.push((t, dt) => { b.position.z += dir * 1.0 * dt; if (b.position.z > 200) b.position.z = -200; if (b.position.z < -200) b.position.z = 200; b.position.y = 0.1 + Math.sin(t * 1.2 + z0) * 0.025; });
  });
  for (let z = -190; z < 190; z += 10 + R() * 8) { K.palm(88 + R() * 3, z, 1 + R() * 0.3); K.palm(120 + R() * 3, z + 4, 1 + R() * 0.3); }
  const reedGeo = new THREE.ConeGeometry(0.06, 1.5, 4); reedGeo.translate(0, 0.75, 0); const reedMat = mat(0x6d8f3a, { roughness: 1 });
  for (let i = 0; i < 70; i++) { const c = new THREE.Group(); c.position.set(R() < 0.5 ? 94.4 : 113.6, 0, (R() - 0.5) * 300); for (let k = 0; k < 5; k++) { const r2 = new THREE.Mesh(reedGeo, reedMat); r2.position.set((R() - 0.5) * 0.5, 0, (R() - 0.5) * 0.5); r2.rotation.set((R() - 0.5) * 0.3, 0, (R() - 0.5) * 0.3); r2.scale.y = 0.7 + R() * 0.9; c.add(r2); } g.add(c); }
  // hurmalıklar (şehir dışı)
  for (let i = 0; i < 46; i++) { const an = R() * Math.PI * 2, rr = 40 + R() * 80, x = Math.cos(an) * rr * 1.15, z = Math.sin(an) * rr; if ((Math.abs(x) < 30 && z > -40 && z < 50) || (x > 84 && x < 124)) continue; K.palm(x, z, 1 + R() * 0.3); }

  // --- Avlu: bahçe ---
  const stoneM = mat(0xcdbfa0, { roughness: 0.9 }), soilM = mat(0x4a3320, { roughness: 1 });
  const planter = (x, z) => { mesh(new THREE.BoxGeometry(1.8, 0.7, 1.8), stoneM, x, 0.35, z, g); mesh(new THREE.BoxGeometry(1.5, 0.08, 1.5), soilM, x, 0.72, z, g).castShadow = false;
    mesh(new THREE.CylinderGeometry(0.1, 0.14, 1.5, 6), K.trunkMat, x, 1.45, z, g); const c = mesh(K.crown, K.canopyMat, x, 2.5, z, g); c.scale.set(1.1, 0.95, 1.1);
    for (let i = 0; i < 6; i++) { const o = mesh(new THREE.SphereGeometry(0.12, 8, 6), mat(0xe8821e, { roughness: 0.6 }), x + (R() - 0.5) * 1.6, 2.3 + (R() - 0.5) * 0.8, z + (R() - 0.5) * 1.6, g); o.castShadow = false; } };
  [-12, -6, 6, 12].forEach((z) => { planter(-17.8, z); planter(17.8, z); });
  [-1.5, 8].forEach((z) => { mesh(new THREE.BoxGeometry(0.7, 0.5, 2.6), stoneM, -17.6, 0.25, z, g); mesh(new THREE.BoxGeometry(0.7, 0.5, 2.6), stoneM, 17.6, 0.25, z, g); });
  // fenerler
  const lampM = new THREE.MeshBasicMaterial({ color: 0xffd27a });
  [[-15.8, -12], [-15.8, -4], [-15.8, 4], [-15.8, 12], [15.8, -12], [15.8, 4], [15.8, 12]].forEach(([x, z]) => {
    mesh(new THREE.CylinderGeometry(0.05, 0.07, 2.6, 8), mat(0x2a2018), x, 1.3, z, g); const l = mesh(new THREE.SphereGeometry(0.2, 10, 8), lampM, x, 2.75, z, g); l.castShadow = false;
    const gl = new THREE.Sprite(new THREE.SpriteMaterial({ map: TX.glowTex(), color: 0xffb85a, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); gl.scale.set(2.2, 2.2, 1); gl.position.set(x, 2.75, z); g.add(gl);
  });
  // kitap rafları (arka duvar önünde) ve küpler
  const wood = mat(0x6a4524, { roughness: 0.85 });
  [-14, -8, 8, 14].forEach((x) => { mesh(new THREE.BoxGeometry(3.6, 2.6, 0.5), wood, x, 1.3, -18.7, g); for (let r2 = 0; r2 < 3; r2++) for (let k = 0; k < 9; k++) { const bk = mesh(new THREE.BoxGeometry(0.2, 0.55, 0.3), mat([0x7a2a2a, 0x2a4a7a, 0x6a5a2a, 0x2a6a4a][(k + r2) % 4], { roughness: 0.8 }), x - 1.5 + k * 0.37, 0.55 + r2 * 0.8, -18.4, g); bk.castShadow = false; } });
  // güvercinler
  const pigeons = []; for (let i = 0; i < 10; i++) { const p = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.45, 4), mat(0xf3f0ea)); p.rotation.x = Math.PI / 2; g.add(p); pigeons.push({ p, a: R() * 6, r: 7 + R() * 6, h: 11 + R() * 5, s: 0.4 + R() * 0.3 }); }
  K.tick.push((t) => pigeons.forEach((q) => { const an = q.a + t * q.s; q.p.position.set(Math.cos(an) * q.r, q.h + Math.sin(t * 3 + q.a) * 0.4, -20 + Math.sin(an) * q.r); q.p.rotation.y = -an; }));

  // --- İnsanlar (cübbe + sarık) ---
  const robes = [0x1b5a8c, 0x2f6b4a, 0xb8842e, 0xe8dcc0, 0x7a3a5a, 0x2b4a7a], turbans = [0xf4efe2, 0xe8d9b4, 0x2f6b4a, 0xb8842e];
  const man = (extra = {}) => ({ skin: pick(K.skins), cloth: pick(robes), long: true, hat: 'turban', hatColor: pick(turbans), ...extra });
  const woman = (extra = {}) => ({ skin: pick(K.skins), cloth: pick([0x3a2a5a, 0x1b3a5c, 0x6a2a3a, 0x2a4a3a]), female: true, scarf: pick([0x2a2a3a, 0x3a2a5a, 0xe8dcc0]), ...extra });
  K.walker([-17, -15.5], [17, -15.5], man(), 0.9); K.walker([17.8, -9], [17.8, 10], man(), 0.8); K.walker([-18.4, 10], [-18.4, -9], man({ scale: 0.95 }), 0.7);
  K.walker([-9, -15.5], [9, -15.5], man({ cloth: 0xe8dcc0 }), 0.75);
  K.stander(-15.6, 6.4, 1.2, man()); K.stander(-14.6, 5.6, -2.0, man()); K.stander(15.8, -9.4, -1.4, man()); K.stander(14.8, -8.6, 1.6, man({ cloth: 0x2f6b4a }));
  K.stander(12.5, -9.6, 3.0, man({ scale: 0.72, cloth: 0xb8842e })); K.stander(-14, -11, 0.6, woman());
  // kapı önü: pazar
  const awn = [0xb04a3a, 0x2f6b8a, 0xc79a34, 0x4d7a4a, 0x8a3a5a];
  const stall = (x, z, c) => {
    mesh(new THREE.BoxGeometry(2.8, 0.9, 1.2), wood, x, 0.45, z, g);
    [[-1.3, -0.5], [1.3, -0.5], [-1.3, 0.5], [1.3, 0.5]].forEach(([dx, dz]) => mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.5, 6), wood, x + dx, 1.25, z + dz, g));
    const cl = mesh(new THREE.BoxGeometry(3.3, 0.08, 1.9), mat(c, { roughness: 1 }), x, 2.55, z, g); cl.rotation.x = 0.12;
    for (let i = 0; i < 6; i++) { const f = mesh(new THREE.SphereGeometry(0.16, 8, 6), mat(pick([0xe8821e, 0xc43a2a, 0xe0c23a, 0x5a8a2a]), { roughness: 0.7 }), x - 1.0 + i * 0.4, 1.02, z + 0.1, g); f.castShadow = false; }
  };
  [[-14, 25], [-8, 29], [-1, 25], [6, 29], [13, 25], [19, 30]].forEach(([x, z], i) => { stall(x, z, awn[i % awn.length]); K.stander(x, z + 1.1, Math.PI, man({ cloth: pick(robes) })); });
  K.camel(-22, 36, 0.6); K.camel(-18.4, 38, 0.2); K.camel(24, 38, -2.4);
  K.walker([-24, 20], [-6, 40], woman({ jarHead: true }), 0.9); K.walker([28, 20], [8, 42], man({ scale: 0.72 }), 1.5); K.walker([-30, 26], [30, 26], man(), 1.1);
  K.stander(-4, 33, 2.4, man()); K.stander(-2.8, 33.4, -0.8, woman());
  [[-36, 0.9], [-34, 0.2], [-36, 0.4]].forEach(([x], i) => K.cypress(x, -10 + i * 10, 1.1)); [36, 38].forEach((x, i) => K.cypress(x, i * 12 - 6, 1.1));
  return K.run;
}

/* =====================================================
   İSKENDERİYE MANZARASI
   ===================================================== */
function buildIskenderiyeScenery(g, w) {
  const K = sceneryKit(g, 24024024); const { R, pick } = K;
  const paved = () => mat(0xffffff, { map: TX.brickTex(60, 60), roughness: 0.8 });
  // kara parçaları
  const land = (x0, x1, z0, z1) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, z1 - z0), paved()); m.rotation.x = -Math.PI / 2; m.position.set((x0 + x1) / 2, 0, (z0 + z1) / 2); m.receiveShadow = true; g.add(m);
    const q = mat(0xd9cfb8, { roughness: 0.9 }); // rıhtım duvarları
    mesh(new THREE.BoxGeometry(x1 - x0, 1.6, 0.5), q, (x0 + x1) / 2, -0.8, z1, g).castShadow = false; mesh(new THREE.BoxGeometry(0.5, 1.6, z1 - z0), q, x0, -0.8, (z0 + z1) / 2, g).castShadow = false; };
  land(23.2, 210, -190, 75); land(-36, 23.2, -190, -14.4);
  // Pharos adası + dolgu yolu (Heptastadion)
  const isl = mesh(new THREE.CylinderGeometry(19, 20, 1.2, 28), mat(0xd9cfb8, { roughness: 0.9 }), -52, -0.4, -80, g); isl.castShadow = false;
  mesh(new THREE.BoxGeometry(10, 1.2, 9), mat(0xd9cfb8, { roughness: 0.9 }), -40, -0.4, -80, g).castShadow = false;

  // --- Şehir: ızgara planlı evler ---
  const cream = [0xf1e8d2, 0xe9dec4, 0xf5eddb, 0xe4d7ba], roofs = [0xb5532e, 0xa6482a, 0xc25f38, 0x9a4326];
  const bodies = [], roofI = [], wins = [], doors = [];
  const house = (x, z, wd, dp, h, ry) => {
    bodies.push({ x, z, sx: wd, sy: h, sz: dp, ry, color: pick(cream) });
    roofI.push({ x, y: h, z, sx: wd * 1.05 * 1.414, sy: 1.6 + R() * 0.8, sz: dp * 1.05 * 1.414, ry: ry + 0, color: pick(roofs) });
    const fx = Math.sin(ry), fz = Math.cos(ry), px = -fz, pz = fx;
    for (let k = -1; k <= 1; k += 2) wins.push({ x: x + fx * (dp / 2 + 0.03) + px * k * wd * 0.27, y: h * 0.5, z: z + fz * (dp / 2 + 0.03) + pz * k * wd * 0.27, sx: 0.7, sy: 1.2, sz: 0.1, ry, color: 0x3a2a1a });
    doors.push({ x: x + fx * (dp / 2 + 0.03), z: z + fz * (dp / 2 + 0.03), sx: 1.1, sy: 2.0, sz: 0.1, ry, color: 0x4a2f1a });
  };
  const blocks = (x0, x1, z0, z1) => {
    for (let x = x0; x < x1; x += 24) for (let z = z0; z > z1; z -= 24) {
      if (R() < 0.12) continue;
      for (let k = 0; k < 2; k++) { const wd = 6 + R() * 5, dp = 6 + R() * 5, h = 4 + R() * 6; house(x + (k ? 11 : 0) + (R() - 0.5) * 2, z + (R() - 0.5) * 2, wd, dp, h, (R() < 0.5 ? 0 : Math.PI / 2) * 0 + (R() - 0.5) * 0.05); }
    }
  };
  blocks(34, 200, 55, -190); // doğu (kıyı hariç)
  blocks(-28, 12, -32, -190);
  K.instanced(K.unitBox, K.plain(), bodies); K.instanced(K.unitPyr, K.plain({ roughness: 0.9 }), roofI);
  K.instanced(K.unitBox, K.plain(), wins); K.instanced(K.unitBox, K.plain(), doors);

  // --- Tapınaklar / stoa / dikilitaş / heykeller ---
  const marble = mat(0xf0e8d8, { roughness: 0.5 });
  const temple = (x, z, cols, s = 1, ry = 0) => {
    const t = new THREE.Group(); t.position.set(x, 0, z); t.scale.setScalar(s); t.rotation.y = ry; g.add(t);
    for (let i = 0; i < 3; i++) mesh(new THREE.BoxGeometry(cols * 3 + 4 - i * 1.4, 0.5, 14 - i * 1.4), marble, 0, 0.25 + i * 0.5, 0, t);
    for (let i = 0; i < cols; i++) for (const zz of [-5, 5]) mesh(new THREE.CylinderGeometry(0.55, 0.7, 7, 14), marble, (i - (cols - 1) / 2) * 3, 5, zz, t);
    mesh(new THREE.BoxGeometry(cols * 3 + 1, 1, 12), marble, 0, 8.9, 0, t);
    const tri = new THREE.Shape(); tri.moveTo(-(cols * 1.5 + 0.5), 0); tri.lineTo(cols * 1.5 + 0.5, 0); tri.lineTo(0, 2.8); tri.closePath();
    const ped = new THREE.Mesh(new THREE.ExtrudeGeometry(tri, { depth: 11, bevelEnabled: false }), marble); ped.position.set(0, 9.4, -5.5); t.add(ped);
    mesh(new THREE.BoxGeometry(cols * 3 - 1, 7, 9), mat(0xe8dcc2, { roughness: 0.8 }), 0, 4.5, 0, t);
  };
  temple(62, -72, 6, 1.3, 0.2); temple(110, -40, 5, 1.0, -0.4); temple(96, -120, 7, 1.2, 0.1); temple(-4, -58, 5, 1.0, 0);
  // stoa (sütunlu galeri)
  const stoa = (x, z, n, ry) => { const s = new THREE.Group(); s.position.set(x, 0, z); s.rotation.y = ry; g.add(s); for (let i = 0; i < n; i++) mesh(new THREE.CylinderGeometry(0.4, 0.5, 5, 12), marble, (i - (n - 1) / 2) * 3, 2.5, 0, s); mesh(new THREE.BoxGeometry(n * 3 + 1, 0.6, 2), marble, 0, 5.3, 0, s); mesh(new THREE.BoxGeometry(n * 3 + 1, 0.3, 3), mat(0xb5532e, { roughness: 0.9 }), 0, 5.9, 0, s); };
  stoa(60, 20, 14, 0); stoa(60, 44, 14, 0); stoa(28.4, -20, 8, Math.PI / 2 * 0 + 0);
  // dikilitaşlar
  const obelisk = (x, z, h) => { const o = new THREE.Group(); o.position.set(x, 0, z); g.add(o); mesh(new THREE.BoxGeometry(3, 1.2, 3), marble, 0, 0.6, 0, o); const b = mesh(new THREE.CylinderGeometry(0.55, 0.9, h, 4), mat(0xcbb28a, { roughness: 0.6 }), 0, h / 2 + 1.2, 0, o); b.rotation.y = Math.PI / 4; mesh(new THREE.ConeGeometry(0.55, 1.2, 4), mat(0xe0a82e, { metalness: 0.7, roughness: 0.3 }), 0, h + 1.8, 0, o).rotation.y = Math.PI / 4; };
  obelisk(30, 8, 13); obelisk(30, -6, 13);
  // heykeller
  const statue = (x, z, ry = 0) => { const s = new THREE.Group(); s.position.set(x, 0, z); s.rotation.y = ry; g.add(s); mesh(new THREE.BoxGeometry(1.4, 1.4, 1.4), marble, 0, 0.7, 0, s); mesh(new THREE.CylinderGeometry(0.28, 0.42, 1.7, 10), marble, 0, 2.2, 0, s); mesh(new THREE.SphereGeometry(0.24, 12, 10), marble, 0, 3.2, 0, s); const a = mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.9, 6), marble, 0.4, 2.5, 0, s); a.rotation.z = -0.9; };
  [[27, 14], [27, 0], [27, -10], [27, 24], [44, 8], [44, -8]].forEach(([x, z], i) => statue(x, z, i * 0.5));
  // sütunlu sokak ağaçları
  for (let z = 70; z > -180; z -= 12 + R() * 4) { K.cypress(33.5, z, 1.1); K.cypress(48, z + 5, 1.0); }
  for (let i = 0; i < 40; i++) { const x = 30 + R() * 170, z = 60 - R() * 240; if (R() < 0.6) K.olive(x, z, 0.9 + R() * 0.5); else K.palm(x, z, 1 + R() * 0.3); }
  for (let i = 0; i < 18; i++) { const x = -30 + R() * 50, z = -30 - R() * 150; K.olive(x, z, 0.9 + R() * 0.5); }

  // --- Deniz: gemiler ve martılar ---
  // Denizdeki gemiler: kara (x>23, z<75) ve meydanın dışında, sadece suda ilerler
  K.sailBoat(-200, 92, 1, 3.2, { hull: 0x5a3a20, square: true, sail: 0xe8dcc0, len: 5, speed: 1.6, xmin: -260, xmax: 300 });
  K.sailBoat(180, 118, -1, 3.8, { hull: 0x6a2a1a, square: true, sail: 0xb04a3a, len: 5, speed: 1.9, xmin: -260, xmax: 300 });
  K.sailBoat(-60, 160, 1, 3.4, { hull: 0x4a3a2a, square: true, sail: 0xe8dcc0, len: 5, speed: 1.4, xmin: -260, xmax: 300 });
  K.sailBoat(100, 84, -1, 1.8, { hull: 0x8a5a2b, speed: 1.1, xmin: -200, xmax: 260 });
  K.sailBoat(-20, 136, 1, 2.2, { hull: 0x7a4a22, speed: 1.3, xmin: -200, xmax: 260 });
  // Meydanın güneyindeki koyda (x<20, z 28-70) küçük tekneler
  K.sailBoat(-120, 44, 1, 1.6, { hull: 0x8a5a2b, speed: 0.9, xmin: -150, xmax: 6 });
  K.sailBoat(-10, 62, -1, 1.4, { hull: 0x7a4a22, speed: 0.8, xmin: -150, xmax: 8 });
  // Batı denizi: Pharos'un önünde (z -14'ten kuzeye, x<-62) gemi
  K.sailBoat(-120, 30, 1, 2.0, { hull: 0x6a4a2a, square: true, sail: 0xe8dcc0, len: 5, speed: 1.0, xmin: -200, xmax: 10 });
  const gulls = []; for (let i = 0; i < 14; i++) { const gm = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.7, 3), mat(0xf6f3ec)); gm.scale.set(2.2, 1, 0.4); g.add(gm); gulls.push({ m: gm, a: R() * 6, r: 20 + R() * 40, h: 12 + R() * 12, s: 0.25 + R() * 0.3, cx: -10 + R() * 40, cz: 10 + R() * 40 }); }
  K.tick.push((t) => gulls.forEach((q) => { const an = q.a + t * q.s; q.m.position.set(q.cx + Math.cos(an) * q.r, q.h + Math.sin(t * 1.5 + q.a) * 0.8, q.cz + Math.sin(an) * q.r); q.m.rotation.y = -an + Math.PI / 2; q.m.rotation.z = Math.sin(t * 6 + q.a) * 0.4; }));

  // --- İnsanlar: khiton + himation, denizciler ---
  const chiton = [0xf3ecd9, 0xe8dfc4, 0xf6f0e0], himation = [0x6b2c8a, 0x8a2f3a, 0x1f4a7a, 0x2f6b4a, 0xb8842e];
  const scholar = (extra = {}) => ({ skin: pick(K.skins), cloth: pick(chiton), top: pick(himation), long: R() < 0.6, ...extra });
  const sailor = (extra = {}) => ({ skin: pick(K.skins), cloth: pick([0xe8dfc4, 0xb89a6a, 0x9a7a4a]), top: pick([0xb04a3a, 0x3a5a8a, 0xc79a34]), cap: pick([0xa83a2a, 0x3a3a3a, 0x6a4a2a]), ...extra });
  const woman = (extra = {}) => ({ skin: pick(K.skins), cloth: pick([0xf3ecd9, 0xe3a8a0, 0x9ab8d8, 0xd8c890]), female: true, scarf: pick([0xf3ecd9, 0xe3a8a0, 0xc79a34]), ...extra });
  K.walker([24.5, 30], [34, -12], scholar(), 1.0); K.walker([36, 60], [36, -30], sailor(), 1.3); K.walker([40, 40], [56, 8], woman({ jarHead: true }), 0.9); K.walker([30, 52], [100, 52], sailor(), 1.2);
  K.walker([-20, -26], [18, -26], scholar(), 1.0); K.walker([60, 4], [60, -30], woman(), 1.0); K.walker([44, 24], [50, 24], scholar({ scale: 0.72 }), 1.5); K.walker([80, 30], [30, 30], scholar(), 1.1);
  K.walker([-8, -40], [20, -40], woman(), 0.9); K.walker([70, -8], [36, -8], sailor(), 1.2);
  K.stander(28.6, 4, 1.8, scholar()); K.stander(29.8, 3.4, -1.6, scholar()); K.stander(26, 22, 0.4, woman()); K.stander(27, 21.2, -2.4, scholar());
  K.stander(24.6, 60, 1.4, sailor()); K.stander(25.8, 60.4, -1.6, sailor()); K.stander(48, 20, 0.5, scholar()); K.stander(52, 21, -2.2, woman());
  K.stander(-26, -20, 2.2, scholar()); K.stander(-4, -26, 0.1, scholar({ scale: 0.7 }));
  // amfora yığınları (rıhtımda)
  const amph = (x, z) => { const a = new THREE.Group(); a.position.set(x, 0, z); g.add(a); mesh(new THREE.SphereGeometry(0.34, 10, 8), K.jarM, 0, 0.5, 0, a).scale.y = 1.3; mesh(new THREE.CylinderGeometry(0.1, 0.17, 0.5, 8), K.jarM, 0, 1.05, 0, a); };
  for (let i = 0; i < 12; i++) amph(25 + R() * 6, 62 + R() * 6);
  for (let i = 0; i < 8; i++) amph(24.8 + R() * 2, 26 + R() * 8);
  return K.run;
}

/* =====================================================
   MISIR MANZARASI: tepeler, ağaçlar, Nil, köy, develer, insanlar
   ===================================================== */
function buildMisirScenery(g) {
  const R = (() => { let a = 20241113; return () => ((a = (a * 1664525 + 1013904223) >>> 0) / 4294967296); })();
  const tick = []; // her karede çalışacak animasyonlar

  // ---- Tepeler ----
  const hillMat = mat(0xffffff, { map: TX.sandTex(5, 5), roughness: 1 });
  const hillGeo = (r, h, seed) => {
    const geo = new THREE.IcosahedronGeometry(1, 4), p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      const n = 1 + 0.16 * Math.sin(x * 3.1 + seed) + 0.12 * Math.sin(z * 4.3 + seed * 2) + 0.07 * Math.sin((x + z) * 7 + seed);
      p.setXYZ(i, x * n * r, Math.max(y, -0.2) * h * n, z * n * r);
    }
    geo.computeVertexNormals(); return geo;
  };
  [[-72, 10, 28, 10], [-58, -20, 16, 6], [-98, -8, 34, 14], [76, 8, 30, 11], [62, -20, 17, 6], [104, -12, 36, 15],
   [-42, 50, 26, 9], [34, 56, 30, 10], [0, 74, 40, 12], [-98, 46, 30, 10], [102, 52, 30, 11], [-30, 24, 12, 3.2], [34, 22, 13, 3.6]].forEach(([x, z, r, h], i) => {
    const m = new THREE.Mesh(hillGeo(r, h, i * 1.7), hillMat); m.position.set(x, 0, z); m.receiveShadow = true; g.add(m);
  });
  // kayalar
  const rockMat = mat(0xb39468, { roughness: 1, flatShading: true });
  for (let i = 0; i < 22; i++) {
    const x = (R() - 0.5) * 150, z = -30 + R() * 80; if (Math.abs(x) < 19 && z > -16 && z < 20) continue;
    const s = 0.5 + R() * 1.6, rk = new THREE.Mesh(new THREE.DodecahedronGeometry(s, 0), rockMat);
    rk.position.set(x, s * 0.35, z); rk.rotation.set(R() * 3, R() * 3, R() * 3); rk.scale.y = 0.65; rk.castShadow = true; g.add(rk);
  }

  // ---- Nil nehri ----
  const bank = new THREE.Mesh(new THREE.PlaneGeometry(420, 34), mat(0x76853f, { roughness: 1 }));
  bank.rotation.x = -Math.PI / 2; bank.position.set(0, 0.02, -52); bank.receiveShadow = true; g.add(bank);
  const waterMat = new THREE.MeshStandardMaterial({ color: 0x2d8ea3, roughness: 0.1, metalness: 0.0, transparent: true, opacity: 0.92, envMapIntensity: 1.4 });
  const water = new THREE.Mesh(new THREE.PlaneGeometry(420, 13), waterMat);
  water.rotation.x = -Math.PI / 2; water.position.set(0, 0.07, -52); g.add(water);
  tick.push((t) => { waterMat.color.setHSL(0.52 + Math.sin(t * 0.4) * 0.008, 0.55, 0.36 + Math.sin(t * 0.9) * 0.02); });
  // felucca yelkenliler
  const boat = (z, dir, x0, sc) => {
    const b = new THREE.Group(); b.position.set(x0, 0.1, z); b.scale.setScalar(sc);
    const hullM = mat(0x8a5a2b, { roughness: 0.9 });
    mesh(new THREE.BoxGeometry(3.6, 0.4, 1.1), hullM, 0, 0.2, 0, b);
    const bow = mesh(new THREE.ConeGeometry(0.55, 1.2, 4), hullM, 2.2, 0.28, 0, b); bow.rotation.z = -Math.PI / 2; bow.rotation.x = Math.PI / 4;
    mesh(new THREE.CylinderGeometry(0.05, 0.05, 3.6, 6), mat(0x5a3d1f), -0.2, 2.0, 0, b);
    const sh = new THREE.Shape(); sh.moveTo(-0.2, 0.5); sh.lineTo(-0.2, 3.7); sh.lineTo(-2.2, 0.7); sh.closePath();
    const sail = new THREE.Mesh(new THREE.ShapeGeometry(sh), new THREE.MeshStandardMaterial({ color: 0xf5ecd8, roughness: 0.9, side: THREE.DoubleSide }));
    sail.castShadow = true; b.add(sail);
    b.rotation.y = dir > 0 ? 0 : Math.PI; g.add(b);
    tick.push((t, dt) => { b.position.x += dir * 1.1 * dt; if (b.position.x > 130) b.position.x = -130; if (b.position.x < -130) b.position.x = 130; b.rotation.z = Math.sin(t * 0.9 + x0) * 0.025; b.position.y = 0.1 + Math.sin(t * 1.3 + x0) * 0.025; });
  };
  boat(-50, 1, -40, 1.2); boat(-54.5, -1, 55, 1.0); boat(-52, 1, 100, 0.9);

  // ---- Ağaçlar ----
  const trunkGeo = new THREE.CylinderGeometry(0.15, 0.26, 1, 7); trunkGeo.translate(0, 0.5, 0);
  const leafGeo = new THREE.ConeGeometry(0.3, 3.3, 4); leafGeo.translate(0, 1.65, 0);
  const trunkMat = mat(0x7a5a33, { roughness: 1 }), leafMat = mat(0x3f8a3a, { roughness: 0.8, side: THREE.DoubleSide });
  const palm = (x, z, s = 1, shadow = false) => TREES.palm(g, x, z, s, shadow);
  const crown = new THREE.SphereGeometry(1, 10, 8), canopyMat = mat(0x58823a, { roughness: 0.9 });
  const acacia = (x, z, s = 1) => {
    const a = new THREE.Group(); a.position.set(x, 0, z); a.scale.setScalar(s);
    const t1 = mesh(new THREE.CylinderGeometry(0.2, 0.34, 3.4, 7), trunkMat, 0, 1.7, 0, a);
    [[0, 3.9, 0, 2.6], [-1.6, 3.4, 0.5, 1.8], [1.5, 3.5, -0.4, 1.9]].forEach(([cx, cy, cz, r]) => { const c = mesh(crown, canopyMat, cx, cy, cz, a); c.scale.set(r, r * 0.5, r); });
    t1.castShadow = true; g.add(a);
  };
  [[-28, -6], [-31, -12], [-25, -14], [-34, -4], [-30, 4], [30, -8], [33, -3], [27, -14], [36, -10], [31, 6], [-19, -10], [19, -11], [-20, 16], [20, 17],
   [-14, 28], [10, 32], [-30, 30], [26, 26], [0, 38]].forEach(([x, z]) => palm(x, z, 1 + R() * 0.3, Math.abs(x) < 25 && z > -16));
  for (let x = -90; x <= 90; x += 11 + R() * 6) { palm(x, -41 + R() * 3, 1 + R() * 0.3); palm(x + 5, -62 + R() * 3, 1 + R() * 0.3); }
  [[-42, -2, 1.1], [44, 0, 1.2], [-24, 22, 1], [23, 22, 1.1], [-52, 14, 1.3], [55, 12, 1.2], [-8, 45, 1.2], [14, 48, 1]].forEach(([x, z, s]) => acacia(x, z, s));
  // sazlıklar
  const reedGeo = new THREE.ConeGeometry(0.06, 1.5, 4); reedGeo.translate(0, 0.75, 0);
  const reedMat = mat(0x6d8f3a, { roughness: 1 });
  for (let i = 0; i < 90; i++) {
    const x = (R() - 0.5) * 220, side = R() < 0.5 ? -45.2 : -58.6, c = new THREE.Group(); c.position.set(x, 0, side + (R() - 0.5) * 1.2);
    for (let k = 0; k < 5; k++) { const r = new THREE.Mesh(reedGeo, reedMat); r.position.set((R() - 0.5) * 0.5, 0, (R() - 0.5) * 0.5); r.rotation.set((R() - 0.5) * 0.3, 0, (R() - 0.5) * 0.3); r.scale.y = 0.7 + R() * 0.9; c.add(r); }
    g.add(c);
  }
  // çalılar
  for (let i = 0; i < 26; i++) {
    const x = (R() - 0.5) * 120, z = -25 + R() * 60; if (Math.abs(x) < 18 && z > -14 && z < 19) continue;
    const b = mesh(crown, canopyMat, x, 0.3, z, g); b.scale.set(0.7 + R() * 0.6, 0.45 + R() * 0.3, 0.7 + R() * 0.6); b.castShadow = false;
  }

  // ---- Köy: kerpiç evler ----
  const mud = mat(0xcfae80, { roughness: 1 }), mudDark = mat(0xb5906a, { roughness: 1 }), doorM = mat(0x2d1d12, { roughness: 1 });
  const house = (x, z, w, d, h, ry) => {
    const hh = new THREE.Group(); hh.position.set(x, 0, z); hh.rotation.y = ry;
    mesh(new THREE.BoxGeometry(w, h, d), mud, 0, h / 2, 0, hh);
    mesh(new THREE.BoxGeometry(w + 0.3, 0.22, d + 0.3), mudDark, 0, h + 0.1, 0, hh);
    mesh(new THREE.BoxGeometry(0.7, 1.4, 0.06), doorM, 0, 0.7, d / 2 + 0.02, hh);
    if (h > 3) mesh(new THREE.BoxGeometry(w * 0.55, 1.3, d * 0.55), mud, -w * 0.12, h + 0.8, 0, hh);
    g.add(hh);
  };
  house(-34, 12, 4.4, 3.6, 3.0, 0.4); house(-41, 6, 5, 4, 3.8, 0.1); house(-38, 21, 4, 3.4, 2.8, 0.7); house(-47, 16, 4.6, 4.2, 3.4, -0.2);
  house(35, 5, 4.6, 3.8, 3.2, -0.5); house(42, 12, 5, 4, 3.9, -0.2); house(37, 20, 4, 3.4, 2.8, -0.8); house(46, 4, 4.2, 3.6, 3.0, -0.1); house(48, 20, 4.4, 3.6, 3.0, -0.6);
  // küpler, sepetler, çuvallar (oynanabilir alanın kenarlarında)
  const jarM = mat(0xb4683a, { roughness: 0.9 });
  const jar = (x, z, s = 1) => { const j = new THREE.Group(); j.position.set(x, 0, z); j.scale.setScalar(s);
    mesh(new THREE.SphereGeometry(0.4, 12, 10), jarM, 0, 0.45, 0, j); mesh(new THREE.CylinderGeometry(0.2, 0.28, 0.3, 10), jarM, 0, 0.92, 0, j); g.add(j); };
  [[-13.5, -9], [-12.6, -9.8], [13.2, -9.4], [14, 13], [-13, 14.5], [-14, 12.8]].forEach(([x, z], i) => jar(x, z, 0.9 + (i % 3) * 0.12));
  const sack = mat(0xd6c394, { roughness: 1 });
  [[14, -8.5], [14.8, -7.6], [-14.4, -7.5]].forEach(([x, z]) => { const s = mesh(crown, sack, x, 0.35, z, g); s.scale.set(0.45, 0.4, 0.4); });
  [[-16, 4, 1.4], [17, -2, 1.1], [16.5, 8, 0.9]].forEach(([x, z, s]) => { const b = mesh(new THREE.BoxGeometry(1.2 * s, 0.9 * s, 1.2 * s), mat(0xd8c9a2, { map: null, roughness: 0.9 }), x, 0.45 * s, z, g); b.rotation.y = x; });

  // ---- İnsanlar ----
  const skins = [0xb98560, 0xa87348, 0xc99870, 0x9b6a42, 0xd0a47a];
  const body = ({ skin, cloth, hair = 0x141008, female = false, scale = 1, jarHead = false, scarf = null }) => {
    const p = new THREE.Group(), sk = mat(skin, { roughness: 0.8 }), cl = mat(cloth, { roughness: 0.95 });
    const limb = (r1, r2, len, mt, x, y) => { const gm = new THREE.CylinderGeometry(r1, r2, len, 8); gm.translate(0, -len / 2, 0); const m = new THREE.Mesh(gm, mt); m.position.set(x, y, 0); m.castShadow = true; p.add(m); return m; };
    const legs = [limb(0.075, 0.06, 0.62, sk, -0.1, 0.66), limb(0.075, 0.06, 0.62, sk, 0.1, 0.66)];
    mesh(new THREE.CapsuleGeometry(0.17, 0.34, 4, 10), female ? cl : sk, 0, 1.12, 0, p);
    if (female) mesh(new THREE.CylinderGeometry(0.19, 0.36, 1.0, 12), cl, 0, 0.62, 0, p);
    else mesh(new THREE.CylinderGeometry(0.2, 0.3, 0.5, 12), cl, 0, 0.82, 0, p);
    const arms = [limb(0.05, 0.042, 0.56, female ? cl : sk, -0.24, 1.36), limb(0.05, 0.042, 0.56, female ? cl : sk, 0.24, 1.36)];
    mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.1, 8), sk, 0, 1.42, 0, p);
    const hd = new THREE.Group(); hd.position.y = 1.58; p.add(hd);
    mesh(new THREE.SphereGeometry(0.135, 14, 12), sk, 0, 0, 0, hd);
    if (scarf !== null) { const sc = mesh(new THREE.SphereGeometry(0.15, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.72), mat(scarf, { roughness: 0.95 }), 0, 0.02, -0.01, hd); sc.rotation.x = -0.15; }
    else { const hr = mesh(new THREE.SphereGeometry(0.145, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), mat(hair, { roughness: 1 }), 0, 0.02, -0.01, hd); hr.rotation.x = -0.2; }
    if (jarHead) { mesh(new THREE.SphereGeometry(0.2, 12, 10), jarM, 0, 0.27, 0, hd); mesh(new THREE.CylinderGeometry(0.1, 0.14, 0.14, 10), jarM, 0, 0.45, 0, hd); }
    blobShadow(p, 0.42, 0.45);
    p.scale.setScalar(scale); return { g: p, legs, arms, head: hd };
  };
  const linen = [0xf0e8d4, 0xe8dcc0, 0xd9c9a4], dress = [0xb04a3a, 0x3f6f8f, 0xc79a34, 0x6a4a8a, 0x4d7a4a];
  const pick = (a) => a[Math.floor(R() * a.length)];
  const walkers = [];
  const walker = (a, b, o, speed = 1.1) => {
    const f = body(o); g.add(f.g); const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const st = { u: R(), dir: 1, wait: 0 };
    tick.push((t, dt) => {
      if (st.wait > 0) { st.wait -= dt; f.legs.forEach((l) => (l.rotation.x *= 0.8)); f.arms.forEach((l) => (l.rotation.x *= 0.8)); return; }
      st.u += (st.dir * speed * dt) / len;
      if (st.u >= 1 || st.u <= 0) { st.u = Math.min(1, Math.max(0, st.u)); st.dir *= -1; st.wait = 1.5 + R() * 3; }
      const x = a[0] + (b[0] - a[0]) * st.u, z = a[1] + (b[1] - a[1]) * st.u;
      f.g.position.set(x, Math.abs(Math.sin(t * 6 * speed)) * 0.02, z);
      f.g.rotation.y = Math.atan2((b[0] - a[0]) * st.dir, (b[1] - a[1]) * st.dir);
      const sw = Math.sin(t * 6 * speed + st.u * 40) * 0.6;
      f.legs[0].rotation.x = sw; f.legs[1].rotation.x = -sw; f.arms[0].rotation.x = -sw * 0.8; f.arms[1].rotation.x = sw * 0.8;
      if (o.jarHead) { f.arms[0].rotation.z = 0.5; f.arms[0].rotation.x = 0; }
    });
  };
  const stander = (x, z, ry, o) => {
    const f = body(o); f.g.position.set(x, 0, z); f.g.rotation.y = ry; g.add(f.g); const ph = R() * 6;
    tick.push((t) => { f.g.position.y = 0; f.head.rotation.y = Math.sin(t * 0.5 + ph) * 0.35; f.arms[0].rotation.x = Math.sin(t * 0.8 + ph) * 0.06; f.arms[1].rotation.x = -Math.sin(t * 0.8 + ph) * 0.06; });
    return f;
  };
  // yürüyenler
  walker([-36, 4], [-22, 14], { skin: pick(skins), cloth: pick(linen) }, 1.2);
  walker([34, -4], [20, 12], { skin: pick(skins), cloth: pick(linen) }, 1.0);
  walker([-24, 27], [-8, 36], { skin: pick(skins), cloth: pick(dress), female: true, jarHead: true, scarf: 0xf0e8d4 }, 0.9);
  walker([40, 28], [22, 18], { skin: pick(skins), cloth: pick(dress), female: true, scarf: pick(dress) }, 1.0);
  walker([-80, -42], [-20, -42], { skin: pick(skins), cloth: pick(linen) }, 1.3);
  walker([70, -62], [10, -62], { skin: pick(skins), cloth: pick(linen), scale: 0.8 }, 1.5);
  walker([-50, 2], [-44, 24], { skin: pick(skins), cloth: pick(dress), female: true, jarHead: true, scarf: pick(dress) }, 0.85);
  walker([50, 26], [30, 36], { skin: pick(skins), cloth: pick(linen), scale: 0.72 }, 1.6);
  // duranlar: sohbet edenler, balıkçı, çocuklar
  stander(-30, 16, 0.9, { skin: pick(skins), cloth: pick(linen) }); stander(-28.6, 15.4, -2.2, { skin: pick(skins), cloth: pick(dress), female: true, scarf: pick(dress) });
  stander(30, 12, 2.4, { skin: pick(skins), cloth: pick(linen) }); stander(31.4, 12.6, -0.8, { skin: pick(skins), cloth: pick(linen) });
  stander(-12, -43.2, 0, { skin: pick(skins), cloth: pick(linen) }); stander(24, -43.4, 0.2, { skin: pick(skins), cloth: pick(linen) });
  stander(-44, 11, 1, { skin: pick(skins), cloth: pick(linen), scale: 0.7 }); stander(41, 8, 3, { skin: pick(skins), cloth: pick(dress), female: true, scale: 0.72, scarf: pick(dress) });
  stander(-16, -13, 0.4, { skin: pick(skins), cloth: pick(linen) });

  // ---- Develer ----
  const camelMat = mat(0xb98e55, { roughness: 1 });
  const camel = (x, z, ry) => {
    const c = new THREE.Group(); c.position.set(x, 0, z); c.rotation.y = ry; c.scale.setScalar(1.05);
    const bd = mesh(new THREE.CapsuleGeometry(0.42, 1.2, 6, 12), camelMat, 0, 1.45, 0, c); bd.rotation.z = Math.PI / 2;
    mesh(crown, camelMat, 0.1, 2.0, 0, c).scale.set(0.32, 0.4, 0.3);
    const neck = mesh(new THREE.CylinderGeometry(0.13, 0.2, 1.1, 8), camelMat, 0.95, 2.0, 0, c); neck.rotation.z = -0.5;
    const head = new THREE.Group(); head.position.set(1.28, 2.5, 0); c.add(head);
    mesh(new THREE.BoxGeometry(0.5, 0.25, 0.26), camelMat, 0.1, 0, 0, head); mesh(new THREE.SphereGeometry(0.16, 10, 8), camelMat, -0.05, 0.05, 0, head);
    [[-0.55, 0.22], [-0.55, -0.22], [0.55, 0.22], [0.55, -0.22]].forEach(([lx, lz]) => mesh(new THREE.CylinderGeometry(0.09, 0.065, 1.2, 8), camelMat, lx, 0.62, lz, c));
    mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.7, 5), camelMat, -1.1, 1.3, 0, c);
    const ph = R() * 6; tick.push((t) => { head.rotation.z = Math.sin(t * 0.6 + ph) * 0.12; c.position.y = 0; });
    g.add(c);
  };
  camel(36, -9, -0.4); camel(39.6, -7.4, 0.5); camel(-35, 19.5, 2.2);

  return (t, dt) => { for (const f of tick) f(t, dt); };
}

function buildMisir() {
  const g = new THREE.Group();
  const w = { group: g, colliders: [], interact: [], spawn: new THREE.Vector3(0, 0, 11), bounds: { x: 15.5, zMin: -11, zMax: 16.5 } };
  w.skyMesh = makeSky('#2b6cb0', '#8fc4ee', '#ffe2b0'); g.add(w.skyMesh);
  g.add(new THREE.HemisphereLight(0xdbeaff, 0xc9a26a, 0.8));
  const sun = new THREE.DirectionalLight(0xfff0d0, 3.4); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -32, right: 32, top: 22, bottom: -22, near: 1, far: 220 });
  sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03;
  sun.target.position.set(2, 0, -3); g.add(sun); g.add(sun.target);

  const ground = mesh(new THREE.PlaneGeometry(500, 500), mat(0xffffff, { map: TX.sandTex(70, 70), roughness: 0.95 }));
  ground.rotation.x = -Math.PI / 2; ground.castShadow = false; g.add(ground);
  // taş çalışma platformu
  const slab = mesh(new THREE.BoxGeometry(34, 0.12, 9), mat(0xffffff, { map: TX.brickTex(12, 3) }), 2, 0.06, -3, g);
  slab.castShadow = false;

  // Uzak piramitler ve kumullar
  const pyrTex = TX.brickTex(80, 20); pyrTex.userData.kind = 'pyramid';
  const stone = mat(0xffffff, { map: pyrTex });
  [[-52, -105, 52, 46], [12, -128, 72, 66], [78, -100, 34, 30]].forEach(([x, z, r, hh]) => {
    const p = mesh(new THREE.ConeGeometry(r, hh, 4), stone, x, hh / 2, z, g); p.rotation.y = Math.PI / 4; p.castShadow = false; p.receiveShadow = false;
  });
  // küçük yardımcı piramitler
  [[-92, -112, 16, 14], [42, -92, 14, 12]].forEach(([x, z, r, hh]) => {
    const p = mesh(new THREE.ConeGeometry(r, hh, 4), stone, x, hh / 2, z, g); p.rotation.y = Math.PI / 4; p.castShadow = false; p.receiveShadow = false;
  });
  const dune = mat(0xdcb878, { roughness: 1 });
  [[-90, -60, 50], [70, -80, 60], [150, -40, 45], [-150, -20, 40]].forEach(([x, z, r]) => {
    const d = mesh(new THREE.SphereGeometry(r, 24, 12), dune, x, -r * 0.62, z, g); d.scale.y = 0.5; d.castShadow = false;
  });

  // Hurmalar
  const palm = (x, z, sc = 1) => {
    TREES.palm(g, x, z, sc, true);
    w.colliders.push({ x, z, r: 0.5 });
  };
  palm(-14, 10, 1.2); palm(14, 11, 1.1); palm(-14, -9, 1.0); palm(14, -9, 1.2); palm(-6, 14, 0.9);

  // Ahmes'in gölgeliği
  const ax = 9, az = 7;
  const wood = mat(0xffffff, { map: TX.woodTex() });
  for (const [dx, dz] of [[-2.2, -1.6], [2.2, -1.6], [-2.2, 1.6], [2.2, 1.6]]) mesh(new THREE.CylinderGeometry(0.1, 0.1, 3.2, 8), wood, ax + dx, 1.6, az + dz, g);
  const cloth = mesh(new THREE.BoxGeometry(5.2, 0.08, 4.0), mat(0xf1e6cf, { roughness: 1 }), ax, 3.25, az, g); cloth.rotation.z = 0.05;
  mesh(new THREE.BoxGeometry(5.0, 0.04, 3.8), mat(0xb02a2a, { roughness: 1 }), ax, 3.31, az, g).castShadow = false;
  mesh(new THREE.BoxGeometry(2.4, 0.1, 1.0), wood, ax + 0.4, 0.95, az - 0.9, g);
  for (const sx of [-1, 1]) mesh(new THREE.BoxGeometry(0.1, 0.95, 0.1), wood, ax + 0.4 + sx * 1.1, 0.47, az - 0.9, g);
  for (let i = 0; i < 3; i++) { const sc = mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.6, 10), mat(0xe9dcb0), ax - 0.2 + i * 0.3, 1.08, az - 0.9, g); sc.rotation.z = Math.PI / 2; }
  const scribe = makeScribe(); scribe.position.set(ax - 1.2, 0, az + 0.6); scribe.rotation.y = -0.5; scribe.scale.setScalar(1.25); g.add(scribe);
  attachModel(scribe, 'assets/models/ahmes.glb', 2.1);
  w.colliders.push({ x: ax - 1.2, z: az + 0.6, r: 0.8 }, { x: ax + 0.4, z: az - 0.9, r: 1.4 });
  w.interact.push({ pos: new THREE.Vector3(ax - 1.2, 0, az + 0.6), r: 3.2, label: () => 'E: Katip Ahmes ile konuş', action: () => talkAhmes() });
  const lamp = new THREE.PointLight(0xffc070, 6, 9); lamp.position.set(ax + 0.4, 2.6, az - 0.5); g.add(lamp);

  // ---- Gölge bulmaca alanı ----
  const RODX = -9, BASEX = -1, SZ = -3;
  const site = new THREE.Group(); g.add(site);
  const rod = new THREE.Group(); rod.position.set(RODX, 0.12, SZ); site.add(rod);
  const rodLabel = TX.labelSprite('h = ?', '#ffcf6a', 0.6); site.add(rodLabel);
  const ruler = (x0, len, col1, col2, labCol, z) => {
    for (let i = 0; i < len; i++) {
      const b = mesh(new THREE.BoxGeometry(0.96, 0.05, 0.28), mat(i % 2 ? col1 : col2, { roughness: 0.8 }), x0 + i + 0.5, 0.15, z, site); b.castShadow = false;
    }
    for (let i = 0; i <= len; i += 2) { const l = TX.labelSprite(String(i), labCol, 0.3); l.position.set(x0 + i, 0.5, z + 0.7); site.add(l); }
  };
  ruler(RODX, 8, 0x2a6f8f, 0xbfe3f2, '#7fe8ff', SZ + 1.6);
  ruler(BASEX, 16, 0x7a4b12, 0xe8c37a, '#ffd27a', SZ + 1.6);
  mesh(new THREE.BoxGeometry(1.4, 0.25, 1.4), mat(0xffffff, { map: TX.brickTex(1, 1) }), BASEX, 0.24, SZ, site);
  const obBody = mesh(new THREE.BoxGeometry(0.6, 1, 0.6), mat(0xd9c7a0, { roughness: 0.6 }), BASEX, 0.37, SZ, site);
  obBody.geometry.translate(0, 0.5, 0);
  const obCap = mesh(new THREE.ConeGeometry(0.43, 0.6, 4), mat(0xe0a82e, { metalness: 0.8, roughness: 0.25, emissive: 0xe0a82e, emissiveIntensity: 0.25 }), BASEX, 1, SZ, site);
  obCap.rotation.y = Math.PI / 4;
  const flag = new THREE.Group(); site.add(flag);
  mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.6, 8), mat(0xe9e9e9), 0, 1.3, 0, flag);
  const cl = mesh(new THREE.BoxGeometry(0.9, 0.5, 0.04), mat(0xc22a2a, { roughness: 0.9, side: THREE.DoubleSide }), 0.45, 2.2, 0, flag);
  const flagLabel = TX.labelSprite('S = ?', '#ff9a9a', 0.6); flagLabel.position.set(0, 3.3, 0); flag.add(flagLabel);
  w.colliders.push({ x: RODX, z: SZ, r: 0.5 }, { x: BASEX, z: SZ, r: 0.9 });

  let curH = 1, targetH = 1, tweenT = 1;
  function setObelisk(H) {
    obBody.scale.y = Math.max(H - 0.6, 0.05);
    obBody.position.y = 0.37;
    obCap.position.y = 0.37 + Math.max(H - 0.6, 0.05) + 0.3;
  }
  setObelisk(1);
  w.shadow = {
    setLevel(l) {
      while (rod.children.length) rod.remove(rod.children[0]);
      for (let i = 0; i < l.h; i++) mesh(new THREE.BoxGeometry(0.2, 0.98, 0.2), mat(i % 2 ? 0xffffff : 0xc22a2a, { roughness: 0.6 }), 0, i + 0.5, 0, rod);
      rodLabel.material.map = TX.labelSprite(`h = ${l.h} arşın`, '#ffcf6a', 1).material.map; rodLabel.position.set(RODX, l.h + 1.2, SZ);
      flagLabel.material.map = TX.labelSprite(`gölge = ${l.S}`, '#ff9a9a', 1).material.map;
      flag.position.set(BASEX + l.S, 0.12, SZ);
      const th = Math.atan2(l.h, l.s);
      sun.position.set(2 - Math.cos(th) * 90, Math.sin(th) * 90, SZ + 4);
      curH = targetH = 1; tweenT = 1; setObelisk(1);
    },
    raise(H, done) { w.shadow.from = curH; targetH = H; tweenT = 0; w.shadow.done = done; },
    get h() { return curH; },
  };

  // Dönüş portalı
  const bp = new THREE.Group(); bp.position.set(0, 0, 15.5); g.add(bp);
  mesh(new THREE.TorusGeometry(1.5, 0.14, 12, 40), mat(0x1fd5ff, { emissive: 0x1fd5ff, emissiveIntensity: 1.6 }), 0, 1.8, 0, bp);
  const bdisc = new THREE.Mesh(new THREE.CircleGeometry(1.4, 32), new THREE.MeshBasicMaterial({ map: TX.portalTex(0x1fd5ff), transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
  bdisc.position.set(0, 1.8, 0); bp.add(bdisc);
  const bl = TX.labelSprite('Zaman Makinesi', '#7fe8ff', 0.6); bl.position.set(0, 3.9, 15.5); g.add(bl);
  const bpl = new THREE.PointLight(0x1fd5ff, 4, 10); bpl.position.set(0, 2, 14.5); g.add(bpl);
  w.interact.push({ pos: new THREE.Vector3(0, 0, 15.5), r: 2.4, label: () => 'E: Zaman makinesine dön', action: () => gotoHub() });

  // Yapı alanı etkileşimi
  w.interact.push({
    pos: new THREE.Vector3(BASEX, 0, SZ + 2.8), r: 3.4,
    label: () => (progM.met ? 'E: Gölge ölçümü' : 'Önce Katip Ahmes ile konuş'),
    action: () => { if (!progM.met) return toast('Önce Katip Ahmes ile konuşmalısın.'); if (progM.solvedAll) return toast('Gölgeleri çözdün! Ahmes seni bekliyor.'); enterShadow(); },
  });

  const glyphs = ['1 : 2', '3 / 5', '△', '☀', 'x / y', '∠', '2 : 3'];
  const floaters = glyphs.map((t) => { const s = TX.labelSprite(t, '#ffe9a0', 0.7); s.position.set((Math.random() - 0.5) * 30, 5 + Math.random() * 5, -6 + Math.random() * 16); s.userData.b = Math.random() * 6; g.add(s); return s; });
  const dm = dust(160, 40, 0xffe6b0, 0.07); g.add(dm);
  const sceneryTick = buildMisirScenery(g);

  w.update = (t, dt) => {
    sceneryTick(t, dt);
    bdisc.rotation.z = t * 0.7;
    floaters.forEach((s) => { s.position.y += Math.sin(t + s.userData.b) * 0.003; s.material.opacity = 0.5 + Math.sin(t * 1.5 + s.userData.b) * 0.3; });
    dm.position.x = Math.sin(t * 0.1) * 2;
    cl.rotation.y = Math.sin(t * 2.2) * 0.25;
    scribe.position.y = Math.sin(t * 1.4) * 0.02;
    const d = player.position.clone().sub(scribe.position);
    if (d.length() < 9) scribe.rotation.y = THREE.MathUtils.lerp(scribe.rotation.y, Math.atan2(d.x, d.z), 0.06);
    if (tweenT < 1) {
      tweenT = Math.min(1, tweenT + dt / 1.1);
      const e = 1 - Math.pow(1 - tweenT, 3);
      curH = w.shadow.from + (targetH - w.shadow.from) * e; setObelisk(curH);
      if (tweenT >= 1 && w.shadow.done) { const f = w.shadow.done; w.shadow.done = null; f(); }
    }
  };
  g.visible = false; scene.add(g);
  return w;
}

/* ---------- Gölge bulmacası (Thales) ---------- */
let sh = null;
function enterShadow() {
  mode = 'puzzle'; show('shadow'); show('prompt', false);
  loadShadow(progM.level);
}
function loadShadow(i) {
  progM.level = i;
  const l = SHADOW_LEVELS[i];
  sh = { l, tries: 0, done: false, busy: false, kind: 'shadow' };
  setInputLabel('Yapının boyu H =', 'arşın');
  worlds.misir.shadow.setLevel(l);
  $('sh-level').textContent = `Bölüm ${i + 1} / ${SHADOW_LEVELS.length}`;
  $('sh-tries').textContent = 'Deneme: 0';
  $('sh-given').innerHTML = `Çubuk: boyu <b>${l.h}</b>, gölgesi <b>${l.s}</b> arşın<br>Bayrak: yapının gölgesi <b>${l.S}</b> arşın olmalı`;
  $('sh-eq').textContent = `${l.h} / ${l.s} = H / ${l.S}`;
  $('sh-tip').textContent = l.tip;
  $('sh-msg').textContent = ''; $('sh-h').value = ''; $('sh-h').disabled = false; $('sh-check').disabled = false; $('sh-hint').disabled = false;
  show('sh-win', false);
}
function checkShadow() {
  if (!sh || sh.busy || sh.done) return;
  const H = parseFloat($('sh-h').value.replace(',', '.'));
  if (!(H > 0 && H <= 18)) { $('sh-msg').textContent = 'Önce yapının boyunu yaz (1 ile 18 arası).'; return; }
  sh.tries++; sh.busy = true;
  $('sh-tries').textContent = `Deneme: ${sh.tries}`; $('sh-msg').textContent = 'Yapı yükseliyor...';
  worlds.misir.shadow.raise(H, () => {
    sh.busy = false;
    const l = sh.l; const ans = (l.h * l.S) / l.s;
    if (Math.abs(H - ans) < 0.01) {
      sh.done = true; sfx('win'); confetti(130, 0.72, 0.4); confetti(130, 0.72, 0.4);
      const st = sh.tries === 1 ? 3 : sh.tries === 2 ? 2 : 1;
      progM.stars[progM.level] = Math.max(progM.stars[progM.level] || 0, st);
      $('sh-msg').textContent = '';
      $('sh-win-text').innerHTML = `Gölge tam bayrağa değdi! ✓<br>H = ${l.h} · ${l.S} / ${l.s} = ${ans}<br>${'★'.repeat(st)}${'☆'.repeat(3 - st)}`;
      $('sh-next').textContent = progM.level + 1 < SHADOW_LEVELS.length ? 'Sonraki bölüm ▸' : 'Bitir ▸';
      show('sh-win'); $('sh-h').disabled = true; $('sh-check').disabled = true; $('sh-hint').disabled = true;
    } else {
      sfx('bad');
      const shadowLen = (H * l.s) / l.h;
      $('sh-msg').textContent = shadowLen < l.S ? `Gölgenin ucu bayrağa ulaşmadı (gölge ${+shadowLen.toFixed(2)}). Yapı daha yüksek olmalı.` : `Gölge bayrağı geçti (gölge ${+shadowLen.toFixed(2)}). Yapı daha alçak olmalı.`;
    }
  });
}
$('sh-check').onclick = () => (sh && sh.kind === 'angle' ? checkAngle() : checkShadow());
$('sh-h').addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter') $('sh-check').onclick(); });
$('sh-hint').onclick = () => { if (sh.kind === 'angle') return hintAngle(); const l = sh.l; $('sh-msg').style.color = '#ffe08a'; $('sh-msg').textContent = `💡 Orantı: ${l.h} / ${l.s} = H / ${l.S}. İçler dışlar çarpımı: ${l.s} · H = ${l.h} · ${l.S}.`; setTimeout(() => ($('sh-msg').style.color = ''), 100); };
$('sh-exit').onclick = () => { show('shadow', false); mode = 'walk'; };
$('sh-next').onclick = () => {
  if (sh.kind === 'angle') return nextAngle();
  if (progM.level + 1 < SHADOW_LEVELS.length) loadShadow(progM.level + 1);
  else { show('shadow', false); mode = 'walk'; progM.solvedAll = true; talkAhmes(); }
};


function setInputLabel(label, unit, btn = 'Yapıyı dik') { $('sh-check').textContent = btn; $('sh-input').querySelector('label').textContent = label; $('sh-input').querySelector('span').textContent = unit; $('sh-h').max = '99999999'; }

/* =====================================================
   DÜNYA 4: İSKENDERİYE — KÜTÜPHANE VE PHAROS (MÖ 240)
   ===================================================== */
function buildIskenderiye() {
  const g = new THREE.Group();
  const w = { group: g, colliders: [], interact: [], spawn: new THREE.Vector3(0, 0, 11), bounds: { x: 15.5, zMin: -9, zMax: 16.5 } };
  w.skyMesh = makeSky('#2f7fd8', '#9ccff5', '#fff1d6'); g.add(w.skyMesh);
  g.add(new THREE.HemisphereLight(0xdcecff, 0xb8a27a, 0.9));
  const sun = new THREE.DirectionalLight(0xfff2dc, 3.0); sun.position.set(-18, 26, 14); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -26, right: 26, top: 26, bottom: -26, near: 1, far: 90 });
  sun.shadow.bias = -0.0004; g.add(sun);

  const sea = mesh(new THREE.PlaneGeometry(1200, 1200), new THREE.MeshPhysicalMaterial({ color: 0x0f7a9e, roughness: 0.08, metalness: 0.1, clearcoat: 1, transparent: true, opacity: 0.96 }), 0, -0.45, 0, g);
  sea.rotation.x = -Math.PI / 2; sea.castShadow = false;
  const pm = TX.marbleTex(); pm.repeat.set(11, 9);
  const plaza = mesh(new THREE.BoxGeometry(46, 0.8, 38), mat(0xffffff, { map: pm, roughness: 0.35 }), 0, -0.4, 3, g);
  plaza.castShadow = false;
  const marble = mat(0xffffff, { map: TX.marbleTex(), roughness: 0.4 });

  // Kütüphane (Mouseion) cephesi
  for (let i = 0; i < 11; i++) {
    const x = -15 + i * 3;
    mesh(new THREE.CylinderGeometry(0.5, 0.62, 6.4, 18), marble, x, 3.4, -12, g);
    mesh(new THREE.BoxGeometry(1.4, 0.3, 1.4), marble, x, 6.75, -12, g);
    mesh(new THREE.BoxGeometry(1.5, 0.3, 1.5), marble, x, 0.15, -12, g);
    w.colliders.push({ x, z: -12, r: 0.65 });
  }
  mesh(new THREE.BoxGeometry(35, 1.1, 1.8), marble, 0, 7.5, -12, g);
  const tri = new THREE.Shape(); tri.moveTo(-17.5, 0); tri.lineTo(17.5, 0); tri.lineTo(0, 3.4); tri.lineTo(-17.5, 0);
  const ped = new THREE.Mesh(new THREE.ExtrudeGeometry(tri, { depth: 1.4, bevelEnabled: false }), marble);
  ped.position.set(0, 8.05, -12.7); ped.castShadow = true; g.add(ped);
  mesh(new THREE.BoxGeometry(35, 8, 0.6), mat(0xe8dcc2, { roughness: 0.7 }), 0, 4, -14.2, g);
  for (const dx of [-6, 0, 6]) mesh(new THREE.BoxGeometry(2.4, 5, 0.3), mat(0x2a1d12), dx, 2.5, -13.8, g);
  for (let i = 0; i < 3; i++) mesh(new THREE.BoxGeometry(36 - i * 2, 0.22, 3 - i * 0.8), marble, 0, 0.11 + i * 0.22, -9.8 - i * 0.7, g).castShadow = false;

  // Pharos Deniz Feneri
  const stone = mat(0xffffff, { map: TX.brickTex(4, 8) });
  const ph = new THREE.Group(); ph.position.set(-52, 0, -80); g.add(ph);
  mesh(new THREE.BoxGeometry(16, 20, 16), stone, 0, 10, 0, ph);
  mesh(new THREE.CylinderGeometry(5, 7, 18, 8), stone, 0, 29, 0, ph);
  mesh(new THREE.CylinderGeometry(2.8, 3.8, 12, 12), stone, 0, 44, 0, ph);
  mesh(new THREE.SphereGeometry(2.4, 16, 12), new THREE.MeshBasicMaterial({ color: 0xffc66a }), 0, 52, 0, ph);
  const pl = new THREE.PointLight(0xffc070, 30, 120); pl.position.set(0, 52, 0); ph.add(pl);
  const pg = new THREE.Sprite(new THREE.SpriteMaterial({ map: TX.glowTex(), color: 0xffc070, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
  pg.scale.set(46, 46, 1); pg.position.set(0, 52, 0); ph.add(pg);

  // Selvi ağaçları
  const cyp = (x, z, sc = 1) => {
    TREES.cypress(g, x, z, sc * 1.1, true);
    w.colliders.push({ x, z, r: 0.6 });
  };
  [[-14, 12], [14, 12], [-14, -7], [14, -7], [-7, 14], [7, 15]].forEach(([x, z]) => cyp(x, z, 1.1));

  // Eratosthenes ve silahlı küre (armillary) masası
  const ex = 9, ez = 3;
  mesh(new THREE.CylinderGeometry(0.6, 0.8, 1.0, 14), marble, ex + 1.8, 0.5, ez - 1.0, g);
  const arm = new THREE.Group(); arm.position.set(ex + 1.8, 1.9, ez - 1.0); g.add(arm);
  const rings = [0, 1, 2].map((i) => { const r = mesh(new THREE.TorusGeometry(0.6, 0.03, 8, 40), mat(0xe0a82e, { metalness: 0.9, roughness: 0.25 }), 0, 0, 0, arm); r.rotation.set(i * 1.05, i * 0.7, 0); return r; });
  mesh(new THREE.SphereGeometry(0.2, 16, 12), mat(0x2f8ad0), 0, 0, 0, arm);
  const scholar = makeScholar(); scholar.position.set(ex, 0, ez); scholar.rotation.y = -0.5; scholar.scale.setScalar(1.25); g.add(scholar);
  attachModel(scholar, 'assets/models/eratosthenes.glb', 2.1);
  w.colliders.push({ x: ex, z: ez, r: 0.8 }, { x: ex + 1.8, z: ez - 1.0, r: 1.0 });
  w.interact.push({ pos: new THREE.Vector3(ex, 0, ez), r: 3.2, label: () => 'E: Eratosthenes ile konuş', action: () => talkErato() });

  // Dünya modeli (açı / çevre bulmacası)
  const R = 4.2;
  const planet = new THREE.Group(); planet.position.set(0, 5.8, -8.2); g.add(planet);
  mesh(new THREE.CylinderGeometry(0.3, 0.45, 1.4, 14), marble, 0, -4.9, 0, planet);
  const disc = mesh(new THREE.CylinderGeometry(R, R, 0.5, 72), new THREE.MeshStandardMaterial({ color: 0x1b64a8, roughness: 0.45, metalness: 0.1, emissive: 0x0a2a55, emissiveIntensity: 0.5 }), 0, 0, 0, planet);
  disc.rotation.x = Math.PI / 2;
  const rim = mesh(new THREE.TorusGeometry(R, 0.1, 10, 96), mat(0xe0a82e, { metalness: 0.8, roughness: 0.3, emissive: 0xe0a82e, emissiveIntensity: 0.2 }), 0, 0, 0.0, planet);
  // kıtalar (süs)
  [[-1.4, 0.6, 1.2], [1.6, -1.0, 0.9], [0.4, 1.8, 0.7]].forEach(([x, y, r]) => { const l = mesh(new THREE.CylinderGeometry(r, r, 0.05, 20), mat(0x4a9a52, { roughness: 0.9 }), x, y, 0.27, planet); l.rotation.x = Math.PI / 2; l.castShadow = false; });
  const hubDot = mesh(new THREE.SphereGeometry(0.15, 12, 10), mat(0xffffff, { emissive: 0xffffff, emissiveIntensity: 0.6 }), 0, 0, 0.3, planet);
  let dyn = null;
  const mkStick = (parent, a, col) => {
    const st = new THREE.Group(); st.position.set(Math.cos(a) * R, Math.sin(a) * R, 0.3); st.rotation.z = a - Math.PI / 2; parent.add(st);
    mesh(new THREE.CylinderGeometry(0.06, 0.08, 1.5, 8), mat(col, { emissive: col, emissiveIntensity: 0.4 }), 0, 0.75, 0, st);
    mesh(new THREE.SphereGeometry(0.14, 10, 8), mat(col, { emissive: col, emissiveIntensity: 0.8 }), 0, 1.5, 0, st);
  };
  w.angle = {
    setLevel(l) {
      if (dyn) { planet.remove(dyn); dyn.traverse((o) => { if (o.geometry) o.geometry.dispose(); }); }
      dyn = new THREE.Group(); planet.add(dyn);
      const th = (l.theta * Math.PI) / 180;
      const wedge = new THREE.Mesh(new THREE.CircleGeometry(R, 64, Math.PI / 2, th), new THREE.MeshBasicMaterial({ color: 0xffd24a, transparent: true, opacity: 0.6, side: THREE.DoubleSide, depthWrite: false }));
      wedge.position.z = 0.28; dyn.add(wedge);
      const arc = new THREE.Mesh(new THREE.TorusGeometry(R + 0.06, 0.1, 8, 64, th), new THREE.MeshBasicMaterial({ color: 0xfff0a0 }));
      arc.rotation.z = Math.PI / 2; arc.position.z = 0.3; dyn.add(arc);
      mkStick(dyn, Math.PI / 2, 0xff7a5a); mkStick(dyn, Math.PI / 2 + th, 0x7ad0ff);
      const tipX = Math.cos(Math.PI / 2 + th) * (R + 1.5), tipY = Math.sin(Math.PI / 2 + th) * (R + 1.5);
      const rayMat = new THREE.MeshBasicMaterial({ color: 0xffe9a0, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false });
      for (const rx of [0, tipX]) { const top = rx === 0 ? R + 1.5 : tipY; const ray = new THREE.Mesh(new THREE.BoxGeometry(0.06, 12, 0.06), rayMat); ray.position.set(rx, top + 6, 0.3); dyn.add(ray); }
      const lab = (txt, col, x, y, sc = 0.7) => { const s = TX.labelSprite(txt, col, sc); s.position.set(x, y, 0.8); dyn.add(s); };
      lab('Syene', '#ff9a80', 1.9, R + 2.1);
      lab('İskenderiye', '#9fe0ff', tipX - 3.0, tipY + 0.9);
      lab(`açı = ${l.theta}°`, '#ffe9a0', -2.2 + Math.cos(Math.PI / 2 + th / 2) * 1.6, 1.2, 0.8);
      lab(`yay = ${l.L} ${l.unit}`, '#fff0a0', Math.cos(Math.PI / 2 + th / 2) * (R + 2.6) - 0.8, Math.sin(Math.PI / 2 + th / 2) * (R + 2.6) + 0.2, 0.7);
      lab('Çevre C = ?', '#ffffff', 0, -1.2, 0.9);
    },
  };
  mesh(new THREE.BoxGeometry(2.6, 0.5, 2.6), marble, 0, 0.25, -8.2, g);
  w.colliders.push({ x: 0, z: -8.2, r: 1.6 });
  w.interact.push({
    pos: new THREE.Vector3(0, 0, -5.4), r: 3.4,
    label: () => (progI.met ? 'E: Dünya ölçümü' : 'Önce Eratosthenes ile konuş'),
    action: () => { if (!progI.met) return toast('Önce Eratosthenes ile konuşmalısın.'); if (progI.solvedAll) return toast("Dünya'yı ölçtün! Eratosthenes seni bekliyor."); enterAngle(); },
  });

  // Dönüş portalı
  const bp = new THREE.Group(); bp.position.set(0, 0, 15.5); g.add(bp);
  mesh(new THREE.TorusGeometry(1.5, 0.14, 12, 40), mat(0x1fd5ff, { emissive: 0x1fd5ff, emissiveIntensity: 1.6 }), 0, 1.8, 0, bp);
  const bdisc = new THREE.Mesh(new THREE.CircleGeometry(1.4, 32), new THREE.MeshBasicMaterial({ map: TX.portalTex(0x1fd5ff), transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
  bdisc.position.set(0, 1.8, 0); bp.add(bdisc);
  const bl = TX.labelSprite('Zaman Makinesi', '#7fe8ff', 0.6); bl.position.set(0, 3.9, 15.5); g.add(bl);
  const bpl = new THREE.PointLight(0x1fd5ff, 4, 10); bpl.position.set(0, 2, 14.5); g.add(bpl);
  w.interact.push({ pos: new THREE.Vector3(0, 0, 15.5), r: 2.4, label: () => 'E: Zaman makinesine dön', action: () => gotoHub() });

  const glyphs = ['π', '∠', '360°', 'θ', 'C = 2πr', '△', '90°'];
  const floaters = glyphs.map((t) => { const s = TX.labelSprite(t, '#d8e8ff', 0.7); s.position.set((Math.random() - 0.5) * 30, 5 + Math.random() * 5, -4 + Math.random() * 16); s.userData.b = Math.random() * 6; g.add(s); return s; });

  const iskTick = buildIskenderiyeScenery(g, w);

  w.update = (t, dt) => {
    iskTick(t, dt);
    bdisc.rotation.z = t * 0.7;
    rings.forEach((r, i) => { r.rotation.x += 0.004 * (i + 1); r.rotation.y += 0.006; });
    floaters.forEach((s) => { s.position.y += Math.sin(t + s.userData.b) * 0.003; s.material.opacity = 0.5 + Math.sin(t * 1.5 + s.userData.b) * 0.3; });
    scholar.position.y = Math.sin(t * 1.4) * 0.02;
    const d = player.position.clone().sub(scholar.position);
    if (d.length() < 9) scholar.rotation.y = THREE.MathUtils.lerp(scholar.rotation.y, Math.atan2(d.x, d.z), 0.06);
    sea.position.y = -0.45 + Math.sin(t * 0.8) * 0.03;
  };
  g.visible = false; scene.add(g);
  return w;
}

/* ---------- Açı / çevre bulmacası (Eratosthenes) ---------- */
function enterAngle() { mode = 'puzzle'; show('shadow'); show('prompt', false); loadAngle(progI.level); }
function loadAngle(i) {
  progI.level = i;
  const l = ANGLE_LEVELS[i];
  sh = { l, tries: 0, done: false, busy: false, kind: 'angle' };
  setInputLabel("Dünya'nın çevresi C =", l.unit, 'Çevreyi söyle');
  worlds.iskenderiye.angle.setLevel(l);
  $('sh-level').textContent = `Bölüm ${i + 1} / ${ANGLE_LEVELS.length}`;
  $('sh-tries').textContent = 'Deneme: 0';
  $('sh-given').innerHTML = `İki şehir arasındaki yay: <b>${l.L}</b> ${l.unit}<br>Güneş ışınlarının yaptığı açı: <b>${l.theta}°</b>`;
  $('sh-eq').textContent = `${l.theta}° / 360° = ${l.L} / C`;
  $('sh-tip').textContent = l.tip;
  $('sh-msg').textContent = ''; $('sh-h').value = ''; $('sh-h').disabled = false; $('sh-check').disabled = false; $('sh-hint').disabled = false;
  show('sh-win', false);
}
function checkAngle() {
  if (!sh || sh.done) return;
  const C = parseFloat($('sh-h').value.replace(',', '.'));
  if (!(C > 0)) { $('sh-msg').textContent = 'Önce çevreyi yaz.'; return; }
  sh.tries++; $('sh-tries').textContent = `Deneme: ${sh.tries}`;
  const l = sh.l; const ans = Math.round((360 * l.L) / l.theta * 1000) / 1000;
  if (Math.abs(C - ans) < 0.5) {
    sh.done = true; sfx('win'); confetti(130, 0.72, 0.4);
    const st = sh.tries === 1 ? 3 : sh.tries === 2 ? 2 : 1;
    progI.stars[progI.level] = Math.max(progI.stars[progI.level] || 0, st);
    $('sh-msg').textContent = '';
    $('sh-win-text').innerHTML = `Doğru! ✓<br>C = 360 · ${l.L} / ${l.theta} = ${ans} ${l.unit}<br>${'★'.repeat(st)}${'☆'.repeat(3 - st)}`;
    $('sh-next').textContent = progI.level + 1 < ANGLE_LEVELS.length ? 'Sonraki bölüm ▸' : 'Bitir ▸';
    show('sh-win'); $('sh-h').disabled = true; $('sh-check').disabled = true; $('sh-hint').disabled = true;
  } else {
    sfx('bad');
    $('sh-msg').textContent = C < ans ? 'Çember bundan daha büyük. Açı 360°\'nin küçük bir parçası, yay da çevrenin aynı küçük parçası.' : 'Çember bundan daha küçük. Orantıyı yeniden kur.';
  }
}
function hintAngle() { const l = sh.l; $('sh-msg').textContent = `💡 ${l.theta} / 360 = ${l.L} / C  →  C = 360 · ${l.L} / ${l.theta}`; }
function nextAngle() {
  if (progI.level + 1 < ANGLE_LEVELS.length) loadAngle(progI.level + 1);
  else { show('shadow', false); mode = 'walk'; progI.solvedAll = true; talkErato(); }
}

/* ---------- Final ---------- */
let fin = null;
function startFinale() {
  say('Harezmî (hologram)', FINALE, () => { worlds.hub.finale = true; finaleCine(); });
}
function finaleResult() {
  const total = [...prog.stars, ...progM.stars, ...progI.stars].reduce((a, b) => a + (b || 0), 0);
  result('KAYIP FORMÜL TAMAMLANDI!', `Cebir, Oran ve Geometri parçaları zaman makinesinde.\nMatematik geri döndü!\nBulmaca yıldızların: ${total} / 54`, 'Yeniden oyna', () => {
    try { localStorage.removeItem('kf_parts'); localStorage.removeItem('kf_hist'); } catch (e) { /* yok say */ }
    location.reload();
  }, 'all');
}
function finaleCine() {
  mode = 'fin'; fin = { t: 0, step: 0 }; show('cine'); $('lb').classList.add('on'); show('hud', false);
  $('cine-skip').style.display = 'none'; $('cine-hint').style.display = 'none';
  $('cine-title').textContent = ''; $('cine-label').textContent = ''; $('cine-cap').textContent = '';
  cineFxStart(); sfx('win'); confetti(260, 0.5, 0.5, true); setTimeout(() => confetti(200, 0.3, 0.4), 1500); setTimeout(() => confetti(200, 0.7, 0.4), 2800); const fl = $('cine-flash'); fl.classList.remove('on'); void fl.offsetWidth; fl.classList.add('on');
}
function finaleUpdate(t, dt) {
  fin.t += dt; const T = fin.t;
  cineFxDraw(dt, true, t);
  const a = 0.5 + T * 0.32, r = 17 - Math.min(T, 8) * 0.45, hgt = 4.5 + Math.min(T, 9) * 0.55;
  camTarget.set(Math.sin(a) * r, hgt, Math.cos(a) * r); lookTarget.set(0, 2.6 + Math.min(T, 9) * 0.12, 0);
  renderer.toneMappingExposure = 1.1 + Math.max(0, Math.sin(Math.min(T, 4) / 4 * Math.PI)) * 0.55;
  const L = (n, fn) => { if (fin.step < n && T > [0, 1.2, 3.2, 6.2, 9.6][n]) { fin.step = n; fn(); } };
  L(1, () => { const e = $('cine-title'); e.textContent = 'KAYIP FORMÜL'; e.classList.remove('on'); void e.offsetWidth; e.classList.add('on'); sfx('portal'); });
  L(2, () => { $('cine-label').textContent = 'Cebir  +  Oran  +  Geometri'; });
  L(3, () => { $('cine-cap').textContent = 'Matematik geri döndü. Zaman yeniden akıyor.'; sfx('ok'); });
  L(4, () => {
    fin = null; renderer.toneMappingExposure = 1.1; fxx.clearRect(0, 0, fxc.width, fxc.height); show('cine', false); $('lb').classList.remove('on');
    $('cine-skip').style.display = ''; $('cine-hint').style.display = ''; $('cine-title').classList.remove('on'); show('hud'); finaleResult();
  });
}


/* ---------- Işınlanma sinematiği: zaman tüneli + çağ kartı ---------- */
const WARP = {
  hub: { title: 'ZAMAN MAKİNESİ', year: '2157', line: 'Formülün parçaları çağlara dağıldı. Sıradaki durak neresi?', color: '#35d0ff' },
  bagdat: { title: 'BAĞDAT', year: '820', line: 'Beytülhikme: denklemlerin ve algoritmanın doğduğu şehir.', color: '#35d0c0' },
  misir: { title: 'MISIR', year: 'MÖ 2500', line: 'Nil taşar, sınırlar silinir; ölçmek ve oranlamak yeniden doğar.', color: '#ffb347' },
  iskenderiye: { title: 'İSKENDERİYE', year: 'MÖ 240', line: "Dünya'nın en büyük kütüphanesi ve en büyük soru: Dünya ne kadar büyük?", color: '#b39ddb' },
};
function warp(to, onSwitch, onDone) {
  const cfg = WARP[to] || WARP.hub;
  const el = $('warp'), cv = $('warp-c'), ctx = cv.getContext('2d');
  cv.width = innerWidth; cv.height = innerHeight;
  const cx = cv.width / 2, cy = cv.height / 2, maxR = Math.hypot(cx, cy);
  mode = 'trans'; sfx('portal'); show('prompt', false);
  el.style.opacity = 0; show('warp'); void el.offsetWidth; el.style.opacity = 1;
  const txt = $('warp-text'); txt.classList.remove('on');
  $('warp-year').textContent = cfg.year; $('warp-title').textContent = cfg.title; $('warp-title').style.color = cfg.color; $('warp-line').textContent = cfg.line;
  const N = 260;
  const parts = Array.from({ length: N }, () => ({ a: Math.random() * Math.PI * 2, r: Math.random() * 0.2, v: 0.4 + Math.random() * 1.1, w: Math.random() < 0.25 }));
  const T = 4200, SWITCH = 1900;
  let start = null, switched = false, finished = false;
  const pl = player.scale; const baseScale = 1;
  function frame(ts) {
    if (!start) start = ts;
    const t = ts - start;
    skip3D = t > 800 && t < SWITCH + 150; // tünel örtüyken 3B çizimi atla
    // arka plan
    const bgA = t < 700 ? 0.35 : 0.18;
    ctx.fillStyle = `rgba(2,4,14,${bgA})`; ctx.fillRect(0, 0, cv.width, cv.height);
    const speed = t < 1200 ? 0.5 + (t / 1200) * 3.5 : t < 2800 ? 4.0 : Math.max(0.6, 4.0 - ((t - 2800) / 1400) * 3.4);
    // merkezde parlama
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR * 0.5);
    g.addColorStop(0, cfg.color + 'aa'); g.addColorStop(0.3, cfg.color + '33'); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = g; ctx.fillRect(0, 0, cv.width, cv.height);
    // tünel çizgileri
    ctx.lineCap = 'round';
    for (const p of parts) {
      const r0 = p.r; p.r += p.v * speed * 0.012 * (0.4 + p.r * 2.2);
      if (p.r > 1.1) { p.r = Math.random() * 0.08; p.a = Math.random() * Math.PI * 2; }
      const x0 = cx + Math.cos(p.a) * r0 * maxR, y0 = cy + Math.sin(p.a) * r0 * maxR;
      const x1 = cx + Math.cos(p.a) * p.r * maxR, y1 = cy + Math.sin(p.a) * p.r * maxR;
      ctx.strokeStyle = p.w ? 'rgba(255,255,255,0.9)' : cfg.color; ctx.lineWidth = 1 + p.r * 3.2;
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
    }
    // genişleyen halkalar
    for (let i = 0; i < 5; i++) {
      const rr = (((t / 900) + i / 5) % 1);
      ctx.strokeStyle = cfg.color + '55'; ctx.lineWidth = 2 + rr * 6;
      ctx.beginPath(); ctx.arc(cx, cy, rr * rr * maxR, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.globalCompositeOperation = 'source-over';
    // oyuncu: ışık sütununa dönüşme / yeniden belirme
    if (t < SWITCH) { const k = Math.min(1, t / 800); player.scale.set(baseScale * (1 - k * 0.9), baseScale * (1 + k * 3), baseScale * (1 - k * 0.9)); }
    else { const k = Math.min(1, (t - SWITCH) / 900); player.scale.set(baseScale * (0.1 + 0.9 * k), baseScale * (4 - 3 * k), baseScale * (0.1 + 0.9 * k)); }
    if (!switched && t >= SWITCH) { switched = true; onSwitch && onSwitch(); }
    if (t > 1500 && !txt.classList.contains('on') && t < 3500) txt.classList.add('on');
    if (t >= 3500 && txt.classList.contains('on')) txt.classList.remove('on');
    if (t >= 3500) el.style.opacity = Math.max(0, 1 - (t - 3500) / 700);
    if (t < T) requestAnimationFrame(frame);
    else if (!finished) {
      finished = true; skip3D = false; show('warp', false); player.scale.set(1, 1, 1);
      mode = 'walk'; onDone && onDone();
    }
  }
  ctx.fillStyle = '#02040e'; ctx.fillRect(0, 0, cv.width, cv.height);
  requestAnimationFrame(frame);
}

/* ---------- Karakter konuşmaları ---------- */
function talkHoloHarezmi() {
  const done = ERAS.filter((e) => parts[e.id]).length;
  const lines = !done ? HAREZMI.hub : done >= 3 ? ['Kayıp Formül tamam! Dilersen çağları yeniden gezebilir, bulmacaları tekrar çözebilirsin.'] : [`Kayıp Formül: ${done} / 3 parça makinede!`, 'Diğer parlayan kapılardan birine gir.'];
  say('Harezmî (hologram)', lines);
}
function talkErato() {
  if (!progI.met) say('Eratosthenes', ERATO.isk1, () => { progI.met = true; toast('Dünya modeline git (E).'); });
  else if (!progI.solvedAll) say('Eratosthenes', ['Unutma: açı / 360° = yay / çevre. Bu orandan çevreyi bulursun.']);
  else if (!progI.quizPassed) say('Eratosthenes', ERATO.isk2, () => startQuiz('iskenderiye'));
  else say('Eratosthenes', ERATO.isk3);
}
function talkAhmes() {
  if (!progM.met) say('Katip Ahmes', AHMES.misir1, () => { progM.met = true; toast('Çubuğun yanındaki yapı alanına git (E).'); });
  else if (!progM.solvedAll) say('Katip Ahmes', ['Gölgeyi bayrağa tutturmak için oranı kur: çubuğun boyu / gölgesi = yapının boyu / gölgesi.']);
  else if (!progM.quizPassed) say('Katip Ahmes', AHMES.misir2, () => startQuiz('misir'));
  else say('Katip Ahmes', AHMES.misir3);
}
function talkHarezmi() {
  if (!prog.met) say('El-Harezmî', HAREZMI.bagdat1, () => { prog.met = true; toast('Soldaki denklem terazisine git (E).'); });
  else if (!prog.solvedAll) say('El-Harezmî', ['Teraziyi dene! Unutma: iki yana da aynı işlemi yap, denge bozulmaz.']);
  else if (!prog.quizPassed) say('El-Harezmî', HAREZMI.bagdat2, () => startQuiz('bagdat'));
  else say('El-Harezmî', HAREZMI.bagdat3);
}

/* ---------- Dünya geçişleri ---------- */
/* ---------- Temas gölgesi (karakterlerin ayağının altı) ---------- */
let _blobTex = null;
function blobShadow(parent, r = 0.6, op = 0.5) {
  if (!_blobTex) {
    const cv = document.createElement('canvas'); cv.width = cv.height = 64; const x = cv.getContext('2d'), g = x.createRadialGradient(32, 32, 2, 32, 32, 32);
    g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(0.55, 'rgba(0,0,0,.55)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64);
    _blobTex = new THREE.CanvasTexture(cv);
  }
  const m = new THREE.Mesh(new THREE.PlaneGeometry(r * 2, r * 2), new THREE.MeshBasicMaterial({ map: _blobTex, transparent: true, opacity: op, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }));
  m.rotation.x = -Math.PI / 2; m.position.y = 0.035; m.renderOrder = 1; parent.add(m); return m;
}

/* ---------- Atmosfer: toz bulutları, deniz sisi, güneş ışınları ---------- */
function atmosphere(name, w) {
  const g = w.group, items = [];
  const soft = (color, op, sc, x, y, z, vx, vz, lim) => {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: TX.glowTex(), color, transparent: true, opacity: op, depthWrite: false, fog: false }));
    sp.scale.set(sc, sc * 0.38, 1); sp.position.set(x, y, z); g.add(sp); items.push({ sp, vx, vz, lim, ph: Math.random() * 6, op });
  };
  let shafts = null;
  if (name === 'misir') {
    for (let i = 0; i < 18; i++) soft(0xe6c48a, 0.1 + Math.random() * 0.06, 22 + Math.random() * 30, (Math.random() - 0.5) * 150, 1.2 + Math.random() * 3.2, -30 + Math.random() * 90, 1.2 + Math.random() * 1.6, 0.15, 80);
  } else if (name === 'iskenderiye') {
    for (let i = 0; i < 16; i++) { const west = i % 2 === 0; soft(0xe4eef8, 0.12 + Math.random() * 0.07, 40 + Math.random() * 40, west ? -40 - Math.random() * 90 : -20 + Math.random() * 100, 1 + Math.random() * 2.4, west ? -50 + Math.random() * 120 : 35 + Math.random() * 70, 0.5 + Math.random() * 0.7, 0.2, 110); }
  } else if (name === 'bagdat') {
    const cv = document.createElement('canvas'); cv.width = 64; cv.height = 256; const x = cv.getContext('2d');
    const gx = x.createLinearGradient(0, 0, 64, 0); gx.addColorStop(0, 'rgba(255,230,170,0)'); gx.addColorStop(0.5, 'rgba(255,236,185,1)'); gx.addColorStop(1, 'rgba(255,230,170,0)'); x.fillStyle = gx; x.fillRect(0, 0, 64, 256);
    x.globalCompositeOperation = 'destination-in'; const gy = x.createLinearGradient(0, 0, 0, 256); gy.addColorStop(0, 'rgba(0,0,0,0)'); gy.addColorStop(0.25, 'rgba(0,0,0,1)'); gy.addColorStop(0.7, 'rgba(0,0,0,.6)'); gy.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = gy; x.fillRect(0, 0, 64, 256);
    const tex = new THREE.CanvasTexture(cv), d = new THREE.Vector3(16, -20, -12).normalize(), q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().negate());
    shafts = [];
    for (let i = 0; i < 9; i++) {
      const grp = new THREE.Group(), px = -13 + i * 3.1 + Math.random() * 1.5, pz = -14 + Math.random() * 14;
      grp.position.set(px, 9, pz); grp.quaternion.copy(q);
      const mt = new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.16, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false });
      const len = 22 + Math.random() * 8, wd = 1.6 + Math.random() * 2.2;
      for (let k = 0; k < 2; k++) { const p = new THREE.Mesh(new THREE.PlaneGeometry(wd, len), mt); p.rotation.y = k * Math.PI / 2; grp.add(p); }
      g.add(grp); shafts.push({ mt, ph: Math.random() * 6, base: 0.09 + Math.random() * 0.1 });
    }
  }
  return (t, dt) => {
    for (const it of items) { it.sp.position.x += it.vx * dt; it.sp.position.z += it.vz * dt * 0.4; if (it.sp.position.x > it.lim + 60) it.sp.position.x = -it.lim - 60; it.sp.material.opacity = it.op * (0.75 + Math.sin(t * 0.3 + it.ph) * 0.25); }
    if (shafts) for (const s of shafts) s.mt.opacity = s.base * (0.7 + Math.sin(t * 0.5 + s.ph) * 0.3);
  };
}
function withAtmosphere(name) {
  const w = worlds[name], tk = atmosphere(name, w), u0 = w.update;
  w.update = (t, dt) => { if (u0) u0(t, dt); tk(t, dt); };
}

function setWorld(name) {
  worldName = name;
  try { ambience(name); } catch (e) { /* ses yoksa sorun değil */ }
  Object.entries(worlds).forEach(([k, w]) => (w.group.visible = k === name));
  const w = worlds[name];
  player.position.copy(w.spawn); player.rotation.y = Math.PI;
  scene.environment = w.env || null; scene.environmentIntensity = name === 'hub' ? 1 : 0.8;
  scene.fog = name === 'bagdat' ? new THREE.Fog(0xf2c98c, 40, 120) : name === 'misir' ? new THREE.Fog(0xead4a6, 70, 300) : name === 'iskenderiye' ? new THREE.Fog(0xc4def2, 90, 400) : new THREE.Fog(0x7aa8dc, 38, 190);
  bloom.strength = name === 'hub' ? 0.5 : 0.3;
  renderer.toneMappingExposure = name === 'bagdat' ? 1.45 : name === 'misir' ? 1.2 : name === 'iskenderiye' ? 1.25 : 1.05;
  $('era-label').textContent = { bagdat: 'Bağdat · Beytülhikme · 820', misir: 'Mısır · Gize · MÖ 2500', iskenderiye: 'İskenderiye · Mouseion · MÖ 240', hub: 'Zaman Makinesi · 2157' }[name];
  camYaw = 0;
  grade.uniforms.haze.value = { misir: 0, bagdat: 0, iskenderiye: 0, hub: 0 }[name] || 0;
  camera.position.copy(player.position).add(new THREE.Vector3(0, 7, 9.5));
}
const ARRIVE = { bagdat: ['820 · Beytülhikme', 'BAĞDAT', 'Cebir'], misir: ['MÖ 2500 · Gize', 'MISIR', 'Oran & Orantı'], iskenderiye: ['MÖ 240 · Mouseion', 'İSKENDERİYE', 'Geometri'] };
function arrivalCard(id) {
  const a = ARRIVE[id]; if (!a) return;
  $('a-sub').textContent = a[0]; $('a-title').textContent = a[1]; $('a-topic').textContent = a[2];
  const el = $('arrive'); show('arrive'); el.classList.remove('on'); void el.offsetWidth; el.classList.add('on');
  $('lb').classList.add('on');
  setTimeout(() => { show('arrive', false); if (mode !== 'dialog') $('lb').classList.remove('on'); }, 3800);
}
function gotoEra(id) { if (!worlds[id] || id === 'hub') return; warp(id, () => setWorld(id), () => arrivalCard(id)); }
function gotoHub() {
  warp('hub', () => setWorld('hub'), () => {
    const n = ERAS.filter((e) => parts[e.id]).length;
    if (n > shownParts) { shownParts = n; setTimeout(() => (n >= 3 ? startFinale() : talkHoloHarezmi()), 400); }
  });
}

/* =====================================================
   GİRİŞ & ETKİLEŞİM
   ===================================================== */
addEventListener('keydown', (e) => {
  const k = e.key.toLowerCase();
  if ([' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) e.preventDefault();
  keys.add(k);
  if (e.repeat) return;
  if (k === 'm' && document.activeElement.tagName !== 'INPUT') { muted = !muted; if (amb && ac) amb.g.gain.setTargetAtTime(muted ? 0 : 1, ac.currentTime, 0.15); toast(muted ? 'Ses kapalı (M)' : 'Ses açık (M)', 1200); }
  if (mode === 'quiz' && qz) {
    const idx = '1234'.indexOf(k) >= 0 && k.length === 1 ? '1234'.indexOf(k) : ('abcd'.indexOf(k) >= 0 && k.length === 1 ? 'abcd'.indexOf(k) : -1);
    if (idx >= 0 && !qz.locked) { const ob = $('qz-opts').querySelectorAll('.opt')[idx]; if (ob) ob.click(); }
    else if ((k === 'enter' || k === ' ') && qz.locked) $('qz-next').click();
    return;
  }
  if (mode === 'karne' && (k === 'escape' || k === 'k')) { $('kr-close').click(); return; }
  if (k === 'k' && mode === 'walk') { openKarne('all'); return; }
  if (k === 'e' || k === ' ' || k === 'enter') {
    if (mode === 'dialog') dlgAdvance();
    else if (mode === 'cine') cineNext();
    else if (mode === 'walk' && current) current.action();
  }
});
addEventListener('keyup', (e) => keys.delete(e.key.toLowerCase()));
$('dialog').onclick = () => { if (mode === 'dialog') dlgAdvance(); };

/* Serbest kamera: sürükle = etrafa bak, tekerlek = yakınlaş/uzaklaş */
{
  const el = renderer.domElement; let drag = false, lx = 0, ly = 0;
  el.addEventListener('pointerdown', (e) => { if (mode !== 'walk' && mode !== 'dialog') return; drag = true; lx = e.clientX; ly = e.clientY; try { el.setPointerCapture(e.pointerId); } catch (_) {} });
  el.addEventListener('pointermove', (e) => {
    if (!drag) return;
    camYaw -= (e.clientX - lx) * 0.006; camPitch = THREE.MathUtils.clamp(camPitch + (e.clientY - ly) * 0.004, 0.1, 1.25);
    lx = e.clientX; ly = e.clientY;
  });
  const end = () => { drag = false; };
  el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end);
  el.addEventListener('wheel', (e) => { if (mode === 'walk' || mode === 'dialog') { camDist = THREE.MathUtils.clamp(camDist + Math.sign(e.deltaY) * 1.2, 6, 22); e.preventDefault(); } }, { passive: false });
}
/* ---------- Giriş sinematiği ---------- */
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const CINE_SHOTS = [
  { w: 'hub', dur: 8, title: '2157', text: STORY[0],
    cam: (u) => { const a = -0.7 + u * 1.2, r = 16 - u * 3; return [V3(Math.sin(a) * r, 5 + u * 2, Math.cos(a) * r), V3(0, 3.2, 0)]; } },
  { w: 'hub', dur: 8.5, text: STORY[1], fx: 'rain', glitch: true,
    cam: (u) => [V3(2.5 - u * 2.5, 4.4 - u * 1.4, 11 - u * 6.5), V3(0, 2.8 + u * 0.8, 0)] },
  { w: 'misir', dur: 3, label: 'MÖ 2500 · MISIR', text: '',
    cam: (u) => [V3(-6 + u * 10, 5 + u * 1.5, 24 - u * 12), V3(10, 14, -110)] },
  { w: 'iskenderiye', dur: 3, label: 'MÖ 240 · İSKENDERİYE', text: '',
    cam: (u) => [V3(-10 + u * 20, 3.6, 22 - u * 6), V3(0, 8, -14)] },
  { w: 'bagdat', dur: 8, label: '820 · BAĞDAT', text: STORY[2],
    cam: (u) => [V3(0, 2.6 + u * 2, 28 - u * 13), V3(0, 8 + u, -26)] },
];
let cine = null;
const fxc = $('cine-fx'), fxx = fxc.getContext('2d');
let rain = [];
function cineFxStart() { fxc.width = innerWidth; fxc.height = innerHeight; rain = Array.from({ length: 70 }, () => ({ x: Math.random() * fxc.width, y: Math.random() * fxc.height, v: 40 + Math.random() * 120, g: ['1:2', 'x+3', 'π', '∠', '=', '√', 'Σ', '7', '3/5', 'θ', 'a·x'][Math.floor(Math.random() * 11)], s: 16 + Math.random() * 26, life: 1 })); }
function cineFxDraw(dt, on, t) {
  fxx.clearRect(0, 0, fxc.width, fxc.height); if (!on) return;
  for (const r of rain) {
    r.y += r.v * dt; r.life -= dt * 0.045; if (r.y > fxc.height || r.life < 0) { r.y = -20; r.x = Math.random() * fxc.width; r.life = 1; }
    fxx.globalAlpha = Math.max(0, r.life) * 0.55; fxx.fillStyle = '#7fe8ff'; fxx.font = `${r.s}px Cambria Math, Georgia, serif`;
    fxx.fillText(r.g, r.x + (Math.random() < 0.02 ? 6 : 0), r.y);
  }
  fxx.globalAlpha = 1;
}
function startCine() {
  show('title', false); show('story', false); mode = 'cine'; show('cine'); $('lb').classList.add('on');
  cine = { i: -1, t: 0, typing: null, fx: false, busy: false }; cineNext(true);
}
function cineNext(first) {
  if (!cine || cine.busy) return;
  if (cine.typing && !cine.typing.done && !first) { cine.typing.finish(); return; }
  cine.busy = true;
  const go = () => {
    if (!cine) return;
    cine.i++;
    if (cine.i >= CINE_SHOTS.length) return endCine();
    const sh = CINE_SHOTS[cine.i]; cine.t = 0; cine.fx = sh.fx === 'rain'; if (cine.fx) cineFxStart();
    if (worldName !== sh.w || first || true) { setWorld(sh.w); }
    const [p, l] = sh.cam(0); camera.position.copy(p); lookNow.copy(l); camera.lookAt(lookNow);
    const lab = $('cine-label'); lab.textContent = sh.label || ''; lab.classList.toggle('on', !!sh.label);
    const tt = $('cine-title'); tt.classList.remove('on'); if (sh.title) { tt.textContent = sh.title; void tt.offsetWidth; tt.classList.add('on'); }
    const cap = $('cine-cap'); cap.classList.toggle('glitch', false);
    cine.typing = sh.text ? typeInto(cap, sh.text, null) : (cap.textContent = '', { done: true, finish() {} });
    if (sh.glitch) { $('cine-flash').classList.remove('on'); void $('cine-flash').offsetWidth; $('cine-flash').classList.add('on'); sfx('portal'); setTimeout(() => cap.classList.add('glitch'), 1200); setTimeout(() => cap.classList.remove('glitch'), 1800); }
    $('fade').classList.remove('on'); setTimeout(() => (cine && (cine.busy = false)), 500);
  };
  if (first && cine.i < 0) { $('fade').classList.add('on'); setTimeout(go, 50); } else { $('fade').classList.add('on'); setTimeout(go, 520); }
}
function endCine() {
  const c = cine; cine = null; if (c && c.typing && c.typing.cancel) c.typing.cancel(); $('cine-cap').textContent = ''; fxx.clearRect(0, 0, fxc.width, fxc.height);
  show('cine', false); $('lb').classList.remove('on'); $('cine-cap').classList.remove('glitch');
  show('hud'); setWorld('hub'); refreshParts(); $('fade').classList.remove('on');
  mode = 'walk'; setTimeout(() => talkHoloHarezmi(), 500);
  try { if (!localStorage.getItem('kf_keys')) { localStorage.setItem('kf_keys', '1'); const k = $('keys-card'); k.classList.remove('hidden'); setTimeout(() => k.classList.add('out'), 14000); setTimeout(() => k.classList.add('hidden'), 15000); } } catch (e) { /* yok say */ }
}
function cineUpdate(t, dt) {
  if (!cine || cine.i < 0 || cine.i >= CINE_SHOTS.length) return;
  const sh = CINE_SHOTS[cine.i]; if (!cine.busy) cine.t += dt;
  const u = Math.min(1, cine.t / sh.dur), e = u * u * (3 - 2 * u), [p, l] = sh.cam(e);
  camera.position.copy(p); lookNow.copy(l); camera.lookAt(lookNow); camTarget.copy(p); lookTarget.copy(l);
  cineFxDraw(dt, cine.fx, t);
  const typed = !cine.typing || cine.typing.done;
  if (!cine.busy && cine.t > sh.dur && typed && cine.i < CINE_SHOTS.length) cineNext();
}
(() => { const f = $('t-float'); if (!f) return; const g = ['x+3', 'π', '∠', '√', 'Σ', '3/5', 'θ', 'a²+b²', '=', '∞', 'sin', '2x', '∫', '1:2']; for (let i = 0; i < 26; i++) { const d = document.createElement('span'); d.textContent = g[i % g.length]; d.style.cssText = `left:${Math.random() * 100}%;font-size:${16 + Math.random() * 30}px;animation-duration:${14 + Math.random() * 18}s;animation-delay:${-Math.random() * 30}s;opacity:${0.12 + Math.random() * 0.25}`; f.appendChild(d); } })();
$('btn-start').onclick = () => { sfx('click'); startCine(); };
$('cine').onclick = () => cineNext();
$('cine-skip').onclick = (e) => { e.stopPropagation(); if (cine) endCine(); };

let current = null;
function updateInteract() {
  current = null;
  if (mode !== 'walk') return show('prompt', false);
  const w = worlds[worldName];
  let best = 1e9;
  for (const it of w.interact) {
    const d = Math.hypot(it.pos.x - player.position.x, it.pos.z - player.position.z);
    if (d < it.r && d < best) { best = d; current = it; }
  }
  if (current) { $('prompt').textContent = current.label(); show('prompt'); } else show('prompt', false);
}

/* ---------- Ana döngü ---------- */
const clock = new THREE.Clock();
let camYaw = 0, camPitch = 0.5, camDist = 11.8;
const camTarget = new THREE.Vector3();
const lookTarget = new THREE.Vector3();
const lookNow = new THREE.Vector3();

/* Yürüme / bekleme animasyonu (iskeletsiz modeller için kod ile) */
let walkAmt = 0;
function walkAnim(moving, t, dt) {
  walkAmt += ((moving ? 1 : 0) - walkAmt) * Math.min(1, dt * 10);
  const piv = player.userData.model; if (!piv) return;
  const wA = player.userData.walkA, iA = player.userData.idleA, a = walkAmt;
  if (wA) { /* gerçek iskelet animasyonu */
    if (iA) { wA.setEffectiveWeight(a); iA.setEffectiveWeight(1 - a); wA.paused = false; }
    else { wA.paused = a < 0.05; if (a < 0.05) wA.time = 0; wA.setEffectiveWeight(1); }
    return;
  }
  walkU.uWalk.value = a; walkU.uTime.value = t;
  const ph = t * 9;
  piv.position.y = Math.abs(Math.sin(ph)) * 0.04 * a;
  piv.rotation.z = Math.sin(ph) * 0.025 * a;
  piv.rotation.x = 0.05 * a;
  piv.rotation.y = Math.sin(ph) * 0.03 * a;
  piv.scale.set(1, 1 + Math.sin(t * 2.2) * 0.006 * (1 - a), 1);
}
/* ---------- Otomatik kalite: FPS düşerse çözünürlüğü kıs, yükselirse aç ---------- */
const qual = { s: 1, acc: 0, n: 0, last: performance.now(), hold: 3, fps: 60, frame: 0 };
const fpsEl = document.createElement('div');
fpsEl.style.cssText = 'position:fixed;left:8px;top:8px;z-index:99;font:12px monospace;color:#9fe8ff;background:rgba(0,0,0,.55);padding:4px 8px;border-radius:6px;display:none;pointer-events:none';
document.body.appendChild(fpsEl);
addEventListener('keydown', (e) => { if (e.key.toLowerCase() === 'f' && !e.repeat && document.activeElement.tagName !== 'INPUT') fpsEl.style.display = fpsEl.style.display === 'none' ? 'block' : 'none'; });
function applyQuality() {
  const pr = BASE_DPR * qual.s; renderer.setPixelRatio(pr); renderer.setSize(innerWidth, innerHeight); composer.setPixelRatio(pr); composer.setSize(innerWidth, innerHeight);
}
function qualityTick() {
  const now = performance.now(), d = now - qual.last; qual.last = now;
  if (mode === 'trans' || skip3D || document.hidden || d > 250) { qual.acc = 0; qual.n = 0; qual.hold = 1.5; return; }
  if (qual.hold > 0) { qual.hold -= d / 1000; return; }
  qual.acc += d; qual.n++;
  if (qual.acc >= 1500) {
    qual.fps = (qual.n * 1000) / qual.acc; qual.acc = 0; qual.n = 0;
    if (qual.fps < 46 && qual.s > 0.55) { qual.s = Math.max(0.55, qual.s - 0.15); applyQuality(); qual.hold = 1.5; }
    else if (qual.fps > 58 && qual.s < 1) { qual.s = Math.min(1, qual.s + 0.1); applyQuality(); qual.hold = 4; }
    fpsEl.textContent = Math.round(qual.fps) + ' FPS · çözünürlük %' + Math.round(qual.s * 100);
  }
}
function loop() {
  requestAnimationFrame(loop);
  const dt = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime;
  const w = worlds[worldName];
  for (const mx of mixers) mx.update(dt);

  if (mode === 'walk' && w) {
    const v = new THREE.Vector3(
      (keys.has('d') || keys.has('arrowright') ? 1 : 0) - (keys.has('a') || keys.has('arrowleft') ? 1 : 0), 0,
      (keys.has('s') || keys.has('arrowdown') ? 1 : 0) - (keys.has('w') || keys.has('arrowup') ? 1 : 0));
    if (v.lengthSq() > 0) {
      v.normalize();
      { const c = Math.cos(camYaw), sn = Math.sin(camYaw), vx = v.x * c + v.z * sn, vz = -v.x * sn + v.z * c; v.set(vx, 0, vz); }
      player.position.addScaledVector(v, 5.2 * dt);
      player.rotation.y = THREE.MathUtils.lerp(player.rotation.y, Math.atan2(v.x, v.z), 0.25);
      player.position.y = Math.abs(Math.sin(t * 12)) * 0.06;
    } else player.position.y = 0;
    walkAnim(v.lengthSq() > 0, t, dt);
    // çarpışma
    for (const c of w.colliders) {
      const dx = player.position.x - c.x, dz = player.position.z - c.z, d = Math.hypot(dx, dz), min = c.r + 0.4;
      if (d < min && d > 0.0001) { player.position.x = c.x + (dx / d) * min; player.position.z = c.z + (dz / d) * min; }
    }
    if (w.radius) { const d = Math.hypot(player.position.x, player.position.z); if (d > w.radius) { player.position.x *= w.radius / d; player.position.z *= w.radius / d; } }
    if (w.bounds) {
      player.position.x = THREE.MathUtils.clamp(player.position.x, -w.bounds.x, w.bounds.x);
      player.position.z = THREE.MathUtils.clamp(player.position.z, w.bounds.zMin, w.bounds.zMax);
    }
  }

  player.visible = mode !== 'puzzle' && mode !== 'cine' && mode !== 'fin' && mode !== 'title' && mode !== 'story';
  // kamera
  if (mode === 'cine') {
    cineUpdate(t, dt);
  } else if (mode === 'fin' && fin) {
    finaleUpdate(t, dt);
  } else if (mode === 'title' || mode === 'story') {
    const a = t * 0.12 + 0.6; camTarget.set(Math.sin(a) * 19, 6.5 + Math.sin(t * 0.2) * 0.8, Math.cos(a) * 19); lookTarget.set(0, 2.6, 0);
  } else if (mode === 'dialog' && dlg && dlg.focus) {
    const f = dlg.focus, dx = f.x - player.position.x, dz = f.z - player.position.z, d = Math.hypot(dx, dz) || 1, nx = dx / d, nz = dz / d, side = 0.95 + Math.sin(t * 0.25) * 0.3;
    camTarget.set(player.position.x - nx * 2.4 - nz * side, 1.95 + Math.sin(t * 0.3) * 0.08, player.position.z - nz * 2.4 + nx * side);
    lookTarget.set(f.x, 1.55, f.z);
    player.rotation.y = THREE.MathUtils.lerp(player.rotation.y, Math.atan2(dx, dz), 0.08);
  } else if (mode === 'puzzle' && worldName === 'iskenderiye') {
    camTarget.set(2.4, 6.6, 17); lookTarget.set(2.4, 5.6, -8);
  } else if (mode === 'puzzle' && worldName === 'misir') {
    camTarget.set(3, 7.5, 21); lookTarget.set(3, 3.2, -3);
  } else if (mode === 'puzzle' && worlds.bagdat) {
    const bp = worlds.bagdat.balancePos;
    camTarget.set(bp.x + 2.4, 3.4, bp.z + 11.5); lookTarget.set(bp.x + 2.4, 1.9, bp.z);
  } else {
    const cp = Math.cos(camPitch);
    camTarget.set(player.position.x + Math.sin(camYaw) * camDist * cp, player.position.y + Math.sin(camPitch) * camDist, player.position.z + Math.cos(camYaw) * camDist * cp);
    lookTarget.copy(player.position).add(new THREE.Vector3(0, 1.3, 0));
  }
  if (mode !== 'cine') {
    const k = 1 - Math.pow(0.002, dt);
    camera.position.lerp(camTarget, k);
    lookNow.lerp(lookTarget, k);
    camera.lookAt(lookNow);
  }
  { const tf = mode === 'dialog' && dlg && dlg.focus ? 42 : mode === 'cine' ? 50 : 55; if (Math.abs(camera.fov - tf) > 0.05) { camera.fov += (tf - camera.fov) * Math.min(1, dt * 3); camera.updateProjectionMatrix(); } }

  if (w && w.update) w.update(t, dt);
  updateInteract();
  grade.uniforms.uTime.value = t;
  if ((qual.frame++ & 1) === 0) renderer.shadowMap.needsUpdate = true;
  if (!skip3D) composer.render();
  qualityTick();
}

worlds.hub = buildHub();
/* Işınlanmada takılmayı önlemek için dünyaları önceden GPU'ya yükle */
function prewarm() {
  ['bagdat', 'misir', 'iskenderiye', 'hub'].forEach((n, i) => setTimeout(() => {
    const w = worlds[n]; if (!w) return;
    const prevEnv = scene.environment, prevFog = scene.fog, was = w.group.visible;
    w.group.visible = true; scene.environment = w.env || null;
    try { composer.render(); } catch (e) {}
    w.group.visible = was || n === worldName; scene.environment = prevEnv; scene.fog = prevFog;
  }, i * 450));
}
setTimeout(prewarm, 2500); setTimeout(prewarm, 9000);
worlds.bagdat = buildBagdat();
worlds.misir = buildMisir();
worlds.iskenderiye = buildIskenderiye();
withAtmosphere('bagdat'); withAtmosphere('misir'); withAtmosphere('iskenderiye');
function skyEnv(a, b, c) { const sc = new THREE.Scene(); sc.add(makeSky(a, b, c)); return pmrem.fromScene(sc, 0, 1, 1000).texture; }
worlds.bagdat.env = skyEnv('#3b6fb0', '#f4b36a', '#ffe3b3');
worlds.hub.env = skyEnv('#050d24', '#1d4180', '#8ab8ec');
worlds.misir.env = skyEnv('#2b6cb0', '#8fc4ee', '#ffe2b0');
worlds.iskenderiye.env = skyEnv('#2f7fd8', '#9ccff5', '#fff1d6');
scene.environment = worlds.hub.env;

/* ---------- Gerçek PBR dokular (assets/tex/...) — dosya yoksa kodla çizilen doku kalır ---------- */
const PBR = {
  brick: { dir: 'duvar/textures', diff: 'old_sandstone_02_diff_1k.jpg', nor: 'old_sandstone_02_nor_gl_1k.exr', rough: 'old_sandstone_02_rough_1k.exr', mult: 1.6 },
  mosaic: { dir: 'zemin/textures', diff: 'marble_mosaic_tiles_diff_1k.jpg', nor: 'marble_mosaic_tiles_nor_gl_1k.exr', rough: 'marble_mosaic_tiles_rough_1k.exr', mult: 1.8 },
  wood: { dir: 'ahşap/textures', diff: 'planks_brown_10_diff_1k.jpg', nor: 'planks_brown_10_nor_gl_1k.exr', rough: 'planks_brown_10_rough_1k.jpg', mult: 1 },
  sand: { dir: 'kum', diff: 'Ground054_1K-JPG_Color.jpg', nor: 'Ground054_1K-JPG_NormalGL.jpg', rough: 'Ground054_1K-JPG_Roughness.jpg', mult: 1.5, ns: 0.8, tint: 0xffd9a0 },
  pyramid: { dir: 'kireçtaşı', diff: 'Tiles139_1K-JPG_Color.jpg', nor: 'Tiles139_1K-JPG_NormalGL.jpg', rough: 'Tiles139_1K-JPG_Roughness.jpg', mult: 0.5, ns: 0.6, tint: 0xf6dca4 },
  limestone: { dir: 'kireçtaşı', diff: 'Tiles139_1K-JPG_Color.jpg', nor: 'Tiles139_1K-JPG_NormalGL.jpg', rough: 'Tiles139_1K-JPG_Roughness.jpg', mult: 0.5, ns: 0.7 },
  marbleWarm: { dir: 'mermer', diff: 'Marble012_1K-JPG_Color.jpg', nor: 'Marble012_1K-JPG_NormalGL.jpg', rough: 'Marble012_1K-JPG_Roughness.jpg', mult: 1, tint: 0xffe6c4 },
  marble: { dir: 'mermer', diff: 'Marble012_1K-JPG_Color.jpg', nor: 'Marble012_1K-JPG_NormalGL.jpg', rough: 'Marble012_1K-JPG_Roughness.jpg', mult: 1 },
};
const texLoader = new THREE.TextureLoader();
// Bazı EXR dokular bu sürümde çözülemiyor (parse undefined döner); hata fırlatmak yerine 1x1 boş doku döndür, loadTex bunu yok sayar
class SafeEXRLoader extends EXRLoader {
  parse(buf) {
    let r = null; try { r = super.parse(buf); } catch (e) { r = null; }
    return r || { width: 1, height: 1, data: new Uint16Array(4), format: THREE.RGBAFormat, type: THREE.HalfFloatType, colorSpace: THREE.LinearSRGBColorSpace };
  }
}
const exrLoader = new SafeEXRLoader();
const texCache = new Map(); // aynı dosya bir kez indirilir/çözülür, her materyal kopyasını alır
function loadTex(url, srgb, rx, ry, cb) {
  const key = url + '|' + (srgb ? 's' : 'l');
  let e = texCache.get(key);
  const give = (t) => { const c = t.clone(); c.needsUpdate = true; c.wrapS = c.wrapT = THREE.RepeatWrapping; c.repeat.set(rx, ry); c.anisotropy = 8; if (srgb) c.colorSpace = THREE.SRGBColorSpace; cb(c); };
  if (e) { if (e.t) give(e.t); else if (!e.failed) e.q.push(give); return; }
  e = { t: null, failed: false, q: [give] }; texCache.set(key, e);
  const loader = url.endsWith('.exr') ? exrLoader : texLoader;
  try {
    loader.load(encodeURI(url), (t) => { if (t.image && t.image.width < 2) { e.failed = true; e.q = []; return; } if (srgb) t.colorSpace = THREE.SRGBColorSpace; e.t = t; e.q.forEach((f) => f(t)); e.q = []; }, undefined, () => { e.failed = true; console.warn('Doku yüklenemedi:', url); });
  } catch (err) { e.failed = true; }
}
function applyPBR(material, cfg, rx, ry) {
  const base = `assets/tex/${cfg.dir}/`;
  loadTex(base + cfg.diff, true, rx, ry, (t) => { material.map = t; material.color.set(cfg.tint || 0xffffff); material.needsUpdate = true; });
  loadTex(base + cfg.nor, false, rx, ry, (t) => { material.normalMap = t; material.normalScale.set(cfg.ns || 0.9, cfg.ns || 0.9); material.needsUpdate = true; });
  loadTex(base + cfg.rough, false, rx, ry, (t) => { material.roughnessMap = t; material.roughness = 1; material.needsUpdate = true; });
}
function upgradeMaterials(group, override = {}) {
  const seen = new Set();
  group.traverse((o) => {
    const m = o.isMesh && o.material;
    if (!m || seen.has(m) || !m.map || !m.map.userData.kind) return;
    seen.add(m);
    const cfg = PBR[override[m.map.userData.kind] || m.map.userData.kind]; if (!cfg) return;
    applyPBR(m, cfg, m.map.repeat.x * cfg.mult, m.map.repeat.y * cfg.mult);
  });
}
upgradeMaterials(worlds.bagdat.group);
upgradeMaterials(worlds.misir.group, { brick: 'limestone' });
upgradeMaterials(worlds.iskenderiye.group, { brick: 'limestone', marble: 'marbleWarm' });
Object.values(worlds).forEach((w) => w.group.traverse((o) => { if (o.isMesh && o.material && 'envMapIntensity' in o.material) o.material.envMapIntensity = o.material.isMeshPhysicalMaterial ? 0.25 : 0.55; }));
// Her çağ için gerçek gün batımı HDRI: assets/hdri/<bagdat|misir|iskenderiye>.(hdr|exr|jpg|png) — yoksa kodla çizilen gökyüzü kalır
const hdriLoaders = { hdr: new RGBELoader(), exr: exrLoader, jpg: new THREE.TextureLoader(), png: new THREE.TextureLoader() };
function loadWorldHdri(name, extraUrl) {
  const w = worlds[name]; if (!w || !w.skyMesh) return;
  const list = ['exr', 'hdr', 'jpg', 'png'].map((e) => [`assets/hdri/${name}.${e}`, e]);
  if (extraUrl) list.push([extraUrl, 'exr']);
  let k = 0;
  const next = () => {
    if (k >= list.length) return;
    const [url, ext] = list[k++];
    hdriLoaders[ext].load(url, (tex) => {
      try {
        if (tex.image && tex.image.width < 2) return next();
        if (ext === 'jpg' || ext === 'png') tex.colorSpace = THREE.SRGBColorSpace;
        tex.mapping = THREE.EquirectangularReflectionMapping;
        w.env = pmrem.fromEquirectangular(tex).texture;
        w.skyMesh.material.map = tex; w.skyMesh.material.needsUpdate = true; w.skyMesh.scale.x = -1;
        w.skyMesh.material.color.setScalar(0.3); // HDRI gökyüzü çok parlak: bloom'u beyaza boğmasın
        if (worldName === name) scene.environment = w.env;
        w.group.traverse((o) => { if (o.isSprite && o.material.blending === THREE.AdditiveBlending && o.scale.x > 100) o.visible = false; });
      } catch (e) { next(); }
    }, undefined, next);
  };
  next();
}
loadWorldHdri('bagdat', 'assets/hdri/magalies_field_sunset_2k.exr');
loadWorldHdri('misir');
loadWorldHdri('iskenderiye');
if (location.search.includes('debug')) window.__KF = { setWorld, player, camera, scene, worlds, startQuiz, openKarne, get mode() { return mode; } };
refreshParts();
worlds.hub.group.visible = true;
player.position.copy(worlds.hub.spawn);
lookNow.set(0, 1, 0);
camera.position.set(0, 9, 16);
loop();

// hata ayıklama kancası (yayından önce silinebilir)

