// =============================================================
//  main.js — 포장마차 원판 붕어빵 기계 게임
//  원버튼: SPACE / 클릭 / 터치.   M = 소리,  L = 언어
//
//  흐름 (앞에 온 틀 하나만 내가 다룸):
//   빈 틀 → 열기 → [꾹] 반죽 → [꾹] 팥 → 덮기 → 닫기 → 원판 돌리기 → 다음 틀
//   굽던 틀이 앞에 오면 → [누름] 꺼내기(노릇할 때!) → 식힘망 → 바로 다시 반죽
//  틀들은 원판 위에서 계속 익어가고(반쯤 익으면 자동으로 뒤집힘),
//  식힘망에 주문 개수만큼 모이면 자동으로 봉투에 담아 손님께 전달.
// =============================================================
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { crustColor, drawBatter } from './art2d.js';
import { noiseTexture, fishTextures, fishThickness, kraftTexture, steamTexture } from './textures.js';
import * as M from './models.js';
import * as P from './stall.js';

const GAME_TIME = 120;
const BEAN_TARGET = -80;                 // 팥을 여기(꼬리 바로 앞)까지 짜면 100점
const STEP = (Math.PI * 2) / P.SLOTS;    // 틀 하나 돌리는 각도 (45°)
const LID_OPEN = -1.9;                   // 뚜껑 열린 각도
const PRESS_STATES = ['pour', 'bean'];
const GOLDEN_SECONDS = 16;              // 노릇해질 때까지 걸리는 시간(초)

// =============================================================
//  1. 3D 기본 설정
// =============================================================
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('scene'), antialias: true });
renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0d1020);
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.22;

const camera = new THREE.PerspectiveCamera(36, 1, 10, 9000);
const LOOK = new THREE.Vector3(40, 0, -300);

// 밤이라 전체 조명은 어둡게, 포장마차 안은 따뜻하게
scene.add(new THREE.HemisphereLight(0x6a76a8, 0x2a1e14, 0.35));
const key = new THREE.DirectionalLight(0xffd9a8, 1.15);
key.position.set(-300, 1400, 500);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
Object.assign(key.shadow.camera, { left: -1100, right: 1100, top: 1100, bottom: -1100, near: 100, far: 3200 });
key.shadow.bias = -0.0004;
key.shadow.normalBias = 1.5;
scene.add(key);

function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h, false);
  const a = w / h;
  camera.aspect = a;
  camera.fov = a < 0.8 ? 66 : a < 1.2 ? 50 : a < 1.5 ? 41 : 36;
  camera.position.set(40, 1080, 980);
  camera.lookAt(LOOK);
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
resize();

// =============================================================
//  2. 물체 만들기
// =============================================================
const tex = {
  iron: noiseTexture(256, 1100, 1),
  bean: noiseTexture(256, 500, 3.5),
  fish: fishTextures(),
  kraft: kraftTexture(),
  steam: steamTexture(),
};
tex.iron.repeat.set(3, 3);
const iron = new THREE.MeshStandardMaterial({ color: 0x2c2a28, metalness: 0.55, roughness: 0.6, bumpMap: tex.iron, bumpScale: 1.2 });

const stall = P.makeStall();
scene.add(stall.group);
const thick = fishThickness();
const fishGeo = M.makeFishGeometry(thick, 160);      // 꺼내서 보이는 붕어빵 (식힘망)
const lidGeo = M.makeFishGeometry(thick, 56);        // 뚜껑 위 볼록한 모양은 대충이어도 OK (가볍게)
const fishMat = M.makeFishMaterial(tex.fish);
const wheel = P.makeWheel(iron, lidGeo);
scene.add(wheel.group);
scene.add(P.makeRack());

// 앞 틀에서 쓰는 것들 (앞에 오는 틀이 바뀔 때마다 그 틀로 옮겨 달아요)
const frontFish = new THREE.Mesh(fishGeo, fishMat.clone());
frontFish.castShadow = true;
const batterCanvas = document.createElement('canvas');
batterCanvas.width = 704;
batterCanvas.height = 448;
const bctx = batterCanvas.getContext('2d');
const batterTex = new THREE.CanvasTexture(batterCanvas);
batterTex.colorSpace = THREE.SRGBColorSpace;
const batter = M.makeBatter(batterTex);
const cover = M.makeBatter(batterTex);
cover.material = cover.material.clone();
const beanMat = M.makeBeanMaterial(tex.bean);
const beanGroup = new THREE.Group();
beanGroup.scale.y = 0.82;

const kettle = M.makeKettle();
kettle.scale.setScalar(0.75);
const stream = M.makeStream();
const piping = M.makePipingBag();
const serveBag = M.makeBag(tex.kraft);
serveBag.visible = false;
scene.add(kettle, stream, piping, serveBag);

const steamMat = new THREE.SpriteMaterial({ map: tex.steam, transparent: true, depthWrite: false, opacity: 0.4 });

