// =============================================================
//  models.js — 3D 물체 만들기 (전부 코드로 만든 도형, 3D 파일 없음)
//  단위: 붕어빵 길이 ≈ 300.  y = 위쪽.  x = 오른쪽(붕어빵 머리 방향).
//  z = 화면 앞쪽(카메라 쪽).  캔버스 그림의 y(아래쪽) = 3D의 z(앞쪽)
// =============================================================
import * as THREE from 'three';
import { fishPath, BEAN } from './art2d.js';

// ---------- 2D 외곽선 → Three.js Shape ----------
// fishPath()는 canvas용 함수지만, 같은 이름의 함수를 가진 "어댑터"를 넘기면
// 그대로 Three.js Shape를 그려줘요. (y는 위아래가 반대라서 -y)
export function adapter(target, k = 1) {
  return {
    beginPath() {},
    closePath() {},
    moveTo: (x, y) => target.moveTo(x * k, -y * k),
    lineTo: (x, y) => target.lineTo(x * k, -y * k),
    bezierCurveTo: (a, b, c, d, e, f) => target.bezierCurveTo(a * k, -b * k, c * k, -d * k, e * k, -f * k),
    quadraticCurveTo: (a, b, c, d) => target.quadraticCurveTo(a * k, -b * k, c * k, -d * k),
  };
}
export function fishShape(k = 1) {
  const s = new THREE.Shape();
  fishPath(adapter(s, k));
  return s;
}
export function roundedRect(s, x, y, w, h, r) {
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
}

// 공통 재질
export const steel = () => new THREE.MeshStandardMaterial({ color: 0xc9ccd0, metalness: 1, roughness: 0.28 });
export const woodMat = () => new THREE.MeshStandardMaterial({ color: 0x8a5a34, roughness: 0.55 });

export function shadowy(obj) {
  obj.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return obj;
}

// ---------- 조리대 + 인덕션 판 ----------
export function makeCounter(woodTex) {
  const g = new THREE.Group();
  woodTex.repeat.set(4, 4);
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(4000, 4000),
    new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.7 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -24;
  floor.receiveShadow = true;
  g.add(floor);
  // 검은 유리 상판 (붕어빵 틀 밑)
  const top = new THREE.Mesh(
    new THREE.BoxGeometry(700, 18, 430),
    new THREE.MeshPhysicalMaterial({ color: 0x161616, roughness: 0.34, clearcoat: 0.5, clearcoatRoughness: 0.25 }),
  );
  top.position.set(-40, -15, 10);
  top.receiveShadow = true;
  g.add(top);
  // 화구 링
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(150, 2, 8, 64),
    new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.4 }),
  );
  ring.rotation.x = -Math.PI / 2;
  ring.scale.set(1.5, 0.9, 1);
  ring.position.y = -5.5;
  g.add(ring);
  return g;
}

// ---------- 무쇠 붕어빵 틀 ----------
export function makeMold(noiseTex) {
  const group = new THREE.Group();
  noiseTex.repeat.set(3, 3);
  const iron = new THREE.MeshStandardMaterial({
    color: 0x2c2a28, metalness: 0.55, roughness: 0.6, bumpMap: noiseTex, bumpScale: 1.2,
  });

  // 둥근 사각형 판에 붕어빵 모양 구멍 뚫기
  const plate = new THREE.Shape();
  roundedRect(plate, -192, -114, 384, 228, 30);
  const hole = new THREE.Path();
  fishPath(adapter(hole, 1.06));
  plate.holes.push(hole);
  const plateGeo = new THREE.ExtrudeGeometry(plate, {
    depth: 26, bevelEnabled: true, bevelThickness: 3, bevelSize: 3, bevelSegments: 3, curveSegments: 28,
  });
  plateGeo.rotateX(-Math.PI / 2);
  const plateMesh = new THREE.Mesh(plateGeo, iron);
  group.add(plateMesh);

  // 홈 바닥
  const floorGeo = new THREE.ShapeGeometry(fishShape(1.08), 28);
  floorGeo.rotateX(-Math.PI / 2);
  const floor = new THREE.Mesh(floorGeo, new THREE.MeshStandardMaterial({ color: 0x141312, metalness: 0.4, roughness: 0.7 }));
  floor.position.y = 2;
  group.add(floor);

  // 손잡이 (왼쪽): 쇠막대 + 나무 손잡이
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(7, 7, 90, 16), steel());
  rod.rotation.z = Math.PI / 2;
  rod.position.set(-238, 14, 0);
  group.add(rod);
  const grip = new THREE.Mesh(new THREE.CylinderGeometry(15, 15, 90, 24), woodMat());
  grip.rotation.z = Math.PI / 2;
  grip.position.set(-325, 14, 0);
  group.add(grip);

  shadowy(group);
  return { group, iron };
}

