/*
  DRUM — a minimal 3D world clock (v29)
  --------------------------------------------------------------
  Black & white only. Hours, minutes and seconds sit on stacked
  rings (like a rotating drum). Each ring turns so that the
  current value always faces you at the front marker.

  The "3D" is done by hand: every point (x, y, z) is rotated and
  projected onto the 2D canvas with a small perspective formula.

  Mouse : drag = rotate · scroll = zoom · move = subtle tilt
          double-click = switch view (DRUM <-> DIAL)
          click a city at the bottom = switch city
  Keys  : 1-9 = city · V = view · L = light / dark mode
  --------------------------------------------------------------
*/

// ---------- CITIES ----------
// Order: Seoul -> Europe -> the Americas -> Australia -> others.
// (Your own city is added in front of all of these when the clock starts.)
const CITIES = [
  { name: 'SEOUL',       tz: 'Asia/Seoul' },
  { name: 'LONDON',      tz: 'Europe/London' },
  { name: 'PARIS',       tz: 'Europe/Paris' },
  { name: 'NEW YORK',    tz: 'America/New_York' },
  { name: 'LOS ANGELES', tz: 'America/Los_Angeles' },
  { name: 'MEXICO CITY', tz: 'America/Mexico_City' },
  { name: 'SYDNEY',      tz: 'Australia/Sydney' },
  { name: 'SINGAPORE',   tz: 'Asia/Singapore' },
];

// ---------- CAMERA ----------
const FOCAL = 900;        // distance of the eye: smaller = stronger perspective
let yaw = 0, pitch = 0.4; // current rotation of the view
let dragYaw = 0, dragPitch = 0; // extra rotation added by dragging
let zoom = 1;
let cx, cy, unit;         // screen center + scale

// ---------- STATE ----------
let rings = [];
let cityIndex = 0;
let morph = 0;            // 0 = DRUM view, 1 = DIAL view (animated)
let viewDial = false;
let lightMode = false;
let lastDaytime = null;   // was the selected city in daytime last frame? (null = not checked yet)
// daytime = 6:00 to 17:59 in that city -> light mode, otherwise dark mode
const DAY_START = 6, DAY_END = 18;
let theme = 0;            // 0 = dark, 1 = light (animated so the switch fades)

// theme colors (RGB)
const DARK  = { bg: [0, 0, 0],       ink: [255, 255, 255] };
const LIGHT = { bg: [255, 255, 255], ink: [0, 0, 0] };
let hitBoxes = [];        // clickable text areas (cities, buttons)
let L;                    // screen layout, recalculated every frame (see computeLayout)
let canHover = true;      // false on touch screens (no mouse to hover with)
let pinchStart = 0, zoomStart = 1, lastTap = 0;
let lastX = 0, lastY = 0;
let listScroll = 0, listVel = 0, listDragging = false;  // sideways scroll of the city row  // last pointer position (we measure drag distance ourselves)
let pressX = 0, pressY = 0, dragging = false;

// (no spaces in these lists — p5 wraps names with spaces in quotes, which breaks a list)
const FONT = 'Helvetica,Arial,sans-serif'; // one typeface everywhere

// =================================================================
//  CLASS: Ring — one rotating ring of ticks and/or labels
// =================================================================
class Ring {
  constructor(o) {
    this.count = o.count;            // how many divisions around the ring (12 or 60)
    this.unit = o.unit;              // which time value drives it: 'h', 'm', 's' or null
    this.labelEvery = o.labelEvery;  // put a label every N divisions (0 = no labels)
    this.labelFn = o.labelFn;        // turns an index into text, e.g. 0 -> "12"
    this.textSize = o.textSize || 12;
    this.tick = o.tick || 0;         // tick length (0 = no ticks)
    this.drumY = o.drumY;            // height in DRUM view
    this.drumR = o.drumR;            // radius in DRUM view
    this.dialR = o.dialR;            // radius in DIAL view (all rings flat, y = 0)
    this.angle = 0;                  // current rotation (animated)
    this.y = this.drumY;
    this.r = this.drumR;
  }

