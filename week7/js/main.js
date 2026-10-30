// =============================================================
//  main.js — 3D 장면 설정 + 게임 흐름(상태 머신) + 입력 + UI
//  원버튼: SPACE / 클릭 / 터치.   M = 소리,  L = 언어
// =============================================================
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { crustColor, drawBatter } from './art2d.js';
import { woodTexture, noiseTexture, fishTextures, fishThickness, kraftTexture, steamTexture } from './textures.js';
import * as M from './models.js';

const GAME_TIME = 100;
const BEAN_TARGET = -80;                          // 팥을 여기(꼬리 바로 앞)까지 짜면 100점
const LIFT = new THREE.Vector3(0, 300, 270);      // 집게로 든 위치 (봉투 위)
const BAG_POS = new THREE.Vector3(0, -24, 270);   // 봉투 놓는 자리
const SERVE_X = 360;                              // 손님께 건넬 때 봉투 x
const STEP_OF = { pour: 0, bean: 1, cover: 1, cookA: 2, flip: 2, cookB: 3, lift: 4, bagging: 4, handover: 4 };
const PRESS_PHASES = ['pour', 'bean', 'cookA', 'cookB'];

// =============================================================
//  1. 3D 기본 설정: 렌더러, 장면, 카메라, 조명
// =============================================================
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('scene'), antialias: true });
renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;      // 부드러운 그림자
renderer.toneMapping = THREE.ACESFilmicToneMapping;    // 영화 같은 색 보정
renderer.toneMappingExposure = 1.05;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xe6d3b6);
// 주변 반사(금속이 반짝이게): 가상의 방을 환경맵으로
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.55;

const camera = new THREE.PerspectiveCamera(30, 1, 10, 6000);
const LOOK = new THREE.Vector3(-20, 0, 80);

scene.add(new THREE.HemisphereLight(0xfff8ee, 0x9b7d5c, 0.9));
const key = new THREE.DirectionalLight(0xfff0dc, 2.6);  // 왼쪽 위에서 오는 주 조명
key.position.set(-380, 820, 320);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
Object.assign(key.shadow.camera, { left: -700, right: 700, top: 700, bottom: -700, near: 100, far: 2200 });
key.shadow.bias = -0.0004;
key.shadow.normalBias = 1.5;
scene.add(key);
const heatLight = new THREE.PointLight(0xff6a1f, 0, 700, 0); // 불 켜지면 주황빛
heatLight.position.set(0, -2, 0);
scene.add(heatLight);

function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h, false);
  const a = w / h;
  camera.aspect = a;
  camera.fov = a < 0.8 ? 58 : a < 1.2 ? 44 : a < 1.5 ? 34 : 30;
  camera.position.set(-20, 830, 650);
  camera.lookAt(LOOK);
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
resize();

// =============================================================
//  2. 물체 만들기
// =============================================================
const tex = {
  wood: woodTexture(),
  iron: noiseTexture(256, 1100, 1),
  bean: noiseTexture(256, 500, 3.5),
  fish: fishTextures(),
  kraft: kraftTexture(),
  steam: steamTexture(),
};

scene.add(M.makeCounter(tex.wood));

// 틀과 틀 안의 것들은 moldPivot에 묶어서 같이 뒤집혀요
const moldPivot = new THREE.Group();
scene.add(moldPivot);
const mold = M.makeMold(tex.iron);
moldPivot.add(mold.group);

const fishObj = M.makeFish(tex.fish, fishThickness());
const fishMesh = fishObj.mesh;
const FISH_Y = 2;                  // 틀 홈 바닥 위에 올려놓기
moldPivot.add(fishMesh);
fishMesh.position.set(0, FISH_Y, 0);

