import * as THREE from 'three';

// Tüm dokular kodla çizilir (dış dosya gerekmez) — çağın havasını verir.
const cv = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
function tex(c, rx = 1, ry = 1) {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(rx, ry);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}
function grain(ctx, w, h, amt) {
  const img = ctx.getImageData(0, 0, w, h), d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() - 0.5) * amt;
    d[i] += n; d[i + 1] += n; d[i + 2] += n;
  }
  ctx.putImageData(img, 0, 0);
}

// Kerpiç / kumtaşı tuğla duvar
export function brickTex(rx = 4, ry = 2) {
  const c = cv(512, 512), g = c.getContext('2d');
  g.fillStyle = '#8f7348'; g.fillRect(0, 0, 512, 512);
  const bw = 128, bh = 64;
  for (let r = 0; r < 8; r++) {
    for (let k = -1; k < 5; k++) {
      const x = k * bw + (r % 2 ? bw / 2 : 0), y = r * bh;
      const l = 62 + Math.random() * 10, h = 36 + Math.random() * 6;
      g.fillStyle = `hsl(${h},42%,${l}%)`;
      g.fillRect(x + 3, y + 3, bw - 6, bh - 6);
    }
  }
  grain(g, 512, 512, 28);
  const TT = tex(c, rx, ry); TT.userData.kind = 'brick'; return TT;
}

// İslam mimarisi geometrik mozaik zemin (sekiz köşeli yıldız)
export function mosaicTex(rx = 10, ry = 10) {
  const c = cv(512, 512), g = c.getContext('2d');
  const T = 256;
  for (let ty = 0; ty < 2; ty++) for (let tx = 0; tx < 2; tx++) {
    const cx = tx * T + T / 2, cy = ty * T + T / 2;
    g.fillStyle = '#efe3c2'; g.fillRect(tx * T, ty * T, T, T);
    // köşe elmasları
    g.fillStyle = '#16365e';
    for (const [dx, dy] of [[0, 0], [T, 0], [0, T], [T, T]]) {
      g.beginPath(); g.moveTo(tx * T + dx, ty * T + dy - 46); g.lineTo(tx * T + dx + 46, ty * T + dy);
      g.lineTo(tx * T + dx, ty * T + dy + 46); g.lineTo(tx * T + dx - 46, ty * T + dy); g.fill();
    }
    // iki kare -> sekiz köşeli yıldız
    for (const rot of [0, Math.PI / 4]) {
      g.save(); g.translate(cx, cy); g.rotate(rot);
      g.fillStyle = rot ? '#1fa6a0' : '#2cc2b5';
      g.strokeStyle = '#16365e'; g.lineWidth = 5;
      g.fillRect(-88, -88, 176, 176); g.strokeRect(-88, -88, 176, 176);
      g.restore();
    }
    g.fillStyle = '#e0a82e'; g.beginPath(); g.arc(cx, cy, 44, 0, 7); g.fill();
    g.strokeStyle = '#16365e'; g.lineWidth = 4; g.stroke();
    g.fillStyle = '#16365e'; g.beginPath(); g.arc(cx, cy, 14, 0, 7); g.fill();
    g.strokeStyle = '#16365e'; g.lineWidth = 6; g.strokeRect(tx * T + 2, ty * T + 2, T - 4, T - 4);
  }
  grain(g, 512, 512, 14);
  const TT = tex(c, rx, ry); TT.userData.kind = 'mosaic'; return TT;
}

// Kubbe çinisi (turkuaz pul deseni)
export function domeTex() {
  const c = cv(256, 256), g = c.getContext('2d');
  g.fillStyle = '#1a8f94'; g.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 8; y++) for (let x = 0; x < 9; x++) {
    const px = x * 32 + (y % 2 ? 16 : 0), py = y * 32;
    g.fillStyle = (x + y) % 2 ? '#22b3b0' : '#157a82';
    g.beginPath(); g.arc(px, py, 20, 0, Math.PI); g.fill();
    g.strokeStyle = '#e8c35a'; g.lineWidth = 2; g.stroke();
  }
  return tex(c, 4, 2);
}

export function woodTex() {
  const c = cv(256, 256), g = c.getContext('2d');
  g.fillStyle = '#6b4423'; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 90; i++) {
    g.strokeStyle = `rgba(${40 + Math.random() * 40},${20 + Math.random() * 20},10,0.35)`;
    g.lineWidth = 1 + Math.random() * 2;
    const x = Math.random() * 256;
    g.beginPath(); g.moveTo(x, 0); g.bezierCurveTo(x + 8, 80, x - 8, 170, x + 2, 256); g.stroke();
  }
  const TT = tex(c, 1, 1); TT.userData.kind = 'wood'; return TT;
}