// =============================================================
//  3. 게임 상태
// =============================================================
const SKINS = [[236, 200, 170], [222, 178, 140], [196, 146, 108], [150, 104, 72], [242, 210, 182]];
const COATS = [[58, 72, 110], [150, 46, 40], [44, 84, 66], [92, 82, 70], [70, 60, 96], [170, 120, 60], [40, 40, 44]];
const HAIRS = [0x1d1612, 0x3a2416, 0x0f0f12, 0x5a3a22];
const pick = (a) => a[Math.floor(Math.random() * a.length)];

const S = {
  phase: 'title', t: 0, timeLeft: GAME_TIME, total: 0, best: 0,
  served: 0, fishSold: 0, lost: 0, custNo: 0,
  fs: 'opening', fsT: 0,          // 앞 틀 상태
  front: 0, angle: 0,             // 앞에 있는 틀 번호, 원판 각도
  cur: null,                      // 지금 앞 틀에서 만드는 붕어빵
  slots: [], rack: [], queue: [], serve: null, spawnT: 0,
  held: false, warnT: 0, lastTick: 99, steam: [], flying: [], rotDur: 0.7,
};
window.S = S;
try { S.best = Number(localStorage.getItem('bungeoppang-best-wheel')) || 0; } catch (e) {}

const isPlaying = () => S.phase === 'play';
const clamp01 = (x) => Math.max(0, Math.min(1, x));
const ease = (x) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);
const lerp = (a, b, k) => a + (b - a) * k;
const frontSlot = () => wheel.slots[S.front];
const setFs = (s) => { S.fs = s; S.fsT = 0; };

// 새 붕어빵 데이터
function newFishData() {
  return {
    fill: 0, pouring: false, beanStart: 108, beanEnd: 108, squeezing: false, beanDone: false, spilled: false,
    beanSpeed: 150 * (1 + S.served * 0.03), scores: {},
  };
}

// =============================================================
//  4. 업데이트
// =============================================================
function update(dt) {
  if (!isPlaying()) return;
  S.timeLeft -= dt;
  const sec = Math.ceil(S.timeLeft);
  if (S.timeLeft <= 10 && sec !== S.lastTick) { S.lastTick = sec; Sound.tick(); }
  if (S.timeLeft <= 0) return endGame();

  updateFront(dt);
  updateSlots(dt);
  updateCustomers(dt);
  updateServe(dt);
}

// ---------- 앞 틀 ----------
function updateFront(dt) {
  S.fsT += dt;
  const c = S.cur;
  switch (S.fs) {
    case 'opening':
      if (S.fsT >= 0.35) startPour();
      break;
    case 'pour':
      if (c.pouring) {
        c.fill += dt * 0.42;
        if (c.fill >= 1) { c.fill = 1; finishPour(); }
      }
      break;
    case 'bean':
      if (c.squeezing) {
        c.beanEnd -= dt * c.beanSpeed;
        if (((c.beanEnd - 5) / 110) ** 2 > 1) c.spilled = true;
        if (c.beanEnd <= -140) finishBean();
      }
      if (c.beanDone && S.fsT > 0.5) { setFs('cover'); Sound.coverPour(); }
      break;
    case 'cover':
      if (S.fsT >= 0.8) setFs('closing');
      break;
    case 'closing':
      if (S.fsT >= 0.35) {
        // 틀 닫고 굽기 시작
        const sl = S.slots[S.front];
        sl.cooking = true;
        sl.d = 0;
        sl.flipped = false;
        sl.flipT = -1;
        sl.rate = (0.68 / GOLDEN_SECONDS) * (1 + S.served * 0.02) * (0.92 + Math.random() * 0.16);
        sl.target = 0.64 + Math.random() * 0.08; // 이만큼 익으면 자동으로 꺼냄
        sl.seed = Math.random() * 100;
        sl.scores = c.scores;
        S.cur = null;
        Sound.clank(0.6);
        startRotate();
      }
      break;
    case 'rotating':
      if (S.fsT >= S.rotDur) {
        S.front = (S.front + 1) % P.SLOTS;
        S.angle = -S.front * STEP;
        attachFront();
        nextFrontStep();
      }
      break;
    case 'waiting':
      // 틀 8개가 전부 굽는 중 → 하나 꺼내질 때까지 기다림
      nextFrontStep();
      break;
  }
}

// 앞 틀이 비었으면 반죽 시작, 굽는 중이면 다음 빈 틀로 휙 넘어가기
function nextFrontStep() {
  const free = S.slots.some((sl) => !sl.cooking && !sl.popT);
  const here = S.slots[S.front];
  if (!here.cooking && here.popT == null) { S.cur = newFishData(); setFs('opening'); }
  else if (free) startRotate(true);
  else if (S.fs !== 'waiting') setFs('waiting');
}

function startPour() {
  if (!S.cur) S.cur = newFishData();
  M.buildBean(beanGroup, beanMat, 0, 0);
  setFs('pour');
}

function startRotate(fast = false) {
  S.rotFrom = S.angle;
  S.rotDur = fast ? 0.35 : 0.7;
  setFs('rotating');
  Sound.whoosh();
}