// 반죽: 캔버스에 2D로 그린 것을 3D 판에 입힘
const batterCanvas = document.createElement('canvas');
batterCanvas.width = 704;
batterCanvas.height = 448;
const bctx = batterCanvas.getContext('2d');
const batterTex = new THREE.CanvasTexture(batterCanvas);
batterTex.colorSpace = THREE.SRGBColorSpace;
const batter = M.makeBatter(batterTex);
const cover = M.makeBatter(batterTex);
cover.material = cover.material.clone();
moldPivot.add(batter, cover);

const beanMat = M.makeBeanMaterial(tex.bean);
const beanGroup = new THREE.Group();
beanGroup.scale.y = 0.7; // 살짝 납작하게
moldPivot.add(beanGroup);

const kettle = M.makeKettle();
const stream = M.makeStream();
const piping = M.makePipingBag();
const tongs = M.makeTongs();
const bag = M.makeBag(tex.kraft);
scene.add(kettle, stream, piping, tongs, bag);
let hand = null;

const steamMat = new THREE.SpriteMaterial({ map: tex.steam, transparent: true, depthWrite: false, opacity: 0.5 });

// =============================================================
//  3. 게임 데이터 (클래스)
// =============================================================
class Bungeoppang {
  constructor(level) {
    this.fill = 0;            // 반죽 양 0~1 (0.5가 딱 좋음)
    this.pouring = false;
    this.beanStart = 108;     // 팥 시작(머리 쪽)
    this.beanEnd = 108;       // 팥 끝 — 누르는 동안 꼬리 쪽으로 이동
    this.squeezing = false;
    this.beanDone = false;
    this.spilled = false;
    this.beanSpeed = 150 * (1 + level * 0.05);
    this.cookA = 0;
    this.cookB = 0;
    this.side = 'A';
    this.scores = {};
    this.cookRate = (1 / 4.6) * (1 + level * 0.06) * (0.9 + Math.random() * 0.22);
    this.seed = Math.random() * 100;
  }
  get done() { return this.side === 'A' ? this.cookA : this.cookB; }
  cook(dt, t) {
    // 불 세기가 조금씩 출렁여서 매번 익는 속도가 달라요
    const flame = 0.82 + 0.36 * (0.5 + 0.5 * Math.sin(t * 0.9 + this.seed) * Math.sin(t * 0.37 + this.seed * 2));
    if (this.side === 'A') this.cookA += dt * this.cookRate * flame;
    else this.cookB += dt * this.cookRate * flame;
  }
  total() { return Object.values(this.scores).reduce((a, b) => a + b, 0); }
}

const SKINS = [[236, 200, 170], [222, 178, 140], [196, 146, 108], [150, 104, 72], [242, 210, 182]];
const COATS = [[58, 72, 110], [120, 46, 40], [44, 84, 66], [92, 82, 70], [70, 60, 96], [150, 110, 60]];
const pick = (a) => a[Math.floor(Math.random() * a.length)];

class Customer {
  constructor(n) {
    this.n = n;
    this.orderIdx = Math.floor(Math.random() * TEXT.ko.orders.length);
    this.skin = pick(SKINS);
    this.coat = pick(COATS);
  }
  get order() { return T('orders')[this.orderIdx]; }
}

// 게임 상태를 한 객체에 (테스트할 때 window.S로 볼 수 있음)
const S = {
  phase: 'title', phaseT: 0, t: 0, timeLeft: GAME_TIME,
  total: 0, sold: 0, fishNo: 0, best: 0,
  fish: null, customer: null, held: false,
  fallY: 0, landed: false, served: false, warnT: 0, lastTick: 99,
  steam: [], sparkles: [],
};
window.S = S;
try { S.best = Number(localStorage.getItem('bungeoppang-best-3d')) || 0; } catch (e) {}

const isPlaying = () => S.phase !== 'title' && S.phase !== 'over';
const clamp01 = (x) => Math.max(0, Math.min(1, x));
const ease = (x) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);
const lerp = (a, b, k) => a + (b - a) * k;

function setPhase(p) { S.phase = p; S.phaseT = 0; }

