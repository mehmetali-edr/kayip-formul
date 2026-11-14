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
export function makeScribe() {
  const g = new THREE.Group();
  const kilt = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.5, 1.0, 18), M(0xf3ead2));
  kilt.position.y = 0.5; g.add(kilt);
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.34, 0.7, 16), M(0xb87a4b));
  torso.position.y = 1.35; g.add(torso);
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.07, 8, 20), M(0xe0a82e, { metalness: 0.6 }));
  collar.rotation.x = Math.PI / 2; collar.position.y = 1.68; g.add(collar);
  const head = new THREE.Group(); head.position.y = 1.95; g.add(head);
  head.add(new THREE.Mesh(new THREE.SphereGeometry(0.25, 18, 14), M(0xb87a4b)));
  const wig = new THREE.Mesh(new THREE.SphereGeometry(0.28, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.62), M(0x15110d));
  wig.position.y = 0.05; head.add(wig);
  for (const s of [-1, 1]) {
    const side = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.45, 0.2), M(0x15110d));
    side.position.set(0.25 * s, -0.12, 0); head.add(side);
    const eye = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.03, 0.02), M(0x050505));
    eye.position.set(0.09 * s, 0.04, 0.23); head.add(eye);
  }
  const arm = (s) => { const a = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 0.65, 10), M(0xb87a4b)); a.position.set(0.38 * s, 1.25, 0.18); a.rotation.set(-0.8, 0, -0.2 * s); g.add(a); };
  arm(-1); arm(1);
  const scroll = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.5, 12), M(0xe9dcb0));
  scroll.rotation.z = Math.PI / 2; scroll.position.set(0, 1.12, 0.42); g.add(scroll);
  const sym = labelSprite('1 : 2', '#ffcf6a', 0.5); sym.position.set(0, 2.7, 0); g.add(sym);
  const name = labelSprite('Katip Ahmes', '#ffe08a', 0.55); name.position.set(0, 3.05, 0); g.add(name);
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