// ---------- 원판 위 모든 틀이 익어가요 ----------
function updateSlots(dt) {
  let cooking = 0;
  for (const sl of S.slots) {
    if (!sl.cooking) continue;
    cooking++;
    const flame = 0.85 + 0.3 * (0.5 + 0.5 * Math.sin(S.t * 0.8 + sl.seed));
    sl.d += dt * sl.rate * flame;
    // 반쯤 익으면 자동으로 뒤집기 (철컥)
    if (!sl.flipped && sl.d >= 0.34) { sl.flipped = true; sl.flipT = 0; Sound.clank(0.18); }
    if (sl.flipT >= 0) { sl.flipT += dt; if (sl.flipT > 0.6) sl.flipT = -1; }
    if (Math.random() < dt * (1.2 + sl.d * 2.5)) spawnSteam(wheel.slots[sl.i], false);
    // 노릇해지면 자동으로 꺼내서 식힘망으로 (뒤집는 중이 아닐 때)
    if (sl.d >= sl.target && sl.flipT < 0) autoTake(sl);
  }
  // 꺼낸 틀: 뚜껑이 잠깐 열렸다 닫힘
  for (const sl of S.slots) {
    if (sl.popT == null) continue;
    sl.popT += dt;
    if (sl.popT > 0.9) sl.popT = null;
  }
  updateFlying(dt);
  const working = S.cur && (S.cur.pouring || S.cur.squeezing);
  Sound.setSizzle(Math.min(0.85, cooking * 0.09 + (working ? 0.1 : 0)));
}

// ---------- 자동 꺼내기: 틀 뚜껑 열고 → 붕어빵이 식힘망으로 날아감 ----------
function autoTake(sl) {
  sl.cooking = false;
  sl.popT = 0;
  const scores = sl.scores || {};
  scores.cook = 200; // 딱 노릇할 때 꺼냈으니 굽기 점수 만점 → 한 마리 최대 400점
  const total = Object.values(scores).reduce((a, b) => a + b, 0);
  const mesh = new THREE.Mesh(fishGeo, fishMat.clone());
  colorFish(mesh.material, sl.d);
  mesh.castShadow = true;
  const base = wheel.slots[sl.i].base;
  base.add(mesh);
  mesh.position.set(0, 2, 0);
  scene.attach(mesh);
  S.flying.push({
    mesh, d: sl.d, total, t: 0,
    p: mesh.position.clone(), q: mesh.quaternion.clone(), s: mesh.scale.x,
    spot: S.rack.length + S.flying.length,
  });
  sl.d = 0;
  Sound.lift();
}

function updateFlying(dt) {
  const qTo = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI / 2, 0));
  for (const f of S.flying) {
    f.t += dt;
    const p = ease(clamp01((f.t - 0.25) / 0.6));
    f.mesh.position.lerpVectors(f.p, P.rackSpot(f.spot), p);
    f.mesh.position.y += Math.sin(p * Math.PI) * 240 + (f.t < 0.25 ? f.t * 120 : 0);
    f.mesh.quaternion.slerpQuaternions(f.q, qTo, p);
    f.mesh.scale.setScalar(lerp(f.s, 0.42, p));
  }
  S.flying = S.flying.filter((f) => {
    if (f.t < 0.85) return true;
    S.rack.push({ d: f.d, total: f.total, mesh: f.mesh });
    layoutRack();
    return false;
  });
}

// 익힘 점수: 0.68 근처가 100점
function cookScore(d) {
  if (d > 1.0) return 0;
  return Math.max(0, Math.min(100, Math.round(100 - (Math.abs(d - 0.68) / 0.3) * 100)));
}

// ---------- 손님 ----------
const activeQueue = () => S.queue.filter((c) => !c.leaving);

function spawnCustomer() {
  const r = Math.random();
  const want = r < 0.45 ? 1 : r < 0.8 ? 2 : 3;
  S.custNo++;
  const fig = P.makeCustomer(pick(SKINS), pick(COATS), pick(HAIRS), Math.random() < 0.35);
  const x = P.queueX(activeQueue().length) + 900;
  fig.position.set(x, -110, P.QUEUE_Z);
  scene.add(fig);
  const el = document.createElement('div');
  el.className = 'cb';
  $('custBubbles').appendChild(el);
  const c = {
    n: S.custNo, want, orderIdx: Math.floor(Math.random() * 4),
    patience: 60 + want * 14, waited: 0, fig, x, el, leaving: false, leaveT: 0, happy: false,
  };
  S.queue.push(c);
  renderBubble(c);
}

