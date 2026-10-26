// ==========================================================================
// 3D DUNGEON GAME ENGINE - THREE.JS
// Renderização tridimensional, iluminação dinâmica, sombras e personagens 3D
// ==========================================================================

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { sound } from './sound.js';

export class DungeonEngine3D {
  constructor(canvasElement, inventoryElement) {
    this.canvas = canvasElement;
    this.invEl = inventoryElement;

    this.currentLevel = null;
    this.grid = [];
    this.heroPos = { x: 0, y: 0 };
    this.heroDir = 'right';
    this.inventory = { gems: 0, keys: 0 };
    this.bumpsCount = 0;
    this.heroCharId = 'wizard';
    this.showCoords = false;
    this.animationSpeed = 1;
    this.isPlaying = false;

    // Callbacks
    this.onLevelCompleted = null;
    this.onActiveLineChanged = null;
    this.onToastRequested = null;

    // Three.js Core
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.clock = new THREE.Clock();

    // 3D Scene Objects Maps
    this.tileMeshes = [];
    this.itemMeshes = new Map(); // key: `${x},${y}`
    this.enemyMeshes = new Map(); // key: `${x},${y}`
    this.doorMeshes = new Map(); // key: `${x},${y}`
    this.portalMesh = null;
    this.heroGroup = null;
    this.coordBadges = [];
    this.dustParticles = null;
    this.dynamicLights = [];

    this.initThree();
  }

  // Inicializa o Renderer, Cena, Câmera e Controles do Three.js
  initThree() {
    // 1. Cena com Névoa Suave de Masmorra
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0e1a);
    this.scene.fog = new THREE.FogExp2(0x0a0e1a, 0.04);

    // 2. Câmera Perspectiva Isométrica
    const rect = this.canvas.parentElement.getBoundingClientRect();
    const width = rect.width || 600;
    const height = rect.height || 420;

    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    this.camera.position.set(4, 7, 7);

    // 3. Renderer com Sombras Suaves
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;

    // 4. OrbitControls para o aluno poder girar e explorar a masmorra em 3D!
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.maxPolarAngle = Math.PI / 2.05; // Não deixa ver por baixo da terra
    this.controls.minDistance = 3.5;
    this.controls.maxDistance = 18;

    // 5. Iluminação Ambiente e Luz Direcional
    this.setupLighting();

    // 6. Poeira Mágica Flutuante
    this.setupAtmosphere();

    // 7. Redimensionamento Responsivo
    window.addEventListener('resize', () => this.onResize());
    const resizeObserver = new ResizeObserver(() => this.onResize());
    resizeObserver.observe(this.canvas.parentElement);