// =============================================================
//  4. 게임 흐름
// =============================================================
function update(dt) {
  S.phaseT += dt;
  if (isPlaying()) {
    S.timeLeft -= dt;
    const sec = Math.ceil(S.timeLeft);
    if (S.timeLeft <= 10 && sec !== S.lastTick) { S.lastTick = sec; Sound.tick(); }
    if (S.timeLeft <= 0) return endGame();
  }
  const f = S.fish;
  switch (S.phase) {
    case 'pour':
      if (f.pouring) {
        f.fill += dt * 0.42;
        if (f.fill >= 1) { f.fill = 1; finishPour(); }
      }
      break;
    case 'bean':
      if (f.squeezing) {
        f.beanEnd -= dt * f.beanSpeed;
        // 깍지 끝이 몸통(타원) 밖으로 나가면 꼬리로 넘친 것
        if (((f.beanEnd - 5) / 110) ** 2 > 1) f.spilled = true;
        if (f.beanEnd <= -140) finishBean();
      }
      if (f.beanDone && S.phaseT > 0.5) { setPhase('cover'); Sound.coverPour(); }
      break;
    case 'cover':
      if (S.phaseT >= 0.8) setPhase('cookA');
      break;
    case 'cookA':
    case 'cookB':
      updateCook(dt);
      break;
    case 'flip':
      Sound.setSizzle(0.7);
      if (S.phaseT >= 0.6) { f.side = 'B'; setPhase('cookB'); Sound.clank(0.45); }
      break;
    case 'lift':
      if (S.phaseT >= 0.6) { S.fallY = LIFT.y; S.fallV = 0; S.landed = false; setPhase('bagging'); }
      break;
    case 'bagging': {
      const rest = BAG_POS.y + bag.userData.top - 6;
      if (!S.landed) {
        S.fallV += 2400 * dt;
        S.fallY -= S.fallV * dt;
        if (S.fallY <= rest) { S.fallY = rest; S.landed = true; S.landT = S.phaseT; Sound.crinkle(); }
      } else if (S.phaseT - S.landT > 0.6) { S.served = false; setPhase('handover'); }
      break;
    }
    case 'handover':
      if (!S.served && S.phaseT >= 0.9) serve();
      if (S.phaseT >= 2.8) nextCustomer();
      break;
  }
  updateParticles(dt);
}

function updateCook(dt) {
  const f = S.fish;
  f.cook(dt, S.t);
  const d = f.done;
  Sound.setSizzle(0.3 + Math.min(1, d) * 0.5);
  if (Math.random() < dt * (9 + d * 20)) spawnSteam(d > 0.95);
  if (d > 0.86) {
    S.warnT -= dt;
    if (S.warnT <= 0) { Sound.warn(); S.warnT = 0.28; }
  }
  if (d >= 1.18) (S.phase === 'cookA' ? flipFish : takeOut)(true);
}

function cookScore(d) {
  if (d > 1.0) return 0;
  return Math.max(0, Math.min(100, Math.round(100 - (Math.abs(d - 0.68) / 0.3) * 100)));
}

function gradeOf(s) {
  if (s >= 90) return ['PERFECT!', '#ffe27a'];
  if (s >= 70) return ['GREAT', '#a6ec8f'];
  if (s >= 45) return ['GOOD', '#8fd2ff'];
  if (s > 0) return ['OK', '#f3dfc0'];
  return ['MISS', '#ff8a7a'];
}

function award(key, s, worldPos) {
  s = Math.round(Math.max(0, Math.min(100, s)));
  S.fish.scores[key] = s;
  const [t, c] = gradeOf(s);
  popup(t, worldPos, c);
  Sound.grade(s);
}

const ABOVE_MOLD = new THREE.Vector3(0, 120, -60);

// ---------- 각 단계 ----------
function finishPour() {
  const f = S.fish;
  f.pouring = false;
  Sound.stopPour();
  award('pour', f.fill >= 0.95 ? 0 : 100 - (Math.abs(f.fill - 0.5) / 0.32) * 100, ABOVE_MOLD);
  if (f.fill >= 0.95) popup(T('overflow'), new THREE.Vector3(0, 60, 20), '#fff', true);
  setPhase('bean');
}

