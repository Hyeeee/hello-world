// ORBITAL CLEANER 3D — a space guardian vs. the Void Maw
// WEBGL edition. 10 stages. Clean 100 debris to restore Earth's orbit.

const CLEAN_GOAL = 100;
const STAGE_NAMES = ["EARTH ORBIT", "LUNAR PASS", "MARS APPROACH",
  "ASTEROID BELT", "JUPITER", "SATURN",
  "DEEP FIELD", "NEBULA", "BLACK HOLE", "GALACTIC CORE"];

// Which stage are we in? One stage per 10 debris eaten.
function stageIndex() {
  return min(floor(creature.eaten / 10), 9);
}

// Game coords (0..width, 0..height) -> WEBGL world coords (centered origin)
function WX(x) { return x - width / 2; }
function WY(y) { return y - height / 2; }

// Lit 3D color. NOTE: in WEBGL mode, fill() carries the base color;
// specularMaterial() only tints the shiny highlight.
function litMat(r, g, b, shine) {
  fill(r, g, b);
  specularMaterial(170, 170, 170); // soft white highlight
  shininess(shine === undefined ? 25 : shine);
  emissiveMaterial(0, 0, 0);
}

// Pure glow color, unaffected by lights.
function glowMat(r, g, b) {
  fill(0, 0, 0);             // no diffuse response
  specularMaterial(0, 0, 0); // no highlight
  emissiveMaterial(r, g, b); // full-strength glow
}

// Tiny background stars twinkling at different depths
class Star {
  constructor() {
    this.x = random(width);
    this.y = random(height);
    this.z = random(-550, -30); // real depth
    this.tw = random(TWO_PI);  // twinkle phase
  }
  show() {
    let b = 150 + 105 * sin(frameCount * 0.05 + this.tw);
    stroke(b);
    strokeWeight(2);
    point(WX(this.x), WY(this.y), this.z);
    noStroke();
  }
}

// Space junk tumbling in 3D: satellite, rocket, shard, bolt
class Debris {
  constructor(x, y) {
    // Use the given x/y, or a random spot if none given
    this.x = (x === undefined) ? random(width) : x;
    this.y = (y === undefined) ? random(height) : y;
    this.vx = random(-0.4, 0.4); // slow drift
    this.vy = random(-0.4, 0.4);
    this.s = random(11, 19);
    this.rx = random(TWO_PI);    // tumble angles
    this.ry = random(TWO_PI);
    this.sx = random(-0.02, 0.02);
    this.sy = random(-0.02, 0.02);
    this.kind = floor(random(4)); // 0 satellite, 1 rocket, 2 shard, 3 bolt
    this.blink = random(TWO_PI);  // beacon phase
  }
  drift() {
    this.x += this.vx;
    this.y += this.vy;
    this.rx += this.sx;
    this.ry += this.sy;
    // Wrap around screen edges so junk never leaves
    if (this.x < -25) this.x = width + 25;
    if (this.x > width + 25) this.x = -25;
    if (this.y < -25) this.y = height + 25;
    if (this.y > height + 25) this.y = -25;
  }
  show() {
    push();
    translate(WX(this.x), WY(this.y), 0);
    rotateX(this.rx);
    rotateY(this.ry);
    noStroke();
    if (this.kind === 0) this.satellite();
    else if (this.kind === 1) this.rocket();
    else if (this.kind === 2) this.shard();
    else this.bolt();
    pop();
  }
  // Dead satellite with solar panels and a blinking beacon
  satellite() {
    let s = this.s;
    litMat(70, 100, 190, 30);
    push(); translate(-s * 0.95, 0, 0); box(s * 0.75, s * 0.38, s * 0.1); pop();
    push(); translate(s * 0.95, 0, 0); box(s * 0.75, s * 0.38, s * 0.1); pop();
    litMat(175, 170, 160, 20);
    box(s * 0.7, s * 0.5, s * 0.45); // body
    if (sin(frameCount * 0.1 + this.blink) > 0) {
      glowMat(255, 70, 70); // blinking beacon
      push(); translate(0, -s * 0.38, s * 0.25); sphere(2.5); pop();
    }
  }
  // Spent rocket stage
  rocket() {
    let s = this.s;
    litMat(185, 180, 170, 20);
    cylinder(s * 0.25, s * 1.3); // hull
    litMat(205, 70, 55, 20);
    push(); translate(0, -s * 0.35, 0); cylinder(s * 0.27, s * 0.22); pop(); // stripe
    litMat(150, 145, 135, 20);
    push(); translate(0, -s * 0.85, 0); cone(s * 0.25, s * 0.4); pop();       // nose
  }
  // Broken crystal shard
  shard() {
    let s = this.s;
    litMat(155, 150, 140, 10);
    cone(s * 0.5, s * 1.1, 5);
  }
  // Lost bolt
  bolt() {
    let s = this.s;
    litMat(165, 160, 150, 40);
    cylinder(s * 0.14, s * 0.9); // shaft
    push(); translate(0, -s * 0.55, 0); sphere(s * 0.25); pop(); // head
  }
}

