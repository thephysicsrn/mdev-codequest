// ==========================================================================
// PROCEDURAL PBR TEXTURES GENERATOR - THREE.JS
// Gera texturas realistas em memória: pedras medievais, tijolos, lava e madeira
// ==========================================================================

import * as THREE from 'three';

// 1. Textura de Ladrilhos de Pedra / Flagstones com Rejunte e Variação
export function createCobblestoneTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // Fundo cinza ardósia escuro
  ctx.fillStyle = '#1c2233';
  ctx.fillRect(0, 0, 512, 512);

  const tileSize = 128;
  const rows = 4;
  const cols = 4;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = c * tileSize + 4;
      const y = r * tileSize + 4;
      const w = tileSize - 8;
      const h = tileSize - 8;

      // Variação de cor entre pedras (azulado, carvão, grafite)
      const baseTone = 35 + Math.floor(Math.random() * 25);
      const blueTint = baseTone + 15;
      ctx.fillStyle = `rgb(${baseTone}, ${baseTone + 5}, ${blueTint})`;
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, 6);
      ctx.fill();

      // Gradiente de iluminação sutil (topo mais claro, base mais escura)
      const grad = ctx.createLinearGradient(x, y, x + w, y + h);
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.12)');
      grad.addColorStop(0.5, 'transparent');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0.35)');
      ctx.fillStyle = grad;
      ctx.fill();

      // Ruído e ranhuras na superfície da pedra
      for (let n = 0; n < 80; n++) {
        const nx = x + Math.random() * w;
        const ny = y + Math.random() * h;
        const alpha = 0.05 + Math.random() * 0.1;
        ctx.fillStyle = Math.random() > 0.5 ? `rgba(255,255,255,${alpha})` : `rgba(0,0,0,${alpha})`;
        ctx.fillRect(nx, ny, 2 + Math.random() * 4, 1 + Math.random() * 2);
      }

      // Rachaduras ocasionais
      if (Math.random() > 0.4) {
        ctx.strokeStyle = 'rgba(10, 15, 25, 0.6)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        let cx = x + Math.random() * w;
        let cy = y + Math.random() * h;
        ctx.moveTo(cx, cy);
        for (let s = 0; s < 3; s++) {
          cx += (Math.random() - 0.5) * 25;
          cy += (Math.random() - 0.5) * 25;
          ctx.lineTo(cx, cy);
        }
        ctx.stroke();
      }
    }
  }

  // Rejunte profundo escuro com sombra
  ctx.strokeStyle = '#0a0d17';
  ctx.lineWidth = 8;
  for (let i = 0; i <= 512; i += tileSize) {
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(512, i);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 512);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

// 2. Bump Map para Relevo dos Ladrilhos de Pedra
export function createCobblestoneBumpMap() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#222222';
  ctx.fillRect(0, 0, 512, 512);

  const tileSize = 128;
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      const x = c * tileSize + 4;
      const y = r * tileSize + 4;
      const w = tileSize - 8;
      const h = tileSize - 8;

      ctx.fillStyle = '#bbbbbb';
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, 6);
      ctx.fill();

      // Borda de desnível
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  // Rejunte rebaixado (preto no bump map)
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 8;
  for (let i = 0; i <= 512; i += tileSize) {
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(512, i);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 512);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

// 3. Textura de Parede Medieval (Tijolos de Pedra Esculpida)
export function createStoneWallTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#181e2b';
  ctx.fillRect(0, 0, 512, 512);

  const blockH = 64;
  const blockW = 128;
  const rows = 8;

  for (let r = 0; r < rows; r++) {
    const isOdd = r % 2 === 1;
    const offset = isOdd ? -blockW / 2 : 0;
    const y = r * blockH + 3;

    for (let x = offset; x < 512 + blockW; x += blockW) {
      const w = blockW - 6;
      const h = blockH - 6;

      const shade = 45 + Math.floor(Math.random() * 25);
      ctx.fillStyle = `rgb(${shade}, ${shade + 4}, ${shade + 14})`;
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, 4);
      ctx.fill();

      // Chanfro e luz no topo do tijolo
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + 2, y + 2);
      ctx.lineTo(x + w - 2, y + 2);
      ctx.stroke();

      // Sombra na base do tijolo
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.beginPath();
      ctx.moveTo(x + 2, y + h - 2);
      ctx.lineTo(x + w - 2, y + h - 2);
      ctx.stroke();

      // Ruído de granulação de pedra
      for (let n = 0; n < 40; n++) {
        const px = x + Math.random() * w;
        const py = y + Math.random() * h;
        ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.12)';
        ctx.fillRect(px, py, 2, 2);
      }
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