  // ease the rotation toward the current time value
  update(value) {
    if (this.count > 0) {
      const target = (value / this.count) * TWO_PI;
      // shortest way around the circle (so 59 -> 0 doesn't spin backwards)
      let diff = target - this.angle;
      diff = ((diff + PI) % TWO_PI + TWO_PI) % TWO_PI - PI;
      this.angle += diff * 0.12;
    }
    // morph between the two views
    this.y = lerp(this.drumY, 0, morph);
    this.r = lerp(this.drumR, this.dialR, morph);
  }

  // a point on this ring at angle a and radius r, projected to the screen
  // how far out this ring actually draws something: ticks reach the full
  // radius; a ring with only numbers stops at the outer edge of its numbers
  outerR() {
    if (this.tick > 0) return this.r;
    return this.r - this.textSize * 0.9 + this.textSize * 0.55;
  }

  point(a, r) {
    return project(r * sin(a), this.y, r * cos(a));
  }

  display(value) {
    const step = TWO_PI / this.count;
    // which index is at the front right now?
    const current = ((floor(value) % this.count) + this.count) % this.count;

    // INNER LOOP: walk around the ring, one division at a time
    for (let i = 0; i < this.count; i++) {
      // angle of this division (0 = front). The minus sign lays the numbers
      // out CLOCKWISE (seen from above, like a real clock face).
      const a = this.angle - i * step;
      const isCurrent = i === current;

      // --- tick mark (a short line pointing to the center) ---
      if (this.tick > 0) {
        const long = i % 5 === 0 && this.count === 60;
        // the current tick grows, but never past the long 5-minute length,
        // so it can't reach the number label just inside it
        const len = this.tick * min((long ? 1.8 : 1) * (isCurrent ? 1.6 : 1), 1.8);
        const p1 = this.point(a, this.r);
        const p2 = this.point(a, this.r - len);
        stroke(fg(isCurrent ? 255 : depthAlpha(p1.z, this.r, 55, 180)));   // other ticks a bit softer so the current one (white) stands out
        strokeWeight(isCurrent ? 2.2 : 1.25);
        line(p1.x, p1.y, p2.x, p2.y);
      }

      // --- label (number lying flat on the ring) ---
      if (this.labelEvery > 0 && i % this.labelEvery === 0) {
        const r = this.r - this.tick * 1.8 - this.textSize * 0.9;
        drawFlatText(this.labelFn(i), a, r, this.y, this.textSize, isCurrent);
      }
    }
  }
}

// =================================================================
//  SETUP
// =================================================================
function setup() {
  const cnv = createCanvas(windowWidth, windowHeight);
  // draw at the screen's real sharpness (3x on most phones, 2x on Retina laptops)
  pixelDensity(constrain(displayDensity(), 2, 3));
  // phones: stop the browser from scrolling / zooming the page while you touch the clock
  cnv.style('touch-action', 'none');
  canHover = window.matchMedia('(hover: hover)').matches;

  addCurrentLocation();

  // prepare a time formatter for every city (converts real time -> that time zone)
  for (const c of CITIES) {
    c.fmt = new Intl.DateTimeFormat('en-GB', {
      timeZone: c.tz, hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
    });
    // full date + time in that zone, used to measure the difference from New York
    c.fullFmt = new Intl.DateTimeFormat('en-US', {
      timeZone: c.tz, year: 'numeric', month: 'numeric', day: 'numeric',
      hour: 'numeric', minute: 'numeric', hourCycle: 'h23',
    });
    c.dayFmt = new Intl.DateTimeFormat('en-US', { timeZone: c.tz, weekday: 'short', day: '2-digit', month: 'short' });
  }

  // the stack of rings, top to bottom
  rings = [
    new Ring({ count: 12, unit: 'h', labelEvery: 1, labelFn: (i) => (i === 0 ? '12' : String(i)),
               textSize: 34, drumY: -165, drumR: 215, dialR: 270 }),
    new Ring({ count: 12, unit: 'h', tick: 14, drumY: -74, drumR: 195, dialR: 215 }),
    new Ring({ count: 60, unit: 'm', tick: 7, labelEvery: 5, labelFn: (i) => nf(i, 2),
               textSize: 11, drumY: 26, drumR: 210, dialR: 185 }),
    new Ring({ count: 60, unit: 's', tick: 6, drumY: 155, drumR: 210, dialR: 130 }),
  ];
}