// The young Orbital Guardian: eats debris, evolves, fights the Maw
class Creature {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = 30;
    this.maxSize = 85;   // growth is capped, shape carries the evolution
    this.energy = 60;    // drains slowly, eating refills it
    this.eaten = 0;
    this.nearest = 9999; // distance to closest debris
    this.stage = 0;      // 0 whelp, 1 guardian, 2 elder guardian
    this.stageNames = ["Whelp", "Guardian", "Elder Guardian"];
    this.cBaby = color(120, 200, 255);
    this.cAdult = color(110, 230, 180);
    this.cElder = color(255, 200, 110);
  }
  drift() {
    this.x += random(-0.5, 0.5);
    this.y += random(-0.5, 0.5);
  }
  // Glide toward the mouse light. Tired creatures move slower.
  attract() {
    let f = 0.015 + 0.03 * (this.energy / 100);
    this.x += (mouseX - this.x) * f;
    this.y += (mouseY - this.y) * f;
  }
  // Slowly get hungry over time
  live() {
    this.energy = max(0, this.energy - 0.03);
  }
  // Eat any debris touching the body, track the nearest one
  eat(debrisList) {
    this.nearest = 9999;
    for (let i = debrisList.length - 1; i >= 0; i--) {
      let d = debrisList[i];
      let dd = dist(this.x, this.y, d.x, d.y);
      if (dd < this.nearest) this.nearest = dd;
      if (dd < this.size / 2 + d.s / 2) {
        debrisList.splice(i, 1); // remove eaten junk
        this.eaten++;
        this.energy = min(this.energy + 12, 100);
        this.size = min(this.size + 1.2, this.maxSize); // slow growth
        this.evolve();
      }
    }
  }
  // Grow into the next life stage after enough meals
  evolve() {
    if (this.eaten >= 12) this.stage = 2;
    else if (this.eaten >= 5) this.stage = 1;
  }
  // Body color blends smoothly between stages as it eats
  bodyColor() {
    let p = constrain(this.eaten / 12, 0, 1);
    if (p < 0.5) return lerpColor(this.cBaby, this.cAdult, p * 2);
    return lerpColor(this.cAdult, this.cElder, (p - 0.5) * 2);
  }
  // One more spike almost every meal: 3 up to 12
  spikeCount() {
    return 3 + min(floor(this.eaten * 1.2), 9);
  }
  // Ward orbs appear from 6 meals, up to 4
  orbCount() {
    if (this.eaten < 6) return 0;
    return min(1 + floor((this.eaten - 6) / 2), 4);
  }
  show(mwx, mwy) {
    let t = frameCount * 0.02;
    let col = this.bodyColor();
    let r = red(col), g = green(col), b = blue(col);
    let R = this.size / 2;
    push();
    translate(WX(this.x), WY(this.y), 0);
    noStroke();

    // Halo torus appears after 3 meals, tumbling in 3D
    if (this.eaten >= 3) {
      push();
      rotateX(t * 0.9);
      rotateY(t * 0.6);
      glowMat(r, g, b);
      torus(R * 1.6, 4);
      pop();
    }
    // Inner ring appears after 9 meals
    if (this.eaten >= 9) {
      push();
      rotateX(-t * 1.2 + 0.6);
      rotateY(t * 0.8);
      glowMat(255, 255, 255);
      torus(R * 1.15, 2.5);
      pop();
    }
    // Radiating spike cones with glowing tips
    let n = this.spikeCount();
    litMat(r, g, b, 30);
    for (let i = 0; i < n; i++) {
      let a = ((TWO_PI / n) * i) + t * 0.3;
      let len = this.size * 0.35 + sin(t * 2 + i * 1.7) * 6;
      let dx = cos(a), dy = sin(a);
      push();
      translate(dx * (R * 0.9 + len / 2), dy * (R * 0.9 + len / 2), 0);
      rotateZ(a + HALF_PI); // aim the cone outward
      cone(5, len);
      pop();
      glowMat(r, g, b);
      push();
      translate(dx * (R * 0.9 + len), dy * (R * 0.9 + len), 0);
      sphere(3.5); // glowing tip
      pop();
      litMat(r, g, b, 30);
    }
    // Body: a lit sphere
    litMat(r, g, b, 40);
    sphere(R);
    // Glowing chest core
    glowMat(255, 255, 240);
    push();
    translate(0, R * 0.15, R * 0.82);
    sphere(R * 0.28);
    pop();
    // Eyes that follow the mouse
    let lmx = mwx - WX(this.x), lmy = mwy - WY(this.y);
    let dm = max(dist(0, 0, lmx, lmy), 1);
    let px = (lmx / dm) * 3, py = (lmy / dm) * 3;
    let ex = this.size * 0.16, ey = -this.size * 0.1;
    let ez = sqrt(max(R * R - ex * ex - ey * ey, 4)); // sit on the sphere
    litMat(245, 245, 250, 50);
    push(); translate(-ex, ey, ez * 0.9); sphere(this.size * 0.11); pop();
    push(); translate(ex, ey, ez * 0.9); sphere(this.size * 0.11); pop();
    litMat(12, 12, 35, 10);
    push(); translate(-ex + px, ey + py, ez + 2.5); sphere(this.size * 0.055); pop();
    push(); translate(ex + px, ey + py, ez + 2.5); sphere(this.size * 0.055); pop();
    // Mouth opens wide when food is near
    let openH = map(constrain(this.nearest, 0, 160), 0, 160,
                    this.size * 0.3, 2);
    let mey = this.size * 0.24;
    let mez = sqrt(max(R * R - mey * mey, 4));
    litMat(12, 12, 35, 10);
    push();
    translate(0, mey, mez * 0.92);
    scale(1.7, max(openH / (this.size * 0.22), 0.12), 0.55);
    sphere(this.size * 0.1);
    pop();
    // Ward orbs on a tilted 3D orbit
    let orbs = this.orbCount();
    glowMat(255, 255, 255);
    for (let i = 0; i < orbs; i++) {
      let a = t * 1.5 + ((i * TWO_PI) / orbs);
      let od = R * 1.7;
      push();
      translate(cos(a) * od, sin(a) * od * 0.55, sin(a) * od * 0.55);
      sphere(3.5);
      pop();
    }
    pop();
  }
}

