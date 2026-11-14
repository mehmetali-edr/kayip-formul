import * as THREE from 'three';
import { labelSprite } from './textures.js?v=3';

const M = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.7, metalness: 0.05, ...o });

// Harezmî — oyunun kendi karakteri (özgün tasarım): çini mavisi cübbe, beyaz sarık, gümüş sakal, elinde kitap.
export function makeHarezmi({ holo = false } = {}) {
  const g = new THREE.Group();
  const robe = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.62, 1.55, 20), M(0x1b5a8c));
  robe.position.y = 0.78; g.add(robe);
  const trim = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.05, 8, 24), M(0xe0a82e, { metalness: 0.5 }));
  trim.rotation.x = Math.PI / 2; trim.position.y = 0.05; g.add(trim);
  const belt = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.06, 8, 20), M(0xe0a82e, { metalness: 0.5 }));
  belt.rotation.x = Math.PI / 2; belt.position.y = 0.95; g.add(belt);
  const head = new THREE.Group(); head.position.y = 1.78; g.add(head);
  const face = new THREE.Mesh(new THREE.SphereGeometry(0.27, 20, 16), M(0xd9a273)); head.add(face);
  const turban = new THREE.Mesh(new THREE.SphereGeometry(0.31, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.58), M(0xf4efe2));
  turban.position.y = 0.07; head.add(turban);
  const wrap = new THREE.Mesh(new THREE.TorusGeometry(0.29, 0.07, 10, 24), M(0xf4efe2));
  wrap.rotation.x = Math.PI / 2; wrap.position.y = 0.1; head.add(wrap);
  const jewel = new THREE.Mesh(new THREE.OctahedronGeometry(0.06), M(0x35d0c0, { emissive: 0x35d0c0, emissiveIntensity: 0.8 }));
  jewel.position.set(0, 0.12, 0.33); head.add(jewel);
  const beard = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.55, 14), M(0xd8dde2));
  beard.rotation.x = Math.PI; beard.position.set(0, -0.3, 0.1); head.add(beard);
  for (const s of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8), M(0x111111));
    eye.position.set(0.09 * s, 0.04, 0.24); head.add(eye);
    const brow = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.02, 0.02), M(0xd8dde2));
    brow.position.set(0.09 * s, 0.11, 0.25); head.add(brow);
  }
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), M(0xc98e5e));
  nose.position.set(0, -0.02, 0.27); head.add(nose);
  // kollar ve kitap
  for (const s of [-1, 1]) {
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 0.7, 10), M(0x1b5a8c));
    arm.position.set(0.42 * s, 1.2, 0.15); arm.rotation.set(-0.7, 0, -0.25 * s); g.add(arm);
  }
  const book = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.06, 0.32), M(0x7a1f1f));
  book.position.set(0, 1.12, 0.52); book.rotation.x = -0.25; g.add(book);
  const pages = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.05, 0.28), M(0xf4efe2));
  pages.position.set(0, 1.16, 0.52); pages.rotation.x = -0.25; g.add(pages);
  const sym = labelSprite('x = ?', '#35d0c0', 0.5); sym.position.set(0, 2.55, 0); g.add(sym);
  const name = labelSprite('El-Harezmî', '#ffe08a', 0.55); name.position.set(0, 2.9, 0); g.add(name);
  g.userData = { head, sym };

  if (holo) {
    g.traverse((o) => {
      if (o.isMesh) {
        o.material = new THREE.MeshBasicMaterial({ color: 0x4fe3ff, transparent: true, opacity: 0.45, wireframe: false, depthWrite: false, blending: THREE.AdditiveBlending });
      }
    });
  }
  g.traverse((o) => { if (o.isMesh) o.castShadow = !holo; });
  return g;
}

