// =============================================================
//  sketch.js — 게임의 흐름(상태 머신)과 입력 처리
//  버튼은 하나: SPACE / 마우스 클릭 / 화면 터치
//  M 키 = 소리 끄기/켜기,  L 키 = 언어 바꾸기 (시작 화면)
// =============================================================

const W = 960, H = 640;                    // 게임은 항상 960x640 크기로 그리고, 화면에 맞게 확대/축소
const MOLD = { x: 470, y: 360, s: 1.2 };   // 붕어빵 틀 위치와 크기
const LIFT = { x: 480, y: 250, s: 0.5 };   // 집게로 든 붕어빵 위치
const BAG_Y = 425;                          // 봉투 입구 높이
const SERVE_X = 680;                        // 손님께 건넬 때 봉투 위치
const BEAN_TARGET = -80;                    // 팥을 여기(꼬리 바로 앞)까지 짜면 100점 (로컬 x)
const GAUGE = { x: 790, y: 222, w: 26, h: 250 };
const LANG_BTN = { x: 806, y: 16, w: 140, h: 40 };
const GAME_TIME = 100;
const STEP_OF = {
  pour: 0, bean: 1, cover: 1, cookA: 2, flip: 2, cookB: 3,
  lift: 4, bagging: 4, handover: 4,
};

// ---------- 게임 상태 ----------
let phase = 'title';
let phaseT = 0;            // 현재 단계가 시작된 뒤 흐른 시간(초)
let tPlay = 0;             // 전체 흐른 시간
let timeLeft = GAME_TIME;
let totalScore = 0, sold = 0, fishNo = 0, bestScore = 0;
let fish, customer;
let particles = [], popups = [];
let held = false;          // 버튼이 눌려 있는지
let bag = { x: 480, y: BAG_Y };
let fall = null, served = false, warnT = 0, lastTick = 99;
let serveCard = null;
let bg, sc = 1, ox = 0, oy = 0;

function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(Math.min(2, displayDensity()));
  textFont('Do Hyeon');
  initLang();
  prepareArt();
  fitScreen();
  try { bestScore = Number(localStorage.getItem('bungeoppang-best-v2')) || 0; } catch (e) {}
  // 폰트가 다 받아지면 배경(가격표 글씨)을 다시 그려요
  if (document.fonts) {
    Promise.all([
      document.fonts.load('30px "Do Hyeon"'),
      document.fonts.load('30px "Nanum Pen Script"'),
    ]).then(buildBackground).catch(() => {});
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  fitScreen();
}

function fitScreen() {
  sc = Math.min(width / W, height / H);
  ox = (width - W * sc) / 2;
  oy = (height - H * sc) / 2;
  buildBackground();
}

function buildBackground() {
  bg = createGraphics(W, H);
  bg.pixelDensity(Math.min(3, displayDensity() * Math.max(1, sc)));
  renderBackground(bg);
}

// =============================================================
//  매 프레임
// =============================================================
function draw() {
  const dt = Math.min(deltaTime / 1000, 0.05);
  tPlay += dt;
  update(dt);
  Sound.update();

  background(8);
  push();
  translate(ox, oy);
  scale(sc);
  const ctx = drawingContext;
  image(bg, 0, 0, W, H);
  drawWorld(ctx);
  drawHUD(ctx);
  pop();
}

const isPlaying = () => phase !== 'title' && phase !== 'over';
const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
const clamp01 = (t) => Math.max(0, Math.min(1, t));

function setPhase(p) {
  phase = p;
  phaseT = 0;
}