// The Void Maw: a rival monster devouring the same debris
class Maw {
  constructor() {
    this.x = random(width);
    this.y = random(100, height);
    this.size = 36;
    this.eaten = 0;
    this.enraged = false; // after 6 meals it hunts YOU
    this.cool = 0;        // cooldown after clashing with you
    this.tx = this.x;     // wander target
    this.ty = this.y;
    this.t = random(1000);
  }
  update(player, debrisList, stage) {
    this.t += 0.02;
    if (this.cool > 0) this.cool--;
    // Gets faster in later stages
    let speed = (this.enraged ? 1.7 : 0.9) + stage * 0.06;
    let gx, gy;
    if (this.enraged) {
      gx = player.x; gy = player.y; // hunt the guardian
    } else {
      // Seek the nearest debris
      let best = null, bd = 99999;
      for (let d of debrisList) {
        let dd = dist(this.x, this.y, d.x, d.y);
        if (dd < bd) { bd = dd; best = d; }
      }
      if (best) { gx = best.x; gy = best.y; }
      else {
        if (dist(this.x, this.y, this.tx, this.ty) < 20) {
          this.tx = random(width);
          this.ty = random(100, height);
        }
        gx = this.tx; gy = this.ty;
      }
    }
    let dx = gx - this.x, dy = gy - this.y;
    let m = max(dist(0, 0, dx, dy), 1);
    this.x += (dx / m) * speed;
    this.y += (dy / m) * speed;
    // Devour debris (your competition)
    for (let i = debrisList.length - 1; i >= 0; i--) {
      let d = debrisList[i];
      if (dist(this.x, this.y, d.x, d.y) < this.size / 2 + d.s / 2) {
        debrisList.splice(i, 1);
        this.eaten++;
        this.size = min(this.size + 2, 90);
        if (this.eaten >= 6) this.enraged = true;
      }
    }
    // Clash: if it rams you, you lose energy and shrink
    if (this.cool <= 0 &&
        dist(this.x, this.y, player.x, player.y) < (this.size + player.size) / 2) {
      player.energy = max(0, player.energy - 15);
      player.size = max(22, player.size - 4);
      this.cool = 180;
      hitFlash = 25;
      // Flung away from you
      let kx = this.x - player.x, ky = this.y - player.y;
      let km = max(dist(0, 0, kx, ky), 1);
      this.x = constrain(player.x + (kx / km) * 260, 30, width - 30);
      this.y = constrain(player.y + (ky / km) * 260, 90, height - 30);
    }
  }
  // Zapped by your click: shrinks, calms down, spits out debris
  hit(player, debrisList) {
    this.size = max(26, this.size - 10);
    this.eaten = max(0, this.eaten - 3);
    if (this.eaten < 6) this.enraged = false;
    for (let i = 0; i < 2; i++) {
      debrisList.push(new Debris(
        constrain(this.x + random(-40, 40), 20, width - 20),
        constrain(this.y + random(-40, 40), 90, height - 20)));
    }
    let dx = this.x - player.x, dy = this.y - player.y;
    let m = max(dist(0, 0, dx, dy), 1);
    this.x = constrain(player.x + (dx / m) * 260, 30, width - 30);
    this.y = constrain(player.y + (dy / m) * 260, 90, height - 30);
  }
  show() {
    let t = this.t;
    let R = this.size / 2;
    push();
    translate(WX(this.x), WY(this.y), 0);
    noStroke();
    // Jagged dark spikes
    litMat(60, 22, 85, 20);
    let n = 9;
    for (let i = 0; i < n; i++) {
      let a = ((TWO_PI / n) * i) + t * 0.4;
      let len = R * (0.8 + 0.18 * sin(t * 3 + i * 2));
      push();
      translate(cos(a) * (R * 0.85 + len / 2), sin(a) * (R * 0.85 + len / 2), 0);
      rotateZ(a + HALF_PI);
      cone(R * 0.2, len);
      pop();
    }
    // Body: dark pulsing sphere
    if (this.enraged) litMat(150, 25, 45, 25);
    else litMat(75, 30, 100, 25);
    let pulse = 1 + 0.05 * sin(t * 4);
    push();
    scale(pulse, pulse, pulse);
    sphere(R);
    pop();
    // Angry glowing eyes
    glowMat(255, 60, 60);
    let ex = this.size * 0.16;
    let ez = sqrt(max(R * R - ex * ex - 16, 4));
    push(); translate(-ex, -4, ez * 0.88); sphere(5); pop();
    push(); translate(ex, -4, ez * 0.88); sphere(5); pop();
    // Devouring mouth with fangs
    let mey = R * 0.5;
    let mez = sqrt(max(R * R - mey * mey, 4));
    litMat(10, 4, 12, 10);
    push();
    translate(0, mey, mez * 0.9);
    scale(1.9, 0.55, 0.5);
    sphere(R * 0.32);
    pop();
    litMat(240, 240, 245, 40);
    for (let i = -1; i <= 1; i++) {
      push();
      translate(i * R * 0.28, mey - R * 0.1, mez * 0.95);
      rotateZ(PI); // fangs point down
      cone(3, 9);
      pop();
    }
    pop();
  }
}

