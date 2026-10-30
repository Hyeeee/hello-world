// =============================================================
//  art.js — 실사 느낌 그래픽을 그리는 함수들
//  p5의 기본 도형만으로는 그라데이션/클리핑이 어려워서
//  p5가 쓰는 캔버스(drawingContext = ctx)에 직접 그립니다.
//  붕어빵은 "길이 약 300" 크기의 로컬 좌표계(머리 = 오른쪽)에서 그리고,
//  필요한 곳에서 확대/축소해요.
// =============================================================

const TAU = Math.PI * 2;

// ---------- 색 ----------
// 익힘 정도(d) → 껍질 색. 0 = 생반죽, 0.7 = 노릇(최고), 1.0 이상 = 탐
const CRUST_STOPS = [
  [0.0, 243, 226, 180],
  [0.3, 240, 208, 138],
  [0.55, 232, 172, 84],
  [0.7, 218, 142, 58],
  [0.85, 168, 96, 38],
  [1.0, 98, 54, 22],
  [1.2, 34, 20, 13],
];
const BATTER = [244, 226, 178];
const BEAN = [92, 36, 46]; // 팥앙금 (보라빛 도는 적갈색)

function crustColor(d) {
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
const rgba = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
const shade = (c, k) => [Math.min(255, c[0] * k), Math.min(255, c[1] * k), Math.min(255, c[2] * k)];
// 같은 숫자를 넣으면 항상 같은 0~1 값 (매 프레임 모양이 흔들리지 않게)
const hash = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

function roundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// 고정된 랜덤 점들(빵 표면의 반점, 기공) — setup()에서 한 번 만들어요
let SPECKLES = [], PORES = [];
function prepareArt() {
  randomSeed(11);
  for (let i = 0; i < 190; i++) SPECKLES.push({ x: random(-150, 150), y: random(-80, 80), r: random(0.6, 2.2), a: random(0.2, 1) });
  for (let i = 0; i < 90; i++) PORES.push({ x: random(-150, 150), y: random(-70, 70), r: random(0.8, 2), a: random(0.3, 1) });
  randomSeed(millis());
}

// =============================================================
//  붕어빵 모양 — 사진처럼 등/배 지느러미, 들쭉날쭉한 꼬리
// =============================================================

// (x0,y0)→(x1,y1) 사이에 둥근 혹 n개를 바깥쪽으로 볼록하게 이어 붙여요 (지느러미)
function bumps(ctx, x0, y0, x1, y1, n, h) {
  const dx = (x1 - x0) / n, dy = (y1 - y0) / n;
  const len = Math.hypot(dx, dy);
  const nx = -dy / len, ny = dx / len; // 진행 방향에 수직인 방향
  for (let i = 0; i < n; i++) {
    const ax = x0 + dx * i, ay = y0 + dy * i;
    ctx.quadraticCurveTo(ax + dx / 2 + nx * h * 2, ay + dy / 2 + ny * h * 2, ax + dx, ay + dy);
  }
}

const TAIL_POINTS = [[-146, -56], [-161, -40], [-148, -19], [-163, 0], [-148, 19], [-161, 40], [-146, 56], [-138, 84]];

function fishPath(ctx) {
  ctx.beginPath();
  ctx.moveTo(154, 4);                                    // 코끝
  ctx.bezierCurveTo(152, -28, 136, -56, 104, -68);       // 이마
  ctx.bezierCurveTo(84, -75, 62, -77, 46, -77);
  bumps(ctx, 46, -77, -68, -63, 6, 6);                   // 등지느러미
  ctx.bezierCurveTo(-80, -56, -92, -38, -100, -22);      // 꼬리 이음새
  ctx.bezierCurveTo(-110, -40, -124, -64, -138, -84);    // 꼬리 위쪽 끝
  for (const [x, y] of TAIL_POINTS) ctx.lineTo(x, y);    // 꼬리 끝 지그재그
  ctx.bezierCurveTo(-124, 64, -110, 40, -100, 22);
  ctx.bezierCurveTo(-92, 38, -80, 54, -66, 62);
  bumps(ctx, -66, 62, 30, 74, 5, 5);                     // 배지느러미
  ctx.bezierCurveTo(70, 76, 116, 66, 138, 42);           // 턱
  ctx.bezierCurveTo(150, 30, 155, 18, 154, 4);
  ctx.closePath();
}

// 몸통의 위/아래 높이 (비늘을 몸통 안에만 그리기 위해)
const bodyHalf = (x) => 64 * Math.sqrt(Math.max(0, 1 - Math.pow((x - 18) / 128, 2)));

// 구워진(또는 굽는 중) 붕어빵
function drawCookedFish(ctx, d) {
  const base = crustColor(d);
  const edge = crustColor(d + 0.22);
  const light = crustColor(Math.max(0, d - 0.18));
  const dark = shade(edge, 0.68);
  const hi = shade(light, 1.12);

  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  fishPath(ctx);
  // 틀 밖으로 살짝 삐져나온 바삭한 테두리
  ctx.strokeStyle = rgba(crustColor(d + 0.3), 0.9);
  ctx.lineWidth = 8;
  ctx.stroke();
  // 몸통: 왼쪽 위에서 빛이 오는 것처럼, 가장자리는 더 진하게
  const g = ctx.createRadialGradient(30, -30, 10, 0, 0, 178);
  g.addColorStop(0, rgba(light));
  g.addColorStop(0.55, rgba(base));
  g.addColorStop(1, rgba(edge));
  ctx.fillStyle = g;
  ctx.fill();
  ctx.clip(); // 이제부터 그리는 건 붕어빵 안쪽에만 보여요

  // 표면 반점 & 기공
  const sp = Math.min(1, 0.2 + d * 0.9) * 0.5;
  for (const p of SPECKLES) {
    ctx.fillStyle = `rgba(80,38,12,${p.a * sp})`;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.fill();
  }
  for (const p of PORES) {
    ctx.fillStyle = `rgba(255,242,210,${p.a * 0.3 * (1 - Math.min(1, d) * 0.5)})`;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.fill();
  }

  // ---- 볼록한 "양각" 표현: 같은 선을 그림자 / 하이라이트 / 본색 3번 겹쳐 그리기 ----
  const relief = (build, w) => {
    ctx.save(); ctx.translate(2, 2.6); build();
    ctx.strokeStyle = rgba(dark, 0.55); ctx.lineWidth = w + 1.6; ctx.stroke(); ctx.restore();
    ctx.save(); ctx.translate(-1.3, -1.6); build();
    ctx.strokeStyle = rgba(hi, 0.8); ctx.lineWidth = w; ctx.stroke(); ctx.restore();
    build();
    ctx.strokeStyle = rgba(shade(base, 1.02)); ctx.lineWidth = w * 0.55; ctx.stroke();
  };
  // 둥글게 부풀어 오른 부분에 하이라이트
  const puff = (x, y, r, k = 0.28) => {
    const pg = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, 0, x, y, r);
    pg.addColorStop(0, rgba(hi, k));
    pg.addColorStop(1, rgba(hi, 0));
    ctx.fillStyle = pg;
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  };

  // 비늘: 세로로 늘어선 둥근 혹 줄 5개 (꼬리 쪽으로 볼록, 사진처럼 통통하게)
  const COLS = [58, 30, 2, -26, -52];
  for (const cx of COLS) {
    const ym = bodyHalf(cx) - 8;
    const n = Math.max(2, Math.round((2 * ym) / 27));
    const step = (2 * ym) / n;
    for (let j = 0; j < n; j++) {
      const yc = -ym + step * (j + 0.5);
      // 혹 뒤쪽(꼬리 쪽)에 살짝 그림자 → 입체감
      const sg = ctx.createRadialGradient(cx - step * 0.75, yc + 2, 0, cx - step * 0.75, yc + 2, step * 0.6);
      sg.addColorStop(0, rgba(dark, 0.22));
      sg.addColorStop(1, rgba(dark, 0));
      ctx.fillStyle = sg;
      ctx.beginPath(); ctx.arc(cx - step * 0.75, yc + 2, step * 0.6, 0, TAU); ctx.fill();
      puff(cx - step * 0.2, yc, step * 0.62, 0.42);
    }
    relief(() => {
      ctx.beginPath();
      ctx.moveTo(cx, -ym);
      for (let j = 0; j < n; j++) ctx.arc(cx, -ym + step * (j + 0.5), step / 2, -Math.PI / 2, Math.PI / 2, true);
    }, 3.8);
  }

  // 아가미 + 턱선
  relief(() => { ctx.beginPath(); ctx.moveTo(84, -58); ctx.bezierCurveTo(106, -28, 106, 28, 84, 58); }, 3.6);
  relief(() => { ctx.beginPath(); ctx.moveTo(150, 22); ctx.quadraticCurveTo(132, 40, 108, 38); }, 2.4);

  // 눈: 꽃 모양 테두리 + 볼록한 눈알
  puff(116, -26, 22, 0.35);
  relief(() => {
    ctx.beginPath();
    for (let k = 0; k <= 60; k++) {
      const a = (k / 60) * TAU;
      const r = 15 + Math.sin(a * 8) * 1.8;
      const x = 116 + Math.cos(a) * r, y = -26 + Math.sin(a) * r;
      k === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
  }, 2.8);
  relief(() => { ctx.beginPath(); ctx.arc(116, -26, 7, 0, TAU); }, 2.6);
  puff(116, -26, 8, 0.5);

  // 입: 동그랗게 벌린 입
  relief(() => { ctx.beginPath(); ctx.ellipse(143, 12, 6, 5.5, 0, 0, TAU); }, 2.4);

  // 등/배 지느러미 결
  for (let i = 0; i < 6; i++) {
    const x = 37 - i * 19;
    const yb = -77 + (46 - x) * 0.123;
    relief(() => { ctx.beginPath(); ctx.moveTo(x - 4, yb + 9); ctx.lineTo(x + 1, yb - 7); }, 2);
  }
  for (let i = 0; i < 5; i++) {
    const x = -56 + i * 19;
    const yb = 62 + (x + 66) * 0.125;
    relief(() => { ctx.beginPath(); ctx.moveTo(x - 4, yb - 8); ctx.lineTo(x + 1, yb + 6); }, 2);
  }

  // 꼬리: 몸통과 경계선 + 부채꼴 결
  relief(() => { ctx.beginPath(); ctx.moveTo(-96, -34); ctx.quadraticCurveTo(-106, 0, -96, 34); }, 3);
  for (const [tx, ty] of [[-146, -66], [-152, -40], [-155, -14], [-155, 14], [-152, 40], [-146, 66]]) {
    relief(() => { ctx.beginPath(); ctx.moveTo(-108, ty * 0.15); ctx.quadraticCurveTo(-128, ty * 0.6, tx, ty); }, 2.2);
  }

  // 가장자리 안쪽 그림자
  fishPath(ctx);
  ctx.strokeStyle = rgba(dark, 0.45);
  ctx.lineWidth = 10;
  ctx.stroke();

  // 탔을 때 검은 얼룩
  if (d > 0.9) {
    const k = Math.min(1, (d - 0.9) * 3);
    for (let i = 0; i < SPECKLES.length; i += 4) {
      const p = SPECKLES[i];
      ctx.fillStyle = `rgba(15,8,4,${k * 0.5 * p.a})`;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 6, 0, TAU); ctx.fill();
    }
  }

  // 반질반질 윤기
  const gl = ctx.createRadialGradient(20, -44, 0, 20, -44, 100);
  gl.addColorStop(0, `rgba(255,250,235,${0.2 * (1 - Math.min(1, d) * 0.55)})`);
  gl.addColorStop(1, 'rgba(255,250,235,0)');
  ctx.fillStyle = gl;
  ctx.fillRect(-170, -100, 340, 200);
  ctx.restore();
}