// =================================================================
//  DRAW
// =================================================================
function draw() {
  // fade between dark and light mode
  theme = lerp(theme, lightMode ? 1 : 0, 0.1);
  background(mixTheme('bg'));
  hitBoxes = [];

  L = computeLayout();
  cx = L.clock.cx;
  cy = L.clock.cy;
  unit = L.clock.unit;

  // --- camera: hover tilt + drag + view mode ---
  // hover tilt only in DRUM view (in DIAL view it would just spin the dial)
  const hoverYaw = canHover ? (mouseX / width - 0.5) * 0.35 * (1 - morph) : 0;
  // DIAL view looks straight down (90°), so the rings are perfect circles
  const basePitch = lerp(0.62, HALF_PI, morph);
  // safety net: if a weird touch value ever slips in, reset instead of breaking the clock
  if (!isFinite(dragYaw) || !isFinite(dragPitch)) { dragYaw = 0; dragPitch = 0; }
  if (!isFinite(yaw) || !isFinite(pitch)) { yaw = 0; pitch = 0.6; }
  yaw = lerp(yaw, hoverYaw + dragYaw, 0.08);
  pitch = lerp(pitch, constrain(basePitch + dragPitch, 0.02, HALF_PI), 0.08);
  if (!dragging) {              // after you let go, the view floats back
    dragYaw *= 0.96;
    dragPitch *= 0.96;
  }
  morph = lerp(morph, viewDial ? 1 : 0, 0.07);
  fitClock();


  // --- time for the selected city ---
  const city = CITIES[cityIndex];
  const now = new Date();
  const t = getTime(city, now);

  // AUTO THEME: morning / daytime in the selected city = light, evening / night = dark.
  // It only switches when the city changes or its day/night flips, so if you
  // press DARK / LIGHT yourself, your choice stays until then.
  const daytime = t.h >= DAY_START && t.h < DAY_END;
  if (daytime !== lastDaytime) {
    setLight(daytime);
    lastDaytime = daytime;
  }
  // Whole numbers only: each ring "clicks" to the exact current value,
  // so the current hour, minute and second all line up at the front center.
  // (Ring.update() eases the rotation, so each click still moves smoothly.)
  const values = {
    h: t.h % 12,
    m: t.m,
    s: t.s,
  };

  // NESTED LOOPS: the outer loop goes through every ring,
  // and inside Ring.display() an inner loop goes around each ring.
  for (let r = 0; r < rings.length; r++) {
    const v = rings[r].unit ? values[rings[r].unit] : 0;
    rings[r].update(v);
    rings[r].display(v);
  }

  drawReadout(city, t, now);
  drawCityList(now);
  drawControls();
}