let creature;
let maw;
let debrisList = [];
let stars = [];
let zaps = [];      // zap shockwaves
let hitFlash = 0;   // red flash when the Maw rams you
let won = false;
let curStage = 0;   // 0-9 across the 10 zones
let stageBannerT = 0;
let hud;            // 2D overlay for crisp HUD text
// Precomputed scenery for the asteroid belt, nebula, deep field
let bgRocks = [];
let bgBlobs = [];
let bgDeep = [];

function setup() {
  createCanvas(600, 400, WEBGL); // <-- 3D mode
  hud = createGraphics(600, 400); // 2D layer for the HUD
  resetGame();
  for (let i = 0; i < 120; i++) stars.push(new Star());
  // Asteroid belt rocks
  for (let i = 0; i < 16; i++) {
    bgRocks.push({ x: random(width), y: random(height), z: random(-160, -20),
                   s: random(14, 42), rx: random(TWO_PI), ry: random(TWO_PI),
                   spd: random(0.5, 2) });
  }
  // Nebula gas clouds
  let blobCols = [[150, 80, 220], [230, 100, 180], [80, 200, 220], [120, 90, 230]];
  for (let i = 0; i < 9; i++) {
    bgBlobs.push({ x: random(width), y: random(height),
                   r: random(60, 150), c: blobCols[i % 4] });
  }
  // Extra faint stars for the deep field
  for (let i = 0; i < 70; i++) {
    bgDeep.push({ x: random(width), y: random(height),
                  z: random(-500, -60), r: random(0.5, 1.5) });
  }
}

