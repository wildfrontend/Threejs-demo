// src/components/Map.tsx
import { useGLTF, useTexture } from '@react-three/drei';
import { ThreeElements } from '@react-three/fiber';
import { FC, useEffect, useMemo, useState } from 'react';
import * as THREE from 'three';

import Model from '../utils/model';

type ModelMeta = {
  id: string;
  url: string;
  weight?: number;
  minDist?: number;
  scale?: [number, number];
  rotateY?: boolean;
  rotationYRange?: [number, number];
  role?: 'fence' | 'prop' | 'landmark';
};

type Manifest = {
  map: { width: number; depth: number; fenceStep: number; density?: number };
  models: ModelMeta[];
};

type MapProps = ThreeElements['group'] & {
  seed?: number;
  width?: number;
  depth?: number;
  fenceStep?: number;
  density?: number; // override manifest density
};

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const randRange = (rng: () => number, min: number, max: number) =>
  min + (max - min) * rng();

function tryPlacePoint(
  rng: () => number,
  width: number,
  depth: number,
  minDist: number,
  existing: THREE.Vector2[],
  maxTries = 30
): THREE.Vector2 | null {
  for (let i = 0; i < maxTries; i++) {
    const x = randRange(rng, -width / 2, width / 2);
    const z = randRange(rng, -depth / 2, depth / 2);
    const p = new THREE.Vector2(x, z);
    let ok = true;
    for (const e of existing) {
      if (p.distanceTo(e) < minDist) {
        ok = false;
        break;
      }
    }
    if (ok) return p;
  }
  return null;
}

function generateFenceLoop(
  url: string,
  width: number,
  depth: number,
  step: number
) {
  const halfW = width / 2;
  const halfD = depth / 2;
  const items: {
    url: string;
    position: [number, number, number];
    rotation: [number, number, number];
  }[] = [];
  for (let x = -halfW; x <= halfW; x += step) {
    items.push({ url, position: [x, 0, -halfD], rotation: [0, 0, 0] });
    items.push({ url, position: [x, 0, halfD], rotation: [0, Math.PI, 0] });
  }
  for (let z = -halfD; z <= halfD; z += step) {
    items.push({
      url,
      position: [-halfW, 0, z],
      rotation: [0, Math.PI / 2, 0],
    });
    items.push({
      url,
      position: [halfW, 0, z],
      rotation: [0, -Math.PI / 2, 0],
    });
  }
  return items;
}

const Map: FC<MapProps> = ({
  seed = 42,
  width: widthProp,
  depth: depthProp,
  fenceStep: fenceStepProp,
  density: densityProp,
  ...props
}) => {
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 載入地面貼圖
  const grassTexture = useTexture('/assets/textures/grass.png');

  // 載入 manifest
  useEffect(() => {
    fetch('/assets/manifest.json')
      .then((r) => r.json())
      .then((data) => setManifest(data))
      .catch((e) => setError(String(e)));
  }, []);

  // 若 manifest 尚未載入，先畫基本地面避免白畫面
  const w = manifest ? (widthProp ?? manifest.map.width) : (widthProp ?? 60);
  const d = manifest ? (depthProp ?? manifest.map.depth) : (depthProp ?? 60);
  const fenceStep = manifest
    ? (fenceStepProp ?? manifest.map.fenceStep)
    : (fenceStepProp ?? 3);
  const density = manifest
    ? (densityProp ?? manifest.map.density ?? 0.5)
    : (densityProp ?? 0.5);

  // 根據地圖尺寸重複地面貼圖以建立場景感
  useEffect(() => {
    grassTexture.wrapS = grassTexture.wrapT = THREE.RepeatWrapping;
    // 將貼圖根據寬與深的比例進行重複，提升地圖覆蓋效果
    grassTexture.repeat.set(w / 10, d / 10);
    grassTexture.needsUpdate = true;
  }, [grassTexture, w, d]);

  // 預載 glb，等 manifest 有資料才做
  useEffect(() => {
    if (!manifest) return;
    manifest.models.forEach((m) => useGLTF.preload(m.url));
  }, [manifest]);

  const rng = useMemo(() => mulberry32(seed), [seed]);

  const { placements, fenceItems } = useMemo(() => {
    if (!manifest) return { placements: [] as any[], fenceItems: [] as any[] };

    const props = manifest.models.filter((m) => m.role !== 'fence');
    const fence = manifest.models.find((m) => m.role === 'fence');

    // 依 density 與 weight 粗略換算數量（你可改為更精準的面積/密度公式）
    const area = w * d;
    const base = Math.max(10, Math.floor((area / 20) * density)); // 基底數量
    const totalWeight = props.reduce((s, m) => s + (m.weight ?? 1), 0);

    const counts = props.map((m) => ({
      m,
      count: Math.round(base * ((m.weight ?? 1) / totalWeight)),
    }));

    // 放置（全局避免重疊）
    const allPoints: THREE.Vector2[] = [];
    const results: {
      url: string;
      position: [number, number, number];
      rotation: [number, number, number];
      scale: number;
    }[] = [];

    for (const { m, count } of counts) {
      for (let i = 0; i < count; i++) {
        const p = tryPlacePoint(rng, w, d, m.minDist ?? 2.0, allPoints);
        if (!p) continue;
        allPoints.push(p);

        let ry = 0;
        if (m.rotateY) {
          const [rmin, rmax] = m.rotationYRange ?? [0, Math.PI * 2];
          ry = randRange(rng, rmin, rmax);
        }
        const scale = m.scale ? randRange(rng, m.scale[0], m.scale[1]) : 1;

        results.push({
          url: m.url,
          position: [p.x, 0, p.y],
          rotation: [0, ry, 0],
          scale,
        });
      }
    }

    // 地標（例如 crypt）確保至少 1 個
    manifest.models
      .filter((m) => m.role === 'landmark')
      .forEach((m) => {
        const p = tryPlacePoint(rng, w, d, m.minDist ?? 4.0, allPoints);
        if (!p) return;
        allPoints.push(p);
        const scale = m.scale ? randRange(rng, m.scale[0], m.scale[1]) : 1.2;
        const [rmin, rmax] = m.rotationYRange ?? [0, Math.PI * 2];
        const ry = m.rotateY ? randRange(rng, rmin, rmax) : 0;
        results.push({
          url: m.url,
          position: [p.x, 0, p.y],
          rotation: [0, ry, 0],
          scale,
        });
      });

    const fenceItems = fence
      ? generateFenceLoop(fence.url, w, d, fenceStep)
      : [];

    return { placements: results, fenceItems };
  }, [manifest, rng, w, d, fenceStep, density]);

  return (
    <group {...props}>
      {/* 地面 */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[w, d, 1, 1]} />
        <meshStandardMaterial map={grassTexture} />
      </mesh>

      {/* 隨機物件 */}
      {placements.map((p, i) => (
          <Model
            key={`spawn-${i}`}
            position={p.position}
            rotation={p.rotation}
            scale={p.scale}
            url={p.url}
          />
      ))}

      {/* 圍籬 */}
      {fenceItems.map((f, i) => (
          <Model
            key={`fence-${i}`}
            position={f.position}
            rotation={f.rotation}
            url={f.url}
          />
      ))}

      {/* 若 manifest 載入失敗，可於開發時顯示錯誤 */}
      {error && (
        <group>
          <mesh position={[0, 0.01, 0]}>
            <planeGeometry args={[w * 0.8, d * 0.2]} />
              <meshBasicMaterial color="red" opacity={0.2} transparent />
          </mesh>
        </group>
      )}
    </group>
  );
};

export default Map;