function finishBean() {
  const f = S.fish;
  f.squeezing = false;
  f.beanDone = true;
  Sound.stopSqueeze();
  let s = 100 - (Math.max(0, Math.abs(f.beanEnd - BEAN_TARGET) - 6) / 60) * 100;
  if (f.spilled) s = Math.min(s, 15);
  const at = new THREE.Vector3(f.beanEnd, 120, -40);
  award('bean', s, at);
  if (f.spilled) popup(T('spilled'), at.clone().setY(60), '#fff', true);
  else if (f.beanEnd > BEAN_TARGET + 45) popup(T('tooShort'), at.clone().setY(60), '#fff', true);
  S.phaseT = 0;
}

function flipFish(auto) {
  award('flip', cookScore(S.fish.cookA), ABOVE_MOLD);
  if (auto === true) popup(T('burnt'), new THREE.Vector3(0, 60, 20), '#fff', true);
  Sound.clank(1);
  setPhase('flip');
}

function takeOut(auto) {
  award('take', cookScore(S.fish.cookB), ABOVE_MOLD);
  if (auto === true) popup(T('burnt'), new THREE.Vector3(0, 60, 20), '#fff', true);
  Sound.setSizzle(0);
  Sound.lift();
  scene.attach(fishMesh); // 틀에서 떼어내서 자유롭게 움직이게
  S.liftFrom = fishMesh.position.clone();
  setPhase('lift');
}

function serve() {
  S.served = true;
  S.sold++;
  const total = S.fish.total();
  S.total += total;
  showCard(total);
  for (let i = 0; i < 24; i++) spawnSparkle(new THREE.Vector3(SERVE_X + 90, 90, BAG_POS.z));
  Sound.coin();
}

function startGame() {
  S.timeLeft = GAME_TIME;
  S.total = 0; S.sold = 0; S.fishNo = 0; S.lastTick = 99;
  document.getElementById('title').classList.add('hidden');
  document.getElementById('over').classList.add('hidden');
  document.getElementById('hud').classList.remove('hidden');
  Sound.start();
  newCustomer(1);
  newFish();
}

function newCustomer(n) {
  S.customer = new Customer(n);
  if (hand) { scene.remove(hand); }
  hand = M.makeHand(S.customer.skin, S.customer.coat);
  hand.visible = false;
  scene.add(hand);
  const b = document.getElementById('bubble');
  b.classList.add('enter');
  requestAnimationFrame(() => requestAnimationFrame(() => b.classList.remove('enter')));
  applyTexts();
}

function newFish() {
  S.fish = new Bungeoppang(S.fishNo);
  moldPivot.add(fishMesh);
  fishMesh.position.set(0, FISH_Y, 0);
  fishMesh.rotation.set(0, 0, 0);
  fishMesh.scale.setScalar(1);
  M.buildBean(beanGroup, beanMat, 0, 0);
  hideCard();
  Sound.setSizzle(0);
  setPhase('pour');
}

function nextCustomer() {
  S.fishNo++;
  newCustomer(S.fishNo + 1);
  newFish();
}

function commentFor(total) {
  const avg = total / 4, c = T('comments');
  return avg >= 85 ? c[0] : avg >= 65 ? c[1] : avg >= 40 ? c[2] : c[3];
}

function endGame() {
  if (S.total > S.best) {
    S.best = S.total;
    try { localStorage.setItem('bungeoppang-best-3d', S.best); } catch (e) {}
  }
  if (S.fish) { S.fish.pouring = false; S.fish.squeezing = false; }
  Sound.stopPour();
  Sound.stopSqueeze();
  Sound.setSizzle(0);
  Sound.gameOver();
  setPhase('over');
  hideCard();
  document.getElementById('hud').classList.add('hidden');
  document.getElementById('over').classList.remove('hidden');
  fillOver();
}