// 붓는 중인 반죽 (액체)
function drawBatter(ctx, fill, t, landX = 30) {
  if (fill <= 0.002) return;
  const k = Math.min(1, Math.sqrt(fill / 0.5));
  ctx.save();
  // 너무 많이 부으면 틀 밖으로 넘침
  if (fill > 0.72) {
    const o = (fill - 0.72) * 0.9;
    ctx.save();
    ctx.scale(1 + o * 0.5, 1 + o * 1.0);
    fishPath(ctx);
    ctx.restore();
    ctx.fillStyle = rgba(shade(BATTER, 0.97), 0.95);
    ctx.fill();
  }
  ctx.save();
  ctx.scale(1.03, 1.05);
  fishPath(ctx);
  ctx.restore();
  ctx.clip();

  const level = Math.max(0, Math.min(1, (fill - 0.4) / 0.4)); // 반 이상 차면 더 밝고 매끈하게
  const g = ctx.createRadialGradient(landX, -6, 4, 0, 0, 185 * k);
  g.addColorStop(0, rgba(shade(BATTER, 1.05 + level * 0.03)));
  g.addColorStop(0.7, rgba(BATTER));
  g.addColorStop(1, rgba(shade(BATTER, 0.88 + level * 0.06)));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(landX * (1 - k), 0, 185 * k, 105 * k, 0, 0, TAU);
  ctx.fill();

  // 퍼져나가는 물결
  ctx.strokeStyle = 'rgba(255,255,255,0.22)';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 3; i++) {
    const r = ((t * 40 + i * 30) % 90) * k;
    ctx.beginPath();
    ctx.ellipse(landX, -4, r * 1.4, r * 0.75, 0, 0, TAU);
    ctx.stroke();
  }
  // 반사광
  ctx.fillStyle = `rgba(255,255,255,${0.25 + level * 0.15})`;
  ctx.beginPath();
  ctx.ellipse(-30 + Math.sin(t * 1.3) * 6, -36 * k, 60 * k, 9 * k, -0.08, 0, TAU);
  ctx.fill();
  ctx.restore();
}

