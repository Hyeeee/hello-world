// =============================================================
//  textures.js — 코드로 그리는 텍스처들 (이미지 파일 없음)
//  canvas에 2D로 그린 뒤 Three.js의 CanvasTexture로 바꿔서 3D 표면에 입혀요.
//   - map      : 표면 색/무늬
//   - bumpMap  : 흑백 높이 정보 (밝을수록 튀어나옴) → 조명이 진짜 울퉁불퉁한 것처럼 계산
// =============================================================
import * as THREE from 'three';
import { fishPath, forEachRelief, forEachScaleBump, hash, TAU } from './art2d.js';

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return [c, c.getContext('2d')];
}

function toTexture(canvas, srgb = true) {
  const t = new THREE.CanvasTexture(canvas);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

// ---------- 밝은 원목 조리대 ----------
export function woodTexture() {
  const [c, ctx] = makeCanvas(1024, 1024);
  ctx.fillStyle = '#e4cfab';
  ctx.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 140; i++) {
    const y = hash(i * 3.3) * 1024;
    const a = 0.03 + hash(i * 1.7) * 0.07;
    ctx.strokeStyle = hash(i) < 0.6 ? `rgba(150,105,60,${a})` : `rgba(255,245,225,${a})`;
    ctx.lineWidth = 1 + hash(i * 9.1) * 5;
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let x = 0; x <= 1024; x += 32) ctx.lineTo(x, y + Math.sin(x * 0.006 + i) * 10 + Math.sin(x * 0.02 + i * 2) * 3);
    ctx.stroke();
  }
  // 나무 판 이음새
  ctx.strokeStyle = 'rgba(120,80,40,0.18)';
  ctx.lineWidth = 2;
  for (let y = 0; y < 1024; y += 256) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(1024, y); ctx.stroke(); }
  const t = toTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

// ---------- 무쇠 / 팥 표면용 울퉁불퉁 노이즈 ----------
export function noiseTexture(size = 256, blobs = 900, soft = 1) {
  const [c, ctx] = makeCanvas(size, size);
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < blobs; i++) {
    const x = hash(i * 1.31) * size, y = hash(i * 2.77) * size;
    const r = (0.6 + hash(i * 5.1) * 2.6) * soft;
    const v = hash(i * 7.3) < 0.5 ? 255 : 0;
    ctx.fillStyle = `rgba(${v},${v},${v},${0.25 + hash(i) * 0.35})`;
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  }
  const t = toTexture(c, false);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

// ---------- 붕어빵 표면: 색 무늬(map) + 높이(bumpMap) ----------
// 텍스처 1024px = 붕어빵 좌표 -170..170 (그래서 3D 쪽에서 repeat 1/340, offset 0.5)
export function fishTextures() {
  const S = 1024, K = S / 340;
  const local = (ctx) => ctx.setTransform(K, 0, 0, K, S / 2, S / 2);

  // 색 무늬: 흰색 바탕에 반점/기공/가장자리 어둡게 → 재질 color(익힘 색)와 곱해져요
  // 붕어빵 바깥은 투명 → 3D에서 그 부분은 잘려나가서 붕어빵 모양 테두리가 생겨요
  const [mc, m] = makeCanvas(S, S);
  local(m);
  fishPath(m);
  const g = m.createRadialGradient(25, -25, 10, 0, 0, 175);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(0.6, '#f2f2f2');
  g.addColorStop(1, '#b4b4b4');
  m.fillStyle = g;
  m.fill();
  m.save();
  m.clip();
  for (let i = 0; i < 260; i++) {
    const x = (hash(i * 1.1) - 0.5) * 310, y = (hash(i * 2.3) - 0.5) * 170;
    m.fillStyle = `rgba(90,60,40,${0.12 + hash(i * 3.9) * 0.3})`;
    m.beginPath(); m.arc(x, y, 0.6 + hash(i * 4.4) * 1.8, 0, TAU); m.fill();
  }
  for (let i = 0; i < 120; i++) {
    const x = (hash(i * 6.1) - 0.5) * 300, y = (hash(i * 7.3) - 0.5) * 150;
    m.fillStyle = `rgba(255,255,255,${0.3 + hash(i) * 0.4})`;
    m.beginPath(); m.arc(x, y, 0.7 + hash(i * 8.8) * 1.6, 0, TAU); m.fill();
  }
  // 튀어나온 결은 틀에 더 닿아서 살짝 더 진하게 구워져요
  m.lineCap = 'round';
  m.lineJoin = 'round';
  forEachRelief(m, (w) => { m.strokeStyle = 'rgba(120,90,70,0.28)'; m.lineWidth = w + 1; m.stroke(); });
  // 가장자리 안쪽 진하게
  fishPath(m);
  m.strokeStyle = 'rgba(110,80,60,0.35)';
  m.lineWidth = 10;
  m.stroke();
  m.restore();

  // 높이: 검정 바탕, 비늘 혹은 둥글게 밝게, 결은 밝은 선 → 살짝 블러
  const [hc, h] = makeCanvas(S, S);
  h.fillStyle = '#000';
  h.fillRect(0, 0, S, S);
  local(h);
  fishPath(h);
  h.fillStyle = '#3a3a3a';
  h.fill();
  forEachScaleBump((x, y, r) => {
    const pg = h.createRadialGradient(x, y, 0, x, y, r);
    pg.addColorStop(0, 'rgba(255,255,255,0.55)');
    pg.addColorStop(1, 'rgba(255,255,255,0)');
    h.fillStyle = pg;
    h.beginPath(); h.arc(x, y, r, 0, TAU); h.fill();
  });
  // 눈 / 볼 부풀림
  for (const [x, y, r, a] of [[116, -26, 20, 0.5], [120, 8, 30, 0.25], [-138, 0, 26, 0.12]]) {
    const pg = h.createRadialGradient(x, y, 0, x, y, r);
    pg.addColorStop(0, `rgba(255,255,255,${a})`);
    pg.addColorStop(1, 'rgba(255,255,255,0)');
    h.fillStyle = pg;
    h.beginPath(); h.arc(x, y, r, 0, TAU); h.fill();
  }
  h.lineCap = 'round';
  h.lineJoin = 'round';
  forEachRelief(h, (w) => { h.strokeStyle = 'rgba(255,255,255,0.95)'; h.lineWidth = w * 1.25; h.stroke(); });
  // 블러로 부드럽게 (모서리가 칼처럼 서지 않게)
  const [bc, b] = makeCanvas(S, S);
  b.filter = 'blur(3px)';
  b.drawImage(hc, 0, 0);

  return { map: toTexture(mc), bump: toTexture(bc, false) };
}