function updateCustomers(dt) {
  S.spawnT -= dt;
  if (S.spawnT <= 0 && activeQueue().length < 4) {
    spawnCustomer();
    const elapsed = GAME_TIME - S.timeLeft;
    S.spawnT = Math.max(7, 14 - elapsed / 15) * (0.8 + Math.random() * 0.4);
  }
  let idx = 0;
  for (const c of S.queue) {
    if (c.leaving) {
      c.leaveT += dt;
      c.x += dt * (c.happy ? 900 : 1200);
      c.fig.position.y = -110 + Math.abs(Math.sin(c.leaveT * 9)) * 14;
    } else {
      const target = P.queueX(idx++);
      c.x = lerp(c.x, target, 1 - Math.pow(0.02, dt));
      c.fig.position.y = -110 + (Math.abs(c.x - target) > 5 ? Math.abs(Math.sin(S.t * 9)) * 12 : 0);
      if (!(S.serve && S.serve.cust === c)) {
        c.waited += dt;
        if (c.waited >= c.patience) leaveAngry(c);
      }
    }
    c.fig.position.x = c.x;
    renderBubble(c);
  }
  // 화면 밖으로 나간 손님 정리
  S.queue = S.queue.filter((c) => {
    if (c.leaving && c.leaveT > 1.8) { scene.remove(c.fig); c.el.remove(); return false; }
    return true;
  });
}

function leaveAngry(c) {
  c.leaving = true;
  S.lost++;
  S.total = Math.max(0, S.total - 100);
  popup(T('left'), c.fig.position.clone().setY(480), '#ff9a8a', true);
  Sound.grade(0);
}

// ---------- 자동 포장·전달 ----------
function updateServe(dt) {
  if (!S.serve) {
    const c = activeQueue()[0];
    if (c && S.rack.length >= c.want) {
      // 점수 높은 붕어빵부터 골라 담기
      S.rack.sort((a, b) => b.total - a.total);
      const picked = S.rack.splice(0, c.want);
      for (const f of picked) scene.remove(f.mesh);
      layoutRack();
      S.serve = { cust: c, fish: picked, t: 0, done: false };
      serveBag.visible = true;
      Sound.crinkle();
    }
    return;
  }
  const sv = S.serve;
  sv.t += dt;
  const from = new THREE.Vector3(P.RACK.x, P.COUNTER_Y, P.RACK.z + 280);
  if (sv.t < 0.3) {
    serveBag.position.copy(from);
    serveBag.scale.setScalar(0.75 * Math.max(0.01, ease(sv.t / 0.3)));
  } else if (sv.t < 1.3) {
    const p = ease((sv.t - 0.3) / 1.0);
    const to = new THREE.Vector3(sv.cust.x, 70, P.QUEUE_Z + 170);
    serveBag.position.lerpVectors(from, to, p);
    serveBag.position.y += Math.sin(p * Math.PI) * 260;
    serveBag.scale.setScalar(0.75);
  } else {
    if (!sv.done) {
      sv.done = true;
      const c = sv.cust;
      const fishSum = sv.fish.reduce((a, f) => a + f.total, 0);
      const bonus = Math.round(100 * c.want * clamp01(1 - c.waited / c.patience));
      S.total += fishSum + bonus;
      S.served++;
      S.fishSold += c.want;
      c.leaving = true;
      c.happy = true;
      showCard(c, fishSum, bonus);
      Sound.coin();
      for (let i = 0; i < 18; i++) sparkle(serveBag.position.clone().setY(300));
    }
    serveBag.position.set(sv.cust.x + 70, 150, P.QUEUE_Z + 120);
    if (sv.t > 2.0) { serveBag.visible = false; S.serve = null; }
  }
}

// =============================================================
//  5. 버튼으로 하는 일들
// =============================================================
function gradeOf(s) {
  if (s >= 90) return ['PERFECT!', '#ffe27a'];
  if (s >= 70) return ['GREAT', '#a6ec8f'];
  if (s >= 45) return ['GOOD', '#8fd2ff'];
  if (s > 0) return ['OK', '#f3dfc0'];
  return ['MISS', '#ff8a7a'];
}

function award(scores, key, s, worldPos) {
  s = Math.round(Math.max(0, Math.min(100, s)));
  scores[key] = s;
  const [t, c] = gradeOf(s);
  popup(t, worldPos, c);
  Sound.grade(s);
}

const frontWorld = (x, y, z) => frontSlot().base.localToWorld(new THREE.Vector3(x, y, z));

function finishPour() {
  const c = S.cur;
  c.pouring = false;
  Sound.stopPour();
  award(c.scores, 'pour', c.fill >= 0.95 ? 0 : 100 - (Math.abs(c.fill - 0.5) / 0.32) * 100, frontWorld(0, 260, 0));
  if (c.fill >= 0.95) popup(T('overflow'), frontWorld(0, 160, 0), '#fff', true);
  setFs('bean');
}

function finishBean() {
  const c = S.cur;
  c.squeezing = false;
  c.beanDone = true;
  Sound.stopSqueeze();
  let s = 100 - (Math.max(0, Math.abs(c.beanEnd - BEAN_TARGET) - 6) / 60) * 100;
  if (c.spilled) s = Math.min(s, 15);
  award(c.scores, 'bean', s, frontWorld(c.beanEnd, 260, 0));
  if (c.spilled) popup(T('spilled'), frontWorld(c.beanEnd, 160, 0), '#fff', true);
  else if (c.beanEnd > BEAN_TARGET + 45) popup(T('tooShort'), frontWorld(c.beanEnd, 160, 0), '#fff', true);
  S.fsT = 0;
}