// =============================================================
//  팥앙금 — 짤주머니에서 짜낸 굵은 줄 (머리 → 꼬리)
//  xStart(머리 쪽)에서 xEnd(꼬리 쪽)까지, 붕어빵 로컬 좌표
// =============================================================
const beanY = (x) => Math.sin(x * 0.045) * 4;

function drawBeanRibbon(ctx, xStart, xEnd, alpha = 1) {
  if (xStart - xEnd < 1) return;
  const path = () => {
    ctx.beginPath();
    ctx.moveTo(xStart, beanY(xStart));
    for (let x = xStart; x > xEnd; x -= 4) ctx.lineTo(x, beanY(x));
    ctx.lineTo(xEnd, beanY(xEnd));
  };
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  // 그림자
  ctx.save(); ctx.translate(2, 5); path();
  ctx.strokeStyle = 'rgba(40,12,8,0.35)'; ctx.lineWidth = 34; ctx.stroke(); ctx.restore();
  // 본체
  path();
  ctx.strokeStyle = rgba(BEAN); ctx.lineWidth = 30; ctx.stroke();
  // 울퉁불퉁한 팥 알갱이
  for (let x = xStart - 3; x > xEnd + 1; x -= 4.5) {
    for (let k = 0; k < 3; k++) {
      const h1 = hash(x * 1.3 + k * 17), h2 = hash(x * 0.7 + k * 31), h3 = hash(x + k * 7);
      const ly = beanY(x) + (h1 - 0.5) * 22;
      const r = 2.5 + h2 * 4;
      const c = h3 < 0.5 ? shade(BEAN, 1.35) : shade(BEAN, 0.75);
      ctx.fillStyle = rgba(c, 0.85);
      ctx.beginPath(); ctx.arc(x + (h3 - 0.5) * 3, ly, r, 0, TAU); ctx.fill();
    }
  }
  // 윗면 반사광
  ctx.save(); ctx.translate(-1, -8); path();
  ctx.strokeStyle = 'rgba(255,215,225,0.2)'; ctx.lineWidth = 5; ctx.stroke(); ctx.restore();
  ctx.restore();
}