// ---------- 상태 업데이트 ----------
function update(dt) {
  phaseT += dt;

  if (isPlaying()) {
    timeLeft -= dt;
    const sec = Math.ceil(timeLeft);
    if (timeLeft <= 10 && sec !== lastTick) { lastTick = sec; Sound.tick(); }
    if (timeLeft <= 0) { endGame(); return; }
    if (customer) customer.enterT += dt;
  }

  switch (phase) {
    case 'pour':
      if (fish.pouring) {
        fish.fill += dt * 0.42;
        if (fish.fill >= 1) { fish.fill = 1; finishPour(); }
      }
      break;

    case 'bean':
      updateBean(dt);
      break;

    case 'cover':
      if (phaseT >= 0.8) setPhase('cookA');
      break;

    case 'cookA':
    case 'cookB':
      updateCook(dt);
      break;

    case 'flip':
      Sound.setSizzle(0.7);
      if (phaseT >= 0.55) {
        fish.side = 'B';
        setPhase('cookB');
        Sound.clank(0.45);
      }
      break;

    case 'lift':
      if (phaseT >= 0.55) {
        fall = { y: LIFT.y, vy: 0, inBag: false };
        setPhase('bagging');
      }
      break;

    case 'bagging':
      updateBagging(dt);
      break;

    case 'handover':
      updateHandover();
      break;
  }

  for (const p of particles) p.update(dt);
  particles = particles.filter((p) => !p.dead);
  for (const p of popups) p.update(dt);
  popups = popups.filter((p) => !p.dead);
}

// ---------- 2) 팥 짜기: 누르고 있는 동안 머리 → 꼬리로 쭉 ----------
function nozzleX() {
  return MOLD.x + fish.beanEnd * MOLD.s; // 짤주머니 깍지의 화면 x 위치
}

function updateBean(dt) {
  if (fish.squeezing) {
    fish.beanEnd -= dt * fish.beanSpeed;
    // p5.collide2D: 깍지 끝이 아직 몸통(타원) 안인가? 벗어나면 꼬리로 넘친 것
    const inBody = collidePointEllipse(nozzleX(), MOLD.y, MOLD.x + 5 * MOLD.s, MOLD.y, 220 * MOLD.s, 120 * MOLD.s);
    if (!inBody) fish.spilled = true;
    if (fish.beanEnd <= -140) finishBean(); // 끝까지 가면 자동으로 멈춤
  }
  if (fish.beanDone && phaseT > 0.5) {
    setPhase('cover');
    Sound.coverPour();
  }
}

function finishBean() {
  fish.squeezing = false;
  fish.beanDone = true;
  Sound.stopSqueeze();
  const err = Math.abs(fish.beanEnd - BEAN_TARGET);
  let s = 100 - (Math.max(0, err - 6) / 60) * 100;
  if (fish.spilled) s = Math.min(s, 15);
  award('bean', constrain(s, 0, 100), nozzleX(), MOLD.y - 110);
  if (fish.spilled) popups.push(new Popup(T('spilled'), nozzleX(), MOLD.y - 70, color('#ffffff'), 22));
  else if (fish.beanEnd > BEAN_TARGET + 45) popups.push(new Popup(T('tooShort'), nozzleX(), MOLD.y - 70, color('#ffffff'), 22));
  phaseT = 0;
}

// ---------- 굽기 ----------
function updateCook(dt) {
  fish.cook(dt);
  const d = fish.done;
  Sound.setSizzle(0.3 + Math.min(1, d) * 0.5);
  if (random() < dt * (9 + d * 22)) {
    particles.push(new Steam(MOLD.x + random(-130, 130) * MOLD.s, MOLD.y + random(-40, 30), d > 0.95));
  }
  if (d > 0.86) {
    warnT -= dt;
    if (warnT <= 0) { Sound.warn(); warnT = 0.28; }
  }
  if (d >= 1.18) {
    // 너무 오래 두면 자동으로 넘어감 (점수 0)
    if (phase === 'cookA') flipFish(true);
    else takeOut(true);
  }
}

// 익힘 점수: 0.68 근처가 100점
function cookScore(d) {
  if (d > 1.0) return 0;
  return constrain(Math.round(100 - (Math.abs(d - 0.68) / 0.3) * 100), 0, 100);
}

// ---------- 5) 자동 포장 ----------
function updateBagging(dt) {
  if (!fall.inBag) {
    fall.vy += 2400 * dt;
    fall.y += fall.vy * dt;
    // p5.collide2D: 떨어지는 붕어빵(사각형)이 봉투 입구(사각형)에 닿았나?
    if (collideRectRect(LIFT.x - 60, fall.y - 20, 120, 40, bag.x - 70, BAG_Y - 8, 140, 26)) {
      fall.inBag = true;
      Sound.crinkle();
    }
  } else if (phaseT > 0.75) {
    served = false;
    setPhase('handover');
  }
}