// ---------- 식힘망 ----------
function addToRack(f) {
  const mesh = new THREE.Mesh(fishGeo, fishMat.clone());
  colorFish(mesh.material, f.d);
  mesh.scale.setScalar(0.42);
  mesh.rotation.y = Math.PI / 2;
  mesh.castShadow = true;
  scene.add(mesh);
  S.rack.push({ ...f, mesh });
  layoutRack();
}
function layoutRack() {
  S.rack.forEach((f, i) => f.mesh.position.copy(P.rackSpot(i)));
}

// =============================================================
//  6. 시작 / 끝
// =============================================================
function resetWorld() {
  for (const c of S.queue) { scene.remove(c.fig); c.el.remove(); }
  for (const f of S.rack) scene.remove(f.mesh);
  S.queue = []; S.rack = []; S.serve = null;
  serveBag.visible = false;
  for (const f of S.flying) scene.remove(f.mesh);
  S.flying = [];
  S.slots = wheel.slots.map((s) => ({ i: s.i, cooking: false, d: 0, flipped: false, flipT: -1, popT: null }));
}

function startGame() {
  resetWorld();
  S.phase = 'play';
  S.timeLeft = GAME_TIME;
  S.total = 0; S.served = 0; S.fishSold = 0; S.lost = 0; S.custNo = 0; S.lastTick = 99;
  S.front = 0; S.angle = 0; S.spawnT = 0;
  S.cur = newFishData();
  attachFront();
  setFs('opening');
  hideCard();
  $('title').classList.add('hidden');
  $('over').classList.add('hidden');
  $('hud').classList.remove('hidden');
  Sound.start();
}

function endGame() {
  if (S.total > S.best) {
    S.best = S.total;
    try { localStorage.setItem('bungeoppang-best-wheel', S.best); } catch (e) {}
  }
  if (S.cur) { S.cur.pouring = false; S.cur.squeezing = false; }
  Sound.stopPour();
  Sound.stopSqueeze();
  Sound.setSizzle(0);
  Sound.gameOver();
  S.phase = 'over';
  S.overAt = S.t;
  hideCard();
  $('hud').classList.add('hidden');
  for (const c of S.queue) c.el.remove();
  $('over').classList.remove('hidden');
  fillOver();
}

// =============================================================
//  7. 입력 (원버튼)
// =============================================================
function press() {
  if (S.held) return;
  S.held = true;
  Sound.init();
  if (S.phase === 'title') return startGame();
  if (S.phase === 'over') { if (S.t - S.overAt > 1.2) startGame(); return; }
  const c = S.cur;
  switch (S.fs) {
    case 'pour': c.pouring = true; Sound.startPour(); break;
    case 'bean': if (!c.beanDone && !c.squeezing) { c.squeezing = true; Sound.startSqueeze(); } break;
  }
}
function release() {
  S.held = false;
  const c = S.cur;
  if (!isPlaying() || !c) return;
  if (S.fs === 'pour' && c.pouring) finishPour();
  if (S.fs === 'bean' && c.squeezing) finishBean();
}

window.addEventListener('keydown', (e) => {
  if (e.code === 'Space') { e.preventDefault(); if (!e.repeat) press(); }
  else if (e.key === 'm' || e.key === 'M') Sound.toggleMute();
  else if (e.key === 'l' || e.key === 'L') setLang(LANG === 'ko' ? 'en' : 'ko');
});
window.addEventListener('keyup', (e) => { if (e.code === 'Space') { e.preventDefault(); release(); } });
window.addEventListener('pointerdown', (e) => { if (e.target.closest('#lang')) return; press(); });
window.addEventListener('pointerup', release);
window.addEventListener('pointercancel', release);
document.querySelectorAll('#lang button').forEach((b) => b.addEventListener('click', () => setLang(b.dataset.lang)));

// =============================================================
//  8. 매 프레임 3D 맞추기
// =============================================================
function colorFish(mat, d) {
  const c = crustColor(d);
  mat.color.setRGB(c[0] / 255, c[1] / 255, c[2] / 255, THREE.SRGBColorSpace);
  mat.roughness = d > 0.95 ? 0.85 : 0.58;
}

// 앞 틀의 base 그룹에 반죽/팥/붕어빵을 옮겨 달기
function attachFront() {
  const base = frontSlot().base;
  base.add(batter, cover, beanGroup, frontFish);
  frontFish.position.set(0, 2, 0);
  frontFish.rotation.set(0, 0, 0);
  frontFish.scale.setScalar(1);
}

function paintBatter(fill, landX) {
  bctx.setTransform(1, 0, 0, 1, 0, 0);
  bctx.clearRect(0, 0, 704, 448);
  bctx.setTransform(1.6, 0, 0, 1.6, 352, 224);
  drawBatter(bctx, fill, S.t, landX);
  batterTex.needsUpdate = true;
}
const batterY = (fill) => (fill > 0.72 ? 31 : lerp(4, 24, clamp01(fill / 0.6)));