function resetGame() {
  creature = new Creature(width / 2, height / 2);
  maw = new Maw();
  debrisList = [];
  for (let i = 0; i < 14; i++) debrisList.push(new Debris());
  zaps = [];
  hitFlash = 0;
  won = false;
  curStage = 0;
  stageBannerT = 0;
}

// Paint the current zone in 3D: planets, belts, nebulae, black hole...
function drawBackground(s) {
  const bases = [
    [8, 8, 26], [10, 10, 28], [16, 8, 12], [12, 12, 16], [14, 10, 20],
    [12, 12, 24], [4, 4, 12], [18, 8, 26], [2, 2, 6], [10, 6, 20]
  ];
  let bc = bases[s];
  background(bc[0], bc[1], bc[2]);
  noStroke();

  if (s === 0) {
    // Earth with green continents
    push();
    translate(WX(width - 70), WY(height + 40), -60);
    litMat(40, 90, 200, 30);
    sphere(105);
    litMat(60, 160, 90, 20);
    push(); translate(-30, -40, 88); sphere(22); pop();
    push(); translate(35, 25, 90); sphere(16); pop();
    pop();
  } else if (s === 1) {
    // The Moon with craters
    push();
    translate(WX(90), WY(90), -40);
    litMat(160, 160, 165, 10);
    sphere(62);
    litMat(125, 125, 130, 10);
    push(); translate(-18, -14, 56); sphere(10); pop();
    push(); translate(20, 12, 55); sphere(7); pop();
    push(); translate(5, -30, 52); sphere(5); pop();
    pop();
  } else if (s === 2) {
    // Mars
    push();
    translate(WX(width - 90), WY(100), -60);
    litMat(200, 90, 50, 15);
    sphere(72);
    litMat(165, 65, 38, 15);
    push(); translate(-28, -18, 62); sphere(14); pop();
    push(); translate(28, 22, 60); sphere(10); pop();
    pop();
  } else if (s === 3) {
    // Tumbling background asteroids
    litMat(88, 86, 82, 8);
    for (let rk of bgRocks) {
      push();
      translate(WX(rk.x), WY(rk.y), rk.z);
      rotateX(rk.rx + frameCount * 0.002 * rk.spd);
      rotateY(rk.ry + frameCount * 0.003 * rk.spd);
      box(rk.s, rk.s * 0.8, rk.s * 0.7);
      pop();
    }
  } else if (s === 4) {
    // Jupiter: banded sphere with the red spot
    let jr = 100;
    push();
    translate(WX(width - 115), WY(height / 2), -70);
    litMat(225, 195, 155, 25);
    sphere(jr);
    let bandCols = [[230, 200, 160], [200, 150, 110], [235, 210, 175], [190, 140, 100]];
    for (let i = 0; i < 4; i++) {
      let by = -jr + 24 + i * 44;
      let rr = sqrt(max(jr * jr - by * by, 4));
      push();
      translate(0, by, 0);
      rotateX(HALF_PI);
      litMat(bandCols[i][0], bandCols[i][1], bandCols[i][2], 20);
      torus(rr, 7);
      pop();
    }
    litMat(200, 90, 60, 20);
    push(); translate(30, 40, 84); sphere(14); pop(); // red spot
    pop();
  } else if (s === 5) {
    // Saturn with a tilted 3D ring
    push();
    translate(WX(105), WY(height - 85), -50);
    litMat(220, 195, 150, 25);
    sphere(58);
    rotateX(0.5);
    litMat(205, 185, 145, 40);
    torus(105, 9);
    pop();
  } else if (s === 6) {
    // Deep field: extra faint stars
    stroke(200, 200, 220, 130);
    strokeWeight(1.5);
    for (let st of bgDeep) point(WX(st.x), WY(st.y), st.z);
    noStroke();
  } else if (s === 7) {
    // Nebula gas clouds (soft billboards)
    for (let bb of bgBlobs) {
      push();
      translate(WX(bb.x), WY(bb.y), -100);
      fill(bb.c[0], bb.c[1], bb.c[2], 26);
      circle(0, 0, bb.r * 2);
      fill(bb.c[0], bb.c[1], bb.c[2], 16);
      circle(0, 0, bb.r * 3);
      pop();
    }
  } else if (s === 8) {
    // Black hole with a glowing accretion disk
    push();
    translate(0, 0, -80);
    fill(255, 150, 50, 24);
    circle(0, 0, 270);
    fill(255, 170, 70, 40);
    circle(0, 0, 210);
    rotateX(1.15); // tilt the disk
    glowMat(255, 175, 80);
    torus(118, 8);
    pop();
    push();
    translate(0, 0, -78);
    fill(0, 0, 0);
    sphere(52); // the hole itself
    pop();
  } else {
    // Galactic core
    push();
    translate(0, 0, -120);
    fill(255, 240, 210, 30);
    circle(0, 0, 330);
    fill(255, 250, 230, 45);
    circle(0, 0, 190);
    glowMat(255, 255, 245);
    sphere(40);
    let t = frameCount * 0.003;
    for (let i = 0; i < 2; i++) {
      push();
      rotateY(t * (i + 1) + i * PI);
      rotateX(0.45);
      glowMat(255, 235, 200);
      torus(120, 7);
      pop();
    }
    pop();
  }
}

