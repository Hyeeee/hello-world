// =============================================================
//  classes.js — 게임에 등장하는 "물건"들을 class로 정의
//  new Bungeoppang() 하면 붕어빵 한 마리, new Customer() 하면 손님 한 명.
// =============================================================

// ---------- 붕어빵 한 마리 ----------
class Bungeoppang {
  constructor(level) {
    this.fill = 0;          // 반죽 양 0~1 (0.5가 딱 좋음)
    this.pouring = false;
    // 팥: 머리(beanStart)에서 시작해서 꼬리 쪽으로 beanEnd가 줄어들어요 (로컬 x좌표)
    this.beanStart = 108;
    this.beanEnd = 108;
    this.squeezing = false;
    this.beanDone = false;
    this.spilled = false;
    this.beanSpeed = 150 * (1 + level * 0.05); // 1초에 얼마나 길게 짜지는지
    this.cookA = 0;         // 첫 번째 면 익힘
    this.cookB = 0;         // 뒤집은 면 익힘
    this.side = 'A';
    this.scores = {};       // 단계별 점수 {pour: 92, bean: 80, ...}
    // 손님이 늘수록 빨리 익고, 매번 살짝 다르게 (외워서 못 하게)
    this.cookRate = (1 / 4.6) * (1 + level * 0.06) * random(0.9, 1.12);
    this.seed = random(1000);
  }

  // getter: fish.done 처럼 변수처럼 읽을 수 있어요
  get done() {
    return this.side === 'A' ? this.cookA : this.cookB;
  }

  cook(dt) {
    // noise()로 불 세기가 조금씩 출렁이게
    const flame = 0.8 + 0.4 * noise(this.seed + tPlay * 0.6);
    if (this.side === 'A') this.cookA += dt * this.cookRate * flame;
    else this.cookB += dt * this.cookRate * flame;
  }

  total() {
    let sum = 0;
    for (const k in this.scores) sum += this.scores[k];
    return Math.round(sum);
  }
}

// ---------- 손님 ----------
const SKINS = [[236, 200, 170], [222, 178, 140], [196, 146, 108], [150, 104, 72], [242, 210, 182]];
const COATS = [[58, 72, 110], [120, 46, 40], [44, 84, 66], [92, 82, 70], [70, 60, 96], [150, 110, 60]];

class Customer {
  constructor(n) {
    this.n = n;
    this.orderIdx = Math.floor(random(TEXT.ko.orders.length)); // 번호로 저장 → 언어가 바뀌어도 OK
    this.skin = random(SKINS);
    this.coat = random(COATS);
    this.enterT = 0;                     // 등장 애니메이션 시간
  }

  get order() {
    return T('orders')[this.orderIdx];
  }
}

// ---------- 김(스팀) / 연기 ----------
class Steam {
  constructor(x, y, smoky) {
    this.x = x;
    this.y = y;
    this.vx = random(-8, 8);
    this.vy = random(-55, -35);
    this.r = random(10, 20);
    this.life = 1;
    this.decay = random(0.5, 0.8);
    this.smoky = smoky;
  }
  update(dt) {
    this.x += this.vx * dt + Math.sin(this.y * 0.04) * 0.3;
    this.y += this.vy * dt;
    this.r += dt * 22;
    this.life -= dt * this.decay;
  }
  draw(ctx) {
    const a = Math.max(0, this.life) * (this.smoky ? 0.32 : 0.16);
    const c = this.smoky ? '60,55,52' : '255,250,240';
    const g = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.r);
    g.addColorStop(0, `rgba(${c},${a})`);
    g.addColorStop(1, `rgba(${c},0)`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, TAU);
    ctx.fill();
  }
  get dead() { return this.life <= 0; }
}

// ---------- 반짝이 (동전 받을 때) ----------
class Sparkle {
  constructor(x, y) {
    this.x = x; this.y = y;
    const a = random(TAU), sp = random(80, 260);
    this.vx = Math.cos(a) * sp;
    this.vy = Math.sin(a) * sp - 120;
    this.life = 1;
    this.size = random(4, 9);
  }
  update(dt) {
    this.vy += 500 * dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.life -= dt * 1.3;
  }
  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.life);
    ctx.fillStyle = '#ffd86b';
    ctx.translate(this.x, this.y);
    ctx.rotate(this.life * 6);
    ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
    ctx.restore();
  }
  get dead() { return this.life <= 0; }
}

// ---------- 점수 팝업 (PERFECT! 등) ----------
class Popup {
  constructor(text, x, y, col, size = 34) {
    this.text = text;
    this.x = x;
    this.y = y;
    this.col = col;
    this.size = size;
    this.t = 0;
  }
  update(dt) { this.t += dt; this.y -= dt * 40; }
  draw() {
    const bounce = this.t < 0.15 ? 0.6 + (this.t / 0.15) * 0.5 : 1.1 - Math.min(0.1, (this.t - 0.15));
    const a = this.t < 0.9 ? 255 : 255 * Math.max(0, 1 - (this.t - 0.9) / 0.4);
    push();
    translate(this.x, this.y);
    scale(bounce);
    textAlign(CENTER, CENTER);
    textSize(this.size);
    stroke(40, 22, 10, a);
    strokeWeight(6);
    fill(red(this.col), green(this.col), blue(this.col), a);
    text(this.text, 0, 0);
    pop();
  }
  get dead() { return this.t > 1.3; }
}