function syncScene(dt) {
  const fs = S.fs, c = S.cur, playing = isPlaying();

  // 원판 회전 (시작 화면에선 천천히 빙글)
  if (S.phase === 'title') S.angle -= dt * 0.08;
  if (playing && fs === 'rotating') S.angle = lerp(S.rotFrom, -(S.front + 1) * STEP, ease(clamp01(S.fsT / S.rotDur)));
  wheel.rotor.rotation.y = S.angle;

  // 뚜껑, 뒤집기, 표시등
  wheel.slots.forEach((ws, i) => {
    const sl = S.slots[i];
    let open = 0;
    if (playing && i === S.front) {
      if (fs === 'opening') open = ease(clamp01(S.fsT / 0.35));
      else if (['pour', 'bean', 'cover'].includes(fs)) open = 1;
      else if (fs === 'closing') open = 1 - ease(clamp01(S.fsT / 0.35));
    }
    if (sl && sl.popT != null) {
      // 자동 꺼내기: 확 열렸다가 다시 닫힘
      const t = sl.popT;
      open = Math.max(open, t < 0.2 ? ease(t / 0.2) : t < 0.55 ? 1 : 1 - ease(clamp01((t - 0.55) / 0.3)));
    }
    ws.lid.rotation.x = LID_OPEN * open;
    if (sl && sl.flipT >= 0) {
      const p = ease(clamp01(sl.flipT / 0.6));
      ws.inner.rotation.x = Math.PI * 2 * p;
      ws.inner.position.y = Math.sin(Math.PI * p) * 70;
    } else {
      ws.inner.rotation.x = 0;
      ws.inner.position.y = 0;
    }
    P.setLamp(ws, sl && sl.cooking ? sl.d : null, S.t);
  });

  // 앞 틀 내용물
  const inMold = playing && c && ['pour', 'bean', 'cover'].includes(fs);
  batter.visible = !!(inMold && c.fill > 0);
  cover.visible = playing && fs === 'cover';
  beanGroup.visible = playing && (fs === 'bean' || fs === 'cover');
  if (batter.visible) {
    if (fs === 'cover') paintBatter(Math.max(0.55, c.fill), 10);
    else if (fs === 'pour' || S.t % 0.12 < dt) paintBatter(c.fill, 30);
    batter.position.y = batterY(c.fill);
  }
  if (playing && fs === 'bean') {
    if (c.squeezing || S.fsT < 0.05) M.buildBean(beanGroup, beanMat, c.beanStart, c.beanEnd);
    beanGroup.position.y = batterY(c.fill) + 12;
  }
  if (cover.visible) {
    cover.position.y = beanGroup.position.y + 16;
    cover.material.opacity = clamp01(S.fsT / 0.7);
  }

  frontFish.visible = false;

  // 놋쇠 주전자 + 반죽 줄기
  kettle.visible = !!(playing && c && (fs === 'pour' || fs === 'cover'));
  stream.visible = false;
  if (kettle.visible) {
    const land = frontWorld(30, batterY(c.fill), 0);
    const pouringNow = (fs === 'pour' && c.pouring) || (fs === 'cover' && S.fsT < 0.6);
    kettle.position.set(land.x, land.y + 110, land.z);
    kettle.rotation.z = lerp(kettle.rotation.z, pouringNow ? 0.48 : 0.1, 1 - Math.pow(0.001, dt));
    stream.visible = pouringNow;
    if (pouringNow) {
      const top = land.y + 107;
      stream.scale.set(0.8 + Math.sin(S.t * 40) * 0.06, top - land.y, 0.8);
      stream.position.set(land.x, (top + land.y) / 2, land.z);
    }
  }

  // 짤주머니
  piping.visible = !!(playing && c && fs === 'bean');
  if (piping.visible) {
    const lift = c.beanDone ? ease(clamp01(S.fsT / 0.4)) * 200 : 0;
    const p = frontWorld(c.beanEnd, batterY(c.fill) + 36, M.beanZ(c.beanEnd));
    piping.position.set(p.x, p.y + lift, p.z);
    piping.rotation.set(-0.45, 0, 0.35);
    piping.scale.setScalar(0.5);
    const squash = c.squeezing ? 1 - 0.08 * (0.5 + 0.5 * Math.sin(S.t * 18)) : 1;
    piping.userData.bag.scale.set(squash, 1, squash);
  }

  // 김
  for (const p of S.steam) {
    p.life -= dt * p.decay;
    p.sprite.position.y += p.vy * dt;
    p.sprite.position.x += p.vx * dt;
    p.sprite.scale.multiplyScalar(1 + dt * 0.8);
    p.sprite.material.opacity = Math.max(0, p.life) * (p.smoky ? 0.5 : 0.3);
  }
  S.steam = S.steam.filter((p) => {
    if (p.life > 0) return true;
    scene.remove(p.sprite);
    p.sprite.material.dispose();
    return false;
  });
}