// ---------- 붕어빵 두께 지도 ----------
// 붕어빵 실루엣을 크게 블러하면: 넓은 몸통 가운데는 하얗게(=두껍게),
// 좁은 꼬리·지느러미·가장자리는 회색(=얇게)이 돼요. 이걸 3D 높이로 써요.
// 반환: heightAt(x, z) → 0~1  (x, z = 붕어빵 좌표)
export function fishThickness() {
  const S = 340; // 1px = 1 단위
  const [mc, m] = makeCanvas(S, S);
  m.fillStyle = '#000';
  m.fillRect(0, 0, S, S);
  m.setTransform(1, 0, 0, 1, S / 2, S / 2);
  fishPath(m);
  m.fillStyle = '#fff';
  m.fill();
  const [bc, b] = makeCanvas(S, S);
  b.filter = 'blur(16px)';
  b.drawImage(mc, 0, 0);
  const blur = b.getImageData(0, 0, S, S).data;
  const mask = m.getImageData(0, 0, S, S).data;
  const field = new Float32Array(S * S);
  for (let i = 0; i < S * S; i++) {
    // 블러값 0.5 = 딱 테두리 → 0으로, 1 = 가운데 → 1로 늘려줌
    const v = Math.max(0, (blur[i * 4] / 255 - 0.5) * 2);
    field[i] = mask[i * 4] > 127 ? v : 0;
  }
  const get = (px, py) => {
    px = Math.max(0, Math.min(S - 1, px));
    py = Math.max(0, Math.min(S - 1, py));
    return field[py * S + px];
  };
  // 부드럽게 보간해서 읽기
  return (x, z) => {
    const fx = x + S / 2, fy = z + S / 2;
    const x0 = Math.floor(fx), y0 = Math.floor(fy), tx = fx - x0, ty = fy - y0;
    const a = get(x0, y0) * (1 - tx) + get(x0 + 1, y0) * tx;
    const c = get(x0, y0 + 1) * (1 - tx) + get(x0 + 1, y0 + 1) * tx;
    return a * (1 - ty) + c * ty;
  };
}

// ---------- 종이봉투 앞면 (크라프트지 + 빨간 도장) ----------
export function kraftTexture() {
  const [c, ctx] = makeCanvas(512, 640);
  const g = ctx.createLinearGradient(0, 0, 512, 0);
  g.addColorStop(0, '#b48a55'); g.addColorStop(0.2, '#d2ab74'); g.addColorStop(0.7, '#cba26b'); g.addColorStop(1, '#a87e48');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 512, 640);
  for (let i = 0; i < 90; i++) {
    ctx.strokeStyle = `rgba(110,75,40,${0.04 + hash(i) * 0.08})`;
    ctx.lineWidth = 1 + hash(i * 2) * 2;
    const y = hash(i * 3.7) * 640;
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(512, y + (hash(i * 5) - 0.5) * 20); ctx.stroke();
  }
  // 지그재그로 자른 윗변 (투명하게 뚫기)
  ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  for (let i = 0; i <= 16; i++) ctx.lineTo((512 * i) / 16, i % 2 ? 18 : 2);
  ctx.lineTo(512, 0);
  ctx.closePath();
  ctx.fill();
  ctx.globalCompositeOperation = 'source-over';
  // 도장
  ctx.strokeStyle = 'rgba(170,40,28,0.85)';
  ctx.fillStyle = 'rgba(170,40,28,0.85)';
  ctx.lineWidth = 9;
  ctx.beginPath(); ctx.arc(256, 360, 112, 0, TAU); ctx.stroke();
  ctx.lineWidth = 4;
  ctx.beginPath(); ctx.arc(256, 360, 96, 0, TAU); ctx.stroke();
  ctx.font = '64px "Do Hyeon", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('붕어빵', 256, 382);
  ctx.save();
  ctx.translate(256, 310);
  ctx.scale(0.22, 0.22);
  fishPath(ctx);
  ctx.restore();
  ctx.fill();
  return toTexture(c);
}

// ---------- 김(스팀) 한 덩어리 ----------
export function steamTexture() {
  const [c, ctx] = makeCanvas(128, 128);
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,255,255,0.9)');
  g.addColorStop(0.5, 'rgba(255,255,255,0.35)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  return toTexture(c);
}