function draw() {
  let mwx = mouseX - width / 2;
  let mwy = mouseY - height / 2;

  // Balanced lights (they add up!): soft ambient + one key light
  // + a gentle lure light that follows your mouse
  ambientLight(30, 30, 40);
  directionalLight(140, 140, 160, -0.3, -0.5, -1);
  pointLight(150, 150, 130, mwx, mwy, 170);
  if (!won && maw.enraged) {
    pointLight(220, 70, 70, WX(maw.x), WY(maw.y), 130); // the Maw glows red
  }

  // Stage advances every 10 debris eaten
  let ns = stageIndex();
  if (ns !== curStage) {
    curStage = ns;
    stageBannerT = 150;
  }
  drawBackground(curStage);
  for (let s of stars) s.show();

  if (!won) {
    // Keep debris coming so there is always food
    if (debrisList.length < 12 && frameCount % 60 === 0) {
      debrisList.push(new Debris());
    }
    for (let d of debrisList) {
      d.drift();
      d.show();
    }
    creature.drift();
    creature.attract();
    creature.live();
    creature.eat(debrisList);
    maw.update(creature, debrisList, curStage);
    // Zap shockwaves expand and fade
    for (let i = zaps.length - 1; i >= 0; i--) {
      zaps[i].t++;
      if (zaps[i].t > 22) zaps.splice(i, 1);
    }
    if (creature.eaten >= CLEAN_GOAL) won = true;
  } else {
    for (let d of debrisList) d.show();
  }

  // Lure marker glowing at the mouse
  glowMat(255, 255, 200);
  push();
  translate(mwx, mwy, 40);
  sphere(6);
  pop();

  creature.show(mwx, mwy);
  maw.show();

  // Zap shockwaves as expanding 3D rings
  for (let z of zaps) {
    push();
    translate(WX(z.x), WY(z.y), 20);
    glowMat(150, 220, 255);
    torus(14 + z.t * 4, 3);
    pop();
  }

  drawHUD2D(); // paint all UI onto the 2D overlay

  // Present the HUD as a screen-space layer in front of the 3D scene.
  // NOTE: reset the material first — leftover material state would
  // tint the transparent parts of the HUD texture.
  fill(255, 255, 255);
  specularMaterial(0, 0, 0);
  emissiveMaterial(0, 0, 0);
  let eyeZ = (height / 2) / tan(PI / 6); // default camera distance
  let hudZ = 100;
  let hs = (eyeZ - hudZ) / eyeZ; // scale so it lands exactly screen-sized
  push();
  translate(0, 0, hudZ);
  image(hud, (-width / 2) * hs, (-height / 2) * hs, width * hs, height * hs);
  pop();
}

