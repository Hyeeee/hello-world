// =============================================================
//  stall.js — 포장마차 무대 + 원판 붕어빵 기계 + 식힘망 + 손님
//  좌표: 조리대 윗면 y = -24.  원판 중심 = WHEEL_C.
//  손님은 포장마차 건너편(z 뒤쪽)에 서 있어요.
// =============================================================
import * as THREE from 'three';
import { fishPath, crustColor } from './art2d.js';
import { adapter, roundedRect, steel, woodMat, shadowy } from './models.js';
import { streetTexture, brushedTexture, signBandTexture, scallopTexture } from './textures.js';

export const COUNTER_Y = -24;
export const WHEEL_C = new THREE.Vector3(-150, 0, -150);
export const SLOTS = 8;            // 틀 8개
export const SLOT_R = 228;         // 원판 중심 → 틀 중심 거리
export const MOLD_S = 0.6;         // 틀/붕어빵 크기 (원래 크기의 60%)
export const DECK_Y = 16;          // 원판 윗면 높이
export const RACK = { x: 560, z: -150, y: 44 };

// =============================================================
//  포장마차 (조리대, 노란 카트, 빨간 천막, 간판, 비닐, 전구, 밤거리)
// =============================================================
export function makeStall() {
  const g = new THREE.Group();
  const lights = [];

  // 스테인리스 조리대
  const brushed = brushedTexture();
  brushed.repeat.set(3, 6);
  const counter = new THREE.Mesh(
    new THREE.PlaneGeometry(2800, 1300),
    new THREE.MeshStandardMaterial({ color: 0x8c9096, metalness: 0.7, roughness: 0.5, bumpMap: brushed, bumpScale: 0.6 }),
  );
  counter.rotation.x = -Math.PI / 2;
  counter.position.set(0, COUNTER_Y, 50);
  counter.receiveShadow = true;
  g.add(counter);

  // 손님 쪽 카트 테두리: 노란색 + 빨간 줄
  const yellow = new THREE.MeshStandardMaterial({ color: 0xf3c331, roughness: 0.45, metalness: 0.2 });
  const red = new THREE.MeshStandardMaterial({ color: 0xc8261d, roughness: 0.45, metalness: 0.2 });
  const lip = new THREE.Mesh(new THREE.BoxGeometry(2800, 70, 50), yellow);
  lip.position.set(0, COUNTER_Y + 35, -620);
  g.add(lip);
  const lipFront = new THREE.Mesh(new THREE.BoxGeometry(2800, 260, 20), yellow);
  lipFront.position.set(0, COUNTER_Y - 130, -640);
  g.add(lipFront);
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(2800, 26, 22), red);
  stripe.position.set(0, COUNTER_Y + 20, -598);
  g.add(stripe);

  // 바깥 길바닥 + 밤거리 배경
  const street = new THREE.Mesh(
    new THREE.PlaneGeometry(6000, 3000),
    new THREE.MeshStandardMaterial({ color: 0x1b1a20, roughness: 0.9 }),
  );
  street.rotation.x = -Math.PI / 2;
  street.position.set(0, -380, -1800);
  street.receiveShadow = true;
  g.add(street);
  const backdrop = new THREE.Mesh(
    new THREE.PlaneGeometry(5200, 2600),
    new THREE.MeshBasicMaterial({ map: streetTexture() }),
  );
  backdrop.position.set(0, 400, -2200);
  g.add(backdrop);

  // 빨간 천막 기둥 (네 귀퉁이)
  for (const [x, z] of [[-1300, -660], [1300, -660], [-1300, 640], [1300, 640]]) {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(12, 12, 1500, 12), red);
    pole.position.set(x, COUNTER_Y + 700, z);
    g.add(pole);
  }
  // 간판 띠 + 물결 천 (손님 머리 위)
  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(2600, 325),
    new THREE.MeshStandardMaterial({ map: signBandTexture(T('sign1'), T('sign2')), roughness: 0.6 }),
  );
  sign.scale.setScalar(0.3);
  sign.position.set(600, 70, -420);
  sign.rotation.x = -0.35;
  g.add(sign);
  g.userData.sign = sign;
  const scallopTex = scallopTexture();
  scallopTex.repeat.set(10, 1);
  const scallop = new THREE.Mesh(
    new THREE.PlaneGeometry(2600, 110),
    new THREE.MeshStandardMaterial({ map: scallopTex, transparent: true, alphaTest: 0.4, roughness: 0.7, side: THREE.DoubleSide }),
  );
  scallop.position.set(0, 520, -660);
  scallop.rotation.x = 0.25;
  g.add(scallop);
  // 빨간 천막 지붕 (양옆으로 보이게)
  const tarp = new THREE.MeshStandardMaterial({ color: 0xc8261d, roughness: 0.75, side: THREE.DoubleSide, emissive: 0x4a0a05, emissiveIntensity: 0.4 });
  for (const sx of [-1, 1]) {
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(1300, 1500), tarp);
    wall.rotation.y = Math.PI / 2;
    wall.position.set(sx * 1300, 700, 0);
    g.add(wall);
    // 투명 비닐 커튼
    const vinyl = new THREE.Mesh(
      new THREE.PlaneGeometry(380, 700),
      new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.16, roughness: 0.05, clearcoat: 1, side: THREE.DoubleSide, depthWrite: false }),
    );
    vinyl.position.set(sx * 1080, 300, -660);
    g.add(vinyl);
  }

  // 전구 3개: 빛나는 공 + 전선 + 따뜻한 점광원
  for (const x of [-560, -60, 460]) {
    const bulb = new THREE.Mesh(
      new THREE.SphereGeometry(20, 16, 12),
      new THREE.MeshStandardMaterial({ color: 0xfff1c8, emissive: 0xffc56a, emissiveIntensity: 3 }),
    );
    bulb.position.set(x, 640, -480);
    g.add(bulb);
    const cord = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 700, 6), new THREE.MeshBasicMaterial({ color: 0x111111 }));
    cord.position.set(x, 640 + 360, -480);
    g.add(cord);
    const light = new THREE.PointLight(0xffb062, 1.1, 1500, 0);
    light.position.set(x, 600, -420);
    g.add(light);
    lights.push(light);
  }

  // 종이봉투 쌓아둔 것 (장식)
  const kraft = new THREE.MeshStandardMaterial({ color: 0xc69c66, roughness: 0.9 });
  for (let i = 0; i < 6; i++) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(170, 3, 120), kraft);
    b.position.set(830, COUNTER_Y + 2 + i * 3.2, 150);
    b.rotation.y = (i % 2 ? 0.08 : -0.06);
    g.add(b);
  }

  // 가격표 대신 작은 계산통 (동전 통)
  const tin = new THREE.Mesh(new THREE.CylinderGeometry(55, 55, 70, 24), new THREE.MeshStandardMaterial({ color: 0x9aa0a6, metalness: 1, roughness: 0.3 }));
  tin.position.set(860, COUNTER_Y + 35, -60);
  g.add(tin);

  shadowy(g);
  backdrop.castShadow = false;
  return { group: g, lights };
}

