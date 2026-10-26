// ==========================================================================
// DUNGEON PROPS & GRAPHIC ELEMENTS - MDEV CODEQUEST
// Elementos gráficos detalhados: pilares de pedra, barris, caixotes, baús,
// brasões de parede, círculos mágicos, efeitos visuais e partículas
// ==========================================================================

import * as THREE from 'three';

// 1. Pilar / Coluna de Pedra Esculpida
export function createStoneColumn(x, y, z, stoneMat, capMat) {
  const colGroup = new THREE.Group();
  colGroup.position.set(x, y, z);

  // Base escalonada
  const base1 = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.14, 0.55), capMat);
  base1.position.y = 0.07;
  base1.castShadow = true;
  base1.receiveShadow = true;

  const base2 = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.12, 0.44), capMat);
  base2.position.y = 0.19;
  base2.castShadow = true;

  // Corpo cilíndrico canelado
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.2, 1.1, 16), stoneMat);
  shaft.position.y = 0.78;
  shaft.castShadow = true;
  shaft.receiveShadow = true;

  // Capitel superior com entalhes
  const cap1 = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.12, 0.44), capMat);
  cap1.position.y = 1.38;
  cap1.castShadow = true;

  const cap2 = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.14, 0.55), capMat);
  cap2.position.y = 1.49;
  cap2.castShadow = true;

  colGroup.add(base1, base2, shaft, cap1, cap2);
  return colGroup;
}

// 2. Barril Medieval de Madeira com Aros de Ferro
export function createMedievalBarrel(x, y, z, woodMatOrTex, rotY = 0) {
  const barrel = new THREE.Group();
  barrel.position.set(x, y, z);
  barrel.rotation.y = rotY;

  // Garante que seja sempre um Material válido do Three.js
  const mat = (woodMatOrTex && woodMatOrTex.isMaterial) ? woodMatOrTex : new THREE.MeshStandardMaterial({
    map: (woodMatOrTex && woodMatOrTex.isTexture) ? woodMatOrTex : null,
    color: (woodMatOrTex && woodMatOrTex.isTexture) ? 0xffffff : 0x78350f,
    roughness: 0.8,
    metalness: 0.1
  });

  // Corpo bojudo do barril
  const barrelGeo = new THREE.CylinderGeometry(0.24, 0.22, 0.55, 14);
  const body = new THREE.Mesh(barrelGeo, mat);
  body.position.y = 0.28;
  body.castShadow = true;
  body.receiveShadow = true;
  barrel.add(body);

  // Aros de ferro forjado
  const ironMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, metalness: 0.9, roughness: 0.3 });
  const hoopGeo = new THREE.TorusGeometry(0.245, 0.018, 8, 16);

  const hoop1 = new THREE.Mesh(hoopGeo, ironMat);
  hoop1.position.y = 0.45;
  hoop1.rotation.x = Math.PI / 2;

  const hoop2 = new THREE.Mesh(hoopGeo, ironMat);
  hoop2.position.y = 0.12;
  hoop2.rotation.x = Math.PI / 2;

  barrel.add(hoop1, hoop2);
  return barrel;
}

// 3. Caixote de Madeira com Reforço em X
export function createMedievalCrate(x, y, z, woodMatOrTex, rotY = 0, size = 0.45) {
  const crate = new THREE.Group();
  crate.position.set(x, y, z);
  crate.rotation.y = rotY;

  // Garante que seja sempre um Material válido do Three.js
  const mat = (woodMatOrTex && woodMatOrTex.isMaterial) ? woodMatOrTex : new THREE.MeshStandardMaterial({
    map: (woodMatOrTex && woodMatOrTex.isTexture) ? woodMatOrTex : null,
    color: (woodMatOrTex && woodMatOrTex.isTexture) ? 0xffffff : 0x78350f,
    roughness: 0.8,
    metalness: 0.1
  });

  const boxGeo = new THREE.BoxGeometry(size, size, size);
  const box = new THREE.Mesh(boxGeo, mat);
  box.position.y = size / 2;
  box.castShadow = true;
  box.receiveShadow = true;
  crate.add(box);

  // Cantoneiras de ferro
  const ironMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.4 });
  const trimGeo = new THREE.BoxGeometry(size + 0.02, size * 0.1, size + 0.02);
  const trimTop = new THREE.Mesh(trimGeo, ironMat);
  trimTop.position.y = size * 0.95;
  const trimBot = new THREE.Mesh(trimGeo, ironMat);
  trimBot.position.y = size * 0.05;

  crate.add(trimTop, trimBot);
  return crate;
}