// ---------- 5) 자동 전달 ----------
function handTip() {
  const t = phaseT;
  if (t < 1.1) return lerp(1010, 765, easeInOut(clamp01((t - 0.3) / 0.6)));
  return 765 + easeInOut(clamp01((t - 1.1) / 0.9)) * 440;
}

function updateHandover() {
  const tip = handTip();
  if (phaseT < 0.9) bag.x = lerp(LIFT.x, SERVE_X, easeInOut(clamp01(phaseT / 0.6)));
  else bag.x = tip - 85; // 손님이 봉투를 들고 감
  if (!served && phaseT >= 0.9) {
    served = true;
    sold++;
    const total = fish.total();
    totalScore += total;
    serveCard = { total, comment: commentFor(total) };
    for (let i = 0; i < 26; i++) particles.push(new Sparkle(tip + 10, 490));
    Sound.coin();
  }
  if (phaseT >= 2.8) nextCustomer();
}

// =============================================================
//  입력 (원버튼)
// =============================================================
function press(fromPointer) {
  if (held) return; // 키를 꾹 누를 때 반복 입력 방지
  held = true;
  Sound.init();

  // 시작 화면의 언어 버튼을 눌렀는지 확인
  if (phase === 'title' && fromPointer) {
    const mx = (mouseX - ox) / sc, my = (mouseY - oy) / sc;
    const b = LANG_BTN;
    if (mx > b.x && mx < b.x + b.w && my > b.y && my < b.y + b.h) {
      setLang(mx < b.x + b.w / 2 ? 'ko' : 'en');
      return;
    }
  }

  switch (phase) {
    case 'title': startGame(); break;
    case 'pour': fish.pouring = true; Sound.startPour(); break;
    case 'bean':
      if (!fish.beanDone && !fish.squeezing) { fish.squeezing = true; Sound.startSqueeze(); }
      break;
    case 'cookA': flipFish(false); break;
    case 'cookB': takeOut(false); break;
    case 'over': if (phaseT > 1.2) startGame(); break;
  }
}

function release() {
  held = false;
  if (phase === 'pour' && fish.pouring) finishPour();
  if (phase === 'bean' && fish.squeezing) finishBean();
}

function keyPressed() {
  if (key === ' ') { press(false); return false; }
  if (key === 'm' || key === 'M') Sound.toggleMute();
  if ((key === 'l' || key === 'L') && phase === 'title') setLang(LANG === 'ko' ? 'en' : 'ko');
}
function keyReleased() {
  if (key === ' ') { release(); return false; }
}
function mousePressed() { press(true); }
function mouseReleased() { release(); }
function touchStarted() { press(true); return false; }   // false = 브라우저 기본 동작(스크롤 등) 막기
function touchEnded() { release(); return false; }

// =============================================================
//  단계별 동작
// =============================================================
function startGame() {
  timeLeft = GAME_TIME;
  totalScore = 0; sold = 0; fishNo = 0; lastTick = 99;
  particles = []; popups = [];
  customer = new Customer(1);
  Sound.start();
  newFish();
}

function newFish() {
  fish = new Bungeoppang(fishNo);
  fall = null;
  serveCard = null;
  bag.x = LIFT.x;
  Sound.setSizzle(0);
  setPhase('pour');
}

function nextCustomer() {
  fishNo++;
  customer = new Customer(fishNo + 1);
  newFish();
}

function gradeOf(s) {
  if (s >= 90) return ['PERFECT!', '#ffe27a'];
  if (s >= 70) return ['GREAT', '#a6ec8f'];
  if (s >= 45) return ['GOOD', '#8fd2ff'];
  if (s > 0) return ['OK', '#e8d2b0'];
  return ['MISS', '#ff7a6b'];
}

function award(key, s, x, y) {
  s = Math.round(s);
  fish.scores[key] = s;
  const [t, c] = gradeOf(s);
  popups.push(new Popup(t, x, y, color(c)));
  Sound.grade(s);
}