// 짤주머니 (x, y = 깍지 끝, 월드 좌표)
function drawPipingBag(ctx, x, y, squeeze) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(0.55);
  const sq = 1 - squeeze * 0.14; // 짤 때 살짝 쪼그라듦
  // 깍지(금속)
  let g = ctx.createLinearGradient(-9, 0, 9, 0);
  g.addColorStop(0, '#5d6268'); g.addColorStop(0.4, '#eef0f2'); g.addColorStop(1, '#6b7076');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(-5, 0); ctx.lineTo(5, 0); ctx.lineTo(10, -24); ctx.lineTo(-10, -24);
  ctx.closePath();
  ctx.fill();
  // 비닐 주머니 모양
  const cone = (top) => {
    ctx.beginPath();
    ctx.moveTo(-11, -22);
    ctx.bezierCurveTo(-30 * sq, -60, -48 * sq, top + 40, -42 * sq, top);
    ctx.quadraticCurveTo(0, top - 18, 42 * sq, top);
    ctx.bezierCurveTo(48 * sq, top + 40, 30 * sq, -60, 11, -22);
    ctx.closePath();
  };
  // 안에 든 팥
  cone(-118);
  g = ctx.createLinearGradient(-40, 0, 40, 0);
  g.addColorStop(0, rgba(shade(BEAN, 0.7)));
  g.addColorStop(0.45, rgba(shade(BEAN, 1.25)));
  g.addColorStop(1, rgba(shade(BEAN, 0.6)));
  ctx.fillStyle = g;
  ctx.fill();
  // 비닐 (반투명)
  cone(-168);
  ctx.fillStyle = 'rgba(255,255,255,0.13)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.45)';
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(-18 * sq, -50); ctx.quadraticCurveTo(-34 * sq, -110, -28 * sq, -150); ctx.stroke();
  // 위쪽 꼬인 매듭
  ctx.fillStyle = 'rgba(235,235,240,0.7)';
  ctx.beginPath(); ctx.ellipse(0, -182, 9, 14, 0, 0, TAU); ctx.fill();
  ctx.restore();
}