// 언어가 바뀌면 간판 글씨 다시 그리기
export function updateSign(stall) {
  const s = stall.group.userData.sign;
  s.material.map.dispose();
  s.material.map = signBandTexture(T('sign1'), T('sign2'));
  s.material.needsUpdate = true;
}

// =============================================================
//  원판 붕어빵 기계 (틀 8개가 빙 둘러 있고, 원판째 돌아가요)
// =============================================================
function moldBaseGeo() {
  const plate = new THREE.Shape();
  roundedRect(plate, -192, -114, 384, 228, 30);
  const hole = new THREE.Path();
  fishPath(adapter(hole, 1.06));
  plate.holes.push(hole);
  const geo = new THREE.ExtrudeGeometry(plate, { depth: 26, bevelEnabled: true, bevelThickness: 3, bevelSize: 3, bevelSegments: 2, curveSegments: 24 });
  geo.rotateX(-Math.PI / 2);
  return geo;
}
function moldLidGeo() {
  const plate = new THREE.Shape();
  roundedRect(plate, -192, -114, 384, 228, 30);
  const geo = new THREE.ExtrudeGeometry(plate, { depth: 16, bevelEnabled: true, bevelThickness: 3, bevelSize: 3, bevelSegments: 2, curveSegments: 16 });
  geo.rotateX(-Math.PI / 2);
  return geo;
}