function spawnSteam(ws, smoky) {
  if (S.steam.length > 70) return;
  const m = steamMat.clone();
  if (smoky) m.color.set(0x5a5450);
  const s = new THREE.Sprite(m);
  ws.pivot.getWorldPosition(s.position);
  s.position.x += (Math.random() - 0.5) * 80;
  s.position.y += 50;
  s.scale.setScalar(26 + Math.random() * 26);
  scene.add(s);
  S.steam.push({ sprite: s, vx: (Math.random() - 0.5) * 16, vy: 70 + Math.random() * 40, life: 1, decay: 0.55 + Math.random() * 0.3, smoky });
}

// =============================================================
//  9. UI (HTML)
// =============================================================
function $(id) { return document.getElementById(id); }
const toScreen = (v) => {
  const p = v.clone().project(camera);
  return { x: ((p.x + 1) / 2) * window.innerWidth, y: ((1 - p.y) / 2) * window.innerHeight };
};

function popup(text, worldPos, color, small = false) {
  const s = toScreen(worldPos);
  const el = document.createElement('div');
  el.className = small ? 'pop small' : 'pop';
  el.textContent = text;
  el.style.color = color;
  el.style.left = `${s.x}px`;
  el.style.top = `${s.y}px`;
  $('popups').appendChild(el);
  setTimeout(() => el.remove(), 1400);
}

function sparkle(pos) {
  const s = toScreen(pos);
  const el = document.createElement('div');
  el.className = 'pop small';
  el.textContent = '✦';
  el.style.color = '#ffd86b';
  el.style.left = `${s.x + (Math.random() - 0.5) * 140}px`;
  el.style.top = `${s.y + (Math.random() - 0.5) * 80}px`;
  el.style.animationDelay = `${Math.random() * 0.25}s`;
  $('popups').appendChild(el);
  setTimeout(() => el.remove(), 1700);
}

// 손님 머리 위 말풍선: 주문 + 기다림 막대
function renderBubble(c) {
  const head = toScreen(new THREE.Vector3(c.fig.position.x, c.fig.position.y + 330, c.fig.position.z));
  c.el.style.left = `${head.x}px`;
  c.el.style.top = `${head.y}px`;
  const left = clamp01(1 - c.waited / c.patience);
  c.el.classList.toggle('first', c === activeQueue()[0]);
  c.el.classList.toggle('gone', c.leaving);
  const key = `${LANG}|${c.leaving}|${c.happy}`;
  if (c.el.dataset.key !== key) {
    c.el.dataset.key = key;
    c.el.innerHTML = c.leaving
      ? `<span>${c.happy ? '😋' : '💢'}</span>`
      : `<small>${T('customer')(c.n)}</small><span>${T('orderN')(c.want, c.orderIdx)}</span><div class="bar"><i></i></div>`;
  }
  const bar = c.el.querySelector('.bar i');
  if (bar) {
    bar.style.width = `${left * 100}%`;
    bar.style.background = `hsl(${Math.round(left * 110)},70%,48%)`;
  }
}

function showCard(c, fishSum, bonus) {
  const avg = fishSum / c.want / 4;
  const cm = T('comments');
  const comment = avg >= 85 ? cm[0] : avg >= 65 ? cm[1] : avg >= 40 ? cm[2] : cm[3];
  const stars = avg >= 85 ? 3 : avg >= 60 ? 2 : avg >= 35 ? 1 : 0;
  S.card = { c, fishSum, bonus };
  $('cardWho').textContent = T('customer')(c.n);
  $('cardComment').textContent = `"${comment}"`;
  $('cardStars').innerHTML = [0, 1, 2].map((i) => `<span class="${i < stars ? 'on' : ''}">★</span>`).join('');
  $('cardPts').textContent = `${T('points')(fishSum)}${bonus ? `  ·  +${bonus} ⏱` : ''}`;
  $('card').classList.remove('hidden');
  clearTimeout(S.cardTimer);
  S.cardTimer = setTimeout(hideCard, 2200);
}
function hideCard() { $('card').classList.add('hidden'); S.card = null; }

function applyTexts() {
  document.querySelectorAll('#lang button').forEach((b) => b.classList.toggle('on', b.dataset.lang === LANG));
  $('tTitle').textContent = T('title');
  $('tSub').textContent = T('subtitle');
  $('tHow').innerHTML = T('howto').map((l) => `<li>${l}</li>`).join('');
  $('tStart').textContent = T('start');
  $('tFoot').textContent = T('footer')(S.best.toLocaleString());
  $('scoreLbl').textContent = T('score');
  P.updateSign(stall);
  for (const c of S.queue) { c.el.dataset.key = ''; renderBubble(c); }
  if (S.card) showCard(S.card.c, S.card.fishSum, S.card.bonus);
  if (S.phase === 'over') fillOver();
}
window.onLangChanged = applyTexts;

function fillOver() {
  const r = T('ranks');
  const rank = S.total >= 7000 ? r[3] : S.total >= 4500 ? r[2] : S.total >= 2000 ? r[1] : r[0];
  const isBest = S.total >= S.best && S.total > 0;
  $('oTitle').textContent = T('over');
  $('oRank').textContent = rank;
  $('oSold').textContent = T('soldLine')(S.served, S.fishSold, S.lost);
  $('oTotalLbl').textContent = T('total');
  $('oTotal').textContent = S.total.toLocaleString();
  $('oBest').textContent = isBest ? T('newBest') : T('bestLine')(S.best.toLocaleString());
  $('oAgain').textContent = T('again');
}