// 1) 반죽 붓기
function finishPour() {
  fish.pouring = false;
  Sound.stopPour();
  const f = fish.fill;
  const s = f >= 0.95 ? 0 : 100 - (Math.abs(f - 0.5) / 0.32) * 100;
  award('pour', constrain(s, 0, 100), MOLD.x, MOLD.y - 150);
  if (f >= 0.95) popups.push(new Popup(T('overflow'), MOLD.x, MOLD.y - 100, color('#ffffff'), 24));
  setPhase('bean');
}

// 3) 뒤집기
function flipFish(auto) {
  award('flip', cookScore(fish.cookA), MOLD.x, MOLD.y - 150);
  if (auto) popups.push(new Popup(T('burnt'), MOLD.x, MOLD.y - 105, color('#ffffff'), 24));
  Sound.clank(1);
  setPhase('flip');
}

// 4) 꺼내기
function takeOut(auto) {
  award('take', cookScore(fish.cookB), MOLD.x, MOLD.y - 150);
  if (auto) popups.push(new Popup(T('burnt'), MOLD.x, MOLD.y - 105, color('#ffffff'), 24));
  Sound.setSizzle(0);
  Sound.lift();
  setPhase('lift');
}

function commentFor(total) {
  const avg = total / 4; // 단계 4개 (반죽, 팥, 뒤집기, 꺼내기)
  const c = T('comments');
  if (avg >= 85) return c[0];
  if (avg >= 65) return c[1];
  if (avg >= 40) return c[2];
  return c[3];
}

function endGame() {
  if (totalScore > bestScore) {
    bestScore = totalScore;
    try { localStorage.setItem('bungeoppang-best-v2', bestScore); } catch (e) {}
  }
  if (fish) { fish.pouring = false; fish.squeezing = false; }
  Sound.stopPour();
  Sound.stopSqueeze();
  Sound.setSizzle(0);
  Sound.gameOver();
  setPhase('over');
}

// =============================================================
//  그리기
// =============================================================
function drawWorld(ctx) {
  if (customer && isPlaying()) {
    const slide = (1 - easeInOut(Math.min(1, customer.enterT / 0.5))) * 140;
    drawCustomerSilhouette(ctx, slide, customer.coat);
  }

  // --- 틀 + 틀 안의 붕어빵 ---
  let squash = 1;
  if (phase === 'flip') squash = Math.max(0.04, Math.abs(Math.cos((phaseT / 0.55) * Math.PI)));
  const heat = fish && (phase === 'cookA' || phase === 'cookB') ? Math.min(1, fish.done) : 0.3;
  ctx.save();
  ctx.translate(MOLD.x, MOLD.y);
  ctx.scale(MOLD.s, MOLD.s * squash);
  drawMoldPlate(ctx, heat);
  if (fish && isPlaying()) drawFishInMold(ctx);
  if (phase === 'flip') {
    ctx.fillStyle = `rgba(0,0,0,${(1 - squash) * 0.6})`;
    ctx.fillRect(-200, -120, 400, 240);
  }
  ctx.restore();

  if (!isPlaying()) {
    if (phase === 'title') drawTitleFish(ctx);
    for (const p of particles) p.draw(ctx);
    return;
  }

  // --- 주전자 ---
  if (phase === 'pour' || phase === 'cover') {
    const pouring = (phase === 'pour' && fish.pouring) || (phase === 'cover' && phaseT < 0.6);
    const tipX = MOLD.x + 30 * MOLD.s, tipY = 205;
    drawKettle(ctx, tipX + 6, tipY - 8, pouring ? -0.42 : -0.12);
    if (pouring) drawStream(ctx, tipX, tipY, tipX, MOLD.y - 6, tPlay);
  }

  // --- 팥 짤주머니 + 목표 깃발 ---
  if (phase === 'bean') {
    drawBeanFlag();
    const lift = fish.beanDone ? easeInOut(clamp01(phaseT / 0.4)) * 160 : 0;
    const squeezeAmt = fish.squeezing ? 0.6 + Math.sin(tPlay * 18) * 0.4 : 0;
    drawPipingBag(ctx, nozzleX(), MOLD.y - 18 - lift, squeezeAmt);
  }

  // --- 집게로 들어 올리기 / 봉투에 떨어뜨리기 ---
  const bagVisible = ['lift', 'bagging', 'handover'].includes(phase);
  let bagTop = BAG_Y;
  if (phase === 'lift') bagTop = lerp(H + 40, BAG_Y, easeInOut(clamp01(phaseT / 0.5)));
  if (phase === 'lift') {
    const p = easeInOut(clamp01(phaseT / 0.55));
    const x = lerp(MOLD.x, LIFT.x, p), y = lerp(MOLD.y, LIFT.y, p), s = lerp(MOLD.s, LIFT.s, p);
    drawFishAt(ctx, x, y, s, 0);
    drawTongs(ctx, x, y);
  }

  for (const p of particles) if (p instanceof Steam) p.draw(ctx);

  if (bagVisible) {
    const inside = (phase === 'bagging' && fall && fall.inBag) || phase === 'handover';
    const bob = phase === 'bagging' && fall && fall.inBag ? Math.sin(phaseT * 30) * 3 * clamp01(1 - phaseT / 0.75) : 0;
    drawBag(ctx, bag.x, bagTop + bob, fish.cookB, inside);
  }
  if (phase === 'bagging' && fall && !fall.inBag) drawFishAt(ctx, LIFT.x, fall.y, LIFT.s, 0);

  // --- 손님 손 ---
  if (phase === 'handover') drawHand(ctx, handTip(), 510, customer.skin, customer.coat);

  for (const p of particles) if (p instanceof Sparkle) p.draw(ctx);
}

