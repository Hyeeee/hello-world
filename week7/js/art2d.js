// =============================================================
//  art2d.js — 2D 그림 도구 (텍스처를 만들 때 사용)
//  붕어빵 외곽선은 여기 한 곳에서만 정의하고,
//  3D 모양(Three.js Shape)과 2D 텍스처(canvas) 양쪽에서 같이 써요.
//  좌표: 붕어빵 길이 약 300, 머리 = 오른쪽(+x), 아래 = +y (캔버스 기준)
// =============================================================

export const TAU = Math.PI * 2;
export const BATTER = [244, 226, 178];
export const BEAN = [92, 36, 46];

// 익힘 정도(d) → 껍질 색. 0 = 생반죽, 0.7 = 노릇(최고), 1.0 이상 = 탐
const CRUST_STOPS = [
  [0.0, 243, 226, 180],
  [0.3, 240, 208, 138],
  [0.55, 230, 158, 60],
  [0.7, 208, 122, 36],
  [0.85, 160, 84, 26],
  [1.0, 96, 52, 22],
  [1.2, 34, 20, 13],
];

export function crustColor(d) {
  d = Math.max(0, Math.min(1.2, d));
  for (let i = 0; i < CRUST_STOPS.length - 1; i++) {
    const a = CRUST_STOPS[i], b = CRUST_STOPS[i + 1];
    if (d <= b[0]) {
      const k = (d - a[0]) / (b[0] - a[0]);
      return [a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k, a[3] + (b[3] - a[3]) * k];
    }
  }
  return CRUST_STOPS[CRUST_STOPS.length - 1].slice(1);
}

export const rgba = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
export const shade = (c, k) => [Math.min(255, c[0] * k), Math.min(255, c[1] * k), Math.min(255, c[2] * k)];
// 같은 숫자를 넣으면 항상 같은 0~1 값 (랜덤처럼 보이지만 매번 똑같음)
export const hash = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

// (x0,y0)→(x1,y1) 사이에 둥근 혹 n개를 바깥쪽으로 볼록하게 (지느러미)
function bumps(p, x0, y0, x1, y1, n, h) {
  const dx = (x1 - x0) / n, dy = (y1 - y0) / n;
  const len = Math.hypot(dx, dy);
  const nx = -dy / len, ny = dx / len;
  for (let i = 0; i < n; i++) {
    const ax = x0 + dx * i, ay = y0 + dy * i;
    p.quadraticCurveTo(ax + dx / 2 + nx * h * 2, ay + dy / 2 + ny * h * 2, ax + dx, ay + dy);
  }
}

const TAIL_POINTS = [[-153, -50], [-167, -37], [-155, -19], [-169, -3], [-156, 13], [-167, 31], [-153, 47], [-149, 70]];

// p 는 canvas context 일 수도 있고, Three.js Shape 어댑터일 수도 있어요 (같은 함수 이름을 가짐)
// 사진처럼: 뾰족한 코 → 아가미 뒤가 제일 통통 → 꼬리 쪽으로 날렵하게 → 가는 꼬리자루 → 넓게 퍼진 꼬리
export function fishPath(p) {
  p.beginPath();
  p.moveTo(160, 8);                                   // 코끝 (뾰족하게)
  p.bezierCurveTo(156, -18, 140, -48, 108, -62);      // 이마
  p.bezierCurveTo(90, -70, 68, -72, 50, -71);
  bumps(p, 50, -71, -58, -46, 6, 5);                  // 등지느러미 (꼬리 쪽으로 낮아짐)
  p.bezierCurveTo(-74, -38, -92, -24, -106, -13);     // 가늘어지는 꼬리자루
  p.bezierCurveTo(-118, -30, -134, -56, -150, -76);   // 꼬리 위쪽 끝
  for (const [x, y] of TAIL_POINTS) p.lineTo(x, y);   // 꼬리 끝 지그재그
  p.bezierCurveTo(-132, 52, -118, 28, -106, 13);
  p.bezierCurveTo(-92, 24, -76, 38, -60, 46);
  bumps(p, -60, 46, 34, 66, 5, 4.5);                  // 배지느러미
  p.bezierCurveTo(74, 70, 116, 62, 140, 40);          // 턱
  p.bezierCurveTo(152, 30, 160, 20, 160, 8);
  p.closePath();
}

// 몸통 위/아래 높이 — 아가미 뒤(x≈50)가 제일 넓고 꼬리 쪽으로 가늘어짐
export const bodyHalf = (x) => (x >= 50
  ? 68 * Math.sqrt(Math.max(0, 1 - Math.pow((x - 50) / 112, 2)))
  : 14 + 54 * Math.pow(Math.max(0, (x + 106) / 156), 0.8));