export function makeWheel(iron, fishGeo) {
  const wheel = new THREE.Group();
  wheel.position.copy(WHEEL_C);

  // 몸통 (검은 원통) + 윗판
  const body = new THREE.Mesh(new THREE.CylinderGeometry(392, 380, 360, 64), new THREE.MeshStandardMaterial({ color: 0x1b1a19, metalness: 0.5, roughness: 0.6 }));
  body.position.y = DECK_Y - 22 - 180;
  wheel.add(body);
  const deck = new THREE.Mesh(new THREE.CylinderGeometry(392, 392, 22, 64), iron);
  deck.position.y = DECK_Y - 11;
  wheel.add(deck);
  // 가스불 (원판 밑 가장자리에서 새어 나오는 주황빛)
  const flame = new THREE.Mesh(
    new THREE.TorusGeometry(388, 5, 8, 96),
    new THREE.MeshStandardMaterial({ color: 0xff7a2a, emissive: 0xff6a1a, emissiveIntensity: 1.6 }),
  );
  flame.rotation.x = Math.PI / 2;
  flame.position.y = DECK_Y - 26;
  wheel.add(flame);

  // 돌아가는 부분
  const rotor = new THREE.Group();
  wheel.add(rotor);
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(92, 98, 40, 40), iron);
  hub.position.y = DECK_Y + 20;
  rotor.add(hub);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(50, 56, 22, 32), steel());
  cap.position.y = DECK_Y + 50;
  rotor.add(cap);

  const baseGeo = moldBaseGeo();
  const lidGeo = moldLidGeo();
  const floorGeo = new THREE.ShapeGeometry((() => { const s = new THREE.Shape(); fishPath(adapter(s, 1.08)); return s; })(), 24);
  floorGeo.rotateX(-Math.PI / 2);
  const floorMat = new THREE.MeshStandardMaterial({ color: 0x141312, metalness: 0.4, roughness: 0.7 });

  const slots = [];
  for (let i = 0; i < SLOTS; i++) {
    const a = (i / SLOTS) * Math.PI * 2;
    // pivot: 원판 위 위치 + 붕어빵 머리가 바깥을 보게 회전
    const pivot = new THREE.Group();
    pivot.position.set(Math.sin(a) * SLOT_R, DECK_Y, Math.cos(a) * SLOT_R);
    pivot.rotation.y = a - Math.PI / 2;
    pivot.scale.setScalar(MOLD_S);
    rotor.add(pivot);
    // inner: 반 바퀴 뒤집기 애니메이션용 (붕어빵 방향 축으로 돌기)
    const inner = new THREE.Group();
    pivot.add(inner);
    // base: 이 안의 좌표 = 예전 틀 좌표 그대로 (반죽, 팥, 붕어빵이 여기 들어감)
    const base = new THREE.Group();
    inner.add(base);
    base.add(new THREE.Mesh(baseGeo, iron));
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.y = 2;
    base.add(floor);
    // 바깥쪽 손잡이
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(7, 7, 90, 12), steel());
    rod.rotation.z = Math.PI / 2;
    rod.position.set(238, 14, 0);
    base.add(rod);
    const grip = new THREE.Mesh(new THREE.CylinderGeometry(15, 15, 90, 16), woodMat());
    grip.rotation.z = Math.PI / 2;
    grip.position.set(325, 14, 0);
    base.add(grip);
    // 뚜껑: 옆 모서리(경첩)를 축으로 열리고 닫힘. 위에는 붕어빵 모양이 볼록
    const lid = new THREE.Group();
    lid.position.set(0, 30, -114);
    const lidBody = new THREE.Group();
    lidBody.position.z = 114;
    lid.add(lidBody);
    lidBody.add(new THREE.Mesh(lidGeo, iron));
    const bulge = new THREE.Mesh(fishGeo, iron);
    bulge.position.y = 18;
    bulge.scale.set(1, 0.55, 1);
    lidBody.add(bulge);
    inner.add(lid);
    // 익힘 표시등 (원판 가장자리)
    const lamp = new THREE.Mesh(
      new THREE.SphereGeometry(11, 16, 12),
      new THREE.MeshStandardMaterial({ color: 0x333333, emissive: 0x000000, emissiveIntensity: 1.5 }),
    );
    lamp.position.set(Math.sin(a) * 372, DECK_Y + 10, Math.cos(a) * 372);
    rotor.add(lamp);
    shadowy(pivot);
    slots.push({ i, a, pivot, inner, base, lid, lamp });
  }
  shadowy(body);
  return { group: wheel, rotor, slots };
}