// Click the Maw to zap it, click empty space to drop food
function mousePressed() {
  if (won || mouseY < 70) return false; // HUD zone is not clickable
  if (dist(mouseX, mouseY, maw.x, maw.y) < maw.size * 0.8) {
    if (creature.energy >= 5) {
      creature.energy -= 5;
      maw.hit(creature, debrisList);
      zaps.push({ x: maw.x, y: maw.y, t: 0 });
    }
  } else {
    debrisList.push(new Debris(mouseX, mouseY));
  }
  return false;
}

function keyPressed() {
  if ((key === "r" || key === "R") && won) resetGame();
}

// ---- 2D overlay: game HUD, banners, story cards (drawn onto `hud`) ----

function drawHUD2D() {
  hud.clear();
  hud.noStroke();
  hud.fill(4, 4, 14, 190);
  hud.rect(0, 0, width, 66);
  hud.fill(255);
  hud.textSize(11);
  hud.textAlign(LEFT, TOP);
  // Stage + cleanup goal
  hud.text("STAGE " + (curStage + 1) + "/10 · CLEANUP  " +
           creature.eaten + " / " + CLEAN_GOAL, 12, 8);
  bar(12, 26, 150, 10, creature.eaten / CLEAN_GOAL, color(110, 230, 180));
  // Energy
  hud.text("ENERGY", 180, 8);
  let ec = lerpColor(color(230, 70, 70), color(110, 230, 140), creature.energy / 100);
  bar(180, 26, 100, 10, creature.energy / 100, ec);
  // Next evolution
  let nl = nextLevelInfo();
  hud.text(nl.label, 300, 8);
  bar(300, 26, 140, 10, nl.p, color(120, 200, 255));
  // Maw threat status
  hud.textAlign(RIGHT, TOP);
  let ms = maw.enraged ? "VOID MAW: ENRAGED" : (maw.eaten >= 3 ? "VOID MAW: HUNGRY" : "VOID MAW: CALM");
  if (maw.enraged) hud.fill(255, 90, 90);
  hud.text(ms, width - 12, 8);
  hud.fill(200);
  hud.textSize(10);
  hud.text("Click MAW to zap  |  Click space to feed", width - 12, 28);
  hud.textAlign(LEFT, BASELINE);

  // Stage transition banner
  if (stageBannerT > 0 && !won) {
    let a = min(stageBannerT * 2, 200);
    hud.fill(5, 5, 15, a);
    hud.rect(0, height / 2 - 42, width, 84);
    hud.fill(255, 255, 255, min(stageBannerT * 2, 255));
    hud.textAlign(CENTER, CENTER);
    hud.textSize(24);
    hud.text("STAGE " + (curStage + 1) + " / 10", width / 2, height / 2 - 14);
    hud.textSize(15);
    hud.fill(180, 220, 255, min(stageBannerT * 2, 255));
    hud.text(STAGE_NAMES[curStage], width / 2, height / 2 + 16);
    hud.textAlign(LEFT, BASELINE);
    stageBannerT--;
  }

  // Story intro card, fades after ~5 seconds
  if (!won && frameCount < 320) {
    hud.fill(5, 5, 18, 225 - frameCount * 0.55);
    hud.rect(0, 0, width, height);
    hud.fill(255);
    hud.textAlign(CENTER, CENTER);
    hud.textSize(30);
    hud.text("ORBITAL CLEANER 3D", width / 2, height / 2 - 60);
    hud.textSize(13);
    hud.text("Year 2087. Earth's orbit is choking on debris.\n" +
             "You are a young Guardian. Eat junk. Evolve.\n" +
             "But beware the Void Maw — it hungers too.\n\n" +
             "Clean " + CLEAN_GOAL + " pieces across 10 zones to restore the orbit.\n" +
             "Click the Maw to zap it  (-5 energy).\n" +
             "Click empty space to drop food.",
             width / 2, height / 2 + 30);
    hud.textAlign(LEFT, BASELINE);
  }

  // Victory screen
  if (won) {
    hud.fill(5, 12, 22, 205);
    hud.rect(0, 0, width, height);
    hud.fill(255);
    hud.textAlign(CENTER, CENTER);
    hud.textSize(32);
    hud.text("ORBIT CLEAN!", width / 2, height / 2 - 25);
    hud.textSize(14);
    hud.text("The Guardian devoured " + CLEAN_GOAL + " debris across 10 zones.\n" +
             "Earth's orbit is safe... for now.\n\nPress R to play again",
             width / 2, height / 2 + 45);
    hud.textAlign(LEFT, BASELINE);
  }

  // Red flash when the Maw rams you
  if (hitFlash > 0) {
    hud.fill(255, 40, 40, hitFlash * 5);
    hud.rect(0, 0, width, height);
    hitFlash--;
  }
}

// Small helper: labeled progress bar on the HUD
function bar(x, y, w, h, p, c) {
  hud.noStroke();
  hud.fill(255, 255, 255, 35);
  hud.rect(x, y, w, h, 4);
  hud.fill(c);
  hud.rect(x, y, w * constrain(p, 0, 1), h, 4);
}

// What is the next evolution and how close are we?
function nextLevelInfo() {
  if (creature.stage === 0)
    return { label: "NEXT: Guardian " + min(creature.eaten, 5) + "/5", p: creature.eaten / 5 };
  if (creature.stage === 1)
    return { label: "NEXT: Elder " + min(creature.eaten, 12) + "/12", p: (creature.eaten - 5) / 7 };
  return { label: "MAX EVOLUTION", p: 1 };
}
