import * as THREE from "three";

const ivory = new THREE.MeshPhysicalMaterial({
  color: 0xfff7e9,
  roughness: 0.42,
  metalness: 0,
  clearcoat: 0.08,
  sheen: 0.85,
  sheenColor: new THREE.Color(0xffe8c8),
  side: THREE.DoubleSide
});

const warmIvory = ivory.clone();
warmIvory.color.set(0xffead0);
warmIvory.roughness = 0.48;

const innerIvory = ivory.clone();
innerIvory.color.set(0xffdfad);
innerIvory.sheen = 1;

const leafMaterial = new THREE.MeshPhysicalMaterial({
  color: 0x536f62,
  roughness: 0.58,
  sheen: 0.55,
  sheenColor: new THREE.Color(0xadc2b7),
  side: THREE.DoubleSide
});

const leafLightMaterial = leafMaterial.clone();
leafLightMaterial.color.set(0x789287);

const stemMaterial = new THREE.MeshStandardMaterial({ color: 0x536f62, roughness: 0.8 });
const champagne = new THREE.MeshPhysicalMaterial({
  color: 0xc8a66e,
  metalness: 0.62,
  roughness: 0.28,
  clearcoat: 0.45
});

const pearl = new THREE.MeshPhysicalMaterial({
  color: 0xf4eef1,
  metalness: 0.04,
  roughness: 0.16,
  clearcoat: 0.8,
  iridescence: 0.38,
  iridescenceIOR: 1.35
});

function seededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function petalGeometry(width = 0.54, length = 0.82, cup = 0.2, tipCurl = 0.12, twist = 0) {
  const sx = 10;
  const sy = 16;
  const positions = [];
  const uvs = [];
  const indices = [];

  for (let y = 0; y <= sy; y += 1) {
    const v = y / sy;
    const taper = Math.pow(Math.sin(Math.PI * Math.min(0.995, v)), 0.58);
    const half = width * taper * (0.82 + v * 0.18);
    for (let x = 0; x <= sx; x += 1) {
      const u = (x / sx) * 2 - 1;
      const px = u * half + Math.sin(v * Math.PI) * twist * (u * 0.34 + 0.2);
      const py = v * length;
      const centerCup = cup * (1 - u * u) * Math.sin(v * Math.PI);
      const edgeLift = Math.pow(Math.abs(u), 2.3) * 0.09 * Math.sin(v * Math.PI);
      const tip = tipCurl * Math.pow(v, 4) * (0.35 + 0.65 * (1 - u * u));
      const pz = centerCup + edgeLift + tip;
      positions.push(px, py, pz);
      uvs.push(x / sx, v);
    }
  }

  for (let y = 0; y < sy; y += 1) {
    for (let x = 0; x < sx; x += 1) {
      const a = y * (sx + 1) + x;
      const b = a + sx + 1;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

const petalCache = new Map();
function getPetalGeometry(key, ...args) {
  if (!petalCache.has(key)) petalCache.set(key, petalGeometry(...args));
  return petalCache.get(key);
}

export function createGardenia(scale = 1, openness = 1, seed = 1) {
  const flower = new THREE.Group();
  const rand = seededRandom(seed);
  const layers = [
    { count: 10, width: 0.46, length: 0.78, radius: 0.15, tilt: -0.46, z: -0.12, material: ivory },
    { count: 9, width: 0.39, length: 0.66, radius: 0.12, tilt: -0.24, z: -0.02, material: ivory },
    { count: 7, width: 0.31, length: 0.52, radius: 0.08, tilt: 0.02, z: 0.08, material: warmIvory },
    { count: 6, width: 0.23, length: 0.39, radius: 0.045, tilt: 0.24, z: 0.15, material: innerIvory },
    { count: 4, width: 0.16, length: 0.28, radius: 0.02, tilt: 0.42, z: 0.19, material: innerIvory }
  ];

  layers.forEach((layer, layerIndex) => {
    const count = Math.max(3, Math.round(layer.count * (0.76 + openness * 0.24)));
    const geometry = getPetalGeometry(
      `p-${layerIndex}`,
      layer.width,
      layer.length,
      0.13 + layerIndex * 0.025,
      0.08 + layerIndex * 0.018,
      (layerIndex - 2) * 0.018
    );
    for (let i = 0; i < count; i += 1) {
      const angle = (i / count) * Math.PI * 2 + layerIndex * 0.41 + (rand() - 0.5) * 0.16;
      const petal = new THREE.Mesh(geometry, layer.material);
      petal.position.set(
        Math.cos(angle) * layer.radius,
        Math.sin(angle) * layer.radius,
        layer.z + (rand() - 0.5) * 0.035
      );
      petal.rotation.set(layer.tilt * openness + (rand() - 0.5) * 0.08, 0, angle - Math.PI / 2);
      petal.scale.setScalar(0.92 + rand() * 0.16);
      petal.castShadow = true;
      flower.add(petal);
    }
  });

  const center = new THREE.Group();
  for (let i = 0; i < 14; i += 1) {
    const angle = (i / 14) * Math.PI * 2;
    const bead = new THREE.Mesh(new THREE.SphereGeometry(0.027, 10, 8), champagne);
    bead.position.set(Math.cos(angle) * 0.1, Math.sin(angle) * 0.1, 0.29 + (i % 3) * 0.016);
    center.add(bead);
  }
  flower.add(center);
  flower.scale.setScalar(scale);
  flower.userData.baseRotation = flower.rotation.clone();
  flower.userData.swaySeed = seed * 0.71;
  return flower;
}

function createBud(scale = 1) {
  const bud = new THREE.Group();
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.24, 20, 16), warmIvory);
  core.scale.set(0.8, 1.35, 0.8);
  core.position.y = 0.19;
  bud.add(core);
  for (let i = 0; i < 5; i += 1) {
    const petal = new THREE.Mesh(getPetalGeometry("bud", 0.19, 0.46, 0.12, 0.03, 0), ivory);
    petal.rotation.z = (i / 5) * Math.PI * 2 - Math.PI / 2;
    petal.rotation.x = 0.62;
    petal.position.z = 0.08;
    bud.add(petal);
  }
  bud.scale.setScalar(scale);
  return bud;
}

function leafGeometry(width = 0.3, length = 1.05) {
  const geometry = petalGeometry(width, length, 0.055, -0.045, 0.018);
  const position = geometry.attributes.position;
  for (let i = 0; i < position.count; i += 1) {
    const x = position.getX(i);
    const y = position.getY(i);
    const ridge = Math.exp(-Math.abs(x) * 28) * 0.026 * Math.sin((y / length) * Math.PI);
    position.setZ(i, position.getZ(i) + ridge);
  }
  geometry.computeVertexNormals();
  return geometry;
}

const leafGeometries = [leafGeometry(0.29, 1.05), leafGeometry(0.23, 0.83)];

function createLeaf(scale = 1, light = false) {
  const leaf = new THREE.Mesh(leafGeometries[light ? 1 : 0], light ? leafLightMaterial : leafMaterial);
  leaf.scale.setScalar(scale);
  leaf.castShadow = true;
  return leaf;
}

function tubeFrom(points, radius, material, tubularSegments = 36) {
  const curve = new THREE.CatmullRomCurve3(points, false, "centripetal");
  return new THREE.Mesh(new THREE.TubeGeometry(curve, tubularSegments, radius, 8, false), material);
}

function wrapGeometry(side = 1, phase = 0) {
  const sx = 12;
  const sy = 18;
  const positions = [];
  const indices = [];
  for (let y = 0; y <= sy; y += 1) {
    const v = y / sy;
    const width = 0.3 + v * 1.16;
    for (let x = 0; x <= sx; x += 1) {
      const u = (x / sx) * 2 - 1;
      const px = u * width + Math.sin(v * Math.PI + phase) * 0.11 * side;
      const py = -2.38 + v * 2.55;
      const pz = 0.05 + Math.cos(u * Math.PI * 0.65 + phase) * 0.11 + Math.pow(v, 1.7) * 0.18;
      positions.push(px, py, pz);
    }
  }
  for (let y = 0; y < sy; y += 1) {
    for (let x = 0; x < sx; x += 1) {
      const a = y * (sx + 1) + x;
      const b = a + sx + 1;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

export function createBouquet() {
  const root = new THREE.Group();
  const blooms = [];
  const leaves = [];
  const flowerData = [
    [-1.1, 0.5, 0.2, 0.88, -0.13, 11],
    [-0.28, 0.92, 0.46, 1.08, 0.06, 19],
    [0.72, 0.66, 0.34, 0.96, -0.08, 31],
    [1.28, 0.15, -0.02, 0.77, 0.12, 47],
    [-0.7, -0.18, 0.62, 0.82, 0.17, 59],
    [0.22, -0.16, 0.82, 0.9, -0.12, 73],
    [0.92, -0.34, 0.52, 0.7, 0.18, 89]
  ];

  flowerData.forEach(([x, y, z, s, r, seed]) => {
    const bottom = new THREE.Vector3(x * 0.12, -2.45, -0.08);
    const top = new THREE.Vector3(x, y, z - 0.12);
    const stem = tubeFrom(
      [bottom, new THREE.Vector3(x * 0.22, -1.15, 0), new THREE.Vector3(x * 0.72, y - 0.45, z - 0.08), top],
      0.032,
      stemMaterial,
      28
    );
    stem.castShadow = true;
    root.add(stem);

    const bloom = createGardenia(s, 1, seed);
    bloom.position.set(x, y, z);
    bloom.rotation.set(-0.06 + r, x * 0.08, r * 0.55);
    bloom.userData.baseRotation.copy(bloom.rotation);
    root.add(bloom);
    blooms.push(bloom);
  });

  const budData = [[-1.48, 0.1, 0.1, 0.7], [1.48, 0.54, -0.06, 0.64], [0.42, 1.47, 0.05, 0.58]];
  budData.forEach(([x, y, z, s], index) => {
    const stem = tubeFrom(
      [new THREE.Vector3(x * 0.08, -2.35, -0.14), new THREE.Vector3(x * 0.3, -0.85, 0), new THREE.Vector3(x, y - 0.28, z)],
      0.025,
      stemMaterial,
      22
    );
    root.add(stem);
    const bud = createBud(s);
    bud.position.set(x, y, z);
    bud.rotation.z = (index - 1) * 0.26;
    root.add(bud);
  });

  for (let i = 0; i < 14; i += 1) {
    const angle = (i / 14) * Math.PI * 2 + (i % 3) * 0.18;
    const radius = 1.04 + (i % 4) * 0.16;
    const leaf = createLeaf(0.68 + (i % 5) * 0.07, i % 4 === 0);
    leaf.position.set(Math.cos(angle) * radius, -0.45 + Math.sin(angle) * 0.7, -0.15 + (i % 3) * 0.16);
    leaf.rotation.set(-0.05 + (i % 3) * 0.12, (i % 5 - 2) * 0.1, angle - Math.PI / 2);
    leaf.userData.baseRotation = leaf.rotation.clone();
    leaf.userData.swaySeed = i * 0.7;
    root.add(leaf);
    leaves.push(leaf);
  }

  const organzaA = new THREE.MeshPhysicalMaterial({
    color: 0xd9d8ef,
    transparent: true,
    opacity: 0.2,
    transmission: 0.28,
    roughness: 0.18,
    clearcoat: 0.22,
    side: THREE.DoubleSide,
    depthWrite: false
  });
  const organzaB = organzaA.clone();
  organzaB.color.set(0xf2eff7);
  organzaB.opacity = 0.16;

  [-0.86, -0.34, 0.25, 0.76].forEach((angle, index) => {
    const panel = new THREE.Mesh(wrapGeometry(index % 2 ? -1 : 1, index * 0.8), index % 2 ? organzaA : organzaB);
    panel.rotation.y = angle;
    panel.position.z = -0.1 + index * 0.035;
    root.add(panel);
  });

  const bowLeft = tubeFrom([
    new THREE.Vector3(-0.05, -1.48, 0.86),
    new THREE.Vector3(-0.68, -1.1, 0.88),
    new THREE.Vector3(-0.74, -1.62, 0.9),
    new THREE.Vector3(-0.08, -1.5, 0.91)
  ], 0.036, champagne, 42);
  const bowRight = tubeFrom([
    new THREE.Vector3(0.05, -1.48, 0.88),
    new THREE.Vector3(0.66, -1.12, 0.9),
    new THREE.Vector3(0.7, -1.63, 0.91),
    new THREE.Vector3(0.08, -1.5, 0.92)
  ], 0.036, champagne, 42);
  const tailLeft = tubeFrom([
    new THREE.Vector3(-0.04, -1.5, 0.9),
    new THREE.Vector3(-0.36, -1.92, 0.92),
    new THREE.Vector3(-0.72, -2.15, 0.88)
  ], 0.031, champagne, 26);
  const tailRight = tubeFrom([
    new THREE.Vector3(0.04, -1.5, 0.92),
    new THREE.Vector3(0.42, -1.92, 0.9),
    new THREE.Vector3(0.78, -2.25, 0.86)
  ], 0.031, champagne, 26);
  const knot = new THREE.Mesh(new THREE.SphereGeometry(0.13, 18, 14), champagne);
  knot.scale.set(1.2, 0.78, 0.48);
  knot.position.set(0, -1.49, 0.92);
  root.add(bowLeft, bowRight, tailLeft, tailRight, knot);

  root.userData.blooms = blooms;
  root.userData.leaves = leaves;
  root.userData.transparentMaterials = [organzaA, organzaB];
  return root;
}

function roundedTier(radius, height, material) {
  const round = Math.min(0.13, height * 0.12);
  const points = [
    new THREE.Vector2(0, -height / 2),
    new THREE.Vector2(radius - round, -height / 2),
    new THREE.Vector2(radius, -height / 2 + round),
    new THREE.Vector2(radius * 0.995, height / 2 - round),
    new THREE.Vector2(radius - round, height / 2),
    new THREE.Vector2(0, height / 2)
  ];
  const mesh = new THREE.Mesh(new THREE.LatheGeometry(points, 96), material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function piping(radius, y, waves = 12, amplitude = 0, tubeRadius = 0.022, material = champagne) {
  const points = [];
  for (let i = 0; i < 96; i += 1) {
    const angle = (i / 96) * Math.PI * 2;
    points.push(new THREE.Vector3(
      Math.cos(angle) * radius,
      y + Math.sin(angle * waves) * amplitude,
      Math.sin(angle) * radius
    ));
  }
  const curve = new THREE.CatmullRomCurve3(points, true, "centripetal");
  return new THREE.Mesh(new THREE.TubeGeometry(curve, 144, tubeRadius, 7, true), material);
}

function pearlRing(root, radius, y, count, size = 0.055) {
  const geometry = new THREE.SphereGeometry(size, 14, 10);
  const mesh = new THREE.InstancedMesh(geometry, pearl, count);
  const dummy = new THREE.Object3D();
  for (let i = 0; i < count; i += 1) {
    const angle = (i / count) * Math.PI * 2;
    dummy.position.set(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
    dummy.scale.setScalar(0.8 + (i % 4) * 0.08);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
  }
  root.add(mesh);
  return mesh;
}

function sugarSail(width, height, color) {
  const shape = new THREE.Shape();
  shape.moveTo(-width * 0.45, 0);
  shape.lineTo(-width * 0.12, height);
  shape.lineTo(width * 0.22, height * 0.55);
  shape.lineTo(width * 0.48, 0);
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.035,
    bevelEnabled: true,
    bevelThickness: 0.012,
    bevelSize: 0.012,
    bevelSegments: 2
  });
  const material = new THREE.MeshPhysicalMaterial({
    color,
    transparent: true,
    opacity: 0.52,
    transmission: 0.4,
    roughness: 0.08,
    clearcoat: 0.85,
    side: THREE.DoubleSide,
    depthWrite: false
  });
  return new THREE.Mesh(geometry, material);
}

function flameGeometry(radius, height) {
  const points = [
    new THREE.Vector2(0, -height * 0.44),
    new THREE.Vector2(radius * 0.88, -height * 0.25),
    new THREE.Vector2(radius, 0),
    new THREE.Vector2(radius * 0.55, height * 0.24),
    new THREE.Vector2(radius * 0.18, height * 0.4),
    new THREE.Vector2(0, height * 0.56)
  ];
  return new THREE.LatheGeometry(points, 28);
}

function dustOrbit(radiusX, radiusZ, y, count, color, size) {
  const positions = new Float32Array(count * 3);
  const rand = seededRandom(count * 17 + Math.round(radiusX * 100));
  for (let i = 0; i < count; i += 1) {
    const a = (i / count) * Math.PI * 2 + (rand() - 0.5) * 0.09;
    positions[i * 3] = Math.cos(a) * (radiusX + (rand() - 0.5) * 0.12);
    positions[i * 3 + 1] = y + Math.sin(a * 2.2) * 0.18 + (rand() - 0.5) * 0.06;
    positions[i * 3 + 2] = Math.sin(a) * (radiusZ + (rand() - 0.5) * 0.1);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    color,
    size,
    transparent: true,
    opacity: 0.7,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true
  });
  return new THREE.Points(geometry, material);
}

export function createCake() {
  const root = new THREE.Group();
  const lowerMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x8995be,
    roughness: 0.48,
    sheen: 0.9,
    sheenColor: new THREE.Color(0xcbd2e8),
    clearcoat: 0.08
  });
  const upperMaterial = lowerMaterial.clone();
  upperMaterial.color.set(0xaab3d2);
  const frostingMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xf4f0ee,
    roughness: 0.53,
    sheen: 0.68,
    sheenColor: new THREE.Color(0xffecd2)
  });
  const glassMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xbccbe3,
    transparent: true,
    opacity: 0.42,
    transmission: 0.42,
    roughness: 0.14,
    clearcoat: 0.75,
    side: THREE.DoubleSide
  });

  const plinth = roundedTier(2.1, 0.24, glassMaterial);
  plinth.position.y = -1.45;
  root.add(plinth);

  const lower = roundedTier(1.72, 1.38, lowerMaterial);
  lower.position.y = -0.68;
  const upper = roundedTier(1.18, 1.1, upperMaterial);
  upper.position.y = 0.56;
  root.add(lower, upper);

  root.add(
    piping(1.73, -1.29, 12, 0.025, 0.025),
    piping(1.73, -0.05, 10, 0.065, 0.021),
    piping(1.19, 0.05, 10, 0.02, 0.024),
    piping(1.19, 1.08, 12, 0.035, 0.024)
  );

  const scallopMaterial = frostingMaterial.clone();
  scallopMaterial.color.set(0xeee7ed);
  root.add(
    piping(1.7, -0.01, 10, 0.08, 0.032, scallopMaterial),
    piping(1.16, 1.02, 9, 0.06, 0.031, scallopMaterial)
  );
  pearlRing(root, 1.66, -1.26, 38, 0.052);
  pearlRing(root, 1.13, 1.04, 26, 0.05);

  const moon = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.055, 12, 64, Math.PI * 1.55), champagne);
  moon.position.set(-0.44, -0.52, 1.65);
  moon.rotation.z = -0.55;
  root.add(moon);

  const constellationPoints = [
    new THREE.Vector3(0.38, -0.42, 1.7),
    new THREE.Vector3(0.72, -0.18, 1.57),
    new THREE.Vector3(0.96, -0.46, 1.42),
    new THREE.Vector3(0.66, -0.72, 1.58)
  ];
  constellationPoints.forEach((point, index) => {
    const bead = new THREE.Mesh(new THREE.SphereGeometry(index === 1 ? 0.055 : 0.04, 12, 9), champagne);
    bead.position.copy(point);
    root.add(bead);
    if (index > 0) {
      const previous = constellationPoints[index - 1];
      root.add(tubeFrom([previous, point], 0.008, champagne, 8));
    }
  });

  const topFlower = createGardenia(0.34, 1, 131);
  topFlower.position.set(-0.38, 1.16, 0.3);
  topFlower.rotation.x = -Math.PI / 2;
  const frontFlower = createGardenia(0.3, 1, 149);
  frontFlower.position.set(0.83, -0.93, 1.45);
  frontFlower.rotation.set(0.04, -0.12, -0.18);
  root.add(topFlower, frontFlower);

  const sailA = sugarSail(0.42, 0.88, 0xd8e1f5);
  sailA.position.set(0.12, 1.12, -0.05);
  sailA.rotation.set(-0.12, -0.22, -0.08);
  const sailB = sugarSail(0.35, 0.67, 0xc6d2ef);
  sailB.position.set(0.5, 1.12, -0.12);
  sailB.rotation.set(-0.05, 0.32, 0.18);
  const sailC = sugarSail(0.3, 0.56, 0xf1e7ee);
  sailC.position.set(0.78, 1.11, 0.08);
  sailC.rotation.set(0.1, 0.45, 0.24);
  root.add(sailA, sailB, sailC);

  const candleMaterial = new THREE.MeshPhysicalMaterial({ color: 0xe4cfe5, roughness: 0.36, clearcoat: 0.42 });
  const candle = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.064, 0.74, 20), candleMaterial);
  candle.position.set(0, 1.55, 0.12);
  root.add(candle);
  const spiralPoints = [];
  for (let i = 0; i < 42; i += 1) {
    const t = i / 41;
    const angle = t * Math.PI * 8;
    spiralPoints.push(new THREE.Vector3(Math.cos(angle) * 0.061, 1.2 + t * 0.7, 0.12 + Math.sin(angle) * 0.061));
  }
  root.add(tubeFrom(spiralPoints, 0.008, champagne, 60));

  const flame = new THREE.Group();
  flame.position.set(0, 2.08, 0.12);
  const outerMaterial = new THREE.MeshBasicMaterial({
    color: 0xff9f47,
    transparent: true,
    opacity: 0.88,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const innerMaterial = new THREE.MeshBasicMaterial({
    color: 0xfff4c4,
    transparent: true,
    opacity: 0.98,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const outer = new THREE.Mesh(flameGeometry(0.11, 0.48), outerMaterial);
  const inner = new THREE.Mesh(flameGeometry(0.055, 0.28), innerMaterial);
  inner.position.y = -0.05;
  inner.position.z = 0.02;
  const halo = new THREE.Mesh(
    new THREE.SphereGeometry(0.36, 18, 12),
    new THREE.MeshBasicMaterial({ color: 0xffbd78, transparent: true, opacity: 0.11, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  halo.scale.y = 1.25;
  flame.add(halo, outer, inner);
  root.add(flame);

  const flameLight = new THREE.PointLight(0xffa451, 4.8, 4.2, 1.6);
  flameLight.position.set(0, 2.12, 0.7);
  root.add(flameLight);

  const hitTarget = new THREE.Mesh(
    new THREE.SphereGeometry(0.3, 12, 10),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
  );
  hitTarget.position.copy(flame.position);
  root.add(hitTarget);

  const orbitA = dustOrbit(2.3, 1.22, 0.15, 280, 0xd6b16f, 0.025);
  orbitA.rotation.z = 0.17;
  const orbitB = dustOrbit(1.68, 2.05, 0.45, 230, 0xf1e1b1, 0.021);
  orbitB.rotation.x = 0.18;
  orbitB.rotation.z = -0.2;
  root.add(orbitA, orbitB);

  const emberCount = 80;
  const emberPositions = new Float32Array(emberCount * 3);
  const emberSeed = seededRandom(492);
  for (let i = 0; i < emberCount; i += 1) {
    const angle = emberSeed() * Math.PI * 2;
    const radius = 0.1 + emberSeed() * 0.58;
    emberPositions[i * 3] = Math.cos(angle) * radius;
    emberPositions[i * 3 + 1] = 2.12 + emberSeed() * 1.15;
    emberPositions[i * 3 + 2] = 0.12 + Math.sin(angle) * radius;
  }
  const emberGeometry = new THREE.BufferGeometry();
  emberGeometry.setAttribute("position", new THREE.BufferAttribute(emberPositions, 3));
  const embers = new THREE.Points(
    emberGeometry,
    new THREE.PointsMaterial({ color: 0xffb45e, size: 0.035, transparent: true, opacity: 0.72, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  root.add(embers);

  const smokeCount = 42;
  const smokePositions = new Float32Array(smokeCount * 3);
  const smokeGeometry = new THREE.BufferGeometry();
  smokeGeometry.setAttribute("position", new THREE.BufferAttribute(smokePositions, 3));
  const smoke = new THREE.Points(
    smokeGeometry,
    new THREE.PointsMaterial({ color: 0xa9adc0, size: 0.045, transparent: true, opacity: 0, depthWrite: false })
  );
  smoke.position.set(0, 2.05, 0.12);
  root.add(smoke);

  root.userData.flame = flame;
  root.userData.flameLight = flameLight;
  root.userData.outerFlame = outer;
  root.userData.innerFlame = inner;
  root.userData.embers = embers;
  root.userData.smoke = smoke;
  root.userData.hitTarget = hitTarget;
  root.userData.orbits = [orbitA, orbitB];
  root.userData.extinguished = false;
  return root;
}

export function createAmbientDust(count = 680) {
  const positions = new Float32Array(count * 3);
  const seeds = new Float32Array(count);
  const rand = seededRandom(20260827);
  for (let i = 0; i < count; i += 1) {
    positions[i * 3] = (rand() - 0.5) * 15;
    positions[i * 3 + 1] = (rand() - 0.5) * 8;
    positions[i * 3 + 2] = -3 + rand() * 6;
    seeds[i] = rand();
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("seed", new THREE.BufferAttribute(seeds, 1));
  const material = new THREE.PointsMaterial({
    color: 0xf6ddb0,
    size: 0.025,
    transparent: true,
    opacity: 0.55,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true
  });
  const points = new THREE.Points(geometry, material);
  points.userData.basePositions = positions.slice();
  return points;
}

export function createFormationParticles(count = 1400) {
  const positions = new Float32Array(count * 3);
  const starts = new Float32Array(count * 3);
  const targets = new Float32Array(count * 3);
  const rand = seededRandom(271828);
  for (let i = 0; i < count; i += 1) {
    const angle = rand() * Math.PI * 2;
    const radius = 4.5 + rand() * 5.5;
    const sx = Math.cos(angle) * radius;
    const sy = (rand() - 0.5) * 7;
    const sz = Math.sin(angle) * radius - 1;
    starts.set([sx, sy, sz], i * 3);
    positions.set([sx, sy, sz], i * 3);

    const cluster = i % 8;
    const centers = [
      [-1.1, 0.5, 0.2], [-0.28, 0.92, 0.46], [0.72, 0.66, 0.34], [1.28, 0.15, -0.02],
      [-0.7, -0.18, 0.62], [0.22, -0.16, 0.82], [0.92, -0.34, 0.52], [0, -1.45, 0.1]
    ];
    const center = centers[cluster];
    const spread = cluster === 7 ? 0.78 : 0.48;
    targets.set([
      center[0] + (rand() - 0.5) * spread,
      center[1] + (rand() - 0.5) * spread,
      center[2] + (rand() - 0.5) * spread * 0.7
    ], i * 3);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    color: 0xffe4ac,
    size: 0.032,
    transparent: true,
    opacity: 0.88,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true
  });
  const points = new THREE.Points(geometry, material);
  points.userData.starts = starts;
  points.userData.targets = targets;
  return points;
}

export function createFallingPetals(count = 16) {
  const group = new THREE.Group();
  const rand = seededRandom(314159);
  const geometry = getPetalGeometry("falling", 0.12, 0.26, 0.035, 0.055, 0.018);
  for (let i = 0; i < count; i += 1) {
    const petal = new THREE.Mesh(geometry, i % 3 ? ivory : warmIvory);
    petal.scale.setScalar(0.72 + rand() * 0.5);
    petal.userData.seed = rand() * 20;
    petal.userData.speed = 0.17 + rand() * 0.19;
    petal.userData.spin = 0.25 + rand() * 0.55;
    petal.position.set((rand() - 0.5) * 7, -1 + rand() * 6.5, -0.5 + rand() * 3.2);
    petal.rotation.set(rand() * Math.PI, rand() * Math.PI, rand() * Math.PI);
    group.add(petal);
  }
  return group;
}

export function updateAmbientDust(points, time) {
  const position = points.geometry.attributes.position;
  const base = points.userData.basePositions;
  for (let i = 0; i < position.count; i += 1) {
    position.array[i * 3] = base[i * 3] + Math.sin(time * 0.12 + i * 0.7) * 0.06;
    position.array[i * 3 + 1] = base[i * 3 + 1] + Math.sin(time * 0.18 + i * 0.31) * 0.09;
  }
  position.needsUpdate = true;
  points.rotation.y = time * 0.008;
}

export function updateFallingPetals(group, time, delta, active) {
  group.visible = active;
  if (!active) return;
  group.children.forEach((petal, index) => {
    const seed = petal.userData.seed;
    petal.position.y -= petal.userData.speed * delta;
    petal.position.x += Math.sin(time * 0.65 + seed) * delta * 0.11;
    petal.position.z += Math.cos(time * 0.42 + seed) * delta * 0.045;
    petal.rotation.x += delta * petal.userData.spin;
    petal.rotation.y += delta * (0.3 + (index % 4) * 0.08);
    petal.rotation.z += Math.sin(time + seed) * delta * 0.32;
    if (petal.position.y < -3.1) {
      petal.position.y = 3.2 + (index % 5) * 0.36;
      petal.position.x = -3.2 + ((index * 1.37) % 6.4);
      petal.position.z = -0.4 + (index % 4) * 0.72;
    }
  });
}

export function updateBouquet(root, time) {
  root.userData.blooms.forEach((bloom, index) => {
    const base = bloom.userData.baseRotation;
    bloom.rotation.x = base.x + Math.sin(time * 0.42 + bloom.userData.swaySeed) * 0.012;
    bloom.rotation.z = base.z + Math.cos(time * 0.36 + index) * 0.014;
  });
  root.userData.leaves.forEach((leaf, index) => {
    const base = leaf.userData.baseRotation;
    leaf.rotation.x = base.x + Math.sin(time * 0.56 + leaf.userData.swaySeed) * 0.022;
    leaf.rotation.z = base.z + Math.cos(time * 0.48 + index * 0.4) * 0.018;
  });
}

export function updateCake(root, time, wishedAt = Infinity) {
  const { flame, flameLight, outerFlame, innerFlame, embers, smoke, orbits } = root.userData;
  const afterWish = time - wishedAt;
  orbits[0].rotation.y = time * 0.06;
  orbits[1].rotation.y = -time * 0.052;
  embers.rotation.y = time * 0.09;

  if (afterWish < 0) {
    const flicker = 1 + Math.sin(time * 8.1) * 0.07 + Math.sin(time * 13.7) * 0.035;
    flame.visible = true;
    flame.scale.set(0.95 + Math.sin(time * 9.8) * 0.04, flicker, 0.95);
    flame.rotation.z = Math.sin(time * 2.8) * 0.08 + Math.sin(time * 6.4) * 0.025;
    outerFlame.material.opacity = 0.82 + Math.sin(time * 7.6) * 0.08;
    innerFlame.material.opacity = 0.94;
    flameLight.intensity = 4.5 + Math.sin(time * 10.4) * 0.6;
    embers.material.opacity = 0.58 + Math.sin(time * 2.1) * 0.12;
    smoke.material.opacity = 0;
  } else {
    const fade = Math.max(0, 1 - afterWish / 0.65);
    flame.scale.setScalar(Math.max(0.02, fade));
    flameLight.intensity = 4.5 * fade;
    embers.material.opacity = 0.62 * fade;
    if (afterWish > 0.68) flame.visible = false;
    smoke.material.opacity = Math.max(0, Math.min(0.32, afterWish * 0.25) * (1 - Math.max(0, afterWish - 3) / 2));
    const position = smoke.geometry.attributes.position;
    for (let i = 0; i < position.count; i += 1) {
      const p = (afterWish * 0.42 + i / position.count) % 1;
      position.array[i * 3] = Math.sin(p * 8 + i) * 0.07 * p;
      position.array[i * 3 + 1] = p * 1.45;
      position.array[i * 3 + 2] = Math.cos(p * 6 + i) * 0.045;
    }
    position.needsUpdate = true;
  }
}