// ---------- 붕어빵 (배는 통통, 꼬리·지느러미·테두리는 날렵하게) ----------
// 촘촘한 격자 판을 만들고, 점마다 "두께 지도" 값만큼 위로 올려요.
//  → 넓은 몸통 가운데는 높이 솟고, 좁은 꼬리/지느러미/가장자리는 얇아짐
// 붕어빵 바깥 부분은 텍스처가 투명해서 alphaTest로 잘려나가요.
export function makeFish(tex, thickness) {
  const geo = makeFishGeometry(thickness);
  const mat = makeFishMaterial(tex);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return { mesh, mat, geo };
}

export function makeFishMaterial(tex) {
  return new THREE.MeshPhysicalMaterial({
    map: tex.map, bumpMap: tex.bump, bumpScale: 5, alphaTest: 0.5, side: THREE.DoubleSide,
    roughness: 0.58, sheen: 0.4, sheenRoughness: 0.6, sheenColor: new THREE.Color(0xffe2b0),
    clearcoat: 0.12, clearcoatRoughness: 0.5,
  });
}

export function makeFishGeometry(thickness) {
  const SIZE = 340, SEG = 220, H = 40;
  const geo = new THREE.PlaneGeometry(SIZE, SIZE, SEG, SEG);
  geo.rotateX(-Math.PI / 2); // 바닥에 눕히기 (x = 오른쪽, z = 앞쪽)
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const t = thickness(pos.getX(i), pos.getZ(i));
    // pow(…, 0.55): 가운데는 둥글게 볼록, 가장자리로 갈수록 빠르게 얇아짐
    pos.setY(i, t > 0 ? 2 + H * Math.pow(t, 0.55) : 0);
  }
  geo.computeVertexNormals(); // 조명 계산용 표면 방향 다시 계산
  return geo;
}

// ---------- 반죽 (액체, 캔버스 텍스처) ----------
export function makeBatter(texture) {
  const geo = new THREE.PlaneGeometry(440, 280);
  geo.rotateX(-Math.PI / 2);
  const mat = new THREE.MeshPhysicalMaterial({
    map: texture, transparent: true, roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.08, depthWrite: false,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.receiveShadow = true;
  return mesh;
}

// ---------- 팥앙금 줄 (머리 → 꼬리) ----------
export const beanZ = (x) => Math.sin(x * 0.045) * 4; // 살짝 구불구불
export function makeBeanMaterial(bumpTex) {
  bumpTex.repeat.set(5, 1.4);
  return new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(`rgb(${BEAN[0]},${BEAN[1]},${BEAN[2]})`),
    roughness: 0.48, clearcoat: 0.35, clearcoatRoughness: 0.4, bumpMap: bumpTex, bumpScale: 3,
  });
}
// x0(머리 쪽)부터 x1(꼬리 쪽)까지 튜브 + 양 끝 둥근 마개
export const BEAN_R = 24; // 팥 줄 굵기(반지름)
// 팥 알갱이: 같은 작은 구를 수백 개 "인스턴스"로 한 번에 그려요 (빠름)
const GRAIN_GEO = new THREE.SphereGeometry(1, 10, 8);
const GRAIN_MAT = new THREE.MeshPhysicalMaterial({ roughness: 0.32, clearcoat: 0.6, clearcoatRoughness: 0.25 });
const hash1 = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _c = new THREE.Color();