// =============================================================
//  무쇠 붕어빵 틀 (로컬 좌표, 틀 중심 = 0,0)
// =============================================================
function drawMoldPlate(ctx, heat) {
  // 아래 불빛
  const glow = ctx.createRadialGradient(0, 30, 30, 0, 30, 300);
  glow.addColorStop(0, `rgba(255,110,30,${0.12 + heat * 0.12})`);
  glow.addColorStop(1, 'rgba(255,110,30,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(-330, -220, 660, 460);

  // 손잡이 (왼쪽)
  let g = ctx.createLinearGradient(0, -10, 0, 10);
  g.addColorStop(0, '#6a6c70'); g.addColorStop(0.5, '#2c2d30'); g.addColorStop(1, '#151517');
  ctx.fillStyle = g;
  ctx.fillRect(-262, -9, 80, 18);
  g = ctx.createLinearGradient(0, -15, 0, 15);
  g.addColorStop(0, '#8a5a34'); g.addColorStop(0.5, '#5b3519'); g.addColorStop(1, '#2e1a0b');
  ctx.fillStyle = g;
  roundRectPath(ctx, -330, -15, 76, 30, 13);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,220,180,0.12)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(-325, -8 + i * 5); ctx.lineTo(-262, -9 + i * 5); ctx.stroke(); }

  // 철판
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur = 30;
  ctx.shadowOffsetY = 14;
  g = ctx.createLinearGradient(-190, -110, 190, 110);
  g.addColorStop(0, '#3b3a39'); g.addColorStop(0.45, '#1f1e1d'); g.addColorStop(1, '#0f0f0f');
  ctx.fillStyle = g;
  roundRectPath(ctx, -192, -114, 384, 228, 30);
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = 'rgba(255,255,255,0.1)';
  ctx.lineWidth = 2;
  roundRectPath(ctx, -190, -112, 380, 224, 28);
  ctx.stroke();
  // 무쇠 질감 + 눌어붙은 부스러기
  for (let i = 0; i < PORES.length; i++) {
    const p = PORES[i];
    ctx.fillStyle = `rgba(255,255,255,${0.035 * p.a})`;
    ctx.beginPath(); ctx.arc(p.x * 1.2, p.y * 1.5, p.r, 0, TAU); ctx.fill();
  }
  for (let i = 0; i < 18; i++) {
    const x = (hash(i * 3.1) - 0.5) * 360, y = (hash(i * 7.7) - 0.5) * 210;
    if (Math.abs(x) < 165 && Math.abs(y) < 92) continue;
    ctx.fillStyle = `rgba(150,85,40,${0.25 + hash(i) * 0.3})`;
    ctx.beginPath(); ctx.arc(x, y, 1.5 + hash(i * 5) * 2.5, 0, TAU); ctx.fill();
  }

  // 붕어빵 모양 홈
  ctx.save();
  ctx.scale(1.05, 1.08);
  fishPath(ctx);
  ctx.restore();
  const cg = ctx.createRadialGradient(0, 0, 20, 0, 0, 175);
  cg.addColorStop(0, '#141210'); cg.addColorStop(1, '#070606');
  ctx.fillStyle = cg;
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,230,200,0.1)';
  ctx.lineWidth = 2.5;
  ctx.stroke();
}

// ---------- 놋쇠 반죽 주전자 ----------
function drawKettle(ctx, tipX, tipY, tilt) {
  ctx.save();
  ctx.translate(tipX, tipY);
  ctx.rotate(tilt);
  // 주둥이
  let g = ctx.createLinearGradient(0, -14, 0, 12);
  g.addColorStop(0, '#fff0b0'); g.addColorStop(0.5, '#c79a3c'); g.addColorStop(1, '#6e4f17');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(0, -2); ctx.quadraticCurveTo(28, -6, 58, -26); ctx.lineTo(62, -6); ctx.quadraticCurveTo(30, 8, 4, 7);
  ctx.closePath();
  ctx.fill();
  // 주둥이 끝에 묻은 반죽
  ctx.fillStyle = rgba(BATTER);
  ctx.beginPath(); ctx.ellipse(3, 2, 6, 7, 0, 0, TAU); ctx.fill();
  // 몸통
  g = ctx.createLinearGradient(50, -90, 150, 30);
  g.addColorStop(0, '#fff3c2'); g.addColorStop(0.3, '#e0b858'); g.addColorStop(0.65, '#9c7428'); g.addColorStop(1, '#4d360d');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(60, -70);
  ctx.bezierCurveTo(46, -30, 48, 10, 70, 24);
  ctx.lineTo(132, 24);
  ctx.bezierCurveTo(154, 10, 156, -30, 142, -70);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(255,250,220,0.55)';
  ctx.beginPath(); ctx.ellipse(72, -26, 5, 34, 0.06, 0, TAU); ctx.fill();
  // 입구 테
  ctx.fillStyle = '#d8b25a';
  ctx.beginPath(); ctx.ellipse(101, -72, 43, 9, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = rgba(BATTER);
  ctx.beginPath(); ctx.ellipse(101, -72, 37, 6, 0, 0, TAU); ctx.fill();
  // 손잡이
  ctx.strokeStyle = '#7a5a1c';
  ctx.lineWidth = 8;
  ctx.beginPath(); ctx.arc(152, -26, 26, -1.2, 1.2); ctx.stroke();
  ctx.restore();
}

function drawStream(ctx, x0, y0, x1, y1, t) {
  ctx.save();
  ctx.lineCap = 'round';
  ctx.strokeStyle = rgba(BATTER);
  ctx.lineWidth = 8 + Math.sin(t * 30) * 1.2;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.quadraticCurveTo(x0 - 6, (y0 + y1) / 2, x1, y1);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.45)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x0 - 2, y0 + 4);
  ctx.quadraticCurveTo(x0 - 8, (y0 + y1) / 2, x1 - 2, y1);
  ctx.stroke();
  ctx.restore();
}