// =================================================================
//  RESPONSIVE LAYOUT
// =================================================================
// Works out where everything goes for the current screen size, so the
// header, buttons, clock and city list never overlap.
//   - desktop: header top-left, buttons top-right, cities in one row
//   - phone (portrait): buttons on their own row, header below, cities 3 per row
//   - phone (landscape): header on the left, clock on the right, cities in one row
function computeLayout() {
  const compact = width < 700;                    // narrow screen (phone portrait)
  const short = height < 520 && width > height;   // low screen (phone landscape)
  const m = compact || short ? 20 : 32;           // outer margin

  // --- buttons ---
  // Two toggle icons. 'size' is the tap area, 'icon' is how big the drawing is.
  // text buttons:  DRUM  DIAL      DARK  LIGHT   (no boxes)
  // size = text size, h = tap height, optGap = space between the two words,
  // groupGap = space between the two pairs
  const ctrl = { size: 11, h: 30, optGap: 14, groupGap: compact || short ? 22 : 30 };
  // lineY = the center of the top line. The city name and the buttons are
  // both centered on it, so they sit exactly on the same line.
  ctrl.lineY = (compact || short ? 20 : 36) + 8;
  ctrl.right = width - m;          // the buttons are lined up from the right edge
  ctrl.y = ctrl.lineY - ctrl.h / 2;

  // --- header (city, big time, date) ---
  const head = { x: m, y: ctrl.lineY - 6, timeSize: compact || short ? 34 : 40 };   // 11px text, centered on lineY
  head.timeY = head.y + (compact || short ? 14 : 16);   // big time sits close under the city name
  head.subY = head.timeY + head.timeSize + 10;   // a little air between the big time and the date
  head.bottom = head.subY + 14;
  head.right = m + 230;                           // roughly how wide the header is

  // --- city list ---
  // always ONE row with every city. If they don't fit (phones), the row
  // scrolls sideways: drag / swipe it left and right.
  const n = CITIES.length;
  const minColW = compact || short ? 108 : 96;
  const list = { count: n, cols: n, rows: 1, m, rowH: 52, gutter: compact ? 14 : 16 };
  list.colW = max(minColW, (width - m * 2) / n);
  list.contentW = n * list.colW;                   // full width of the row
  list.maxScroll = max(0, list.contentW - (width - m * 2) - list.gutter);
  list.top = height - m - list.rowH + 12;

  // --- clock: the free box that is left ---
  let box;
  if (short) {
    // landscape phone: to the right of the header, under the buttons
    box = { x1: head.right + 10, x2: width - m, y1: ctrl.y + ctrl.h + 8, y2: list.top - 12 };
  } else {
    // the clock sits HIGH: a small gap under the header, a bigger one above the
    // cities (the big rings at the bottom make it look lower than it is)
    box = compact
      ? { x1: m, x2: width - m, y1: head.bottom + 24, y2: list.top - 24 }     // phone: same gap above and below
      : { x1: m, x2: width - m, y1: head.bottom + 8, y2: list.top - 110 };   // desktop: big gap above the cities
  }
  const bw = box.x2 - box.x1, bh = box.y2 - box.y1;
  const clock = {
    cx: (box.x1 + box.x2) / 2,
    cy: (box.y1 + box.y2) / 2,
    unit: max(0.2, min(bw, bh) * 0.95 / 600),     // first guess; fitClock() refines it
    box: { cx: (box.x1 + box.x2) / 2, cy: (box.y1 + box.y2) / 2, w: bw, h: bh },
  };

  return { compact, short, m, ctrl, head, list, clock };
}

// Center the clock on what is actually DRAWN, not on its math center.
// A tilted drum looks lower than its center (the front of the bottom ring
// swings down), so we project the rings once with the default view,
// measure the box they cover on screen, then scale and move the clock so
// that box sits in the middle of the free space.
function fitClock() {
  const saved = { yaw, pitch, zoom };
  yaw = 0;
  pitch = lerp(0.62, HALF_PI, morph);   // the default view (ignores dragging)
  zoom = 1; cx = 0; cy = 0; unit = 1;

  let x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
  // NESTED LOOPS: every ring x 24 points around it
  for (const ring of rings) {
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * TWO_PI;
      const r = ring.outerR();
      const p = project(r * sin(a), ring.y, r * cos(a));
      x1 = min(x1, p.x); x2 = max(x2, p.x);
      y1 = min(y1, p.y); y2 = max(y2, p.y);
    }
  }
  ({ yaw, pitch, zoom } = saved);

  const b = L.clock.box;
  const pad = 6;                          // tiny breathing room (the gaps above/below are set in computeLayout)
  unit = max(0.2, min(b.w / (x2 - x1 + pad * 2), b.h / (y2 - y1 + pad * 2)));
  const k = unit * zoom;
  cx = b.cx - ((x1 + x2) / 2) * k;
  // Vertical (desktop): the clock's top is pinned right under the header and
  // any spare height goes BELOW it. On phones the clock is centered instead.
  const clockH = (y2 - y1) * k;
  const spare = max(0, b.h - clockH);
  // phones: spare space split evenly = clock exactly in the middle
  const top = b.cy - b.h / 2 + (L.compact || L.short ? spare / 2 : 0);
  cy = top - y1 * k;
}