    // 8. Loop de Renderização
    this.animate();
  }

  setupLighting() {
    // Luz ambiente suave tom azul escuro de fantasia
    const ambientLight = new THREE.AmbientLight(0x2d3748, 1.4);
    this.scene.add(ambientLight);

    // Luz Direcional Principal (Luar / Sol da Masmorra)
    const dirLight = new THREE.DirectionalLight(0xe2e8f0, 1.8);
    dirLight.position.set(8, 14, 6);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 25;
    const d = 8;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    dirLight.shadow.bias = -0.0005;
    this.scene.add(dirLight);

    // Luz de preenchimento azul mágica suave vinda do lado oposto
    const fillLight = new THREE.DirectionalLight(0x6366f1, 0.6);
    fillLight.position.set(-6, 8, -6);
    this.scene.add(fillLight);
  }

  setupAtmosphere() {
    // Partículas de poeira e centelhas mágicas flutuantes
    const count = 70;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 12;
      positions[i + 1] = Math.random() * 4;
      positions[i + 2] = (Math.random() - 0.5) * 12;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0xa78bfa,
      size: 0.06,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending
    });

    this.dustParticles = new THREE.Points(geometry, material);
    this.scene.add(this.dustParticles);
  }

  onResize() {
    const parent = this.canvas.parentElement;
    if (!parent) return;
    const width = parent.clientWidth;
    const height = parent.clientHeight;
    if (width === 0 || height === 0) return;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  // ==========================================================================
  // CARREGAMENTO E CONSTRUÇÃO DO MUNDO 3D
  // ==========================================================================
  loadLevel(levelData, heroEmoji = '🧙‍♂️') {
    this.currentLevel = levelData;
    this.heroPos = { ...levelData.startPos };
    this.heroDir = levelData.startDir || 'right';
    this.inventory = { gems: 0, keys: 0 };
    this.bumpsCount = 0;
    this.isPlaying = false;
    this.grid = levelData.map.map(row => [...row]);

    // Limpa a cena anterior de meshes antigos
    this.clearDungeonMeshes();

    // Constrói o tabuleiro 3D
    this.build3DDungeon();

    // Cria e posiciona o Herói 3D
    this.createHero3D();

    // Centraliza a Câmera no tabuleiro
    this.centerCamera();

    this.updateInventoryUI();
  }

  clearDungeonMeshes() {
    // Remove tiles antigos
    this.tileMeshes.forEach(m => this.scene.remove(m));
    this.tileMeshes = [];

    // Remove itens
    this.itemMeshes.forEach(m => this.scene.remove(m));
    this.itemMeshes.clear();

    // Remove inimigos
    this.enemyMeshes.forEach(m => this.scene.remove(m));
    this.enemyMeshes.clear();

    // Remove portas
    this.doorMeshes.forEach(m => this.scene.remove(m));
    this.doorMeshes.clear();

    // Remove portal
    if (this.portalMesh) {
      this.scene.remove(this.portalMesh);
      this.portalMesh = null;
    }

    // Remove luzes dinâmicas antigas
    this.dynamicLights.forEach(l => this.scene.remove(l));
    this.dynamicLights = [];

    // Remove badges de coordenadas
    this.coordBadges.forEach(b => this.scene.remove(b));
    this.coordBadges = [];

    // Remove herói
    if (this.heroGroup) {
      this.scene.remove(this.heroGroup);
      this.heroGroup = null;
    }
  }

  build3DDungeon() {
    const rows = this.currentLevel.gridSize.rows;
    const cols = this.currentLevel.gridSize.cols;

    // Materiais reutilizáveis de alta qualidade
    const matFloor1 = new THREE.MeshStandardMaterial({
      color: 0x1e273a,
      roughness: 0.85,
      metalness: 0.1
    });
    const matFloor2 = new THREE.MeshStandardMaterial({
      color: 0x182030,
      roughness: 0.85,
      metalness: 0.1
    });

    const matWall = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.9,
      metalness: 0.15
    });
    const matWallCap = new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.8
    });

    const matLava = new THREE.MeshStandardMaterial({
      color: 0xff3b14,
      emissive: 0xff2200,
      emissiveIntensity: 0.95,
      roughness: 0.2
    });

    // Geometrias
    const floorGeo = new THREE.BoxGeometry(0.96, 0.25, 0.96);
    const wallGeo = new THREE.BoxGeometry(0.96, 1.1, 0.96);
    const wallCapGeo = new THREE.BoxGeometry(1.02, 0.15, 1.02);
    const lavaGeo = new THREE.BoxGeometry(0.96, 0.1, 0.96);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const type = this.grid[r][c];
        const x = c;
        const z = r;

        if (type === 'W') {
          // Parede de Pedra 3D com topo chanfrado
          const wall = new THREE.Mesh(wallGeo, matWall);
          wall.position.set(x, 0.55, z);
          wall.castShadow = true;
          wall.receiveShadow = true;

          const cap = new THREE.Mesh(wallCapGeo, matWallCap);
          cap.position.set(x, 1.15, z);
          cap.castShadow = true;
          cap.receiveShadow = true;

          const wallGroup = new THREE.Group();
          wallGroup.add(wall);
          wallGroup.add(cap);

          this.scene.add(wallGroup);
          this.tileMeshes.push(wallGroup);

        } else if (type === 'L') {
          // Lava Fervente 3D (Poça afundada com luz laranja pulsante)
          const lava = new THREE.Mesh(lavaGeo, matLava);
          lava.position.set(x, 0.05, z);
          lava.receiveShadow = true;
          this.scene.add(lava);
          this.tileMeshes.push(lava);

          // Ponto de luz da lava que ilumina o ambiente
          const lavaLight = new THREE.PointLight(0xff5500, 1.4, 2.5);
          lavaLight.position.set(x, 0.35, z);
          this.scene.add(lavaLight);
          this.dynamicLights.push({ light: lavaLight, base: 1.4, type: 'lava' });

        } else {
          // Chão de Pedra 3D com tons alternados estilo tabuleiro
          const floorMat = (r + c) % 2 === 0 ? matFloor1 : matFloor2;
          const floor = new THREE.Mesh(floorGeo, floorMat);
          floor.position.set(x, 0.12, z);
          floor.receiveShadow = true;
          this.scene.add(floor);
          this.tileMeshes.push(floor);
        }

        // Elementos interativos em 3D
        if (type === 'G') {
          this.createGem3D(x, z);
        } else if (type === 'K') {
          this.createKey3D(x, z);
        } else if (type === 'D') {
          this.createDoor3D(x, z);
        } else if (type === 'P') {
          this.createPortal3D(x, z);
        } else if (type === 'S') {
          this.createSlime3D(x, z);
        } else if (type === 'B') {
          this.createBoss3D(x, z);
        }

        // Badges de coordenadas X, Y flutuantes
        this.createCoordBadge3D(x, z);
      }
    }

    // Base flutuante diorama embaixo do tabuleiro
    this.createDioramaBase(cols, rows);
  }

  // Base de pedra e terra flutuante sob o calabouço (efeito ilha suspensa)
  createDioramaBase(cols, rows) {
    const baseGeo = new THREE.BoxGeometry(cols + 0.4, 0.8, rows + 0.4);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x0f1523,
      roughness: 0.95,
      metalness: 0.1
    });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.set((cols - 1) / 2, -0.4, (rows - 1) / 2);
    base.receiveShadow = true;
    this.scene.add(base);
    this.tileMeshes.push(base);
  }

  // ==========================================================================
  // ELEMENTOS E ITENS 3D (Cristal, Chave, Porta, Portal, Inimigos)
  // ==========================================================================

  // Cristal de Mana 3D (Octaedro lapidado flutuante com luz azul)
  createGem3D(x, z) {
    const group = new THREE.Group();
    group.position.set(x, 0.55, z);

    const geo = new THREE.OctahedronGeometry(0.24, 0);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.8,
      roughness: 0.15,
      metalness: 0.85
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    group.add(mesh);

    const light = new THREE.PointLight(0x38bdf8, 1.2, 2.5);
    light.position.set(0, 0, 0);
    group.add(light);

    this.scene.add(group);
    this.itemMeshes.set(`${x},${z}`, { group, mesh, light, type: 'G', initialY: 0.55 });
  }

  // Chave Dourada 3D (Anel + Haste + Dentes)
  createKey3D(x, z) {
    const group = new THREE.Group();
    group.position.set(x, 0.5, z);

    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      emissive: 0xd97706,
      emissiveIntensity: 0.4,
      roughness: 0.25,
      metalness: 0.9
    });

    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.025, 8, 20), goldMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.1;
    group.add(ring);

    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.25, 8), goldMat);
    shaft.position.y = -0.05;
    group.add(shaft);

    const tooth = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.05, 0.02), goldMat);
    tooth.position.set(0.03, -0.14, 0);
    group.add(tooth);

    group.scale.set(1.2, 1.2, 1.2);
    this.scene.add(group);
    this.itemMeshes.set(`${x},${z}`, { group, type: 'K', initialY: 0.5 });
  }

  // Porta de Ferro 3D
  createDoor3D(x, z) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);

    // Moldura de pedra
    const archMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.8 });
    const postLeft = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.1, 0.15), archMat);
    postLeft.position.set(-0.42, 0.55, 0);
    const postRight = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.1, 0.15), archMat);
    postRight.position.set(0.42, 0.55, 0);
    const topBar = new THREE.Mesh(new THREE.BoxGeometry(0.96, 0.15, 0.15), archMat);
    topBar.position.set(0, 1.1, 0);

    // Grade de metal trancada
    const gateMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.85, roughness: 0.3 });
    const gate = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.95, 0.06), gateMat);
    gate.position.set(0, 0.5, 0);
    gate.castShadow = true;

    group.add(postLeft);
    group.add(postRight);
    group.add(topBar);
    group.add(gate);

    this.scene.add(group);
    this.doorMeshes.set(`${x},${z}`, { group, gate });
  }

  // Portal Mágico Dimensional 3D (Dois anéis de luz girando em sentidos opostos + núcleo de vórtice)
  createPortal3D(x, z) {
    const group = new THREE.Group();
    group.position.set(x, 0.65, z);

    const portalMat1 = new THREE.MeshStandardMaterial({
      color: 0xa855f7,
      emissive: 0xc084fc,
      emissiveIntensity: 1.2,
      roughness: 0.1
    });
    const ring1 = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.05, 12, 32), portalMat1);
    group.add(ring1);

    const portalMat2 = new THREE.MeshStandardMaterial({
      color: 0x6366f1,
      emissive: 0x818cf8,
      emissiveIntensity: 1.0,
      roughness: 0.1
    });
    const ring2 = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.04, 12, 28), portalMat2);
    group.add(ring2);

    // Luz violeta que ilumina o ambiente ao redor do portal
    const light = new THREE.PointLight(0xa855f7, 2.0, 3.5);
    group.add(light);

    this.scene.add(group);
    this.portalMesh = { group, ring1, ring2, light };
  }

  // Inimigo Slime 3D (Gelatina verde saltitante com olhinhos fofos)
  createSlime3D(x, z) {
    const group = new THREE.Group();
    group.position.set(x, 0.32, z);

    const slimeMat = new THREE.MeshStandardMaterial({
      color: 0x22c55e,
      emissive: 0x15803d,
      emissiveIntensity: 0.4,
      roughness: 0.2,
      transparent: true,
      opacity: 0.92
    });

    const body = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 16), slimeMat);
    body.scale.set(1.15, 0.85, 1.15);
    body.castShadow = true;
    group.add(body);

    // Olhos
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
    const eye1 = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), eyeMat);
    eye1.position.set(0.1, 0.06, 0.25);
    const eye2 = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), eyeMat);
    eye2.position.set(-0.1, 0.06, 0.25);
    group.add(eye1);
    group.add(eye2);

    this.scene.add(group);
    this.enemyMeshes.set(`${x},${z}`, { group, body, type: 'slime', initialY: 0.32 });
  }

  // Boss Golem de Pedra 3D
  createBoss3D(x, z) {
    const group = new THREE.Group();
    group.position.set(x, 0.5, z);

    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.9 });
    const body = new THREE.Mesh(new THREE.DodecahedronGeometry(0.42), stoneMat);
    body.castShadow = true;
    group.add(body);

    // Olhos vermelhos brilhantes
    const redMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const eye1 = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), redMat);
    eye1.position.set(0.14, 0.12, 0.35);
    const eye2 = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), redMat);
    eye2.position.set(-0.14, 0.12, 0.35);
    group.add(eye1);
    group.add(eye2);

    this.scene.add(group);
    this.enemyMeshes.set(`${x},${z}`, { group, type: 'boss', initialY: 0.5 });
  }

  // Badges 3D de Coordenadas X, Y
  createCoordBadge3D(x, z) {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.beginPath();
    ctx.roundRect(4, 4, 56, 56, 12);
    ctx.fill();
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 24px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${x},${z}`, 32, 32);

    const texture = new THREE.CanvasTexture(canvas);
    const mat = new THREE.SpriteMaterial({ map: texture, transparent: true, opacity: this.showCoords ? 0.9 : 0 });
    const sprite = new THREE.Sprite(mat);
    sprite.position.set(x, 0.32, z);
    sprite.scale.set(0.45, 0.45, 0.45);

    this.scene.add(sprite);
    this.coordBadges.push(sprite);
  }

  toggleCoords() {
    this.showCoords = !this.showCoords;
    this.coordBadges.forEach(s => {
      s.material.opacity = this.showCoords ? 0.9 : 0;
    });
    return this.showCoords;
  }

  // ==========================================================================
  // O HERÓI 3D (Mago estilizado com chapéu pontudo e cajado brilhante)
  // ==========================================================================
  createHero3D() {
    this.heroGroup = new THREE.Group();
    this.heroGroup.position.set(this.heroPos.x, 0.25, this.heroPos.y);

    // 1. Manto / Túnica Mágica
    const robeMat = new THREE.MeshStandardMaterial({
      color: 0x3730a3, // Azul / Índigo Real
      roughness: 0.6
    });
    const robe = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.5, 16), robeMat);
    robe.position.y = 0.25;
    robe.castShadow = true;
    this.heroGroup.add(robe);

    // 2. Cabeça
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xfed7aa, roughness: 0.5 });
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 16), skinMat);
    head.position.y = 0.52;
    head.castShadow = true;
    this.heroGroup.add(head);

    // 3. Barba Branca do Mago
    const beardMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.7 });
    const beard = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.2, 12), beardMat);
    beard.rotation.x = Math.PI;
    beard.position.set(0, 0.43, 0.11);
    this.heroGroup.add(beard);

    // 4. Chapéu Pontudo de Mago
    const hatMat = new THREE.MeshStandardMaterial({ color: 0x4338ca, roughness: 0.5 });
    const hatBrim = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.03, 16), hatMat);
    hatBrim.position.y = 0.62;
    this.heroGroup.add(hatBrim);

    const hatCone = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.45, 16), hatMat);
    hatCone.position.set(0, 0.82, -0.04);
    hatCone.rotation.x = -0.15; // Leve inclinação estilosa
    hatCone.castShadow = true;
    this.heroGroup.add(hatCone);

    // 5. Cajado Mágico na mão direita
    const staffMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8 });
    const staff = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.65, 8), staffMat);
    staff.position.set(0.26, 0.35, 0.12);
    staff.rotation.z = -0.1;
    this.heroGroup.add(staff);

    // Orbe de luz do cajado
    const orbMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 1.2,
      roughness: 0.1
    });
    const orb = new THREE.Mesh(new THREE.SphereGeometry(0.065, 12, 12), orbMat);
    orb.position.set(0.29, 0.68, 0.12);
    this.heroGroup.add(orb);

    // Luz emitida pelo orbe do cajado que acompanha o herói!
    const staffLight = new THREE.PointLight(0x38bdf8, 1.3, 3.2);
    staffLight.position.set(0.29, 0.68, 0.12);
    this.heroGroup.add(staffLight);

    // 6. Sombra suave sob os pés
    const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.4 });
    const shadowDecal = new THREE.Mesh(new THREE.CircleGeometry(0.22, 16), shadowMat);
    shadowDecal.rotation.x = -Math.PI / 2;
    shadowDecal.position.y = 0.01;
    this.heroGroup.add(shadowDecal);

    this.updateHeroOrientation(this.heroDir, false);
    this.scene.add(this.heroGroup);
  }

  updateHeroOrientation(dir, animate = true) {
    if (!this.heroGroup) return;
    let targetAngle = 0;
    if (dir === 'right') targetAngle = Math.PI / 2;
    else if (dir === 'left') targetAngle = -Math.PI / 2;
    else if (dir === 'up') targetAngle = Math.PI;
    else if (dir === 'down') targetAngle = 0;

    this.heroGroup.rotation.y = targetAngle;
  }

  // Centraliza e enquadra a câmera suavemente na masmorra
  centerCamera() {
    const cols = this.currentLevel.gridSize.cols;
    const rows = this.currentLevel.gridSize.rows;
    const centerX = (cols - 1) / 2;
    const centerZ = (rows - 1) / 2;

    this.controls.target.set(centerX, 0.4, centerZ);
    // Ajusta a distância da câmera conforme o tamanho do grid
    const maxDim = Math.max(cols, rows);
    this.camera.position.set(centerX + maxDim * 0.7, maxDim * 1.05 + 1.5, centerZ + maxDim * 0.9);
    this.controls.update();
  }

  cycleSpeed() {
    if (this.animationSpeed === 1) this.animationSpeed = 2;
    else if (this.animationSpeed === 2) this.animationSpeed = 4;
    else this.animationSpeed = 1;
    return this.animationSpeed;
  }

  // ==========================================================================
  // CLONE DE SIMULAÇÃO PARA TESTE DAS CONDIÇÕES EM PYTHON
  // ==========================================================================
  cloneSimulationState() {
    const simGrid = this.grid.map(row => [...row]);
    const simPos = { ...this.heroPos };
    const simDir = this.heroDir;
    let simKeys = this.inventory.keys;
    let simGems = this.inventory.gems;

    return {
      move: (dir) => {
        const offset = this.getOffset(dir);
        const nx = simPos.x + offset.x;
        const ny = simPos.y + offset.y;
        if (this.isValidCell(nx, ny) && simGrid[ny][nx] !== 'W' && simGrid[ny][nx] !== 'D') {
          simPos.x = nx;
          simPos.y = ny;
        }
      },
      collect: () => {
        const item = simGrid[simPos.y][simPos.x];
        if (item === 'G') {
          simGems++;
          simGrid[simPos.y][simPos.x] = '.';
        } else if (item === 'K') {
          simKeys++;
          simGrid[simPos.y][simPos.x] = '.';
        }
      },
      attack: () => {
        const offsets = [{x:1,y:0}, {x:-1,y:0}, {x:0,y:1}, {x:0,y:-1}];
        for (const off of offsets) {
          const nx = simPos.x + off.x;
          const ny = simPos.y + off.y;
          if (this.isValidCell(nx, ny) && (simGrid[ny][nx] === 'S' || simGrid[ny][nx] === 'B')) {
            simGrid[ny][nx] = '.';
            break;
          }
        }
      },
      openDoor: () => {
        const offsets = [{x:1,y:0}, {x:-1,y:0}, {x:0,y:1}, {x:0,y:-1}];
        for (const off of offsets) {
          const nx = simPos.x + off.x;
          const ny = simPos.y + off.y;
          if (this.isValidCell(nx, ny) && simGrid[ny][nx] === 'D' && simKeys > 0) {
            simGrid[ny][nx] = '.';
            simKeys--;
            break;
          }
        }
      },
      isPathAheadFree: () => {
        const offset = this.getOffset(simDir);
        const nx = simPos.x + offset.x;
        const ny = simPos.y + offset.y;
        return this.isValidCell(nx, ny) && simGrid[ny][nx] !== 'W' && simGrid[ny][nx] !== 'D' && simGrid[ny][nx] !== 'L';
      },
      hasEnemyAhead: () => {
        const offsets = [{x:1,y:0}, {x:-1,y:0}, {x:0,y:1}, {x:0,y:-1}];
        return offsets.some(off => {
          const nx = simPos.x + off.x;
          const ny = simPos.y + off.y;
          return this.isValidCell(nx, ny) && (simGrid[ny][nx] === 'S' || simGrid[ny][nx] === 'B');
        });
      },
      hasKeyInInventory: () => simKeys > 0,
      isCurrentTileGem: () => simGrid[simPos.y][simPos.x] === 'G',
      isCurrentTilePortal: () => simGrid[simPos.y][simPos.x] === 'P'
    };
  }

  getOffset(dir) {
    if (dir === 'right') return { x: 1, y: 0 };
    if (dir === 'left') return { x: -1, y: 0 };
    if (dir === 'up') return { x: 0, y: -1 };
    if (dir === 'down') return { x: 0, y: 1 };
    return { x: 1, y: 0 };
  }

  isValidCell(x, y) {
    return y >= 0 && y < this.currentLevel.gridSize.rows && x >= 0 && x < this.currentLevel.gridSize.cols;
  }

  // ==========================================================================
  // EXECUÇÃO DE AÇÕES ANIMADAS EM 3D
  // ==========================================================================
  async playActionQueue(actions, codeTotalLines) {
    this.isPlaying = true;
    let success = true;

    for (let i = 0; i < actions.length; i++) {
      if (!this.isPlaying) break;
      const act = actions[i];

      if (this.onActiveLineChanged && act.line) {
        this.onActiveLineChanged(act.line);
      }

      await this.executeSingleAction(act);

      // Checa se pisou na lava
      if (this.grid[this.heroPos.y][this.heroPos.x] === 'L') {
        sound.playBump();
        this.showToast('🔥 Ai! O herói pisou na lava quente! Desvie dela.');
        this.shakeHero();
        success = false;
        break;
      }

      const pauseMs = Math.max(80, Math.floor(300 / this.animationSpeed));
      await new Promise(r => setTimeout(r, pauseMs));
    }

    if (this.onActiveLineChanged) {
      this.onActiveLineChanged(null);
    }

    this.isPlaying = false;

    if (success) {
      this.checkLevelCompletion(codeTotalLines);
    }
  }

  async executeSingleAction(act) {
    if (act.type === 'move') {
      const offset = this.getOffset(act.dir);
      this.heroDir = act.dir;
      this.updateHeroOrientation(act.dir);

      const nx = this.heroPos.x + offset.x;
      const ny = this.heroPos.y + offset.y;

      if (!this.isValidCell(nx, ny) || this.grid[ny][nx] === 'W' || this.grid[ny][nx] === 'D') {
        this.bumpsCount++;
        sound.playBump();
        this.shakeHero();
        if (this.grid[ny]?.[nx] === 'D') {
          this.showToast('🚪 Porta trancada! Use heroi.abrir_porta() se tiver a chave.');
        } else {
          this.showToast('🧱 O herói bateu na parede de pedra!');
        }
        return;
      }

      // Animação 3D de salto/passo em arco para a próxima célula
      const startX = this.heroPos.x;
      const startZ = this.heroPos.y;
      const targetX = nx;
      const targetZ = ny;
      this.heroPos.x = nx;
      this.heroPos.y = ny;

      sound.playStep();
      await this.animateHeroHop(startX, startZ, targetX, targetZ);

    } else if (act.type === 'collect') {
      const key = `${this.heroPos.x},${this.heroPos.y}`;
      const itemData = this.itemMeshes.get(key);

      if (itemData) {
        sound.playGem();
        if (itemData.type === 'G') {
          this.inventory.gems++;
          this.grid[this.heroPos.y][this.heroPos.x] = '.';
          this.showToast('✨ +1 Cristal Mágico coletado!');
        } else if (itemData.type === 'K') {
          this.inventory.keys++;
          this.grid[this.heroPos.y][this.heroPos.x] = '.';
          this.showToast('🗝️ Chave Dourada encontrada!');
        }

        // Animação 3D do item subindo e encolhendo ao ser coletado
        await this.animateItemCollect(itemData);
        this.itemMeshes.delete(key);
        this.updateInventoryUI();
      } else {
        this.showToast('🔍 Nada para coletar neste bloco!');
      }

    } else if (act.type === 'attack') {
      sound.playAttack();
      await this.animateHeroAttack();

      // Procura monstro adjacente
      const offsets = [{x:1,y:0}, {x:-1,y:0}, {x:0,y:1}, {x:0,y:-1}];
      let hit = false;

      for (const off of offsets) {
        const nx = this.heroPos.x + off.x;
        const ny = this.heroPos.y + off.y;
        const key = `${nx},${ny}`;
        const enemy = this.enemyMeshes.get(key);

        if (enemy) {
          hit = true;
          this.grid[ny][nx] = '.';
          this.showToast('⚔️ Monstro derrotado com feitiço certeiro!');
          await this.animateEnemyDefeat(enemy);
          this.enemyMeshes.delete(key);
          break;
        }
      }

      if (!hit) {
        this.showToast('💨 Golpe no vento! Não havia monstros por perto.');
      }

    } else if (act.type === 'open_door') {
      const offsets = [{x:1,y:0}, {x:-1,y:0}, {x:0,y:1}, {x:0,y:-1}];
      let opened = false;

      for (const off of offsets) {
        const nx = this.heroPos.x + off.x;
        const ny = this.heroPos.y + off.y;
        const key = `${nx},${ny}`;
        const door = this.doorMeshes.get(key);

        if (door) {
          if (this.inventory.keys > 0) {
            opened = true;
            this.inventory.keys--;
            this.grid[ny][nx] = '.';
            sound.playVictory();
            this.showToast('🔓 A porta de ferro se abriu com a chave!');
            await this.animateDoorOpen(door);
            this.doorMeshes.delete(key);
            this.updateInventoryUI();
          } else {
            sound.playBump();
            this.showToast('🔒 Você precisa de uma chave 🗝️ para abrir a porta!');
          }
          break;
        }
      }
    }
  }

  // Animação de Salto 3D (Arco Parabólico)
  animateHeroHop(x1, z1, x2, z2) {
    return new Promise(resolve => {
      const duration = 280 / this.animationSpeed;
      const startTime = performance.now();

      const updateHop = () => {
        const elapsed = performance.now() - startTime;
        const progress = Math.min(1, elapsed / duration);

        // Curva suave
        const ease = 0.5 - Math.cos(progress * Math.PI) / 2;
        const curX = x1 + (x2 - x1) * ease;
        const curZ = z1 + (z2 - z1) * ease;
        const curY = 0.25 + Math.sin(progress * Math.PI) * 0.32; // Salto em arco

        if (this.heroGroup) {
          this.heroGroup.position.set(curX, curY, curZ);
        }

        if (progress < 1) {
          requestAnimationFrame(updateHop);
        } else {
          if (this.heroGroup) this.heroGroup.position.set(x2, 0.25, z2);
          resolve();
        }
      };

      requestAnimationFrame(updateHop);
    });
  }

  // Animação de Coleta de Item em 3D
  animateItemCollect(itemData) {
    return new Promise(resolve => {
      const startTime = performance.now();
      const duration = 300;
      const startY = itemData.group.position.y;

      const update = () => {
        const progress = Math.min(1, (performance.now() - startTime) / duration);
        itemData.group.position.y = startY + progress * 0.5;
        itemData.group.scale.setScalar(1 - progress);
        itemData.group.rotation.y += 0.2;

        if (progress < 1) {
          requestAnimationFrame(update);
        } else {
          this.scene.remove(itemData.group);
          resolve();
        }
      };

      requestAnimationFrame(update);
    });
  }

  // Animação de Ataque do Herói
  animateHeroAttack() {
    return new Promise(resolve => {
      const startTime = performance.now();
      const duration = 250;

      const update = () => {
        const progress = Math.min(1, (performance.now() - startTime) / duration);
        const swing = Math.sin(progress * Math.PI) * 0.4;
        if (this.heroGroup) {
          this.heroGroup.rotation.x = swing;
        }

        if (progress < 1) {
          requestAnimationFrame(update);
        } else {
          if (this.heroGroup) this.heroGroup.rotation.x = 0;
          resolve();
        }
      };

      requestAnimationFrame(update);
    });
  }

  // Derrota do Inimigo em 3D
  animateEnemyDefeat(enemy) {
    return new Promise(resolve => {
      const startTime = performance.now();
      const duration = 350;

      const update = () => {
        const progress = Math.min(1, (performance.now() - startTime) / duration);
        enemy.group.scale.setScalar((1 - progress) * 1.2);
        enemy.group.position.y += 0.02;
        enemy.group.rotation.y += 0.25;

        if (progress < 1) {
          requestAnimationFrame(update);
        } else {
          this.scene.remove(enemy.group);
          resolve();
        }
      };

      requestAnimationFrame(update);
    });
  }

  // Abertura da Porta (Desce para o subsolo)
  animateDoorOpen(door) {
    return new Promise(resolve => {
      const startTime = performance.now();
      const duration = 350;

      const update = () => {
        const progress = Math.min(1, (performance.now() - startTime) / duration);
        door.gate.position.y = 0.5 - progress * 0.9;

        if (progress < 1) {
          requestAnimationFrame(update);
        } else {
          resolve();
        }
      };

      requestAnimationFrame(update);
    });
  }

  // Efeito de tremor ao bater na parede
  shakeHero() {
    if (!this.heroGroup) return;
    const startX = this.heroGroup.position.x;
    let step = 0;
    const shake = () => {
      if (step < 6) {
        this.heroGroup.position.x = startX + (step % 2 === 0 ? 0.08 : -0.08);
        step++;
        requestAnimationFrame(shake);
      } else {
        this.heroGroup.position.x = startX;
      }
    };
    shake();
  }

  // Vitória
  checkLevelCompletion(codeTotalLines) {
    const isAtPortal = this.grid[this.heroPos.y][this.heroPos.x] === 'P';
    const remainingGems = this.grid.flat().filter(t => t === 'G').length;

    if (isAtPortal && remainingGems === 0) {
      sound.playVictory();
      this.animateVictoryJump();

      const star1 = true;
      const star2 = this.bumpsCount === 0;
      const star3 = (codeTotalLines <= this.currentLevel.maxLinesFor3Stars);

      let starsCount = 1;
      if (star2) starsCount++;
      if (star3) starsCount++;

      if (this.onLevelCompleted) {
        this.onLevelCompleted({
          levelId: this.currentLevel.id,
          stars: starsCount,
          starDetails: [
            { text: 'Chegou ao Portal Mágico com todas as gemas', achieved: star1 },
            { text: 'Caminho limpo: nenhuma colisão com paredes ou lava', achieved: star2 },
            { text: `Código Mágico Eficiente (máximo ${this.currentLevel.maxLinesFor3Stars} linhas)`, achieved: star3 }
          ],
          gemsEarned: this.inventory.gems,
          xpEarned: 50 + (starsCount * 25)
        });
      }
    } else if (isAtPortal && remainingGems > 0) {
      this.showToast('💎 Você chegou ao Portal, mas esqueceu de pegar os cristais mágicos!');
    } else {
      this.showToast('O herói parou antes do Portal. Complete o feitiço até o fim!');
    }
  }

  animateVictoryJump() {
    if (!this.heroGroup) return;
    const startTime = performance.now();
    const jump = () => {
      const elapsed = (performance.now() - startTime) / 1000;
      this.heroGroup.position.y = 0.25 + Math.abs(Math.sin(elapsed * 5)) * 0.45;
      this.heroGroup.rotation.y += 0.08;
      if (elapsed < 3) {
        requestAnimationFrame(jump);
      } else {
        this.heroGroup.position.y = 0.25;
      }
    };
    jump();
  }

  showToast(msg) {
    if (this.onToastRequested) this.onToastRequested(msg);
  }

  updateInventoryUI() {
    if (!this.invEl) return;
    this.invEl.innerHTML = '';
    if (this.inventory.gems === 0 && this.inventory.keys === 0) {
      this.invEl.innerHTML = '<span class="inv-empty-msg">Vazia</span>';
      return;
    }
    if (this.inventory.gems > 0) {
      const slot = document.createElement('span');
      slot.className = 'inv-item-slot';
      slot.innerHTML = `💎 ${this.inventory.gems}`;
      this.invEl.appendChild(slot);
    }
    if (this.inventory.keys > 0) {
      const slot = document.createElement('span');
      slot.className = 'inv-item-slot';
      slot.innerHTML = `🗝️ ${this.inventory.keys}`;
      this.invEl.appendChild(slot);
    }
  }

  resetHeroPosition() {
    this.isPlaying = false;
    this.heroPos = { ...this.currentLevel.startPos };
    this.heroDir = this.currentLevel.startDir || 'right';
    this.inventory = { gems: 0, keys: 0 };
    this.bumpsCount = 0;
    this.grid = this.currentLevel.map.map(row => [...row]);

    this.clearDungeonMeshes();
    this.build3DDungeon();
    this.createHero3D();
    this.updateInventoryUI();
  }

  // ==========================================================================
  // LOOP PRINCIPAL DE ANIMAÇÃO (60 FPS)
  // ==========================================================================
  animate() {
    requestAnimationFrame(() => this.animate());

    const time = this.clock.getElapsedTime();

    // 1. Rotação e flutuação dos cristais 3D
    this.itemMeshes.forEach(item => {
      if (item.type === 'G') {
        item.group.rotation.y = time * 1.5;
        item.group.position.y = item.initialY + Math.sin(time * 3) * 0.06;
      } else if (item.type === 'K') {
        item.group.rotation.y = time * 2;
        item.group.position.y = item.initialY + Math.sin(time * 2.5) * 0.05;
      }
    });

    // 2. Animação do Portal Mágico (anéis girando em sentidos contrários)
    if (this.portalMesh) {
      this.portalMesh.ring1.rotation.z = time * 1.8;
      this.portalMesh.ring2.rotation.z = -time * 2.2;
      this.portalMesh.group.rotation.y = Math.sin(time) * 0.15;
    }

    // 3. Slime quicando suavemente
    this.enemyMeshes.forEach(enemy => {
      if (enemy.type === 'slime') {
        const bounce = Math.abs(Math.sin(time * 3.5)) * 0.12;
        enemy.group.position.y = enemy.initialY + bounce;
        enemy.body.scale.set(1.15 - bounce * 0.5, 0.85 + bounce * 0.8, 1.15 - bounce * 0.5);
      }
    });

    // 4. Luz da lava piscando
    this.dynamicLights.forEach(item => {
      if (item.type === 'lava') {
        item.light.intensity = item.base + Math.sin(time * 5 + item.light.position.x) * 0.3;
      }
    });

    // 5. Partículas de poeira mágica
    if (this.dustParticles) {
      const positions = this.dustParticles.geometry.attributes.position.array;
      for (let i = 1; i < positions.length; i += 3) {
        positions[i] += 0.004;
        if (positions[i] > 4.5) positions[i] = 0;
      }
      this.dustParticles.geometry.attributes.position.needsUpdate = true;
    }

    // 6. Atualiza controles e renderiza
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}