// ---------- 집게 ----------
function drawTongs(ctx, x, y) {
  ctx.save();
  ctx.lineCap = 'round';
  for (const [dx, dy, w] of [[-14, -6, 8], [14, 8, 8]]) {
    ctx.strokeStyle = '#6f757c';
    ctx.lineWidth = w;
    ctx.beginPath(); ctx.moveTo(x + 150, y - 150); ctx.lineTo(x + dx, y + dy); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.45)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x + 148, y - 152); ctx.lineTo(x + dx - 1, y + dy - 2); ctx.stroke();
  }
  ctx.restore();
}

// ---------- 종이봉투 ----------
function drawBag(ctx, x, top, fishD, fishInside) {
  const w = 150, h = 190, L = x - w / 2;
  ctx.save();
  // 그림자
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath(); ctx.ellipse(x + 8, top + h - 2, w * 0.6, 14, 0, 0, TAU); ctx.fill();
  // 안쪽(입구)
  ctx.fillStyle = '#4a3420';
  ctx.beginPath(); ctx.ellipse(x, top + 4, w / 2 - 4, 11, 0, 0, TAU); ctx.fill();
  // 봉투 안의 붕어빵 (머리가 위로 빼꼼)
  if (fishInside) {
    ctx.save();
    ctx.translate(x + 6, top + 8);
    ctx.rotate(-1.42);
    ctx.scale(0.42, 0.42);
    drawCookedFish(ctx, fishD);
    ctx.restore();
  }
  // 앞면 (윗변은 지그재그로 자른 모양)
  ctx.beginPath();
  ctx.moveTo(L, top);
  for (let i = 0; i <= 10; i++) ctx.lineTo(L + (w * i) / 10, top + (i % 2 ? 5 : 0));
  ctx.lineTo(L + w - 4, top + h);
  ctx.lineTo(L + 4, top + h);
  ctx.closePath();
  const g = ctx.createLinearGradient(L, 0, L + w, 0);
  g.addColorStop(0, '#9c7342'); g.addColorStop(0.18, '#c9a06a'); g.addColorStop(0.6, '#c39960'); g.addColorStop(1, '#8e6635');
  ctx.fillStyle = g;
  ctx.fill();
  ctx.save();
  ctx.clip();
  // 종이 결
  ctx.strokeStyle = 'rgba(90,60,30,0.12)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 26; i++) {
    const yy = top + 8 + i * 7;
    ctx.beginPath(); ctx.moveTo(L, yy + Math.sin(i) * 2); ctx.lineTo(L + w, yy + Math.cos(i * 1.7) * 2); ctx.stroke();
  }
  // 접힌 주름
  ctx.fillStyle = 'rgba(70,45,20,0.18)';
  ctx.fillRect(L + 18, top, 3, h);
  ctx.fillRect(L + w - 22, top, 3, h);
  ctx.fillStyle = 'rgba(255,240,210,0.12)';
  ctx.fillRect(L + 21, top, 2, h);
  ctx.restore();
  // 빨간 도장
  ctx.strokeStyle = 'rgba(168,40,28,0.78)';
  ctx.fillStyle = 'rgba(168,40,28,0.78)';
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(x, top + 92, 36, 0, TAU); ctx.stroke();
  ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.arc(x, top + 92, 31, 0, TAU); ctx.stroke();
  ctx.font = '20px "Do Hyeon", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('붕어빵', x, top + 98);
  ctx.save();
  ctx.translate(x, top + 76);
  ctx.scale(0.07, 0.07);
  fishPath(ctx);
  ctx.restore();
  ctx.fill();
  ctx.restore();
}