// =============================================================
//  5. 입력 (원버튼)
// =============================================================
function press() {
  if (S.held) return;
  S.held = true;
  Sound.init();
  const f = S.fish;
  switch (S.phase) {
    case 'title': startGame(); break;
    case 'pour': f.pouring = true; Sound.startPour(); break;
    case 'bean': if (!f.beanDone && !f.squeezing) { f.squeezing = true; Sound.startSqueeze(); } break;
    case 'cookA': flipFish(false); break;
    case 'cookB': takeOut(false); break;
    case 'over': if (S.phaseT > 1.2) startGame(); break;
  }
}
function release() {
  S.held = false;
  const f = S.fish;
  if (S.phase === 'pour' && f.pouring) finishPour();
  if (S.phase === 'bean' && f.squeezing) finishBean();
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
//  6. 매 프레임 3D 물체 위치/모양 맞추기
// =============================================================
function setFishColor(d) {
  const c = crustColor(d);
  fishObj.mat.color.setRGB(c[0] / 255, c[1] / 255, c[2] / 255, THREE.SRGBColorSpace);
  fishObj.mat.roughness = d > 0.95 ? 0.85 : 0.58;
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
  const ph = S.phase, f = S.fish, playing = isPlaying();
  const inMold = ['pour', 'bean', 'cover'].includes(ph);
  const cooking = ['cookA', 'cookB', 'flip'].includes(ph);

  // 반죽 / 팥
  batter.visible = playing && inMold && f.fill > 0;
  cover.visible = ph === 'cover';
  beanGroup.visible = ph === 'bean' || ph === 'cover';
  if (batter.visible) {
    if (ph === 'cover') paintBatter(Math.max(0.55, f.fill), 10);
    else if (ph === 'pour' || S.t % 0.1 < dt) paintBatter(f.fill, 30);
    batter.position.y = batterY(f.fill);
  }
  if (ph === 'bean') {
    if (f.squeezing || S.phaseT < 0.05) M.buildBean(beanGroup, beanMat, f.beanStart, f.beanEnd);
    beanGroup.position.y = batterY(f.fill) + 8;
  }
  if (ph === 'cover') {
    cover.position.y = beanGroup.position.y + 9;
    cover.material.opacity = clamp01(S.phaseT / 0.7);
  }

  // 붕어빵
  fishMesh.visible = ph === 'title' || cooking || ['lift', 'bagging', 'handover'].includes(ph);
  if (ph === 'title') setFishColor(0.68);
  if (ph === 'cookA' || ph === 'cookB') setFishColor(f.done);

  // 뒤집기: 틀 전체를 한 바퀴 휙
  if (ph === 'flip') {
    const p = ease(clamp01(S.phaseT / 0.6));
    moldPivot.rotation.x = Math.PI * 2 * p;
    moldPivot.position.y = Math.sin(Math.PI * p) * 80;
    setFishColor(p < 0.5 ? f.cookA : f.cookB);
  } else {
    moldPivot.rotation.x = 0;
    moldPivot.position.y = 0;
  }
  heatLight.intensity = cooking ? 0.6 + Math.min(1, f.done) * 1.2 : 0;

  // 주전자 + 반죽 줄기
  kettle.visible = ph === 'pour' || ph === 'cover';
  const pouringNow = (ph === 'pour' && f.pouring) || (ph === 'cover' && S.phaseT < 0.6);
  kettle.position.set(36, 165, -6);
  kettle.rotation.z = lerp(kettle.rotation.z, pouringNow ? 0.48 : 0.1, 1 - Math.pow(0.001, dt));
  stream.visible = kettle.visible && pouringNow;
  if (stream.visible) {
    const top = 161, bottom = batterY(f.fill);
    stream.scale.set(1 + Math.sin(S.t * 40) * 0.08, top - bottom, 1);
    stream.position.set(36, (top + bottom) / 2, -6);
  }

  // 짤주머니
  piping.visible = ph === 'bean';
  if (piping.visible) {
    const lift = f.beanDone ? ease(clamp01(S.phaseT / 0.4)) * 200 : 0;
    const squash = f.squeezing ? 1 - 0.08 * (0.5 + 0.5 * Math.sin(S.t * 18)) : 1;
    piping.position.set(f.beanEnd, batterY(f.fill) + 24 + lift, M.beanZ(f.beanEnd));
    piping.rotation.set(0.35, 0, -0.5);
    piping.scale.setScalar(0.72);
    piping.userData.bag.scale.set(squash, 1, squash);
  }

  // 꺼내서 봉투에
  bag.visible = ['lift', 'bagging', 'handover'].includes(ph);
  tongs.visible = ph === 'lift';
  if (ph === 'lift') {
    const p = ease(clamp01(S.phaseT / 0.6));
    fishMesh.position.lerpVectors(S.liftFrom, LIFT, p);
    fishMesh.rotation.x = (Math.PI / 2) * p;
    fishMesh.scale.setScalar(lerp(1, 0.45, p));
    tongs.position.copy(fishMesh.position);
    bag.position.set(0, lerp(-400, BAG_POS.y, ease(clamp01(S.phaseT / 0.5))), BAG_POS.z);
  }
  if (ph === 'bagging') {
    bag.position.copy(BAG_POS);
    const bob = S.landed ? Math.sin((S.phaseT - S.landT) * 30) * 4 * clamp01(1 - (S.phaseT - S.landT) / 0.5) : 0;
    fishMesh.position.set(0, S.fallY + bob, BAG_POS.z);
  }

  // 손님에게 전달
  if (hand) hand.visible = ph === 'handover';
  if (ph === 'handover') {
    const t = S.phaseT;
    const tip = t < 1.1
      ? lerp(1100, SERVE_X + 82, ease(clamp01((t - 0.3) / 0.6)))
      : SERVE_X + 82 + ease(clamp01((t - 1.1) / 0.9)) * 700;
    const bx = t < 0.9 ? lerp(0, SERVE_X, ease(clamp01(t / 0.6))) : tip - 82;
    bag.position.set(bx, BAG_POS.y, BAG_POS.z);
    fishMesh.position.set(bx, BAG_POS.y + bag.userData.top + 18, BAG_POS.z);
    hand.position.set(tip, 70, BAG_POS.z);
  }

  // 파티클
  for (const p of S.steam) {
    p.sprite.position.x += p.vx * dt;
    p.sprite.position.y += p.vy * dt;
    p.sprite.scale.multiplyScalar(1 + dt * 0.9);
    p.sprite.material.opacity = Math.max(0, p.life) * (p.smoky ? 0.55 : 0.35);
  }
}

function spawnSteam(smoky) {
  const m = steamMat.clone();
  if (smoky) m.color.set(0x5a5450);
  const s = new THREE.Sprite(m);
  s.position.set((Math.random() - 0.5) * 260, 40, (Math.random() - 0.5) * 100);
  s.scale.setScalar(30 + Math.random() * 30);
  scene.add(s);
  S.steam.push({ sprite: s, vx: (Math.random() - 0.5) * 20, vy: 60 + Math.random() * 40, life: 1, decay: 0.5 + Math.random() * 0.3, smoky });
}

function spawnSparkle(pos) {
  const el = document.createElement('div');
  el.className = 'pop small';
  el.textContent = '✦';
  el.style.color = '#ffd86b';
  const v = pos.clone().project(camera);
  el.style.left = `${((v.x + 1) / 2) * window.innerWidth + (Math.random() - 0.5) * 120}px`;
  el.style.top = `${((1 - v.y) / 2) * window.innerHeight + (Math.random() - 0.5) * 80}px`;
  el.style.animationDelay = `${Math.random() * 0.25}s`;
  document.getElementById('popups').appendChild(el);
  setTimeout(() => el.remove(), 1600);
}

function updateParticles(dt) {
  for (const p of S.steam) p.life -= dt * p.decay;
  S.steam = S.steam.filter((p) => {
    if (p.life > 0) return true;
    scene.remove(p.sprite);
    p.sprite.material.dispose();
    return false;
  });
}

// =============================================================
//  7. UI (HTML)
// =============================================================
const $ = (id) => document.getElementById(id);

function popup(text, worldPos, color, small = false) {
  const v = worldPos.clone().project(camera);
  const el = document.createElement('div');
  el.className = small ? 'pop small' : 'pop';
  el.textContent = text;
  el.style.color = color;
  el.style.left = `${((v.x + 1) / 2) * window.innerWidth}px`;
  el.style.top = `${((1 - v.y) / 2) * window.innerHeight}px`;
  $('popups').appendChild(el);
  setTimeout(() => el.remove(), 1400);
}

function showCard(total) {
  const s = total / 400;
  const stars = s >= 0.85 ? 3 : s >= 0.6 ? 2 : s >= 0.35 ? 1 : 0;
  S.card = { total };
  $('cardWho').textContent = T('customer')(S.customer.n);
  $('cardComment').textContent = `"${commentFor(total)}"`;
  $('cardStars').innerHTML = [0, 1, 2].map((i) => `<span class="${i < stars ? 'on' : ''}">★</span>`).join('');
  $('cardPts').textContent = T('points')(total);
  $('card').classList.remove('hidden');
}
function hideCard() { $('card').classList.add('hidden'); S.card = null; }

// 언어가 바뀌면 화면 글자를 전부 다시 써요
function applyTexts() {
  document.querySelectorAll('#lang button').forEach((b) => b.classList.toggle('on', b.dataset.lang === LANG));
  $('tTitle').textContent = T('title');
  $('tSub').textContent = T('subtitle');
  $('tHow').innerHTML = T('howto').map((l) => `<li>${l}</li>`).join('');
  $('tStart').textContent = T('start');
  $('tFoot').textContent = T('footer')(S.best.toLocaleString());
  $('scoreLbl').textContent = T('score');
  $('steps').innerHTML = T('steps').map((s) => `<li>${s}</li>`).join('');
  S.lastStep = -1;
  if (S.customer) {
    $('cust').textContent = T('customer')(S.customer.n);
    $('order').textContent = S.customer.order;
  }
  if (S.card) showCard(S.card.total);
  if (S.phase === 'over') fillOver();
}
window.onLangChanged = applyTexts;

function fillOver() {
  const r = T('ranks');
  const rank = S.total >= 2200 ? r[3] : S.total >= 1500 ? r[2] : S.total >= 800 ? r[1] : r[0];
  const isBest = S.total >= S.best && S.total > 0;
  $('oTitle').textContent = T('over');
  $('oRank').textContent = rank;
  $('oSold').textContent = T('soldLine')(S.sold, S.sold ? Math.round(S.total / S.sold) : 0);
  $('oTotalLbl').textContent = T('total');
  $('oTotal').textContent = S.total.toLocaleString();
  $('oBest').textContent = isBest ? T('newBest') : T('bestLine')(S.best.toLocaleString());
  $('oAgain').textContent = T('again');
}

// 게이지 (작은 캔버스에 그리기)
const gctx = $('gaugeCanvas').getContext('2d');
function drawGauge(kind) {
  const W = 60, H = 300, x = 18, y = 8, w = 24, h = 284;
  gctx.clearRect(0, 0, W, H);
  const rr = (yy, hh) => { gctx.beginPath(); gctx.roundRect(x, yy, w, hh, 8); };
  let v;
  if (kind === 'pour') {
    rr(y, h); gctx.fillStyle = '#5a4634'; gctx.fill();
    const zone = (a, b, c) => { gctx.fillStyle = c; gctx.fillRect(x, y + h - b * h, w, (b - a) * h); };
    zone(0.34, 0.66, 'rgba(120,200,110,0.45)');
    zone(0.44, 0.56, 'rgba(110,220,95,0.95)');
    zone(0.95, 1, 'rgba(230,90,70,0.9)');
    v = Math.min(1, S.fish.fill);
    gctx.fillStyle = 'rgba(248,232,190,0.95)';
    gctx.fillRect(x + 5, y + h - v * h, w - 10, v * h);
  } else {
    const g = gctx.createLinearGradient(0, y + h, 0, y);
    for (let i = 0; i <= 12; i++) { const c = crustColor((i / 12) * 1.2); g.addColorStop(i / 12, `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`); }
    rr(y, h); gctx.fillStyle = g; gctx.fill();
    const toY = (d) => y + h - (d / 1.2) * h;
    gctx.strokeStyle = '#5fd84a'; gctx.lineWidth = 3;
    gctx.strokeRect(x - 3, toY(0.78), w + 6, toY(0.58) - toY(0.78));
    v = (S.phase === 'flip' ? S.fish.cookA : S.fish.done) / 1.2;
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
  $('sold').textContent = T('sold')(S.sold);
  const sec = Math.max(0, Math.ceil(S.timeLeft));
  $('time').textContent = sec;
  $('time').parentElement.classList.toggle('low', S.timeLeft <= 10);
  const step = STEP_OF[S.phase];
  if (step !== S.lastStep) {
    S.lastStep = step;
    [...$('steps').children].forEach((li, i) => { li.className = i < step ? 'done' : i === step ? 'cur' : ''; });
  }
  const showGauge = S.phase === 'pour' || ['cookA', 'cookB', 'flip'].includes(S.phase);
  $('gauge').classList.toggle('hidden', !showGauge);
  if (showGauge) {
    const kind = S.phase === 'pour' ? 'pour' : 'cook';
    $('gaugeLbl').textContent = kind === 'pour' ? T('gaugePour') : T('gaugeCook');
    drawGauge(kind);
  }
  $('hintText').textContent = T('hints')[S.phase] || '';
  $('hint').classList.toggle('auto', !PRESS_PHASES.includes(S.phase));
  // 팥 목표 깃발은 3D 위치를 화면 좌표로 바꿔서 표시
  updateFlag();
}

let flagEl = null;
function updateFlag() {
  const show = S.phase === 'bean' && !S.fish.beanDone;
  if (!flagEl) {
    flagEl = document.createElement('div');
    flagEl.className = 'flag';
    flagEl.style.cssText = 'position:fixed;transform:translate(-50%,-100%);pointer-events:none;text-align:center;font-size:16px;color:#3a2516;';
    document.body.appendChild(flagEl);
  }
  flagEl.style.display = show ? 'block' : 'none';
  if (!show) return;
  // 깃발 줄: 붕어빵 위쪽(top)에서 아래쪽(bot)까지, 라벨은 줄 위에
  const top = new THREE.Vector3(BEAN_TARGET, 30, -60).project(camera);
  const bot = new THREE.Vector3(BEAN_TARGET, 30, 50).project(camera);
  const py = ((1 - top.y) / 2) * window.innerHeight;
  const bx = ((bot.x + 1) / 2) * window.innerWidth, by = ((1 - bot.y) / 2) * window.innerHeight;
  flagEl.style.left = `${bx}px`;
  flagEl.style.top = `${by}px`;
  flagEl.innerHTML = `<div style="background:#ffd76a;border-radius:10px;padding:4px 10px;box-shadow:0 4px 10px rgba(0,0,0,.15)">${T('flag')}</div>`
    + `<div style="margin:0 auto;width:0;height:${Math.max(20, by - py)}px;border-left:3px dashed rgba(255,248,236,.95)"></div>`;
}

// =============================================================
//  8. 시작!
// =============================================================
initLang();
applyTexts();
const clock = new THREE.Clock();
renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 0.05);
  S.t += dt;
  update(dt);
  Sound.update();
  syncScene(dt);
  updateHUD();
  if (S.phase === 'title' && Math.random() < 0.15) spawnSteam(false);
  renderer.render(scene, camera);
});