// 비늘/눈/아가미/지느러미 결 — "선"들을 모아둔 목록 (높이맵과 색 텍스처에 같이 씀)
export function forEachRelief(ctx, stroke) {
  // 비늘: 세로 5줄, 꼬리 쪽으로 볼록한 반원들
  const COLS = [58, 30, 2, -26, -52];
  for (const cx of COLS) {
    const ym = bodyHalf(cx) - 8;
    const n = Math.max(2, Math.round((2 * ym) / 27));
    const step = (2 * ym) / n;
    ctx.beginPath();
    ctx.moveTo(cx, -ym);
    for (let j = 0; j < n; j++) ctx.arc(cx, -ym + step * (j + 0.5), step / 2, -Math.PI / 2, Math.PI / 2, true);
    stroke(3.8);
  }
  // 아가미, 턱선
  ctx.beginPath(); ctx.moveTo(84, -58); ctx.bezierCurveTo(106, -28, 106, 28, 84, 58); stroke(3.6);
  ctx.beginPath(); ctx.moveTo(150, 22); ctx.quadraticCurveTo(132, 40, 108, 38); stroke(2.4);
  // 꽃 모양 눈 + 눈알
  ctx.beginPath();
  for (let k = 0; k <= 60; k++) {
    const a = (k / 60) * TAU, r = 15 + Math.sin(a * 8) * 1.8;
    const x = 116 + Math.cos(a) * r, y = -26 + Math.sin(a) * r;
    k === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  stroke(2.8);
  ctx.beginPath(); ctx.arc(116, -26, 7, 0, TAU); stroke(2.6);
  // 입
  ctx.beginPath(); ctx.ellipse(148, 13, 5.5, 5, 0, 0, TAU); stroke(2.4);
  // 등/배 지느러미 결 (지느러미 선을 따라 비스듬히)
  for (let i = 0; i < 6; i++) {
    const x = 43 - i * 18, yb = -71 + (50 - x) * 0.231;
    ctx.beginPath(); ctx.moveTo(x - 4, yb + 9); ctx.lineTo(x + 1, yb - 6); stroke(2);
  }
  for (let i = 0; i < 5; i++) {
    const x = -52 + i * 18, yb = 46 + (x + 60) * 0.213;
    ctx.beginPath(); ctx.moveTo(x - 4, yb - 8); ctx.lineTo(x + 1, yb + 5); stroke(2);
  }
  // 꼬리: 경계선 + 길게 뻗은 부채꼴 결
  ctx.beginPath(); ctx.moveTo(-100, -24); ctx.quadraticCurveTo(-110, 0, -100, 24); stroke(3);
  for (const [tx, ty] of [[-152, -62], [-160, -40], [-163, -14], [-163, 14], [-160, 40], [-152, 62]]) {
    ctx.beginPath(); ctx.moveTo(-112, ty * 0.12); ctx.quadraticCurveTo(-132, ty * 0.55, tx, ty); stroke(2.2);
  }
}

// 통통한 비늘 혹들의 중심 (높이맵에서 둥글게 부풀리기)
export function forEachScaleBump(fn) {
  const COLS = [58, 30, 2, -26, -52];
  for (const cx of COLS) {
    const ym = bodyHalf(cx) - 8;
    const n = Math.max(2, Math.round((2 * ym) / 27));
    const step = (2 * ym) / n;
    for (let j = 0; j < n; j++) fn(cx - step * 0.22, -ym + step * (j + 0.5), step * 0.6);
  }
}

// 붓는 중인 반죽 (위에서 본 모습) — 반죽 텍스처에 그려요
export function drawBatter(ctx, fill, t, landX = 30) {
  if (fill <= 0.002) return;
  const k = Math.min(1, Math.sqrt(fill / 0.5));
  ctx.save();
  if (fill > 0.72) {
    // 너무 많이 부으면 틀 밖으로 넘침
    const o = (fill - 0.72) * 0.9;
    ctx.save();
    ctx.scale(1.05 + o * 0.5, 1.08 + o * 1.0);
    fishPath(ctx);
    ctx.restore();
    ctx.fillStyle = rgba(shade(BATTER, 0.97), 1);
    ctx.fill();
  }
  ctx.save();
  ctx.scale(1.04, 1.07);
  fishPath(ctx);
  ctx.restore();
  ctx.clip();
  const level = Math.max(0, Math.min(1, (fill - 0.4) / 0.4));
  const g = ctx.createRadialGradient(landX, -6, 4, 0, 0, 185 * k);
  g.addColorStop(0, rgba(shade(BATTER, 1.04 + level * 0.02)));
  g.addColorStop(0.7, rgba(BATTER));
  g.addColorStop(1, rgba(shade(BATTER, 0.9 + level * 0.05)));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(landX * (1 - k), 0, 185 * k, 105 * k, 0, 0, TAU);
  ctx.fill();
  // 퍼져나가는 물결
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.lineWidth = 1.6;
  for (let i = 0; i < 3; i++) {
    const r = ((t * 40 + i * 30) % 90) * k;
    ctx.beginPath(); ctx.ellipse(landX, -4, r * 1.4, r * 0.75, 0, 0, TAU); ctx.stroke();
  }
  ctx.restore();
}