function drawFishInMold(ctx) {
  if (phase === 'pour') {
    drawBatter(ctx, fish.fill, tPlay);
  } else if (phase === 'bean') {
    drawBatter(ctx, fish.fill, tPlay);
    drawBeanRibbon(ctx, fish.beanStart, fish.beanEnd);
  } else if (phase === 'cover') {
    drawBatter(ctx, fish.fill, tPlay);
    drawBeanRibbon(ctx, fish.beanStart, fish.beanEnd);
    // 반죽을 한 겹 더 덮기
    ctx.save();
    ctx.globalAlpha = Math.min(1, phaseT / 0.7);
    drawBatter(ctx, Math.max(0.55, fish.fill), tPlay, 10);
    ctx.restore();
  } else if (phase === 'cookA' || phase === 'cookB') {
    drawCookedFish(ctx, fish.done);
  } else if (phase === 'flip') {
    // 반쯤 돌았을 때 새 면(아직 하얀 면)으로 바뀜
    drawCookedFish(ctx, phaseT < 0.275 ? fish.cookA : fish.cookB);
  }
}

function drawBeanFlag() {
  if (fish.beanDone) return;
  const x = MOLD.x + BEAN_TARGET * MOLD.s;
  push();
  stroke(255, 230, 150, 170);
  strokeWeight(2);
  drawingContext.setLineDash([6, 7]);
  line(x, MOLD.y - 62, x, MOLD.y + 62);
  drawingContext.setLineDash([]);
  // 깃발
  stroke(58, 37, 22);
  strokeWeight(2);
  line(x, MOLD.y - 62, x, MOLD.y - 104);
  fill('#ffd76a');
  triangle(x, MOLD.y - 104, x, MOLD.y - 84, x - 26, MOLD.y - 94);
  noStroke();
  fill(255, 244, 220);
  textAlign(CENTER, BOTTOM);
  textSize(16);
  text(T('flag'), x, MOLD.y - 108);
  pop();
}

function drawFishAt(ctx, x, y, s, rot) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.scale(s, s);
  ctx.shadowColor = 'rgba(0,0,0,0.45)';
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 10;
  drawCookedFish(ctx, fish.cookB);
  ctx.restore();
}

function drawTitleFish(ctx) {
  ctx.save();
  ctx.translate(MOLD.x, MOLD.y);
  ctx.scale(MOLD.s, MOLD.s);
  drawCookedFish(ctx, 0.68);
  ctx.restore();
  if (random() < 0.3) particles.push(new Steam(MOLD.x + random(-140, 140), MOLD.y + random(-30, 30), false));
}