// Oyuncu: zaman yolcusu (turuncu ceket, camgöz, sırt çantası)
export function makePlayer() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.28, 0.6, 6, 14), M(0xe86a2c));
  body.position.y = 0.75; g.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.26, 18, 14), M(0xf2c9a0));
  head.position.y = 1.5; g.add(head);
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.28, 18, 10, 0, Math.PI * 2, 0, Math.PI * 0.5), M(0x2b2f3a));
  cap.position.y = 1.54; g.add(cap);
  const goggles = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.05, 8, 20, Math.PI), M(0x35d0ff, { emissive: 0x35d0ff, emissiveIntensity: 1.2 }));
  goggles.position.set(0, 1.52, 0.1); goggles.rotation.set(0, 0, Math.PI); goggles.rotation.x = 0; g.add(goggles);
  const lens = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.1, 0.04), M(0x35d0ff, { emissive: 0x35d0ff, emissiveIntensity: 1.4 }));
  lens.position.set(0, 1.5, 0.25); g.add(lens);
  const pack = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.55, 0.22), M(0x3b3f4c));
  pack.position.set(0, 0.85, -0.3); g.add(pack);
  const dial = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.025, 8, 16), M(0x35d0ff, { emissive: 0x35d0ff, emissiveIntensity: 1.5 }));
  dial.position.set(0, 0.9, -0.42); g.add(dial);
  for (const s of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.5, 8), M(0x2b2f3a));
    leg.position.set(0.14 * s, 0.25, 0); g.add(leg);
  }
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return g;
}

// Katip Ahmes — Mısırlı kâtip (Rhind Papirüsü'nü yazan kâtibe selam)
function stripeTex(c1, c2, n = 12) {
  const cv = document.createElement('canvas'); cv.width = 64; cv.height = 128; const x = cv.getContext('2d'), h = 128 / n;
  for (let i = 0; i < n; i++) { x.fillStyle = i % 2 ? c1 : c2; x.fillRect(0, i * h, 64, h); }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}
