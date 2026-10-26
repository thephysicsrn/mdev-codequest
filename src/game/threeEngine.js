// ==========================================================================
// REALISTIC 3D DUNGEON ENGINE - THREE.JS + PBR + BLOOM + TORCHES
// Motor 3D de alta fidelidade com texturas procedurais, iluminação cinemática e shaders
// ==========================================================================

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import {
  createCobblestoneTexture,
  createCobblestoneBumpMap,
  createStoneWallTexture,
  createStoneWallBumpMap,
  LavaTextureAnimator,
  createWoodTexture,
  createParticleTexture
} from './textures.js';

import {
  createStoneColumn,
  createMedievalBarrel,
  createMedievalCrate,
  createWallBanner,
  createMagicSeal,
  createRubblePile,
  createGrimoireMesh
} from './dungeonProps.js';
import { sound } from './sound.js';

export class ThreeDungeonEngine {
  constructor(canvasElement, containerElement) {
    this.canvas = canvasElement;
    this.container = containerElement;

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.composer = null;
    this.controls = null;

    this.currentLevel = null;
    this.grid = [];
    this.heroPos = { x: 0, y: 0 };
    this.heroDir = 'right';
    this.inventory = { gems: 0, keys: 0 };
    this.bumpsCount = 0;
    this.animationSpeed = 1;
    this.isPlaying = false;

    // Entidades e Iluminação
    this.tileMeshes = [];
    this.itemMeshes = new Map();
    this.enemyMeshes = new Map();
    this.doorMeshes = new Map();
    this.heroMesh = null;
    this.portalMesh = null;
    this.torches = [];
    this.propsMeshes = [];
    this.grimoireMesh = null;
    this.animatingItems = [];
    this.emberParticles = null;

    // Gerador de Lava e Texturas
    this.lavaAnimator = new LavaTextureAnimator();
    this.floorTexture = createCobblestoneTexture();
    this.floorBump = createCobblestoneBumpMap();
    this.wallTexture = createStoneWallTexture();
    this.wallBump = createStoneWallBumpMap();
    this.woodTexture = createWoodTexture();
    this.particleTex = createParticleTexture();

    // Callbacks
    this.onLevelCompleted = null;
    this.onActiveLineChanged = null;
    this.onToastRequested = null;
    this.onInventoryChanged = null;

    this.clock = new THREE.Clock();

    this.initThree();
  }

  initThree() {
    const width = this.container.clientWidth || 700;
    const height = this.container.clientHeight || 500;

    // 1. Cena com Neblina Suave e Fundo Noturno Mágico
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0c1222);
    this.scene.fog = new THREE.Fog(0x0c1222, 18, 50);

    // 2. Câmera Isométrica Cinemática
    this.camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    this.camera.position.set(7.5, 10.5, 11);

    // 3. Renderer WebGL de Alta Qualidade com Fallback Seguro
    try {
      this.renderer = new THREE.WebGLRenderer({
        canvas: this.canvas,
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance'
      });
    } catch (e) {
      console.warn('WebGL com antialias não disponível, usando renderer padrão:', e);
      this.renderer = new THREE.WebGLRenderer({
        canvas: this.canvas,
        antialias: false,
        alpha: false
      });
    }
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.3;

    // 4. OrbitControls (Navegação 3D Livre e Intuitiva)
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.maxPolarAngle = Math.PI / 2.05;
    this.controls.minDistance = 5;
    this.controls.maxDistance = 30;
    this.controls.target.set(0, 0.5, 0);

    // 5. Iluminação Viva e Partículas Mágicas
    this.setupLighting();
    this.setupEmbers();

    // 6. Resize Observer para se adaptar a qualquer tamanho de tela
    this.resizeObserver = new ResizeObserver(() => this.onResize());
    this.resizeObserver.observe(this.container);

    // 7. Render Loop 60 FPS
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  setupLighting() {
    // Luz ambiente suave para visibilidade límpida de todos os blocos
    const ambLight = new THREE.AmbientLight(0xffffff, 1.2);
    this.scene.add(ambLight);

    // Luz hemisférica (céu azul suave, chão quente de masmorra)
    const hemiLight = new THREE.HemisphereLight(0xdbeafe, 0x1e293b, 0.8);
    this.scene.add(hemiLight);

    // Luz solar/lunar principal com sombras nítidas
    const moonLight = new THREE.DirectionalLight(0xfff7ed, 1.6);
    moonLight.position.set(12, 20, 10);
    moonLight.castShadow = true;
    moonLight.shadow.mapSize.width = 1024;
    moonLight.shadow.mapSize.height = 1024;
    moonLight.shadow.camera.near = 0.5;
    moonLight.shadow.camera.far = 45;
    moonLight.shadow.camera.left = -12;
    moonLight.shadow.camera.right = 12;
    moonLight.shadow.camera.top = 12;
    moonLight.shadow.camera.bottom = -12;
    moonLight.shadow.bias = -0.0005;
    this.scene.add(moonLight);

    // Luz de borda / Rim light para realce dos contornos do herói e pilares
    const rimLight = new THREE.DirectionalLight(0x818cf8, 0.8);
    rimLight.position.set(-10, 12, -10);
    this.scene.add(rimLight);
  }