export function marbleTex() {
  const c = cv(256, 256), g = c.getContext('2d');
  g.fillStyle = '#e9e2d0'; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 14; i++) {
    g.strokeStyle = 'rgba(120,110,95,0.25)'; g.lineWidth = 1 + Math.random() * 2;
    g.beginPath(); g.moveTo(Math.random() * 256, 0);
    g.bezierCurveTo(Math.random() * 256, 80, Math.random() * 256, 170, Math.random() * 256, 256); g.stroke();
  }
  grain(g, 256, 256, 10);
  const TT = tex(c, 1, 1); TT.userData.kind = 'marble'; return TT;
}

// Gelecek: zaman makinesi odası zemini
export function hubFloorTex() {
  const c = cv(512, 512), g = c.getContext('2d');
  g.fillStyle = '#0a1226'; g.fillRect(0, 0, 512, 512);
  g.strokeStyle = '#1fd5ff'; g.lineWidth = 2;
  for (let i = 0; i <= 512; i += 64) {
    g.globalAlpha = 0.55; g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 512); g.moveTo(0, i); g.lineTo(512, i); g.stroke();
  }
  g.globalAlpha = 0.9; g.fillStyle = '#1fd5ff';
  for (let i = 0; i < 40; i++) g.fillRect(Math.floor(Math.random() * 8) * 64 + 28, Math.floor(Math.random() * 8) * 64 + 28, 8, 8);
  grain(g, 512, 512, 12);
  return tex(c, 6, 6);
}

export function xCrateTex(label = 'x') {
  const c = cv(128, 128), g = c.getContext('2d');
  const grd = g.createLinearGradient(0, 0, 128, 128);
  grd.addColorStop(0, '#ffd966'); grd.addColorStop(1, '#c98a1a');
  g.fillStyle = grd; g.fillRect(0, 0, 128, 128);
  g.strokeStyle = '#7a4e08'; g.lineWidth = 8; g.strokeRect(4, 4, 120, 120);
  g.fillStyle = '#3a2404'; g.font = 'italic bold 92px serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(label, 64, 70);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export function skyTex(top, mid, bottom) {
  const c = cv(8, 256), g = c.getContext('2d');
  const grd = g.createLinearGradient(0, 0, 0, 256);
  grd.addColorStop(0, top); grd.addColorStop(0.55, mid); grd.addColorStop(1, bottom);
  g.fillStyle = grd; g.fillRect(0, 0, 8, 256);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export function labelSprite(text, color = '#ffffff', size = 1) {
  const c = cv(512, 128), g = c.getContext('2d');
  g.font = 'bold 54px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.shadowColor = color; g.shadowBlur = 18; g.fillStyle = color;
  g.fillText(text, 256, 64);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false }));
  s.scale.set(4 * size, 1 * size, 1);
  return s;
}

export function portalTex(hex) {
  const c = cv(256, 256), g = c.getContext('2d');
  const col = '#' + hex.toString(16).padStart(6, '0');
  const grd = g.createRadialGradient(128, 128, 4, 128, 128, 128);
  grd.addColorStop(0, '#ffffff'); grd.addColorStop(0.35, col); grd.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grd; g.fillRect(0, 0, 256, 256);
  g.strokeStyle = 'rgba(255,255,255,0.5)'; g.lineWidth = 3;
  for (let i = 0; i < 6; i++) { g.beginPath(); g.arc(128, 128, 20 + i * 18, i, i + 3.2); g.stroke(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export function glowTex() {
  const c = cv(256, 256), g = c.getContext('2d');
  const grd = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  grd.addColorStop(0, 'rgba(255,255,255,1)'); grd.addColorStop(0.15, 'rgba(255,230,180,0.7)');
  grd.addColorStop(0.5, 'rgba(255,170,90,0.18)'); grd.addColorStop(1, 'rgba(255,150,60,0)');
  g.fillStyle = grd; g.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export function sandTex(rx = 40, ry = 40) {
  const c = cv(512, 512), g = c.getContext('2d');
  g.fillStyle = '#dcbc84'; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 50; i++) {
    g.strokeStyle = `rgba(${150 + Math.random() * 50},${110 + Math.random() * 40},60,0.18)`; g.lineWidth = 2 + Math.random() * 4;
    const y = Math.random() * 512;
    g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(130, y + 14, 380, y - 14, 512, y + 4); g.stroke();
  }
  grain(g, 512, 512, 30);
  const TT = tex(c, rx, ry); TT.userData.kind = 'sand'; return TT;
}