function papyrusTex() {
  const cv = document.createElement('canvas'); cv.width = 256; cv.height = 140; const x = cv.getContext('2d');
  x.fillStyle = '#ecdcaa'; x.fillRect(0, 0, 256, 140);
  for (let i = 0; i < 40; i++) { x.fillStyle = `rgba(150,110,50,${Math.random() * 0.08})`; x.fillRect(0, Math.random() * 140, 256, 2); }
  x.strokeStyle = '#7a3b1e'; x.fillStyle = '#7a3b1e'; x.lineWidth = 3;
  x.strokeRect(8, 8, 240, 124);
  x.font = 'bold 40px Georgia, serif'; x.textAlign = 'center'; x.fillText('1 : 2', 128, 64);
  x.font = '22px Georgia, serif'; x.fillText('x = (b · c) / a', 128, 104);
  for (const [px, py] of [[34, 34], [222, 34], [34, 108], [222, 108]]) { x.beginPath(); x.arc(px, py, 8, 0, 7); x.stroke(); x.beginPath(); x.arc(px, py, 2.5, 0, 7); x.fill(); }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
}
// Ahmes — Mısırlı katip (özgün tasarım): nemes başlık, geniş boyun süsü, keten etek, elinde açık papirüs
export function makeScribe() {
  const g = new THREE.Group();
  const skin = 0xa8683c, gold = 0xe0a82e, blue = 0x1f5fa8, turq = 0x2bb3c0;
  const goldM = () => M(gold, { metalness: 0.7, roughness: 0.35 });
  // sandaletler ve etek
  for (const sx of [-1, 1]) { const f = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.06, 0.34), M(0x6b4423)); f.position.set(0.16 * sx, 0.03, 0.06); g.add(f); }
  const kilt = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.5, 0.98, 24), M(0xf6eed8, { roughness: 0.9 }));
  kilt.position.y = 0.55; g.add(kilt);
  const front = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.78, 0.05), M(0xfffaf0, { roughness: 0.85 })); front.position.set(0, 0.6, 0.45); front.rotation.x = 0.1; g.add(front);
  const hem = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.05, 0.06), goldM()); hem.position.set(0, 0.22, 0.49); g.add(hem);
  const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.345, 0.345, 0.1, 24), goldM()); belt.position.y = 1.03; g.add(belt);
  const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.12, 0.05), M(blue)); buckle.position.set(0, 1.03, 0.35); g.add(buckle);
  // gövde
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.3, 0.6, 20), M(skin)); torso.position.y = 1.35; g.add(torso);
  for (const sx of [-1, 1]) { const ch = new THREE.Mesh(new THREE.SphereGeometry(0.15, 12, 10), M(skin)); ch.scale.set(1, 0.8, 0.7); ch.position.set(0.14 * sx, 1.45, 0.24); g.add(ch); }
  // geniş boyun süsü (usekh)
  [[0.3, 0.035, gold, 1.68], [0.345, 0.035, turq, 1.645], [0.39, 0.035, 0xc0392b, 1.61], [0.435, 0.035, gold, 1.575]].forEach(([r, t, c, y]) => {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r, t, 8, 28), c === gold ? goldM() : M(c, { roughness: 0.4 }));
    ring.rotation.x = Math.PI / 2 - 0.15; ring.scale.set(1, 0.85, 1); ring.position.set(0, y, 0.04); g.add(ring);
  });
  // baş
  const head = new THREE.Group(); head.position.y = 1.9; g.add(head);
  const face = new THREE.Mesh(new THREE.SphereGeometry(0.25, 22, 18), M(skin)); face.scale.set(0.92, 1.08, 0.95); head.add(face);
  const stripes = stripeTex('#e0a82e', '#1f5fa8', 14);
  const nemesM = new THREE.MeshStandardMaterial({ map: stripes, roughness: 0.6, metalness: 0.15 });
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.295, 26, 16, 0, Math.PI * 2, 0, Math.PI * 0.56), nemesM); cap.position.y = 0.05; cap.scale.set(1, 1, 1.05); head.add(cap);
  const band = new THREE.Mesh(new THREE.TorusGeometry(0.265, 0.025, 8, 28), goldM()); band.rotation.x = Math.PI / 2; band.position.set(0, 0.155, 0.03); band.scale.set(1, 1.05, 1); head.add(band);
  const uraeus = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.12, 8), goldM()); uraeus.position.set(0, 0.22, 0.28); uraeus.rotation.x = -0.4; head.add(uraeus);
  for (const sx of [-1, 1]) {
    const lap = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.52, 0.16), nemesM); lap.position.set(0.255 * sx, -0.24, 0.03); lap.rotation.z = 0.04 * sx; head.add(lap);
    // gözler: kohl çizgili
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.036, 10, 8), M(0xffffff, { roughness: 0.3 })); eye.scale.set(1.2, 0.8, 0.5); eye.position.set(0.095 * sx, 0.03, 0.238); head.add(eye);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 8), M(0x0a0604)); pupil.position.set(0.095 * sx, 0.03, 0.252); head.add(pupil);
    const kohl = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.022, 0.02), M(0x050505)); kohl.position.set(0.12 * sx, 0.03, 0.242); kohl.rotation.z = 0.12 * sx; head.add(kohl);
    const brow = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.022, 0.02), M(0x050505)); brow.position.set(0.1 * sx, 0.095, 0.238); brow.rotation.z = -0.1 * sx; head.add(brow);
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), M(skin)); ear.scale.set(0.5, 1, 0.8); ear.position.set(0.235 * sx, 0, 0); head.add(ear);
  }
  const tail = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.7, 0.1), nemesM); tail.position.set(0, -0.28, -0.27); head.add(tail);
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.1, 8), M(skin)); nose.position.set(0, -0.02, 0.265); nose.rotation.x = Math.PI / 2 + 0.3; head.add(nose);
  const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.02, 0.02), M(0x7a3326)); mouth.position.set(0, -0.11, 0.238); head.add(mouth);
  // kollar: omuz → dirsek → önkol, papirüsü tutuyor
  for (const sx of [-1, 1]) {
    const sh = new THREE.Group(); sh.position.set(0.4 * sx, 1.58, 0); sh.rotation.set(-0.5, 0, -0.08 * sx); g.add(sh);
    const up = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.08, 0.4, 12), M(skin)); up.position.y = -0.19; sh.add(up);
    const band2 = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.05, 12), goldM()); band2.position.y = -0.08; sh.add(band2);
    const el = new THREE.Group(); el.position.y = -0.39; el.rotation.x = -1.2; sh.add(el);
    const fo = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.34, 12), M(skin)); fo.position.y = -0.17; el.add(fo);
    const wr = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.068, 0.04, 12), goldM()); wr.position.y = -0.3; el.add(wr);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.065, 10, 8), M(skin)); hand.position.y = -0.37; el.add(hand);
  }
  // açık papirüs
  const sheet = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.36, 0.015), new THREE.MeshStandardMaterial({ map: papyrusTex(), roughness: 0.95 }));
  sheet.position.set(0, 1.27, 0.54); sheet.rotation.x = -0.3; g.add(sheet);
  for (const sx of [-1, 1]) { const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.42, 10), M(0xd9c58b)); rod.position.set(0.34 * sx, 1.27, 0.54); rod.rotation.x = -0.3; g.add(rod); }
  // kamış kalem
  const pen = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.3, 6), M(0x6b4423)); pen.position.set(0.3, 1.38, 0.5); pen.rotation.set(0.5, 0, -0.6); g.add(pen);
  const sym = labelSprite('1 : 2', '#ffcf6a', 0.5); sym.position.set(0, 2.85, 0); g.add(sym);
  const name = labelSprite('Katip Ahmes', '#ffe08a', 0.55); name.position.set(0, 3.2, 0); g.add(name);
  g.userData = { head, sym };
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return g;
}