// =================================================================
//  3D PROJECTION
// =================================================================
// Rotate a 3D point by yaw (left/right) and pitch (up/down),
// then shrink it with distance to make perspective.
function project(x, y, z) {
  const cY = cos(yaw), sY = sin(yaw);
  const cP = cos(pitch), sP = sin(pitch);

  const x1 = x * cY + z * sY;     // turn around the vertical axis
  const z1 = -x * sY + z * cY;
  const y2 = y * cP + z1 * sP;    // tilt around the horizontal axis
  const z2 = -y * sP + z1 * cP;

  const s = FOCAL / (FOCAL - z2); // closer points (bigger z) get bigger
  const k = unit * zoom;
  return { x: cx + x1 * s * k, y: cy + y2 * s * k, z: z2 };
}

// Points in the back get fainter, points in the front brighter
function depthAlpha(z, r, minA, maxA) {
  return map(z, -r * 1.2, r * 1.2, minA, maxA, true);
}

// Draw text that lies flat on a ring, bent by perspective.
// We project the point, plus one step along the ring (tangent)
// and one step outward (radial), and use them as a 2D matrix.
function drawFlatText(str, a, r, y, size, highlight) {
  const px = r * sin(a), pz = r * cos(a);
  const p = project(px, y, pz);
  const pu = project(px + cos(a), y, pz - sin(a)); // 1 unit along the tangent
  const pv = project(px + sin(a), y, pz + cos(a)); // 1 unit outward

  push();
  applyMatrix(pu.x - p.x, pu.y - p.y, pv.x - p.x, pv.y - p.y, p.x, p.y);
  noStroke();
  fill(fg(highlight ? 255 : depthAlpha(p.z, r, 55, 175)));   // other numbers softer, the current one pure white
  textFont(FONT);
  textSize(size);
  textAlign(CENTER, CENTER);
  text(str, 0, 0);
  pop();
}

// =================================================================
//  DECORATION + UI
// =================================================================
function drawReadout(city, t, now) {
  const x = L.head.x, y = L.head.y;
  noStroke();
  textAlign(LEFT, TOP);
  textFont(FONT);

  fill(fg(140));
  textSize(11);
  text((city.here ? '● ' : '') + city.name, x, y);   // ● = your current location

  fill(fg(255));
  textFont(FONT);
  textSize(L.head.timeSize);
  text(nf(t.h, 2) + ':' + nf(t.m, 2) + ':' + nf(t.s, 2), x - 2, L.head.timeY);

  fill(fg(140));
  textFont(FONT);
  textSize(11);
  text(getOffset(city, now) + '   ' + city.dayFmt.format(now).toUpperCase(), x, L.head.subY);
}