  // Partículas de brasas mágicas flutuando suavemente pelo ar da masmorra
  setupEmbers() {
    const count = 45;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const scales = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 12;
      positions[i * 3 + 1] = Math.random() * 5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 12;
      scales[i] = 0.05 + Math.random() * 0.1;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('scale', new THREE.BufferAttribute(scales, 1));

    const mat = new THREE.PointsMaterial({
      color: 0xfbbf24,
      size: 0.12,
      map: this.particleTex,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.emberParticles = new THREE.Points(geo, mat);
    this.scene.add(this.emberParticles);
  }

  onResize() {
    if (!this.container || !this.renderer || !this.camera) return;
    const width = this.container.clientWidth || this.canvas.clientWidth || 700;
    const height = this.container.clientHeight || this.canvas.clientHeight || 500;
    if (width === 0 || height === 0) return;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    if (this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  setTopDownCamera() {
    if (!this.currentLevel) return;
    this.controls.target.set(0, 0, 0);
    const maxDim = Math.max(this.currentLevel.gridSize.cols, this.currentLevel.gridSize.rows);
    this.camera.position.set(0, maxDim * 2.2, 0.01);
    this.controls.update();
  }

  resetCamera() {
    if (!this.currentLevel) return;
    const cols = this.currentLevel.gridSize.cols;
    const rows = this.currentLevel.gridSize.rows;

    this.controls.target.set(0, 0.5, 0);
    this.camera.position.set(cols * 0.9 + 1, Math.max(rows, cols) * 1.5 + 2, rows * 1.5 + 2);
    this.controls.update();
  }

  loadLevel(levelData, heroEmoji = '🧙‍♂️') {
    this.currentLevel = levelData;
    this.heroPos = { ...levelData.startPos };
    this.heroDir = levelData.startDir || 'right';
    this.inventory = { gems: 0, keys: 0 };
    this.bumpsCount = 0;
    this.isPlaying = false;
    this.grid = levelData.map.map(row => [...row]);

    this.clearScene();
    this.buildRealistic3DWorld();
    this.resetCamera();
    this.notifyInventory();

    // Renderização imediata para exibição instantânea
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  clearScene() {
    [...this.tileMeshes, ...this.itemMeshes.values(), ...this.enemyMeshes.values(), ...this.doorMeshes.values()].forEach(m => {
      this.scene.remove(m);
      if (m.geometry) m.geometry.dispose();
      if (m.material) {
        if (Array.isArray(m.material)) m.material.forEach(mat => mat.dispose());
        else m.material.dispose();
      }
    });

    if (this.heroMesh) {
      this.scene.remove(this.heroMesh);
      this.heroMesh = null;
    }
    if (this.portalMesh) {
      this.scene.remove(this.portalMesh);
      this.portalMesh = null;
    }

    if (this.propsMeshes && this.propsMeshes.length > 0) {
      this.propsMeshes.forEach(p => {
        if (p) {
          this.scene.remove(p);
          if (p.geometry) p.geometry.dispose();
          if (p.material) {
            if (Array.isArray(p.material)) p.material.forEach(mat => mat.dispose());
            else p.material.dispose();
          }
        }
      });
      this.propsMeshes = [];
    }

    if (this.grimoireMesh) {
      this.scene.remove(this.grimoireMesh);
      this.grimoireMesh = null;
    }

    this.torches.forEach(t => {
      if (t.light) this.scene.remove(t.light);
      if (t.group) this.scene.remove(t.group);
    });
    this.torches = [];

    this.tileMeshes = [];
    this.itemMeshes.clear();
    this.enemyMeshes.clear();
    this.doorMeshes.clear();
    this.animatingItems = [];
  }

  gridToWorld(x, y) {
    const cols = this.currentLevel.gridSize.cols;
    const rows = this.currentLevel.gridSize.rows;
    const tileSize = 1.35; // Espaçamento generoso entre blocos

    const worldX = (x - (cols - 1) / 2) * tileSize;
    const worldZ = (y - (rows - 1) / 2) * tileSize;
    return { x: worldX, z: worldZ, tileSize };
  }

  // ==========================================================================
  // CONSTRUÇÃO DO MUNDO 3D REALISTA (PBR + TEXTURAS + TOCHAS)
  // ==========================================================================
  buildRealistic3DWorld() {
    const rows = this.currentLevel.gridSize.rows;
    const cols = this.currentLevel.gridSize.cols;

    // 1. Pedestal do Diorama com Textura de Madeira Envelhecida e Rebites
    const dioramaW = cols * 1.35 + 0.8;
    const dioramaD = rows * 1.35 + 0.8;

    const baseGeo = new THREE.BoxGeometry(dioramaW, 0.7, dioramaD);
    const baseMat = new THREE.MeshStandardMaterial({
      map: this.woodTexture,
      roughness: 0.8,
      metalness: 0.2
    });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.position.set(0, -0.45, 0);
    baseMesh.receiveShadow = true;
    this.scene.add(baseMesh);
    this.tileMeshes.push(baseMesh);

    // Moldura de Ferro Forjado no Pedestal
    const rimGeo = new THREE.BoxGeometry(dioramaW + 0.15, 0.16, dioramaD + 0.15);
    const rimMat = new THREE.MeshStandardMaterial({
      color: 0x1f293d,
      roughness: 0.4,
      metalness: 0.7
    });
    const rimMesh = new THREE.Mesh(rimGeo, rimMat);
    rimMesh.position.set(0, -0.1, 0);
    this.scene.add(rimMesh);
    this.tileMeshes.push(rimMesh);

    // 2. Materiais PBR Realistas
    const floorMaterial = new THREE.MeshStandardMaterial({
      map: this.floorTexture,
      bumpMap: this.floorBump,
      bumpScale: 0.04,
      roughness: 0.82,
      metalness: 0.15
    });

    const wallMaterial = new THREE.MeshStandardMaterial({
      map: this.wallTexture,
      bumpMap: this.wallBump,
      bumpScale: 0.08,
      roughness: 0.75,
      metalness: 0.12
    });

    const wallCapMaterial = new THREE.MeshStandardMaterial({
      map: this.floorTexture,
      bumpMap: this.floorBump,
      bumpScale: 0.05,
      roughness: 0.7,
      metalness: 0.2
    });

    // 3. Montagem da Grade da Masmorra
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const type = this.grid[r][c];
        const pos = this.gridToWorld(c, r);

        // Bloco de Chão / Piso de Pedra
        if (type !== 'L') {
          const tileGeo = new THREE.BoxGeometry(1.26, 0.25, 1.26);
          const tileMesh = new THREE.Mesh(tileGeo, floorMaterial);
          tileMesh.position.set(pos.x, 0, pos.z);
          tileMesh.receiveShadow = true;
          this.scene.add(tileMesh);
          this.tileMeshes.push(tileMesh);
        }

        // ==================== PAREDE DE PEDRA REALISTA 3D ====================
        if (type === 'W') {
          // Bloco principal de pedra com tijolos esculpidos
          const wallGeo = new THREE.BoxGeometry(1.26, 1.35, 1.26);
          const wallMesh = new THREE.Mesh(wallGeo, [
            wallMaterial, wallMaterial, wallCapMaterial, wallMaterial, wallMaterial, wallMaterial
          ]);
          wallMesh.position.set(pos.x, 0.68, pos.z);
          wallMesh.castShadow = true;
          wallMesh.receiveShadow = true;
          this.scene.add(wallMesh);
          this.tileMeshes.push(wallMesh);

          // Beiral / Cornija chanfrada no topo da parede
          const corniceGeo = new THREE.BoxGeometry(1.32, 0.12, 1.32);
          const cornice = new THREE.Mesh(corniceGeo, wallCapMaterial);
          cornice.position.set(pos.x, 1.41, pos.z);
          cornice.castShadow = true;
          this.scene.add(cornice);
          this.tileMeshes.push(cornice);

          // Adiciona tochas de parede decorativas com chamas em paredes específicas
          if ((c === 0 && r === 1) || (c === cols - 1 && r === rows - 2) || (c === 2 && r === 0)) {
            this.createWallTorch(pos.x, 0.85, pos.z, c === 0 ? 'right' : (c === cols - 1 ? 'left' : 'down'));
          }

        // ==================== LAVA FERVENTE MAGMÁTICA 3D ====================
        } else if (type === 'L') {
          // Bloco rebaixado com relevo de basalto
          const lavaGeo = new THREE.BoxGeometry(1.26, 0.14, 1.26);
          const lavaMat = new THREE.MeshStandardMaterial({
            map: this.lavaAnimator.texture,
            emissive: 0xff3300,
            emissiveIntensity: 1.1,
            roughness: 0.25,
            metalness: 0.1
          });
          const lavaMesh = new THREE.Mesh(lavaGeo, lavaMat);
          lavaMesh.position.set(pos.x, -0.06, pos.z);
          this.scene.add(lavaMesh);
          this.tileMeshes.push(lavaMesh);

          // Luz pontual laranja quente que pulsa
          const lavaLight = new THREE.PointLight(0xff5500, 1.8, 3.8);
          lavaLight.position.set(pos.x, 0.45, pos.z);
          lavaLight.castShadow = false;
          this.scene.add(lavaLight);
          this.animatingItems.push({ type: 'lava_light', light: lavaLight, baseIntensity: 1.8 });

        // ==================== CRISTAL / GEMA DE MANA 3D ====================
        } else if (type === 'G') {
          const gemGroup = new THREE.Group();
          gemGroup.position.set(pos.x, 0.72, pos.z);

          // Cristal multifacetado (Icosaedro) com emissão pura
          const gemGeo = new THREE.IcosahedronGeometry(0.36, 0);
          const gemMat = new THREE.MeshStandardMaterial({
            color: 0x00f7ff,
            emissive: 0x00d8f6,
            emissiveIntensity: 1.3,
            roughness: 0.1,
            metalness: 0.2,
            transparent: true,
            opacity: 0.95
          });
          const gemMesh = new THREE.Mesh(gemGeo, gemMat);
          gemMesh.castShadow = true;
          gemGroup.add(gemMesh);

          // Anel orbital de partículas mágicas girando ao redor do cristal
          const ringGeo = new THREE.TorusGeometry(0.48, 0.02, 8, 24);
          const ringMat = new THREE.MeshBasicMaterial({ color: 0x67e8f9 });
          const ring = new THREE.Mesh(ringGeo, ringMat);
          ring.rotation.x = Math.PI / 3;
          gemGroup.add(ring);

          // Luz pontual ciano brilhante
          const gemLight = new THREE.PointLight(0x00f7ff, 2.0, 3.2);
          gemGroup.add(gemLight);

          this.scene.add(gemGroup);
          this.itemMeshes.set(`item-${c}-${r}`, gemGroup);
          this.animatingItems.push({ type: 'spin_float', mesh: gemGroup, baseY: 0.72, speed: 2.5 });

        // ==================== CHAVE DOURADA MEDIEVAL 3D ====================
        } else if (type === 'K') {
          const keyGroup = new THREE.Group();
          keyGroup.position.set(pos.x, 0.65, pos.z);

          const keyMat = new THREE.MeshStandardMaterial({
            color: 0xf59e0b,
            metalness: 0.95,
            roughness: 0.18,
            emissive: 0xd97706,
            emissiveIntensity: 0.6
          });

          // Haste, dentes e empunhadura ornamentada
          const shaftGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.52);
          const shaft = new THREE.Mesh(shaftGeo, keyMat);
          shaft.rotation.z = Math.PI / 2;
          keyGroup.add(shaft);

          const ringGeo = new THREE.TorusGeometry(0.14, 0.04, 12, 24);
          const ring = new THREE.Mesh(ringGeo, keyMat);
          ring.position.set(-0.28, 0, 0);
          keyGroup.add(ring);

          const tooth1 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.15, 0.04), keyMat);
          tooth1.position.set(0.16, -0.09, 0);
          const tooth2 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.11, 0.04), keyMat);
          tooth2.position.set(0.24, -0.07, 0);
          keyGroup.add(tooth1, tooth2);

          const keyLight = new THREE.PointLight(0xfbbf24, 1.4, 2.5);
          keyGroup.add(keyLight);

          keyGroup.scale.set(1.3, 1.3, 1.3);
          this.scene.add(keyGroup);
          this.itemMeshes.set(`item-${c}-${r}`, keyGroup);
          this.animatingItems.push({ type: 'spin_float', mesh: keyGroup, baseY: 0.65, speed: 2.8 });

        // ==================== PORTA PESADA DE CARVALHO E FERRO 3D ====================
        } else if (type === 'D') {
          const doorGroup = new THREE.Group();
          doorGroup.position.set(pos.x, 0, pos.z);

          // Batentes de pedra laterais
          const postGeo = new THREE.BoxGeometry(0.2, 1.3, 0.25);
          const postL = new THREE.Mesh(postGeo, wallMaterial);
          postL.position.set(-0.52, 0.65, 0);
          const postR = new THREE.Mesh(postGeo, wallMaterial);
          postR.position.set(0.52, 0.65, 0);
          doorGroup.add(postL, postR);

          // Folha da porta de madeira reforçada com ferro
          const woodPanelGeo = new THREE.BoxGeometry(0.86, 1.25, 0.12);
          const woodPanelMat = new THREE.MeshStandardMaterial({
            map: this.woodTexture,
            roughness: 0.65,
            metalness: 0.3
          });
          const woodPanel = new THREE.Mesh(woodPanelGeo, woodPanelMat);
          woodPanel.position.set(0, 0.65, 0);
          woodPanel.castShadow = true;
          doorGroup.add(woodPanel);

          // Cintas de ferro forjado e cadeado dourado
          const ironBandMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.85, roughness: 0.3 });
          const band1 = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.08, 0.14), ironBandMat);
          band1.position.set(0, 0.3, 0);
          const band2 = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.08, 0.14), ironBandMat);
          band2.position.set(0, 0.95, 0);
          doorGroup.add(band1, band2);

          const lockMesh = new THREE.Mesh(
            new THREE.BoxGeometry(0.2, 0.22, 0.18),
            new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.9, roughness: 0.2 })
          );
          lockMesh.position.set(0, 0.65, 0);
          doorGroup.add(lockMesh);

          this.scene.add(doorGroup);
          this.doorMeshes.set(`door-${c}-${r}`, doorGroup);

        // ==================== PORTAL DIMENSIONAL COM ARCO GÓTICO 3D ====================
        } else if (type === 'P') {
          const portalGroup = new THREE.Group();
          portalGroup.position.set(pos.x, 0, pos.z);

          // Arco de pedra gótico
          const pillarGeo = new THREE.BoxGeometry(0.22, 1.4, 0.25);
          const pillarL = new THREE.Mesh(pillarGeo, wallMaterial);
          pillarL.position.set(-0.55, 0.7, 0);
          const pillarR = new THREE.Mesh(pillarGeo, wallMaterial);
          pillarR.position.set(0.55, 0.7, 0);
          const lintel = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.22, 0.28), wallMaterial);
          lintel.position.set(0, 1.45, 0);
          portalGroup.add(pillarL, pillarR, lintel);

          // Anel mágico brilhante com vórtice
          const vortexGroup = new THREE.Group();
          vortexGroup.position.set(0, 0.75, 0);

          const torusGeo = new THREE.TorusGeometry(0.48, 0.09, 16, 32);
          const torusMat = new THREE.MeshStandardMaterial({
            color: 0x8b5cf6,
            emissive: 0xa855f7,
            emissiveIntensity: 1.8,
            roughness: 0.2
          });
          const torus = new THREE.Mesh(torusGeo, torusMat);
          vortexGroup.add(torus);

          // Disco espiral do vórtice com transparência
          const discGeo = new THREE.CircleGeometry(0.42, 32);
          const discMat = new THREE.MeshBasicMaterial({
            color: 0x4c1d95,
            side: THREE.DoubleSide
          });
          const disc = new THREE.Mesh(discGeo, discMat);
          vortexGroup.add(disc);

          portalGroup.add(vortexGroup);

          // Luz mágica violeta pulsante
          const portalLight = new THREE.PointLight(0xa855f7, 2.5, 4.5);
          portalLight.position.set(0, 0.75, 0.2);
          portalGroup.add(portalLight);

          this.scene.add(portalGroup);
          this.portalMesh = vortexGroup;
          this.animatingItems.push({ type: 'spin_portal', mesh: vortexGroup, light: portalLight });

          // Círculo Mágico de Glifos sob o Portal
          const portalSeal = createMagicSeal(pos.x, 0.13, pos.z, 0xa855f7, 0.6);
          this.scene.add(portalSeal);
          this.propsMeshes.push(portalSeal);
          this.animatingItems.push({ type: 'spin_seal', mesh: portalSeal });

        // ==================== SLIME MONSTRO GELATINOSO 3D ====================
        } else if (type === 'S') {
          const slimeGroup = new THREE.Group();
          slimeGroup.position.set(pos.x, 0.38, pos.z);

          const slimeMat = new THREE.MeshStandardMaterial({
            color: 0x10b981,
            emissive: 0x059669,
            emissiveIntensity: 0.45,
            roughness: 0.2,
            metalness: 0.1,
            transparent: true,
            opacity: 0.9
          });
          const slimeGeo = new THREE.SphereGeometry(0.4, 20, 20);
          const slimeMesh = new THREE.Mesh(slimeGeo, slimeMat);
          slimeMesh.scale.set(1.1, 0.85, 1.1);
          slimeMesh.castShadow = true;
          slimeGroup.add(slimeMesh);

          // Olhos pretos expressivos com reflexo branco
          const eyeGeo = new THREE.SphereGeometry(0.07, 10, 10);
          const eyeMat = new THREE.MeshBasicMaterial({ color: 0x050505 });
          const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
          eyeL.position.set(-0.13, 0.08, 0.36);
          const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
          eyeR.position.set(0.13, 0.08, 0.36);
          slimeGroup.add(eyeL, eyeR);

          const pupilGeo = new THREE.SphereGeometry(0.025, 8, 8);
          const pupilMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
          const pupL = new THREE.Mesh(pupilGeo, pupilMat);
          pupL.position.set(-0.11, 0.1, 0.42);
          const pupR = new THREE.Mesh(pupilGeo, pupilMat);
          pupR.position.set(0.15, 0.1, 0.42);
          slimeGroup.add(pupL, pupR);

          this.scene.add(slimeGroup);
          this.enemyMeshes.set(`enemy-${c}-${r}`, slimeGroup);
          this.animatingItems.push({ type: 'squish_slime', mesh: slimeGroup });

        // ==================== GOLEM BOSS DE PEDRA 3D ====================
        } else if (type === 'B') {
          const golemGroup = new THREE.Group();
          golemGroup.position.set(pos.x, 0.65, pos.z);

          const bodyGeo = new THREE.BoxGeometry(0.75, 0.75, 0.75);
          const golemBody = new THREE.Mesh(bodyGeo, wallMaterial);
          golemBody.castShadow = true;
          golemGroup.add(golemBody);

          // Cabeça de pedra angular
          const headMesh = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.45, 0.5), wallMaterial);
          headMesh.position.set(0, 0.6, 0);
          headMesh.castShadow = true;
          golemGroup.add(headMesh);

          // Olhos vermelhos brilhantes com Bloom
          const eyeGeo = new THREE.BoxGeometry(0.12, 0.08, 0.08);
          const eyeMat = new THREE.MeshStandardMaterial({
            color: 0xef4444,
            emissive: 0xff0000,
            emissiveIntensity: 2.2
          });
          const e1 = new THREE.Mesh(eyeGeo, eyeMat);
          e1.position.set(-0.16, 0.62, 0.24);
          const e2 = new THREE.Mesh(eyeGeo, eyeMat);
          e2.position.set(0.16, 0.62, 0.24);
          golemGroup.add(e1, e2);

          const bossLight = new THREE.PointLight(0xef4444, 2.0, 3.5);
          golemGroup.add(bossLight);

          this.scene.add(golemGroup);
          this.enemyMeshes.set(`enemy-${c}-${r}`, golemGroup);
          this.animatingItems.push({ type: 'boss_breath', mesh: golemGroup });
        }
      }
    }

    // Cria o Herói Mago Detalhado
    // Círculo Mágico de Invocação sob o Herói
    const startW = this.gridToWorld(this.heroPos.x, this.heroPos.y);
    const startSeal = createMagicSeal(startW.x, 0.13, startW.z, 0x38bdf8, 0.5);
    this.scene.add(startSeal);
    this.propsMeshes.push(startSeal);
    this.animatingItems.push({ type: 'spin_seal', mesh: startSeal });

    // Pilares de Pedra nos 4 cantos do pedestal
    const p1 = this.gridToWorld(0, 0);
    const p2 = this.gridToWorld(cols - 1, 0);
    const p3 = this.gridToWorld(0, rows - 1);
    const p4 = this.gridToWorld(cols - 1, rows - 1);

    const c1 = createStoneColumn(p1.x - 0.7, 0, p1.z - 0.7, wallMaterial, wallCapMaterial);
    const c2 = createStoneColumn(p2.x + 0.7, 0, p2.z - 0.7, wallMaterial, wallCapMaterial);
    const c3 = createStoneColumn(p3.x - 0.7, 0, p3.z + 0.7, wallMaterial, wallCapMaterial);
    const c4 = createStoneColumn(p4.x + 0.7, 0, p4.z + 0.7, wallMaterial, wallCapMaterial);
    this.scene.add(c1, c2, c3, c4);
    this.propsMeshes.push(c1, c2, c3, c4);

    // Estandarte real na parede norte central
    const midX = Math.floor(cols / 2);
    const midW = this.gridToWorld(midX, 0);
    const banner = createWallBanner(midW.x, 0.95, midW.z + 0.65, 'down');
    this.scene.add(banner);
    this.propsMeshes.push(banner);

    // Caixotes e Barris em cantos decorativos
    const woodMat = new THREE.MeshStandardMaterial({
      map: this.woodTexture,
      roughness: 0.8,
      metalness: 0.1
    });
    const b1 = createMedievalBarrel(p1.x + 0.3, 0.12, p1.z + 0.4, woodMat, 0.4);
    const cr1 = createMedievalCrate(p2.x - 0.4, 0.12, p2.z + 0.3, woodMat, -0.3);
    this.scene.add(b1, cr1);
    this.propsMeshes.push(b1, cr1);

    this.createRealisticHero();
  }

  // Cria tocha de parede com suporte de ferro forjado e chama animada
  createWallTorch(x, y, z, facing) {
    const torchGroup = new THREE.Group();
    const offset = 0.52;

    if (facing === 'right') {
      torchGroup.position.set(x + offset, y, z);
      torchGroup.rotation.y = Math.PI / 2;
    } else if (facing === 'left') {
      torchGroup.position.set(x - offset, y, z);
      torchGroup.rotation.y = -Math.PI / 2;
    } else {
      torchGroup.position.set(x, y, z + offset);
    }

    // Haste de ferro
    const ironMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, metalness: 0.9, roughness: 0.3 });
    const bracket = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.25), ironMat);
    bracket.rotation.z = Math.PI / 3;
    torchGroup.add(bracket);

    // Corpo de madeira da tocha
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.8 });
    const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.03, 0.35), woodMat);
    stick.position.set(0.1, 0.15, 0);
    torchGroup.add(stick);

    // Cabeça da chama (Glow)
    const flameMat = new THREE.MeshStandardMaterial({
      color: 0xff8800,
      emissive: 0xff4400,
      emissiveIntensity: 2.5,
      roughness: 0.1
    });
    const flameGeo = new THREE.ConeGeometry(0.08, 0.22, 12);
    const flame = new THREE.Mesh(flameGeo, flameMat);
    flame.position.set(0.1, 0.35, 0);
    torchGroup.add(flame);

    // Luz pontual oscilante da tocha
    const light = new THREE.PointLight(0xff7700, 1.6, 4.5);
    light.position.set(0.1, 0.4, 0);
    light.castShadow = true;
    light.shadow.bias = -0.002;
    torchGroup.add(light);

    this.scene.add(torchGroup);
    this.torches.push({ group: torchGroup, flame: flame, light: light, baseIntensity: 1.6 });
  }

  // ==========================================================================
  // O HERÓI MAGO 3D REALISTA E DETALHADO
  // ==========================================================================
  createRealisticHero() {
    if (this.heroMesh) {
      this.scene.remove(this.heroMesh);
    }

    const hero = new THREE.Group();

    // 1. Manto Arcano com Dobras de Tecido
    const robeMat = new THREE.MeshStandardMaterial({
      color: 0x2563eb,
      roughness: 0.65,
      metalness: 0.1
    });
    const robeGeo = new THREE.ConeGeometry(0.38, 0.72, 18);
    const robe = new THREE.Mesh(robeGeo, robeMat);
    robe.position.y = 0.36;
    robe.castShadow = true;
    hero.add(robe);

    // Cinto de couro com fivela dourada
    const beltMat = new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.6 });
    const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.08, 16), beltMat);
    belt.position.y = 0.34;
    hero.add(belt);

    const buckleMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.9, roughness: 0.2 });
    const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.1, 0.06), buckleMat);
    buckle.position.set(0, 0.34, 0.32);
    hero.add(buckle);

    // Capa nos ombros
    const capeMat = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.6 });
    const cowl = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.42, 0.15, 16), capeMat);
    cowl.position.y = 0.62;
    hero.add(cowl);

    // 2. Cabeça e Rosto com Barba Branca Espessa de Mago
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xffdfba, roughness: 0.7 });
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 16), skinMat);
    head.position.y = 0.76;
    head.castShadow = true;
    hero.add(head);

    // Olhos pretos expressivos
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x111827 });
    const eL = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 8), eyeMat);
    eL.position.set(-0.07, 0.8, 0.18);
    const eR = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 8), eyeMat);
    eR.position.set(0.07, 0.8, 0.18);
    hero.add(eL, eR);

    // Barba branca clássica de mago
    const beardMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.9 });
    const beardGeo = new THREE.ConeGeometry(0.18, 0.35, 12);
    const beard = new THREE.Mesh(beardGeo, beardMat);
    beard.position.set(0, 0.6, 0.14);
    beard.rotation.x = -0.2;
    hero.add(beard);

    // 3. Chapéu Cônico de Bruxo Curvado com Faixa de Couro
    const hatGroup = new THREE.Group();
    hatGroup.position.y = 0.88;

    const hatMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.5 });
    // Aba larga do chapéu
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.04, 20), hatMat);
    hatGroup.add(brim);

    // Faixa dourada no chapéu
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.27, 0.06, 16), buckleMat);
    band.position.y = 0.06;
    hatGroup.add(band);

    // Cone pontiagudo com ponta dobrada para trás
    const cone1 = new THREE.Mesh(new THREE.ConeGeometry(0.26, 0.45, 16), hatMat);
    cone1.position.set(0, 0.25, -0.04);
    cone1.rotation.x = -0.2;
    hatGroup.add(cone1);

    const cone2 = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.28, 12), hatMat);
    cone2.position.set(0, 0.52, -0.16);
    cone2.rotation.x = -0.55;
    hatGroup.add(cone2);

    hero.add(hatGroup);

    // 4. Cajado Mágico Retorcido de Madeira com Orbe Reluzente
    const staffGroup = new THREE.Group();
    staffGroup.position.set(0.35, 0.45, 0.15);

    const woodMat = new THREE.MeshStandardMaterial({ color: 0x5c2e0b, roughness: 0.85 });
    const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.025, 0.95), woodMat);
    stick.castShadow = true;
    staffGroup.add(stick);

    // Garras de madeira no topo segurando a gema
    const clawMat = new THREE.MeshStandardMaterial({ color: 0x78350f });
    for (let i = 0; i < 3; i++) {
      const claw = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.14, 0.03), clawMat);
      const angle = (i * Math.PI * 2) / 3;
      claw.position.set(Math.cos(angle) * 0.08, 0.46, Math.sin(angle) * 0.08);
      claw.rotation.z = Math.cos(angle) * 0.3;
      staffGroup.add(claw);
    }

    // Orbe Mágico Flutuante com Luz Própria
    const orbGeo = new THREE.OctahedronGeometry(0.1, 1);
    const orbMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 2.2,
      roughness: 0.1,
      metalness: 0.2
    });
    const orb = new THREE.Mesh(orbGeo, orbMat);
    orb.position.y = 0.52;
    staffGroup.add(orb);

    const staffLight = new THREE.PointLight(0x38bdf8, 1.4, 2.8);
    staffLight.position.y = 0.52;
    staffGroup.add(staffLight);

    hero.add(staffGroup);

    // Livro de Feitiços Flutuante (Grimório do Mago)
    const grimoire = createGrimoireMesh();
    grimoire.position.set(-0.36, 0.52, 0.1);
    grimoire.rotation.set(0.1, 0.3, -0.15);
    hero.add(grimoire);
    this.grimoireMesh = grimoire;

    // Posiciona no Grid
    const pos = this.gridToWorld(this.heroPos.x, this.heroPos.y);
    hero.position.set(pos.x, 0, pos.z);
    this.updateHeroRotation(hero, this.heroDir);

    this.scene.add(hero);
    this.heroMesh = hero;
  }

  updateHeroRotation(heroMesh, dir) {
    if (!heroMesh) return;
    let targetY = 0;
    if (dir === 'right') targetY = Math.PI / 2;
    else if (dir === 'left') targetY = -Math.PI / 2;
    else if (dir === 'up') targetY = Math.PI;
    else if (dir === 'down') targetY = 0;
    heroMesh.rotation.y = targetY;
  }

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

      if (this.grid[this.heroPos.y][this.heroPos.x] === 'L') {
        sound.playBump();
        this.showToast('🔥 Ai! O herói pisou na lava fervente! Tente desviar.');
        await this.animateBump();
        success = false;
        break;
      }

      const delay = Math.max(60, Math.floor(350 / this.animationSpeed));
      await new Promise(r => setTimeout(r, delay));
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
      const nx = this.heroPos.x + offset.x;
      const ny = this.heroPos.y + offset.y;

      this.updateHeroRotation(this.heroMesh, act.dir);

      if (!this.isValidCell(nx, ny) || this.grid[ny][nx] === 'W' || this.grid[ny][nx] === 'D') {
        this.bumpsCount++;
        sound.playBump();
        await this.animateBump();
        if (this.grid[ny]?.[nx] === 'D') {
          this.showToast('🚪 A porta está trancada! Use heroi.abrir_porta() se tiver a chave.');
        } else {
          this.showToast('🧱 O herói bateu na parede de pedra!');
        }
        return;
      }

      this.heroPos.x = nx;
      this.heroPos.y = ny;
      sound.playStep();
      await this.animateHeroMove(nx, ny);

    } else if (act.type === 'collect') {
      const item = this.grid[this.heroPos.y][this.heroPos.x];

      if (item === 'G') {
        this.inventory.gems++;
        this.grid[this.heroPos.y][this.heroPos.x] = '.';
        sound.playGem();

        const gemMesh = this.itemMeshes.get(`item-${this.heroPos.x}-${this.heroPos.y}`);
        if (gemMesh) {
          await this.animateItemCollect(gemMesh);
          this.scene.remove(gemMesh);
          this.itemMeshes.delete(`item-${this.heroPos.x}-${this.heroPos.y}`);
        }
        this.notifyInventory();

      } else if (item === 'K') {
        this.inventory.keys++;
        this.grid[this.heroPos.y][this.heroPos.x] = '.';
        sound.playGem();

        const keyMesh = this.itemMeshes.get(`item-${this.heroPos.x}-${this.heroPos.y}`);
        if (keyMesh) {
          await this.animateItemCollect(keyMesh);
          this.scene.remove(keyMesh);
          this.itemMeshes.delete(`item-${this.heroPos.x}-${this.heroPos.y}`);
        }
        this.notifyInventory();
      } else {
        this.showToast('🔍 Nada para coletar neste bloco!');
      }

    } else if (act.type === 'attack') {
      sound.playAttack();
      await this.animateHeroAttack();

      const offsets = [{x:1,y:0}, {x:-1,y:0}, {x:0,y:1}, {x:0,y:-1}];
      let hit = false;

      for (const off of offsets) {
        const nx = this.heroPos.x + off.x;
        const ny = this.heroPos.y + off.y;
        if (this.isValidCell(nx, ny) && (this.grid[ny][nx] === 'S' || this.grid[ny][nx] === 'B')) {
          hit = true;
          const enemyMesh = this.enemyMeshes.get(`enemy-${nx}-${ny}`);
          if (enemyMesh) {
            await this.animateEnemyDefeat(enemyMesh);
            this.scene.remove(enemyMesh);
            this.enemyMeshes.delete(`enemy-${nx}-${ny}`);
          }
          this.grid[ny][nx] = '.';
          this.showToast('⚔️ Golpe certeiro! Monstro derrotado em 3D.');
          break;
        }
      }

      if (!hit) {
        this.showToast('💨 O herói atacou o ar! Não havia monstros adjacentes.');
      }

    } else if (act.type === 'open_door') {
      const offsets = [{x:1,y:0}, {x:-1,y:0}, {x:0,y:1}, {x:0,y:-1}];
      let opened = false;

      for (const off of offsets) {
        const nx = this.heroPos.x + off.x;
        const ny = this.heroPos.y + off.y;
        if (this.isValidCell(nx, ny) && this.grid[ny][nx] === 'D') {
          if (this.inventory.keys > 0) {
            opened = true;
            this.inventory.keys--;
            this.grid[ny][nx] = '.';
            sound.playVictory();

            const doorMesh = this.doorMeshes.get(`door-${nx}-${ny}`);
            if (doorMesh) {
              await this.animateDoorOpen(doorMesh);
              this.scene.remove(doorMesh);
              this.doorMeshes.delete(`door-${nx}-${ny}`);
            }
            this.notifyInventory();
          } else {
            sound.playBump();
            this.showToast('🔒 Você precisa de uma chave dourada 🗝️ para abrir a porta!');
          }
          break;
        }
      }
    }
  }

  animateHeroMove(targetGridX, targetGridY) {
    return new Promise(resolve => {
      const startPos = this.heroMesh.position.clone();
      const endTarget = this.gridToWorld(targetGridX, targetGridY);
      const endPos = new THREE.Vector3(endTarget.x, 0, endTarget.z);

      const duration = 280 / this.animationSpeed;
      const startTime = performance.now();

      const step = (now) => {
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / duration);

        this.heroMesh.position.x = THREE.MathUtils.lerp(startPos.x, endPos.x, progress);
        this.heroMesh.position.z = THREE.MathUtils.lerp(startPos.z, endPos.z, progress);

        // Pulo do herói em parábola
        const hopHeight = 0.38;
        this.heroMesh.position.y = Math.sin(progress * Math.PI) * hopHeight;

        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          this.heroMesh.position.copy(endPos);
          resolve();
        }
      };
      requestAnimationFrame(step);
    });
  }

  animateBump() {
    return new Promise(resolve => {
      const origPos = this.heroMesh.position.clone();
      const startTime = performance.now();
      const duration = 250;

      const shake = (now) => {
        const elapsed = now - startTime;
        const progress = elapsed / duration;

        if (progress < 1) {
          const offset = Math.sin(progress * Math.PI * 6) * 0.12 * (1 - progress);
          this.heroMesh.position.x = origPos.x + offset;
          this.heroMesh.rotation.z = offset * 2;
          requestAnimationFrame(shake);
        } else {
          this.heroMesh.position.copy(origPos);
          this.heroMesh.rotation.z = 0;
          resolve();
        }
      };
      requestAnimationFrame(shake);
    });
  }

  animateItemCollect(mesh) {
    return new Promise(resolve => {
      const startY = mesh.position.y;
      const startTime = performance.now();
      const duration = 300;

      const animate = (now) => {
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / duration);

        mesh.position.y = startY + progress * 0.9;
        const scale = 1 - progress;
        mesh.scale.set(scale, scale, scale);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };
      requestAnimationFrame(animate);
    });
  }

  animateHeroAttack() {
    return new Promise(resolve => {
      const origRotX = this.heroMesh.rotation.x;
      const startTime = performance.now();
      const duration = 360;

      // Anel expansivo de onda de choque com Bloom
      const ringGeo = new THREE.RingGeometry(0.15, 0.35, 24);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.95,
        blending: THREE.AdditiveBlending
      });
      const shockwave = new THREE.Mesh(ringGeo, ringMat);
      shockwave.rotation.x = -Math.PI / 2;
      shockwave.position.copy(this.heroMesh.position);
      shockwave.position.y = 0.2;
      this.scene.add(shockwave);

      const attack = (now) => {
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / duration);

        this.heroMesh.rotation.x = origRotX + Math.sin(progress * Math.PI) * 0.45;

        const waveScale = 1 + progress * 3.2;
        shockwave.scale.set(waveScale, waveScale, waveScale);
        ringMat.opacity = (1 - progress) * 0.95;

        if (progress < 1) {
          requestAnimationFrame(attack);
        } else {
          this.heroMesh.rotation.x = origRotX;
          this.scene.remove(shockwave);
          ringGeo.dispose();
          ringMat.dispose();
          resolve();
        }
      };
      requestAnimationFrame(attack);
    });
  }

  animateEnemyDefeat(mesh) {
    return new Promise(resolve => {
      const startTime = performance.now();
      const duration = 350;

      const defeat = (now) => {
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / duration);

        mesh.rotation.y += 0.25;
        const scale = 1 - progress;
        mesh.scale.set(scale, scale, scale);
        mesh.position.y += 0.08;

        if (progress < 1) {
          requestAnimationFrame(defeat);
        } else {
          resolve();
        }
      };
      requestAnimationFrame(defeat);
    });
  }

  animateDoorOpen(mesh) {
    return new Promise(resolve => {
      const startY = mesh.position.y;
      const startTime = performance.now();
      const duration = 400;

      const open = (now) => {
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / duration);

        mesh.position.y = startY + progress * 1.6;

        if (progress < 1) {
          requestAnimationFrame(open);
        } else {
          resolve();
        }
      };
      requestAnimationFrame(open);
    });
  }

  checkLevelCompletion(codeTotalLines) {
    const currentTile = this.grid[this.heroPos.y][this.heroPos.x];
    const remainingGems = this.grid.flat().filter(t => t === 'G').length;
    const isAtPortal = currentTile === 'P';

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
            { text: 'Chegou ao Portal Mágico com todas as gemas em 3D', achieved: star1 },
            { text: 'Percurso perfeito: sem colisões com pedra ou lava', achieved: star2 },
            { text: `Código Mágico Otimizado (máximo ${this.currentLevel.maxLinesFor3Stars} linhas)`, achieved: star3 }
          ],
          gemsEarned: this.inventory.gems,
          xpEarned: 50 + (starsCount * 25)
        });
      }
    } else if (isAtPortal && remainingGems > 0) {
      this.showToast('💎 Você chegou ao Portal, mas esqueceu de coletar as gemas mágicas!');
    } else {
      this.showToast('O herói parou antes do Portal. Continue seu código para chegar ao fim!');
    }
  }

  animateVictoryJump() {
    if (!this.heroMesh) return;
    const startTime = performance.now();
    const duration = 1100;

    const jump = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);

      this.heroMesh.position.y = Math.sin(progress * Math.PI) * 0.9;
      this.heroMesh.rotation.y += 0.15;

      if (progress < 1) {
        requestAnimationFrame(jump);
      } else {
        this.heroMesh.position.y = 0;
      }
    };
    requestAnimationFrame(jump);
  }

  cycleSpeed() {
    if (this.animationSpeed === 1) this.animationSpeed = 2;
    else if (this.animationSpeed === 2) this.animationSpeed = 4;
    else this.animationSpeed = 1;
    return this.animationSpeed;
  }

  resetHeroPosition() {
    this.isPlaying = false;
    this.heroPos = { ...this.currentLevel.startPos };
    this.heroDir = this.currentLevel.startDir || 'right';
    this.inventory = { gems: 0, keys: 0 };
    this.bumpsCount = 0;
    this.grid = this.currentLevel.map.map(row => [...row]);
    this.clearScene();
    this.buildRealistic3DWorld();
    this.notifyInventory();

    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  showToast(message) {
    if (this.onToastRequested) this.onToastRequested(message);
  }

  notifyInventory() {
    if (this.onInventoryChanged) {
      this.onInventoryChanged(this.inventory);
    }
  }

  // ==========================================================================
  // LOOP DE RENDERIZAÇÃO 60 FPS (BLOOM + PARTICULAS + TOCHAS)
  // ==========================================================================
  animate() {
    requestAnimationFrame(this.animate);

    try {
      const delta = this.clock.getDelta();
      const time = this.clock.getElapsedTime();

      // 1. Atualiza Textura Dinâmica da Lava Fervente
      if (this.lavaAnimator) {
        this.lavaAnimator.update(time);
      }

      // 1.5. Flutuação suave do Grimório de Feitiços
      if (this.grimoireMesh) {
        this.grimoireMesh.position.y = 0.52 + Math.sin(time * 3) * 0.04;
        this.grimoireMesh.rotation.y = 0.3 + Math.sin(time * 2) * 0.08;
      }

      // 2. Animação de Chamas de Tochas e Oscilação da Luz (Flicker)
      this.torches.forEach(t => {
        const flicker = (Math.sin(time * 12 + t.baseIntensity) * 0.2) + (Math.cos(time * 23) * 0.15);
        if (t.light) t.light.intensity = t.baseIntensity + flicker;
        if (t.flame) {
          t.flame.scale.set(
            1 + Math.sin(time * 15) * 0.15,
            1 + Math.cos(time * 18) * 0.2,
            1 + Math.sin(time * 12) * 0.15
          );
        }
      });

      // 3. Animação de Itens (Gemas girando, portal com vórtice e slimes respirando)
      this.animatingItems.forEach(item => {
        if (!item) return;
        if (item.type === 'spin_float' && item.mesh) {
          item.mesh.rotation.y += 0.028;
          item.mesh.position.y = item.baseY + Math.sin(time * item.speed) * 0.08;
        } else if (item.type === 'spin_portal' && item.mesh) {
          item.mesh.rotation.z += 0.035;
          if (item.light) {
            item.light.intensity = 2.0 + Math.sin(time * 4) * 0.8;
          }
        } else if (item.type === 'spin_seal' && item.mesh) {
          item.mesh.rotation.y += 0.01;
        } else if (item.type === 'squish_slime' && item.mesh) {
          item.mesh.scale.y = 0.85 + Math.sin(time * 3.5) * 0.15;
        } else if (item.type === 'boss_breath' && item.mesh) {
          item.mesh.scale.setScalar(1 + Math.sin(time * 2) * 0.06);
        } else if (item.type === 'lava_light' && item.light) {
          item.light.intensity = item.baseIntensity + Math.sin(time * 5) * 0.4;
        }
      });

      // 4. Animação de Brasas Flutuando no Ar
      if (this.emberParticles && this.emberParticles.geometry) {
        const posAttr = this.emberParticles.geometry.attributes.position;
        if (posAttr && posAttr.array) {
          const positions = posAttr.array;
          for (let i = 0; i < positions.length; i += 3) {
            positions[i + 1] += 0.015; // sobe devagar
            positions[i] += Math.sin(time + i) * 0.005; // oscila no vento
            if (positions[i + 1] > 6) {
              positions[i + 1] = 0;
            }
          }
          posAttr.needsUpdate = true;
        }
      }

      if (this.controls) {
        this.controls.update();
      }

      // Renderiza a cena com o WebGLRenderer de alta performance
      if (this.renderer && this.scene && this.camera) {
        this.renderer.render(this.scene, this.camera);
      }
    } catch (err) {
      console.error("Erro na animação 3D:", err);
    }
  }
}