export function buildBean(group, mat, x0, x1) {
  for (const c of [...group.children]) { if (c.isInstancedMesh) c.dispose(); else c.geometry.dispose(); group.remove(c); }
  if (x0 - x1 < 2) return;
  const pts = [];
  const n = Math.max(2, Math.ceil((x0 - x1) / 12));
  for (let i = 0; i <= n; i++) {
    const x = x0 + ((x1 - x0) * i) / n;
    pts.push(new THREE.Vector3(x, 0, beanZ(x)));
  }
  const curve = new THREE.CatmullRomCurve3(pts);
  // 앙금 몸통은 살짝 가늘게 (알갱이가 겉을 덮으니까)
  const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, n * 3, BEAN_R * 0.82, 20, false), mat);
  group.add(tube);
  for (const x of [x0, x1]) {
    const cap = new THREE.Mesh(new THREE.SphereGeometry(BEAN_R * 0.82, 20, 14), mat);
    cap.position.set(x, 0, beanZ(x));
    group.add(cap);
  }
  // 겉에 붙은 팥 알갱이들 (길이에 비례해서 개수 결정, 위치는 x로 정해져서 매 프레임 같은 자리)
  const count = Math.min(420, Math.floor((x0 - x1) * 2.2) + 12);
  const grains = new THREE.InstancedMesh(GRAIN_GEO, GRAIN_MAT, count);
  for (let i = 0; i < count; i++) {
    const h = hash1(i * 3.17 + 1), h2 = hash1(i * 7.31 + 2), h3 = hash1(i * 1.93 + 3);
    const x = x0 - (x0 - x1) * h;
    const ang = (h2 - 0.5) * Math.PI * 1.15;          // 위쪽 반원 위주로
    const r = BEAN_R * (0.78 + h3 * 0.12);
    const pos = new THREE.Vector3(x, Math.cos(ang) * r, beanZ(x) + Math.sin(ang) * r);
    const size = 4.2 + h3 * 3.2;                       // 팥알 크기
    _e.set(h * 6, h2 * 6, h3 * 6);
    _q.setFromEuler(_e);
    _m.compose(pos, _q, new THREE.Vector3(size * 1.25, size, size));  // 살짝 길쭉한 콩 모양
    grains.setMatrixAt(i, _m);
    // 진한 팥 / 붉은 팥 / 껍질 벗겨진 연한 팥 섞기
    const k = hash1(i * 5.5 + 4);
    if (k < 0.55) _c.setRGB(0.30, 0.08, 0.11);
    else if (k < 0.85) _c.setRGB(0.42, 0.13, 0.17);
    else _c.setRGB(0.55, 0.28, 0.30);
    grains.setColorAt(i, _c.convertSRGBToLinear());
  }
  grains.instanceMatrix.needsUpdate = true;
  if (grains.instanceColor) grains.instanceColor.needsUpdate = true;
  group.add(grains);
  shadowy(group);
}

// ---------- 놋쇠 주전자 (주둥이 끝 = 원점) ----------
export function makeKettle() {
  const group = new THREE.Group();
  const brass = new THREE.MeshStandardMaterial({ color: 0xd8aa4c, metalness: 1, roughness: 0.26 });
  const body = new THREE.Group();
  const profile = [[0, 0], [42, 0], [54, 16], [58, 46], [52, 78], [40, 98], [38, 104], [0, 104]].map(([r, y]) => new THREE.Vector2(r, y));
  const lathe = new THREE.Mesh(new THREE.LatheGeometry(profile, 40), brass);
  body.add(lathe);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(10, 16, 12), brass);
  knob.position.y = 108;
  body.add(knob);
  const handle = new THREE.Mesh(new THREE.TorusGeometry(32, 5, 10, 24, Math.PI), brass);
  handle.rotation.z = -Math.PI / 2;
  handle.position.set(56, 52, 0);
  body.add(handle);
  // 주둥이: 곡선을 따라가는 관
  const spoutCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-36, 26, 0), new THREE.Vector3(-70, 40, 0), new THREE.Vector3(-98, 66, 0), new THREE.Vector3(-112, 86, 0),
  ]);
  body.add(new THREE.Mesh(new THREE.TubeGeometry(spoutCurve, 24, 7, 12, false), brass));
  // 주둥이 끝을 원점으로 옮겨서, 주전자를 기울이면 끝을 중심으로 돌게
  body.position.set(112, -86, 0);
  group.add(body);
  return shadowy(group);
}

export function makeStream() {
  const mat = new THREE.MeshPhysicalMaterial({ color: 0xf4e2b2, roughness: 0.2, clearcoat: 1 });
  const m = new THREE.Mesh(new THREE.CylinderGeometry(4.5, 6, 1, 16), mat);
  m.castShadow = true;
  return m;
}