// All cities as a small grid at the bottom — click to switch
function drawCityList(now) {
  const { colW, gutter, count, maxScroll } = L.list;
  const margin = L.list.m;
  const y = L.list.top;

  // after a swipe the row keeps gliding a little and slows down (momentum)
  if (!listDragging) {
    listScroll += listVel;
    listVel *= 0.92;
    if (abs(listVel) < 0.05) listVel = 0;
  }
  listScroll = constrain(listScroll, 0, maxScroll);

  textFont(FONT);
  textAlign(LEFT, TOP);
  noStroke();

  // one loop over the cities; each one is shifted left by the scroll amount
  for (let i = 0; i < count; i++) {
    const c = CITIES[i];
    const x = margin + i * colW - listScroll;
    if (x > width || x + colW < 0) continue;     // off screen: skip
    const t = getTime(c, now);
    const active = i === cityIndex;

    // thin line above each city; the active one is solid
    stroke(fg(active ? 255 : 50));
    strokeWeight(1);
    line(x, y, x + colW - gutter, y);
    noStroke();

    fill(fg(active ? 255 : 110));
    textSize(10);
    text((c.here ? '● ' : '') + c.name, x, y + 8);
    text(nf(t.h, 2) + ':' + nf(t.m, 2) + ':' + nf(t.s, 2), x, y + 22);
    fill(fg(active ? 160 : 70));
    text(getOffset(c, now), x, y + 36);

    hitBoxes.push({ x, y, w: colW - gutter, h: 48, action: () => setCity(i) });
  }

  // soft fade at the edges that still have more cities = "you can scroll"
  if (maxScroll > 0) {
    const bg = mixTheme('bg');
    const fadeW = 36;
    if (listScroll < maxScroll - 1) edgeFade(width - fadeW, width, bg, y - 4, 56);
    if (listScroll > 1) edgeFade(fadeW, 0, bg, y - 4, 56);
  }
}

// a gradient from transparent (at x1) to the background color (at x2)
function edgeFade(x1, x2, bg, y, h) {
  const ctx = drawingContext;
  const g = ctx.createLinearGradient(x1, 0, x2, 0);
  g.addColorStop(0, `rgba(${bg[0]},${bg[1]},${bg[2]},0)`);
  g.addColorStop(1, `rgba(${bg[0]},${bg[1]},${bg[2]},1)`);
  ctx.save();
  ctx.fillStyle = g;
  ctx.fillRect(min(x1, x2), y, abs(x2 - x1), h);
  ctx.restore();
}

// Top-right controls: segmented text buttons on every screen size.
function drawControls() {
  drawTextButtons();
  cursor(hitBoxes.some((b) => isInside(b)) ? HAND : dragging ? MOVE : ARROW);
}

// Minimal text buttons. The chosen word is bright with a thin underline,
// the other one is dim. Click / tap a word to choose it.
function drawTextButtons() {
  const groups = [
    { options: ['DRUM', 'DIAL'],  selected: viewDial ? 1 : 0,  set: (k) => setView(k === 1) },
    { options: ['DARK', 'LIGHT'], selected: lightMode ? 1 : 0, set: (k) => setLight(k === 1) },
  ];
  const c = L.ctrl;
  textFont(FONT);
  textSize(c.size);
  textAlign(LEFT, CENTER);

  // measure everything first, so the whole row can be right-aligned
  let total = 0;
  for (let g = 0; g < groups.length; g++) {
    for (let k = 0; k < groups[g].options.length; k++) {
      total += textWidth(groups[g].options[k]) + (k > 0 ? c.optGap : 0);
    }
    if (g > 0) total += c.groupGap;
  }

  let x = c.right - total;
  // loop over the pairs, then over the two words in each pair
  for (let g = 0; g < groups.length; g++) {
    const grp = groups[g];
    if (g > 0) x += c.groupGap;
    for (let k = 0; k < grp.options.length; k++) {
      if (k > 0) x += c.optGap;
      const label = grp.options[k];
      const w = textWidth(label);
      // tap area: a bit wider and taller than the word itself
      const box = { x: x - c.optGap / 2, y: c.lineY - c.h / 2, w: w + c.optGap, h: c.h, action: () => grp.set(k) };
      const active = k === grp.selected;
      const hover = !active && canHover && isInside(box);

      noStroke();
      fill(fg(active ? 255 : hover ? 200 : 100));
      text(label, x, c.lineY);
      if (active) {                          // thin underline under the chosen word
        stroke(fg(255));
        strokeWeight(1);
        line(x, c.lineY + c.size * 0.75, x + w, c.lineY + c.size * 0.75);
      }
      hitBoxes.push(box);
      x += w;
    }
  }
}

