// Terazi mantığı (saf JS, test edilebilir): a·x + b = c·x + d
export const MAXN = 9;

export function apply(s, op, n) {
  if (op === 'c') {
    if (s.b >= n && s.d >= n) return { ...s, b: s.b - n, d: s.d - n };
  } else if (op === 'x') {
    if (s.c >= n && s.a - n >= 1) return { ...s, a: s.a - n, c: s.c - n };
  } else if (op === 'd') {
    if (n > 1 && [s.a, s.b, s.c, s.d].every((v) => v % n === 0))
      return { a: s.a / n, b: s.b / n, c: s.c / n, d: s.d / n };
  }
  return null;
}

export function isSolved(s) {
  return s.a === 1 && s.b === 0 && s.c === 0;
}

const key = (s) => `${s.a},${s.b},${s.c},${s.d}`;

// En kısa çözüm yolu (BFS)
export function solve(s) {
  const seen = new Set([key(s)]);
  let frontier = [{ s, path: [] }];
  for (let depth = 0; depth < 8; depth++) {
    const next = [];
    for (const node of frontier) {
      if (isSolved(node.s)) return node.path;
      for (const op of ['c', 'x', 'd']) {
        for (let n = 1; n <= MAXN; n++) {
          const t = apply(node.s, op, n);
          if (t && !seen.has(key(t))) {
            seen.add(key(t));
            next.push({ s: t, path: [...node.path, { op, n }] });
          }
        }
      }
    }
    frontier = next;
    for (const node of frontier) if (isSolved(node.s)) return node.path;
  }
  return null;
}

export const par = (s) => (solve(s) || []).length;
export const value = (s) => (s.d - s.b) / (s.a - s.c);

function side(xc, k) {
  const p = [];
  if (xc) p.push(xc === 1 ? 'x' : `${xc}x`);
  if (k || !xc) p.push(String(k));
  return p.join(' + ');
}
export const fmt = (s) => `${side(s.a, s.b)} = ${side(s.c, s.d)}`;

export function stepText(step) {
  if (!step) return '';
  if (step.op === 'c') return `Her iki taraftan ${step.n} ağırlık çıkar`;
  if (step.op === 'x') return `Her iki taraftan ${step.n}x çıkar`;
  return `Her iki tarafı ${step.n}'e böl`;
}

export const stars = (moves, p) => (moves <= p ? 3 : moves <= p + 1 ? 2 : 1);