// ---------- 짤주머니 (깍지 끝 = 원점) ----------
export function makePipingBag() {
  const group = new THREE.Group();
  const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(10, 4, 26, 20), steel());
  nozzle.position.y = 13;
  group.add(nozzle);
  const outer = [[10, 24], [20, 50], [36, 90], [48, 130], [44, 160], [24, 178], [6, 186]].map(([r, y]) => new THREE.Vector2(r, y));
  const bag = new THREE.Mesh(
    new THREE.LatheGeometry(outer, 32),
    new THREE.MeshPhysicalMaterial({
      color: 0xffffff, transparent: true, opacity: 0.32, roughness: 0.12, clearcoat: 1, side: THREE.DoubleSide, depthWrite: false,
    }),
  );
  group.add(bag);
  const inner = [[8, 24], [17, 50], [32, 90], [42, 124], [0, 132]].map(([r, y]) => new THREE.Vector2(r, y));
  const beanFill = new THREE.Mesh(
    new THREE.LatheGeometry(inner, 32),
    new THREE.MeshStandardMaterial({ color: new THREE.Color(`rgb(${BEAN[0]},${BEAN[1]},${BEAN[2]})`), roughness: 0.5 }),
  );
  group.add(beanFill);
  const twist = new THREE.Mesh(new THREE.SphereGeometry(10, 12, 10), new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.3 }));
  twist.scale.set(1, 1.6, 1);
  twist.position.y = 192;
  group.add(twist);
  group.userData.bag = bag;
  return shadowy(group);
}

// ---------- 집게 ----------
export function makeTongs() {
  const group = new THREE.Group();
  for (const dz of [-12, 12]) {
    const arm = new THREE.Mesh(new THREE.BoxGeometry(6, 220, 10), steel());
    arm.position.set(70, 95, dz);
    arm.rotation.z = -0.62;
    group.add(arm);
  }
  return shadowy(group);
}

// ---------- 종이봉투 (위가 뚫린 상자) ----------
export function makeBag(kraftTex) {
  const W = 160, Hh = 130, D = 70;
  const group = new THREE.Group();
  const paper = new THREE.MeshStandardMaterial({ color: 0xc69c66, roughness: 0.9, side: THREE.DoubleSide });
  const front = new THREE.Mesh(
    new THREE.PlaneGeometry(W, Hh),
    new THREE.MeshStandardMaterial({ map: kraftTex, roughness: 0.9, alphaTest: 0.5, side: THREE.DoubleSide }),
  );
  front.position.set(0, Hh / 2, D / 2);
  group.add(front);
  const back = new THREE.Mesh(new THREE.PlaneGeometry(W, Hh), paper);
  back.position.set(0, Hh / 2, -D / 2);
  group.add(back);
  for (const sx of [-1, 1]) {
    const s = new THREE.Mesh(new THREE.PlaneGeometry(D, Hh), paper);
    s.rotation.y = Math.PI / 2;
    s.position.set((sx * W) / 2, Hh / 2, 0);
    group.add(s);
  }
  const bottom = new THREE.Mesh(new THREE.PlaneGeometry(W, D), paper);
  bottom.rotation.x = -Math.PI / 2;
  group.add(bottom);
  group.userData.top = Hh;
  return shadowy(group);
}

// ---------- 손님 손 (손끝 = 원점, 오른쪽에서 뻗어옴) ----------
export function makeHand(skin, coat) {
  const group = new THREE.Group();
  const skinMat = new THREE.MeshPhysicalMaterial({ color: new THREE.Color(`rgb(${skin.join(',')})`), roughness: 0.55, sheen: 0.4 });
  const coatMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(`rgb(${coat.join(',')})`), roughness: 0.85 });
  const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(36, 40, 500, 24), coatMat);
  sleeve.rotation.z = Math.PI / 2;
  sleeve.position.x = 340;
  group.add(sleeve);
  const palm = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), skinMat);
  palm.scale.set(42, 16, 34);
  palm.position.set(62, 0, 0);
  group.add(palm);
  for (let i = 0; i < 4; i++) {
    const len = 34 - Math.abs(i - 1.3) * 4;
    const f = new THREE.Mesh(new THREE.CapsuleGeometry(7.5, len, 6, 12), skinMat);
    f.rotation.z = Math.PI / 2;
    f.position.set(28 - (34 - len) / 2 + 10, 2, -24 + i * 16);
    group.add(f);
  }
  const thumb = new THREE.Mesh(new THREE.CapsuleGeometry(8.5, 26, 6, 12), skinMat);
  thumb.rotation.set(0, 0.9, Math.PI / 2);
  thumb.position.set(52, 10, -40);
  group.add(thumb);
  return shadowy(group);
}