// =================================================================
//  CURRENT LOCATION
// =================================================================
// 1) The browser always knows its own time zone, so the time is right
//    immediately (no permission needed).
// 2) Then we ask for location permission. If allowed, we turn the
//    latitude/longitude into a city name with a free reverse-geocoding API.
//    If not allowed, we keep the name taken from the time zone.
function addCurrentLocation() {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone; // e.g. "America/New_York"
  const here = { name: nameFromTimeZone(tz), tz, here: true };
  // if this time zone is already in the list (e.g. New York), remove the copy
  const dup = CITIES.findIndex((c) => c.tz === tz);
  if (dup !== -1) CITIES.splice(dup, 1);
  CITIES.unshift(here);   // put it first in the list
  cityIndex = 0;          // and show it by default

  if (!navigator.geolocation) return;
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const { latitude, longitude } = pos.coords;
      const url = 'https://api.bigdatacloud.net/data/reverse-geocode-client' +
        '?latitude=' + latitude + '&longitude=' + longitude + '&localityLanguage=en';
      fetch(url)
        .then((res) => res.json())
        .then((data) => {
          const name = data.city || data.locality;
          if (name) here.name = name.toUpperCase();
        })
        .catch(() => {}); // no internet -> keep the time-zone name
    },
    () => {},             // permission denied -> keep the time-zone name
    { timeout: 10000 }
  );
}

// "America/New_York" -> "NEW YORK"
function nameFromTimeZone(tz) {
  const last = tz.split('/').pop();
  return last.replace(/_/g, ' ').toUpperCase();
}

// =================================================================
//  HELPERS
// =================================================================
// mix a theme color between DARK and LIGHT using the animated 'theme' value
function mixTheme(name) {
  const a = DARK[name], b = LIGHT[name];
  return [lerp(a[0], b[0], theme), lerp(a[1], b[1], theme), lerp(a[2], b[2], theme)];
}

// foreground "ink" color with transparency: white in dark mode, near-black in light mode
function fg(alpha) {
  const c = mixTheme('ink');
  return color(c[0], c[1], c[2], alpha);
}

function setLight(on) {
  lightMode = on;
  document.body.style.background = on ? '#fff' : '#000';
}

function toggleLight() {
  setLight(!lightMode);
}

function getTime(city, date) {
  const parts = city.fmt.formatToParts(date);
  const get = (type) => parseInt(parts.find((p) => p.type === type).value, 10);
  return { h: get('hour') % 24, m: get('minute'), s: get('second') };
}

// ---- time difference from New York ----
const NY_FMT = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/New_York', year: 'numeric', month: 'numeric', day: 'numeric',
  hour: 'numeric', minute: 'numeric', hourCycle: 'h23',
});

// Read a formatter's date+time as if it were UTC, and return it in minutes.
// Comparing two cities this way gives their difference in minutes.
function wallClockMinutes(fmt, date) {
  const parts = fmt.formatToParts(date);
  const get = (type) => parseInt(parts.find((p) => p.type === type).value, 10);
  const ms = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour') % 24, get('minute'));
  return ms / 60000;
}

// New York's time-zone name right now: "EDT" in summer, "EST" in winter
const NY_ABBR_FMT = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', timeZoneName: 'short' });
function eastern(date) {
  const part = NY_ABBR_FMT.formatToParts(date).find((p) => p.type === 'timeZoneName');
  return part ? part.value : 'ET';
}

// e.g. Seoul -> "EDT +13", LA -> "EDT −3", Mumbai -> "EDT +9:30", New York -> "EDT"
function getOffset(city, date) {
  const diff = wallClockMinutes(city.fullFmt, date) - wallClockMinutes(NY_FMT, date);
  const base = eastern(date);
  if (diff === 0) return base;
  const sign = diff > 0 ? '+' : '−';
  const h = floor(abs(diff) / 60);
  const m = abs(diff) % 60;
  return base + ' ' + sign + h + (m ? ':' + nf(m, 2) : '');
}

function isInside(b, x = mouseX, y = mouseY) {
  return x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h;
}

function setCity(i) {
  cityIndex = i;      // the rings spin to the new time on their own (see Ring.update)
  lastDaytime = null; // re-check day / night for the new city on the next frame
}