// 표시등 색: 비었으면 꺼짐, 굽는 중이면 익힘 색, 노릇하면 초록, 타기 직전이면 빨강 깜빡
export function setLamp(slot, d, t) {
  const m = slot.lamp.material;
  if (d == null) { m.emissive.setRGB(0, 0, 0); m.color.set(0x333333); return; }
  let r, g, b;
  if (d >= 0.58 && d <= 0.8) { r = 0.35; g = 1; b = 0.3; }
  else if (d > 0.86) { const k = 0.5 + 0.5 * Math.sin(t * 14); r = 1 * k + 0.2; g = 0.15 * k; b = 0.08; }
  else { const c = crustColor(d); r = c[0] / 255; g = c[1] / 255 * 0.8; b = c[2] / 255 * 0.4; }
  m.emissive.setRGB(r, g, b);
  m.color.setRGB(r, g, b);
}

// =============================================================
//  식힘망 (다 구운 붕어빵을 올려두는 스테인리스 망)
// =============================================================
export function makeRack() {
  const g = new THREE.Group();
  g.position.set(RACK.x, 0, RACK.z);
  const s = steel();
  for (let k = 0; k < 12; k++) {
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(3.5, 3.5, 400, 8), s);
    rod.rotation.x = Math.PI / 2;
    rod.position.set(-170 + k * 31, RACK.y, 0);
    g.add(rod);
  }
  for (const z of [-195, 195]) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(380, 10, 14), s);
    bar.position.set(0, RACK.y, z);
    g.add(bar);
    for (const x of [-180, 180]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(5, 5, RACK.y - COUNTER_Y, 8), s);
      leg.position.set(x, (RACK.y + COUNTER_Y) / 2, z);
      g.add(leg);
    }
  }
  return shadowy(g);
}

// 식힘망 위 자리 (위에서부터 2줄 × 5칸)
export function rackSpot(i) {
  const col = i % 5, row = Math.floor(i / 5);
  return new THREE.Vector3(RACK.x - 130 + col * 65, RACK.y + 6 + Math.floor(i / 10) * 18, RACK.z - 70 + row * 140);
}

// =============================================================
//  손님 (포장마차 건너편에 서 있는 사람)
// =============================================================
export const QUEUE_Z = -800;
export const queueX = (i) => -380 + i * 260;

export function makeCustomer(skin, coat, hairColor, hat) {
  const g = new THREE.Group();
  const coatMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(`rgb(${coat.join(',')})`), roughness: 0.85 });
  const skinMat = new THREE.MeshPhysicalMaterial({ color: new THREE.Color(`rgb(${skin.join(',')})`), roughness: 0.6, sheen: 0.3 });
  const hairMat = new THREE.MeshStandardMaterial({ color: hairColor, roughness: 0.8 });
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(95, 220, 8, 24), coatMat);
  torso.position.y = -60;
  g.add(torso);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(26, 30, 40, 16), skinMat);
  neck.position.y = 160;
  g.add(neck);
  const head = new THREE.Mesh(new THREE.SphereGeometry(62, 24, 18), skinMat);
  head.scale.set(1, 1.12, 1);
  head.position.y = 232;
  g.add(head);
  const hair = new THREE.Mesh(new THREE.SphereGeometry(66, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.55), hat ? coatMat : hairMat);
  hair.position.set(0, 240, -6);
  hair.rotation.x = -0.25;
  g.add(hair);
  if (hat) {
    const pom = new THREE.Mesh(new THREE.SphereGeometry(18, 12, 10), new THREE.MeshStandardMaterial({ color: 0xf4efe6, roughness: 0.9 }));
    pom.position.set(0, 312, -14);
    g.add(pom);
  }
  // 목도리
  const scarf = new THREE.Mesh(new THREE.TorusGeometry(48, 16, 10, 24), new THREE.MeshStandardMaterial({ color: hat ? 0xf3c331 : 0xe9e1d3, roughness: 0.9 }));
  scarf.rotation.x = Math.PI / 2;
  scarf.position.y = 148;
  g.add(scarf);
  return shadowy(g);
}
