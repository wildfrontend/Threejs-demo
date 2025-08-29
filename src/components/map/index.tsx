'use client';

// src/components/map/index.tsx
import { useThree } from '@react-three/fiber';
import { FC, useMemo } from 'react';
import * as THREE from 'three';

function createCanvas(size: number) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  return { canvas, ctx };
}

function drawTileableGrass(size: number) {
  const { canvas, ctx } = createCanvas(size);

  // Base gradient
  const g = ctx.createLinearGradient(0, 0, 0, size);
  g.addColorStop(0, 'hsl(110, 40%, 36%)');
  g.addColorStop(1, 'hsl(110, 45%, 36%)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);

  // Fine color noise (tileable via wrap drawing)
  const noisePass = (
    count: number,
    sat: number,
    light: number,
    alpha: number
  ) => {
    ctx.globalAlpha = alpha;
    for (let i = 0; i < count; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const hueJitter = (Math.random() - 0.5) * 8; // slight hue variation
      ctx.fillStyle = `hsl(${110 + hueJitter}, ${sat}%, ${light + (Math.random() - 0.5) * 8}%)`;
      // Draw in a 3x3 wrap grid for seamless tiling
      for (let ox = -1; ox <= 1; ox++) {
        for (let oy = -1; oy <= 1; oy++) {
          ctx.fillRect((x + ox * size) | 0, (y + oy * size) | 0, 1, 1);
        }
      }
    }
    ctx.globalAlpha = 1;
  };

  noisePass(size * 40, 28, 40, 0.28);
  noisePass(size * 25, 34, 36, 0.22);
  noisePass(size * 15, 26, 32, 0.18);

  // Blade-like micro strokes for perceived grass fiber
  ctx.lineWidth = 1;
  for (let i = 0; i < size * 2; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const len = 3 + Math.random() * 6;
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * (Math.PI / 6); // mostly vertical
    const h = 108 + (Math.random() - 0.5) * 10;
    const s = 40 + Math.random() * 20;
    const l = 36 + Math.random() * 16;
    ctx.strokeStyle = `hsla(${h}, ${s}%, ${l}%, 0.22)`;

    const dx = Math.cos(angle) * len;
    const dy = Math.sin(angle) * len;

    for (let ox = -1; ox <= 1; ox++) {
      for (let oy = -1; oy <= 1; oy++) {
        ctx.beginPath();
        ctx.moveTo(x + ox * size, y + oy * size);
        ctx.lineTo(x + dx + ox * size, y + dy + oy * size);
        ctx.stroke();
      }
    }
  }

  return canvas;
}

function drawTileableBump(size: number) {
  const { canvas, ctx } = createCanvas(size);
  ctx.fillStyle = 'rgb(128,128,128)';
  ctx.fillRect(0, 0, size, size);

  ctx.globalAlpha = 0.2;
  for (let i = 0; i < size * 35; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const val = 96 + Math.random() * 64; // mid gray variance
    ctx.fillStyle = `rgb(${val | 0},${val | 0},${val | 0})`;
    for (let ox = -1; ox <= 1; ox++) {
      for (let oy = -1; oy <= 1; oy++) {
        ctx.fillRect((x + ox * size) | 0, (y + oy * size) | 0, 1, 1);
      }
    }
  }
  ctx.globalAlpha = 1;

  return canvas;
}

const Map: FC = () => {
  const { gl } = useThree();
  const textures = useMemo(() => {
    const size = 1024; // detail resolution
    const grassCanvas = drawTileableGrass(size);
    const bumpCanvas = drawTileableBump(size);

    const grassMap = new THREE.CanvasTexture(grassCanvas);
    const bumpMap = new THREE.CanvasTexture(bumpCanvas);

    const maxAniso = Math.min(16, gl.capabilities.getMaxAnisotropy?.() || 1);
    [grassMap, bumpMap].forEach((t) => {
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.anisotropy = maxAniso;
      t.generateMipmaps = true;
      t.minFilter = THREE.LinearMipMapLinearFilter;
      t.magFilter = THREE.LinearFilter;
      t.needsUpdate = true;
      // Dense tiling for close-up detail
      t.repeat.set(40, 40);
    });
    grassMap.colorSpace = THREE.SRGBColorSpace;
    // Bump/height data is non-color data
    bumpMap.colorSpace = THREE.NoColorSpace as unknown as THREE.ColorSpace;

    return { grassMap, bumpMap };
  }, [gl]);

  return (
    <group>
      {/* Ground only */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[500, 500, 1, 1]} />
        <meshStandardMaterial
          bumpMap={textures.bumpMap}
          bumpScale={0.03}
          map={textures.grassMap}
          metalness={0}
          roughness={1}
        />
      </mesh>
    </group>
  );
};

export default Map;