function setView(dial) {
  viewDial = dial;
}

function toggleView() {
  setView(!viewDial);
}

// =================================================================
//  MOUSE + KEYBOARD
// =================================================================
// Where is the pointer? (first finger on a touch screen, otherwise the mouse)
function pointer() {
  if (touches.length > 0) return { x: touches[0].x, y: touches[0].y };
  return { x: mouseX, y: mouseY };
}

function pressAt(p) {
  pressX = lastX = p.x;
  pressY = lastY = p.y;
  dragging = false;
  // pressing on the city row scrolls the row instead of rotating the clock
  listDragging = L && L.list.maxScroll > 0 && p.y >= L.list.top - 12;
  if (listDragging) listVel = 0;
}

// Rotate by how far the pointer moved since last time.
// (We measure this ourselves: on iPhone Safari p5's movedX can be undefined,
//  which used to turn the angles into NaN and make the clock vanish.)
function dragTo(p) {
  const dx = p.x - lastX, dy = p.y - lastY;
  lastX = p.x;
  lastY = p.y;
  if (!isFinite(dx) || !isFinite(dy)) return;
  if (dist(p.x, p.y, pressX, pressY) > 6) dragging = true;
  if (listDragging) {
    listScroll -= dx;            // move the row with the finger
    listVel = -dx;               // remember the speed for the glide
    return;
  }
  dragYaw += dx * 0.008;
  dragPitch += dy * 0.006;
}

// a click / tap that didn't move = press a button or a city
function releaseAt(p) {
  let hitSomething = false;
  if (!dragging) {
    for (const b of hitBoxes) {
      if (isInside(b, p.x, p.y)) { b.action(); hitSomething = true; break; }
    }
  }
  const wasTap = !dragging;
  dragging = false;
  listDragging = false;
  return { wasTap, hitSomething };
}

function mousePressed() { pressAt(pointer()); }
function mouseDragged() { dragTo(pointer()); }
function mouseReleased() { releaseAt(pointer()); }

function doubleClicked() {
  if (!hitBoxes.some((b) => isInside(b))) toggleView();
}

function mouseWheel(e) {
  if (L && L.list.maxScroll > 0 && mouseY >= L.list.top - 12) {   // over the city row: scroll it
    listScroll += e.deltaX || e.delta;
    return false;
  }
  zoom = constrain(zoom - e.delta * 0.001, 0.55, 1.8);
  return false; // stop the page from scrolling
}

// ---- touch screens ----
// one finger = drag to rotate, two fingers = pinch to zoom,
// tap = buttons / cities, double-tap = switch view
function touchStarted() {
  if (touches.length === 2) {
    pinchStart = dist(touches[0].x, touches[0].y, touches[1].x, touches[1].y);
    zoomStart = zoom;
    dragging = true;                 // a pinch is never a tap
  } else if (touches.length === 1) {
    pressAt(pointer());
  }
  return false; // don't scroll the page
}

function touchMoved() {
  if (touches.length === 2 && pinchStart > 0) {
    const d = dist(touches[0].x, touches[0].y, touches[1].x, touches[1].y);
    if (d > 0) zoom = constrain(zoomStart * (d / pinchStart), 0.55, 1.8);
  } else if (touches.length === 1 && pinchStart === 0) {
    dragTo(pointer());
  }
  return false;
}

function touchEnded() {
  if (touches.length > 0) return false;      // other fingers still down
  const r = releaseAt({ x: lastX, y: lastY });
  if (pinchStart === 0 && r.wasTap && !r.hitSomething) {
    if (millis() - lastTap < 300) toggleView();   // double-tap
    lastTap = millis();
  }
  pinchStart = 0;
  return false;
}

function keyPressed() {
  if (key >= '1' && key <= String(CITIES.length)) setCity(int(key) - 1);
  if (key === 'v' || key === 'V') toggleView();
  if (key === 'l' || key === 'L') toggleLight();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