// Eratosthenes — İskenderiye Kütüphanesi'nin başkâtibi (özgün tasarım)
export function makeScholar() {
  const g = new THREE.Group();
  const robe = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.58, 1.6, 20), M(0xf2f0ea));
  robe.position.y = 0.8; g.add(robe);
  const drape = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.4, 0.5, 18, 1, true, 0, Math.PI * 1.3), M(0x6c4fb2, { side: THREE.DoubleSide }));
  drape.position.y = 1.35; drape.rotation.y = 0.6; g.add(drape);
  const head = new THREE.Group(); head.position.y = 1.78; g.add(head);
  head.add(new THREE.Mesh(new THREE.SphereGeometry(0.26, 18, 14), M(0xdcae82)));
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.28, 18, 10, 0, Math.PI * 2, 0, Math.PI * 0.45), M(0x9a9a9a));
  hair.position.y = 0.05; head.add(hair);
  const beard = new THREE.Mesh(new THREE.ConeGeometry(0.17, 0.4, 12), M(0xb9b9b9));
  beard.rotation.x = Math.PI; beard.position.set(0, -0.28, 0.1); head.add(beard);
  const laurel = new THREE.Mesh(new THREE.TorusGeometry(0.27, 0.035, 8, 22), M(0x3a8a3a));
  laurel.rotation.x = Math.PI / 2; laurel.position.y = 0.13; head.add(laurel);
  for (const s of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 8), M(0x111111));
    eye.position.set(0.09 * s, 0.04, 0.23); head.add(eye);
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.65, 10), M(0xf2f0ea));
    arm.position.set(0.4 * s, 1.2, 0.15); arm.rotation.set(-0.7, 0, -0.25 * s); g.add(arm);
  }
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.02, 8, 24), M(0xe0a82e, { metalness: 0.8 }));
  ring.position.set(0, 1.2, 0.5); g.add(ring);
  const sym = labelSprite('θ = ?', '#c9b8ff', 0.5); sym.position.set(0, 2.55, 0); g.add(sym);
  const name = labelSprite('Eratosthenes', '#ffe08a', 0.55); name.position.set(0, 2.9, 0); g.add(name);
  g.userData = { head, sym, ring };
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return g;
}