// =============================================================
//  UI (HUD)
// =============================================================
const CREAM = '#fff4dc', INK = '#3a2516';

function pill(x, y, w, h, fillCol, strokeCol = INK, sw = 3) {
  push();
  fill(fillCol);
  stroke(strokeCol);
  strokeWeight(sw);
  rect(x, y, w, h, h / 2);
  pop();
}

function drawHUD(ctx) {
  for (const p of popups) p.draw();

  if (phase === 'title') return drawTitle();
  if (phase === 'over') return drawGameOver();

  // 점수
  pill(14, 12, 168, 46, CREAM);
  push();
  noStroke();
  fill(INK);
  textAlign(LEFT, CENTER);
  textSize(14);
  text(T('score'), 30, 35);
  textSize(26);
  text(totalScore.toLocaleString(), LANG === 'en' ? 90 : 76, 34);
  textSize(14);
  textAlign(RIGHT, CENTER);
  text(T('sold')(sold), 168, 35);
  pop();

  // 시간
  const low = timeLeft <= 10;
  pill(806, 12, 140, 46, low ? '#ffcf9a' : CREAM);
  push();
  noStroke();
  fill(low ? '#b8321e' : INK);
  textAlign(LEFT, CENTER);
  textSize(14);
  text('TIME', 824, 35);
  textAlign(RIGHT, CENTER);
  textSize(30);
  text(Math.max(0, Math.ceil(timeLeft)), 928, 33);
  pop();

  // 단계 칩
  const steps = T('steps');
  const cur = STEP_OF[phase];
  const cw = 112, gap = 8, total = steps.length * cw + (steps.length - 1) * gap;
  const x0 = (W - total) / 2;
  for (let i = 0; i < steps.length; i++) {
    const x = x0 + i * (cw + gap);
    const isCur = i === cur, isDone = i < cur;
    push();
    if (isCur) { fill('#ffd76a'); stroke(INK); strokeWeight(3); rect(x - 3, 13, cw + 6, 40, 20); }
    else if (isDone) { fill(255, 244, 220, 210); stroke(INK); strokeWeight(2); rect(x, 17, cw, 32, 16); }
    else { fill(0, 0, 0, 110); noStroke(); rect(x, 17, cw, 32, 16); }
    noStroke();
    fill(isCur || isDone ? INK : color(255, 255, 255, 150));
    textAlign(CENTER, CENTER);
    textSize(isCur ? 17 : 15);
    text((isDone ? '✓ ' : `${i + 1}. `) + steps[i], x + cw / 2, 32);
    pop();
  }

  // 손님 말풍선
  if (customer) {
    const a = Math.min(1, customer.enterT / 0.4) * 255;
    push();
    textSize(18);
    const bw = textWidth(customer.order) + 30;   // 글자 길이에 맞춰 말풍선 너비 조절
    const bx = 838 - bw;
    fill(255, 252, 244, a);
    stroke(58, 37, 22, a);
    strokeWeight(2.5);
    rect(bx, 80, bw, 58, 14);
    triangle(830, 96, 830, 116, 850, 100);
    noStroke();
    rect(826, 98, 6, 15);
    fill(150, 110, 80, a);
    textSize(13);
    textAlign(LEFT, CENTER);
    text(T('customer')(customer.n), bx + 14, 96);
    fill(58, 37, 22, a);
    textSize(18);
    text(customer.order, bx + 14, 119);
    pop();
  }

  // 게이지
  if (phase === 'pour') drawPourGauge();
  if (phase === 'cookA' || phase === 'cookB' || phase === 'flip') drawCookGauge();

  // 하단 안내
  const hint = T('hints')[phase];
  if (hint) {
    // 버튼을 눌러야 하는 단계에서만 SPACE 표시 (자동 단계는 글자만)
    const needsPress = ['pour', 'bean', 'cookA', 'cookB'].includes(phase);
    const pad = needsPress ? 102 : 24;
    push();
    textSize(19);
    const tw = textWidth(hint) + pad + 18;
    fill(20, 14, 10, 200);
    noStroke();
    rect(W / 2 - tw / 2, 582, tw, 42, 21);
    if (needsPress) {
      fill(CREAM);
      stroke(INK);
      strokeWeight(2);
      rect(W / 2 - tw / 2 + 8, 590, 82, 26, 7);
      noStroke();
      fill(INK);
      textSize(14);
      textAlign(CENTER, CENTER);
      text('SPACE', W / 2 - tw / 2 + 49, 603);
    }
    fill(255);
    textSize(19);
    textAlign(LEFT, CENTER);
    text(hint, W / 2 - tw / 2 + pad, 602);
    pop();
  }

  if (phase === 'handover' && serveCard) drawServeCard();
}