// 4. Estandarte / Tapeçaria Real na Parede
export function createWallBanner(x, y, z, facing, colorHex = 0xb91c1c) {
  const bannerGroup = new THREE.Group();
  bannerGroup.position.set(x, y, z);

  if (facing === 'right') {
    bannerGroup.rotation.y = Math.PI / 2;
  } else if (facing === 'left') {
    bannerGroup.rotation.y = -Math.PI / 2;
  } else if (facing === 'down') {
    bannerGroup.rotation.y = 0;
  } else {
    bannerGroup.rotation.y = Math.PI;
  }

  // Vara de madeira de sustentação
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x5c2e0b, roughness: 0.8 });
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.75), poleMat);
  pole.rotation.z = Math.PI / 2;
  pole.position.set(0, 0, 0.04);
  bannerGroup.add(pole);

  // Terminais dourados da haste
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.9, roughness: 0.2 });
  const tip1 = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), goldMat);
  tip1.position.set(-0.38, 0, 0.04);
  const tip2 = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), goldMat);
  tip2.position.set(0.38, 0, 0.04);
  bannerGroup.add(tip1, tip2);

  // Pano do estandarte (Tecido vermelho escuro com ponta em V)
  const clothMat = new THREE.MeshStandardMaterial({
    color: colorHex,
    roughness: 0.9,
    side: THREE.DoubleSide
  });

  const bannerMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.9), clothMat);
  bannerMesh.position.set(0, -0.45, 0.03);
  bannerMesh.castShadow = true;
  bannerGroup.add(bannerMesh);

  // Brasão heráldico dourado bordado
  const crestMat = new THREE.MeshStandardMaterial({
    color: 0xfde047,
    emissive: 0xd97706,
    emissiveIntensity: 0.3,
    metalness: 0.6
  });
  const crest = new THREE.Mesh(new THREE.OctahedronGeometry(0.12, 0), crestMat);
  crest.position.set(0, -0.4, 0.05);
  bannerGroup.add(crest);

  return bannerGroup;
}

// 5. Círculo Mágico de Invocação no Chão (Runas Arcanas)
export function createMagicSeal(x, y, z, colorHex = 0x8b5cf6, radius = 0.55) {
  const sealGroup = new THREE.Group();
  sealGroup.position.set(x, y + 0.02, z);

  // Anel externo brilhante
  const ringGeo = new THREE.RingGeometry(radius * 0.85, radius, 32);
  const sealMat = new THREE.MeshBasicMaterial({
    color: colorHex,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.85
  });
  const ring = new THREE.Mesh(ringGeo, sealMat);
  ring.rotation.x = -Math.PI / 2;
  sealGroup.add(ring);

  // Estrela / Octagrama central de runas
  const innerRingGeo = new THREE.RingGeometry(radius * 0.45, radius * 0.52, 24);
  const innerRing = new THREE.Mesh(innerRingGeo, sealMat);
  innerRing.rotation.x = -Math.PI / 2;
  sealGroup.add(innerRing);

  // Linhas geométricas de conjuração
  for (let i = 0; i < 4; i++) {
    const lineMesh = new THREE.Mesh(new THREE.PlaneGeometry(radius * 1.6, 0.025), sealMat);
    lineMesh.rotation.x = -Math.PI / 2;
    lineMesh.rotation.z = (i * Math.PI) / 4;
    sealGroup.add(lineMesh);
  }

  return sealGroup;
}

// 6. Pequena pilha de escombros e pedras caídas
export function createRubblePile(x, y, z, stoneMat) {
  const rubble = new THREE.Group();
  rubble.position.set(x, y, z);

  const numRocks = 4 + Math.floor(Math.random() * 3);
  for (let i = 0; i < numRocks; i++) {
    const s = 0.06 + Math.random() * 0.1;
    const rockGeo = new THREE.DodecahedronGeometry(s, 0);
    const rock = new THREE.Mesh(rockGeo, stoneMat);
    rock.position.set(
      (Math.random() - 0.5) * 0.35,
      s / 2,
      (Math.random() - 0.5) * 0.35
    );
    rock.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
    rock.castShadow = true;
    rubble.add(rock);
  }

  return rubble;
}

// 7. Livro de Feitiços Flutuante (Grimório do Herói)
export function createGrimoireMesh() {
  const book = new THREE.Group();

  // Capa de couro mística
  const coverMat = new THREE.MeshStandardMaterial({
    color: 0x581c87,
    roughness: 0.4,
    metalness: 0.3
  });
  const cover = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.3, 0.06), coverMat);
  cover.castShadow = true;
  book.add(cover);

  // Páginas douradas envelhecidas
  const pagesMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.8 });
  const pages = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.28, 0.05), pagesMat);
  pages.position.x = 0.02;
  book.add(pages);

  // Fecho dourado e gema no centro da capa
  const gemMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0284c7,
    emissiveIntensity: 1.5
  });
  const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.04, 0), gemMat);
  gem.position.set(-0.02, 0, 0.04);
  book.add(gem);

  return book;
}