// 4. Bump Map da Parede Medieval
export function createStoneWallBumpMap() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, 512, 512);

  const blockH = 64;
  const blockW = 128;
  const rows = 8;

  for (let r = 0; r < rows; r++) {
    const isOdd = r % 2 === 1;
    const offset = isOdd ? -blockW / 2 : 0;
    const y = r * blockH + 3;

    for (let x = offset; x < 512 + blockW; x += blockW) {
      const w = blockW - 6;
      const h = blockH - 6;

      ctx.fillStyle = '#aaaaaa';
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, 4);
      ctx.fill();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

// 5. Canvas Dinâmico de Lava Magmática Fervente
export class LavaTextureAnimator {
  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = 256;
    this.canvas.height = 256;
    this.ctx = this.canvas.getContext('2d');
    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.wrapS = THREE.RepeatWrapping;
    this.texture.wrapT = THREE.RepeatWrapping;
    this.phase = 0;
  }

  update(time) {
    this.phase += 0.03;
    const ctx = this.ctx;
    const w = 256;
    const h = 256;

    // Fundo vermelho carmesim profundo
    ctx.fillStyle = '#8b0000';
    ctx.fillRect(0, 0, w, h);

    // Rios de magma amarelo e laranja fluorescente
    const numVeins = 6;
    for (let i = 0; i < numVeins; i++) {
      const yBase = (i * (h / numVeins) + time * 15) % h;
      const grad = ctx.createLinearGradient(0, yBase - 25, 0, yBase + 25);
      grad.addColorStop(0, 'rgba(255, 69, 0, 0.4)');
      grad.addColorStop(0.5, 'rgba(255, 215, 0, 0.95)');
      grad.addColorStop(1, 'rgba(255, 69, 0, 0.4)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(0, yBase);
      for (let x = 0; x <= w; x += 30) {
        const wave = Math.sin(x * 0.05 + this.phase + i) * 18;
        ctx.lineTo(x, yBase + wave);
      }
      ctx.lineTo(w, yBase + 35);
      ctx.lineTo(0, yBase + 35);
      ctx.closePath();
      ctx.fill();
    }

    // Placas de crosta de basalto negro resfriado flutuando no magma
    ctx.fillStyle = 'rgba(25, 15, 15, 0.82)';
    for (let j = 0; j < 12; j++) {
      const cx = (j * 45 + Math.sin(time + j) * 15 + w) % w;
      const cy = (j * 30 + Math.cos(time + j) * 12 + h) % h;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 14 + (j % 5), 9 + (j % 4), j * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }

    this.texture.needsUpdate = true;
  }
}

// 6. Textura de Madeira Envelhecida com Veios para Portas e Pedestal
export function createWoodTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#3e2723';
  ctx.fillRect(0, 0, 256, 256);

  // Veios da madeira
  ctx.strokeStyle = '#271711';
  ctx.lineWidth = 2;
  for (let i = 0; i < 40; i++) {
    const y = Math.random() * 256;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(80, y + (Math.random() - 0.5) * 20, 180, y + (Math.random() - 0.5) * 20, 256, y);
    ctx.stroke();
  }

  // Rebites de ferro nas pontas
  ctx.fillStyle = '#1c1917';
  ctx.beginPath();
  ctx.arc(20, 20, 5, 0, Math.PI * 2);
  ctx.arc(236, 20, 5, 0, Math.PI * 2);
  ctx.arc(20, 236, 5, 0, Math.PI * 2);
  ctx.arc(236, 236, 5, 0, Math.PI * 2);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

// 7. Partícula Radial Brilhante para Tochas e Magia
export function createParticleTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');

  const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
  grad.addColorStop(0.3, 'rgba(255, 180, 50, 0.8)');
  grad.addColorStop(0.7, 'rgba(255, 60, 0, 0.25)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 64);

  return new THREE.CanvasTexture(canvas);
}