function gaugeFrame(label) {
  push();
  fill(20, 14, 10, 190);
  stroke(255, 255, 255, 40);
  strokeWeight(1);
  rect(GAUGE.x - 40, GAUGE.y - 40, GAUGE.w + 80, GAUGE.h + 60, 16);
  noStroke();
  fill(CREAM);
  textAlign(CENTER, CENTER);
  textSize(15);
  text(label, GAUGE.x + GAUGE.w / 2, GAUGE.y - 20);
  pop();
}

function gaugeMarker(v) {
  const y = GAUGE.y + GAUGE.h - constrain(v, 0, 1) * GAUGE.h;
  push();
  fill(255);
  stroke(INK);
  strokeWeight(2);
  triangle(GAUGE.x - 4, y, GAUGE.x - 18, y - 9, GAUGE.x - 18, y + 9);
  triangle(GAUGE.x + GAUGE.w + 4, y, GAUGE.x + GAUGE.w + 18, y - 9, GAUGE.x + GAUGE.w + 18, y + 9);
  pop();
}

function drawPourGauge() {
  gaugeFrame(T('gaugePour'));
  const { x, y, w, h } = GAUGE;
  push();
  noStroke();
  fill(50, 40, 32);
  rect(x, y, w, h, 8);
  const zone = (a, b, c) => { fill(c); rect(x, y + h - b * h, w, (b - a) * h); };
  zone(0.34, 0.66, color(120, 200, 110, 90));
  zone(0.44, 0.56, color(130, 235, 110, 200));
  zone(0.95, 1.0, color(230, 90, 70, 200));
  const f = constrain(fish.fill, 0, 1);
  fill(BATTER[0], BATTER[1], BATTER[2], 230);
  rect(x + 4, y + h - f * h, w - 8, f * h, 4);
  pop();
  gaugeMarker(fish.fill);
}

function drawCookGauge() {
  gaugeFrame(T('gaugeCook'));
  const { x, y, w, h } = GAUGE;
  const ctx = drawingContext;
  const g = ctx.createLinearGradient(0, y + h, 0, y);
  for (let i = 0; i <= 12; i++) g.addColorStop(i / 12, rgba(crustColor((i / 12) * 1.2)));
  ctx.fillStyle = g;
  roundRectPath(ctx, x, y, w, h, 8);
  ctx.fill();
  const toY = (d) => y + h - (d / 1.2) * h;
  push();
  noFill();
  stroke(140, 240, 120);
  strokeWeight(3);
  rect(x - 3, toY(0.78), w + 6, toY(0.58) - toY(0.78), 4);
  noStroke();
  fill(255, 255, 255, 200);
  textSize(12);
  textAlign(LEFT, CENTER);
  text(T('golden'), x + w + 22, toY(0.68));
  fill(255, 140, 120);
  text(T('burntLbl'), x + w + 22, toY(1.08));
  pop();
  const d = phase === 'flip' ? fish.cookA : fish.done;
  gaugeMarker(d / 1.2);
}

function drawServeCard() {
  const t = phaseT - 0.9;
  const a = clamp01(t / 0.25);
  const s = serveCard.total / 400;
  const stars = s >= 0.85 ? 3 : s >= 0.6 ? 2 : s >= 0.35 ? 1 : 0;
  push();
  translate(W / 2 - 40, 300);
  scale(0.85 + a * 0.15);
  fill(255, 248, 232, 240 * a);
  stroke(58, 37, 22, 255 * a);
  strokeWeight(3);
  rect(-180, -70, 360, 140, 18);
  noStroke();
  fill(58, 37, 22, 255 * a);
  textAlign(CENTER, CENTER);
  textSize(16);
  text(T('customer')(customer.n), 0, -48);
  textSize(25);
  text(`"${serveCard.comment}"`, 0, -16);
  textSize(30);
  for (let i = 0; i < 3; i++) {
    fill(i < stars ? color(242, 182, 48, 255 * a) : color(0, 0, 0, 40 * a));
    text('★', -40 + i * 40, 26);
  }
  fill(58, 37, 22, 255 * a);
  textSize(16);
  text(T('points')(serveCard.total), 0, 54);
  pop();
}