// ---------- 손님 손 (오른쪽에서 뻗어옴) ----------
function drawHand(ctx, tipX, y, skin, coat) {
  ctx.save();
  // 소매
  let g = ctx.createLinearGradient(0, y - 36, 0, y + 36);
  g.addColorStop(0, rgba(shade(coat, 1.3)));
  g.addColorStop(0.5, rgba(coat));
  g.addColorStop(1, rgba(shade(coat, 0.55)));
  ctx.fillStyle = g;
  roundRectPath(ctx, tipX + 88, y - 34, 400, 70, 20);
  ctx.fill();
  ctx.fillStyle = rgba(shade(coat, 0.75));
  roundRectPath(ctx, tipX + 84, y - 36, 22, 74, 10);
  ctx.fill();
  // 손바닥
  g = ctx.createLinearGradient(0, y - 30, 0, y + 30);
  g.addColorStop(0, rgba(shade(skin, 1.1)));
  g.addColorStop(1, rgba(shade(skin, 0.78)));
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.ellipse(tipX + 62, y + 2, 34, 27, 0, 0, TAU); ctx.fill();
  // 손가락 4개
  for (let i = 0; i < 4; i++) {
    const fy = y - 13 + i * 9.5;
    const len = 48 - Math.abs(i - 1.2) * 5;
    ctx.fillStyle = rgba(shade(skin, 0.96 - i * 0.04));
    roundRectPath(ctx, tipX + 6 + (48 - len), fy - 5, len + 20, 11, 5.5);
    ctx.fill();
    ctx.strokeStyle = rgba(shade(skin, 0.7), 0.6);
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  // 엄지
  ctx.save();
  ctx.translate(tipX + 44, y - 25);
  ctx.rotate(-0.45);
  ctx.fillStyle = rgba(shade(skin, 1.04));
  ctx.beginPath(); ctx.ellipse(0, 0, 22, 9.5, 0, 0, TAU); ctx.fill();
  ctx.restore();
  ctx.restore();
}

// ---------- 손님 실루엣 (오른쪽 위) ----------
function drawCustomerSilhouette(ctx, offX, coat) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(820, 60, 200, 146);
  ctx.clip();
  ctx.translate(offX, 0);
  const body = ctx.createLinearGradient(850, 0, 960, 0);
  body.addColorStop(0, rgba(shade(coat, 0.55)));
  body.addColorStop(1, rgba(shade(coat, 0.25)));
  ctx.fillStyle = body;
  ctx.beginPath(); ctx.ellipse(922, 238, 95, 72, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#16120f';
  ctx.beginPath(); ctx.ellipse(920, 128, 32, 38, 0, 0, TAU); ctx.fill();
  ctx.fillRect(908, 150, 24, 30);
  // 전구 빛이 비치는 테두리
  ctx.strokeStyle = 'rgba(255,180,100,0.35)';
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.ellipse(920, 128, 32, 38, 0, 2.2, 4.3); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(922, 238, 95, 72, 0, 3.4, 4.4); ctx.stroke();
  ctx.restore();
}

// =============================================================
//  배경 (한 번만 그려서 이미지처럼 재사용) — 가격표는 언어에 따라 바뀜
// =============================================================
function renderBackground(g) {
  const c = g.drawingContext;
  // 밤거리 하늘
  let lg = c.createLinearGradient(0, 0, 0, 230);
  lg.addColorStop(0, '#0a0f1e'); lg.addColorStop(1, '#1d1621');
  c.fillStyle = lg;
  c.fillRect(0, 0, W, 230);
  // 흐릿한 도시 불빛 (보케)
  randomSeed(3);
  const cols = [[255, 190, 110], [255, 140, 80], [120, 170, 255], [255, 230, 170], [210, 130, 255]];
  for (let i = 0; i < 50; i++) {
    const x = random(W), y = random(70, 225), r = random(8, 36), col = random(cols), a = random(0.1, 0.32);
    const rg = c.createRadialGradient(x, y, 0, x, y, r);
    rg.addColorStop(0, rgba(col, a)); rg.addColorStop(0.75, rgba(col, a * 0.6)); rg.addColorStop(1, rgba(col, 0));
    c.fillStyle = rg;
    c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
  }
  // 포장마차 천막
  lg = c.createLinearGradient(0, 0, 0, 66);
  lg.addColorStop(0, '#8f2c14'); lg.addColorStop(1, '#d4582b');
  c.fillStyle = lg;
  c.fillRect(0, 0, W, 66);
  for (let x = 0; x < W; x += 64) {
    const fg = c.createLinearGradient(x, 0, x + 64, 0);
    fg.addColorStop(0, 'rgba(0,0,0,0.18)'); fg.addColorStop(0.5, 'rgba(255,200,150,0.08)'); fg.addColorStop(1, 'rgba(0,0,0,0.18)');
    c.fillStyle = fg;
    c.fillRect(x, 0, 64, 66);
  }
  c.fillStyle = '#a63a1b';
  for (let x = 0; x < W + 40; x += 40) { c.beginPath(); c.arc(x + 20, 64, 20, 0, Math.PI); c.fill(); }

  // 작업대 (스테인리스)
  lg = c.createLinearGradient(0, 205, 0, H);
  lg.addColorStop(0, '#55575b'); lg.addColorStop(0.08, '#3c3e42'); lg.addColorStop(0.6, '#2a2b2e'); lg.addColorStop(1, '#18191b');
  c.fillStyle = lg;
  c.fillRect(0, 205, W, H - 205);
  randomSeed(5);
  for (let i = 0; i < 420; i++) {
    const y = random(212, H), x = random(-50, W), len = random(60, 260);
    c.strokeStyle = random() < 0.5 ? `rgba(255,255,255,${random(0.015, 0.05)})` : `rgba(0,0,0,${random(0.03, 0.08)})`;
    c.lineWidth = 1;
    c.beginPath(); c.moveTo(x, y); c.lineTo(x + len, y); c.stroke();
  }
  // 뒤쪽 난간
  lg = c.createLinearGradient(0, 200, 0, 216);
  lg.addColorStop(0, '#9aa0a6'); lg.addColorStop(0.5, '#5d6166'); lg.addColorStop(1, '#2d2f33');
  c.fillStyle = lg;
  c.fillRect(0, 200, W, 16);
  // 앞쪽 나무 테두리
  lg = c.createLinearGradient(0, 612, 0, H);
  lg.addColorStop(0, '#7a4a26'); lg.addColorStop(1, '#3b2010');
  c.fillStyle = lg;
  c.fillRect(0, 612, W, H - 612);
  c.strokeStyle = 'rgba(30,15,5,0.4)';
  for (let i = 0; i < 6; i++) { c.beginPath(); c.moveTo(0, 617 + i * 4); c.bezierCurveTo(300, 612 + i * 5, 600, 622 + i * 3, W, 616 + i * 4); c.stroke(); }

  // 전구 + 따뜻한 빛
  for (const bx of [250, 720]) {
    c.strokeStyle = '#111';
    c.lineWidth = 2;
    c.beginPath(); c.moveTo(bx, 60); c.lineTo(bx, 96); c.stroke();
    const big = c.createRadialGradient(bx, 110, 0, bx, 110, 430);
    big.addColorStop(0, 'rgba(255,190,110,0.28)'); big.addColorStop(1, 'rgba(255,190,110,0)');
    c.fillStyle = big;
    c.fillRect(0, 0, W, H);
    const b = c.createRadialGradient(bx, 108, 0, bx, 108, 16);
    b.addColorStop(0, '#fff8e0'); b.addColorStop(0.5, '#ffd27a'); b.addColorStop(1, 'rgba(255,170,60,0)');
    c.fillStyle = b;
    c.beginPath(); c.arc(bx, 108, 16, 0, TAU); c.fill();
  }
  // 작업대 위 빛 웅덩이
  const pool = c.createRadialGradient(470, 380, 40, 470, 380, 430);
  pool.addColorStop(0, 'rgba(255,170,90,0.14)'); pool.addColorStop(1, 'rgba(255,170,90,0)');
  c.fillStyle = pool;
  c.fillRect(0, 200, W, H - 200);

  // 골판지 가격표 (끈에 매달림)
  c.save();
  c.translate(108, 128);
  c.rotate(-0.06);
  c.strokeStyle = '#1b130d';
  c.lineWidth = 1.5;
  c.beginPath(); c.moveTo(-60, -44); c.lineTo(-48, -66); c.moveTo(60, -44); c.lineTo(50, -66); c.stroke();
  c.fillStyle = '#c69a62';
  c.shadowColor = 'rgba(0,0,0,0.5)'; c.shadowBlur = 12; c.shadowOffsetY = 6;
  c.fillRect(-80, -46, 160, 92);
  c.shadowColor = 'transparent';
  c.strokeStyle = 'rgba(80,50,20,0.5)';
  c.lineWidth = 3;
  c.strokeRect(-78, -44, 156, 88);
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  const [s1, s2] = T('signSize');
  c.fillStyle = '#25170d';
  c.font = `${s1}px "Nanum Pen Script", cursive`;
  c.fillText(T('sign1'), 0, -14);
  c.fillStyle = '#b02a1c';
  c.font = `${s2}px "Nanum Pen Script", cursive`;
  c.fillText(T('sign2'), 0, 22);
  c.restore();

  // 비네팅 (가장자리 어둡게)
  const v = c.createRadialGradient(W / 2, H / 2, 220, W / 2, H / 2, 680);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.55)');
  c.fillStyle = v;
  c.fillRect(0, 0, W, H);
  randomSeed(millis());
}