// 게이지: 반죽 양 / 앞 틀 익힘
const gctx = $('gaugeCanvas').getContext('2d');
function drawGauge(kind, v) {
  const x = 18, y = 8, w = 24, h = 284;
  gctx.clearRect(0, 0, 60, 300);
  const rr = () => { gctx.beginPath(); gctx.roundRect(x, y, w, h, 8); };
  if (kind === 'pour') {
    rr(); gctx.fillStyle = '#5a4634'; gctx.fill();
    const zone = (a, b, col) => { gctx.fillStyle = col; gctx.fillRect(x, y + h - b * h, w, (b - a) * h); };
    zone(0.34, 0.66, 'rgba(120,200,110,0.45)');
    zone(0.44, 0.56, 'rgba(110,220,95,0.95)');
    zone(0.95, 1, 'rgba(230,90,70,0.9)');
    gctx.fillStyle = 'rgba(248,232,190,0.95)';
    gctx.fillRect(x + 5, y + h - Math.min(1, v) * h, w - 10, Math.min(1, v) * h);
  } else {
    const g = gctx.createLinearGradient(0, y + h, 0, y);
    for (let i = 0; i <= 12; i++) { const c = crustColor((i / 12) * 1.2); g.addColorStop(i / 12, `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`); }
    rr(); gctx.fillStyle = g; gctx.fill();
    const toY = (d) => y + h - (d / 1.2) * h;
    gctx.strokeStyle = '#5fd84a'; gctx.lineWidth = 3;
    gctx.strokeRect(x - 3, toY(0.78), w + 6, toY(0.58) - toY(0.78));
    v /= 1.2;
  }
  const my = y + h - Math.min(1, v) * h;
  gctx.fillStyle = '#fff'; gctx.strokeStyle = '#3a2516'; gctx.lineWidth = 2;
  for (const [a, b] of [[x - 3, x - 15], [x + w + 3, x + w + 15]]) {
    gctx.beginPath(); gctx.moveTo(a, my); gctx.lineTo(b, my - 8); gctx.lineTo(b, my + 8); gctx.closePath(); gctx.fill(); gctx.stroke();
  }
}

function updateHUD() {
  if (!isPlaying()) return;
  $('score').textContent = S.total.toLocaleString();
  $('sold').textContent = T('sold')(S.served);
  $('rackPill').textContent = T('rack')(S.rack.length);
  $('time').textContent = Math.max(0, Math.ceil(S.timeLeft));
  $('time').parentElement.classList.toggle('low', S.timeLeft <= 10);
  const showGauge = S.fs === 'pour';
  $('gauge').classList.toggle('hidden', !showGauge);
  if (showGauge) {
    const kind = S.fs === 'pour' ? 'pour' : 'cook';
    $('gaugeLbl').textContent = kind === 'pour' ? T('gaugePour') : T('gaugeCook');
    drawGauge(kind, kind === 'pour' ? S.cur.fill : S.slots[S.front].d);
  }
  $('hintText').textContent = T('hints')[S.fs] || '';
  $('hint').classList.toggle('auto', !PRESS_STATES.includes(S.fs));
  updateFlag();
}

// 팥 목표 깃발: 앞 틀 위에 가로선 + 라벨
const flagEl = document.createElement('div');
flagEl.className = 'flag';
document.body.appendChild(flagEl);
function updateFlag() {
  const show = S.fs === 'bean' && S.cur && !S.cur.beanDone;
  flagEl.style.display = show ? 'block' : 'none';
  if (!show) return;
  const a = toScreen(frontWorld(BEAN_TARGET, 50, -80));
  const b = toScreen(frontWorld(BEAN_TARGET, 50, 80));
  const len = Math.hypot(b.x - a.x, b.y - a.y), ang = Math.atan2(b.y - a.y, b.x - a.x);
  const right = a.x > b.x ? a : b;
  flagEl.innerHTML = `<i style="left:${a.x}px;top:${a.y}px;width:${len}px;transform:rotate(${ang}rad)"></i>`
    + `<b style="left:${right.x + 10}px;top:${right.y}px">${T('flag')}</b>`;
}

// =============================================================
//  10. 시작!
// =============================================================
initLang();
resetWorld();
attachFront();
applyTexts();
// 시작 화면: 틀 몇 개는 굽는 중으로 보이게
[1, 3, 4, 6].forEach((i, k) => { S.slots[i].cooking = true; S.slots[i].d = 0.3 + k * 0.15; });

const clock = new THREE.Clock();
renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 0.05);
  S.t += dt;
  update(dt);
  if (S.phase === 'title') {
    for (const sl of S.slots) if (sl.cooking && Math.random() < dt * 1.5) spawnSteam(wheel.slots[sl.i], false);
  }
  Sound.update();
  syncScene(dt);
  updateHUD();
  renderer.render(scene, camera);
});