function drawLangButton() {
  const b = LANG_BTN;
  push();
  fill(20, 14, 10, 200);
  stroke(CREAM);
  strokeWeight(2);
  rect(b.x, b.y, b.w, b.h, b.h / 2);
  noStroke();
  fill('#ffd76a');
  const half = b.w / 2;
  rect(LANG === 'ko' ? b.x + 4 : b.x + half, b.y + 4, half - 4, b.h - 8, (b.h - 8) / 2);
  textAlign(CENTER, CENTER);
  textSize(16);
  fill(LANG === 'ko' ? INK : CREAM);
  text('한국어', b.x + half / 2 + 2, b.y + b.h / 2);
  fill(LANG === 'en' ? INK : CREAM);
  text('EN', b.x + half * 1.5 - 2, b.y + b.h / 2);
  pop();
}

function drawTitle() {
  push();
  fill(10, 6, 4, 150);
  noStroke();
  rect(0, 0, W, H);
  textAlign(CENTER, CENTER);
  stroke(INK);
  strokeWeight(10);
  fill('#ffd76a');
  textSize(LANG === 'ko' ? 84 : 62);
  text(T('title'), W / 2, 120);
  noStroke();
  fill(CREAM);
  textSize(21);
  text(T('subtitle'), W / 2, 186);

  const lines = T('howto');
  textSize(19);
  for (let i = 0; i < lines.length; i++) {
    const col = i % 2, row = Math.floor(i / 2);
    fill(255, 244, 220, 230);
    textAlign(LEFT, CENTER);
    text(lines[i], W / 2 - 240 + col * 270, 470 + row * 34);
  }
  const blink = 160 + Math.sin(tPlay * 4) * 95;
  fill(255, 215, 106, blink);
  textAlign(CENTER, CENTER);
  textSize(26);
  text(T('start'), W / 2, 590);
  fill(255, 255, 255, 120);
  textSize(14);
  text(T('footer')(bestScore.toLocaleString()), W / 2, 622);
  pop();
  drawLangButton();
}

function drawGameOver() {
  const a = Math.min(1, phaseT / 0.5);
  const r = T('ranks');
  let rank = r[0];
  if (totalScore >= 2200) rank = r[3];
  else if (totalScore >= 1500) rank = r[2];
  else if (totalScore >= 800) rank = r[1];
  const avg = sold ? Math.round(totalScore / sold) : 0;
  push();
  fill(10, 6, 4, 190 * a);
  noStroke();
  rect(0, 0, W, H);
  translate(W / 2, H / 2);
  scale(0.9 + a * 0.1);
  fill(255, 248, 232);
  stroke(INK);
  strokeWeight(4);
  rect(-240, -200, 480, 380, 24);
  noStroke();
  textAlign(CENTER, CENTER);
  fill('#b8321e');
  textSize(20);
  text(T('over'), 0, -165);
  fill(INK);
  textSize(42);
  text(rank, 0, -115);
  textSize(19);
  text(T('soldLine')(sold, avg), 0, -55);
  textSize(16);
  text(T('total'), 0, -10);
  textSize(64);
  text(totalScore.toLocaleString(), 0, 40);
  textSize(16);
  const isBest = totalScore >= bestScore && totalScore > 0;
  fill(isBest ? '#c9541e' : color(120, 90, 60));
  text(isBest ? T('newBest') : T('bestLine')(bestScore.toLocaleString()), 0, 92);
  if (phaseT > 1.2) {
    fill(58, 37, 22, 160 + Math.sin(tPlay * 4) * 90);
    textSize(20);
    text(T('again'), 0, 140);
  }
  pop();
}
