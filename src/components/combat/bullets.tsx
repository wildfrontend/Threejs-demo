'use client';

import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';

import {
  AUTO_FIRE_INTERVAL,
  BULLET_RANGE,
  BULLET_SIZE,
  BULLET_SPEED,
  RELOAD_TIME,
  BULLET_SPREAD_DEG,
  SKELETON_HP,
  ZOMBIE_HP,
  GHOST_HP,
  VAMPIRE_HP,
  FULL_CIRCLE_BULLETS,
  FULL_CIRCLE_DAMAGE_SCALE,
  HEART_DROP_CHANCE,
} from '@/config/gameplay';
import { useGame } from '@/store/game';

// Auto-fire only: no input dependency

type Bullet = {
  position: THREE.Vector3;
  direction: THREE.Vector3;
  traveled: number;
  damage?: number;
};

const MAX_BULLETS = 256;

const Bullets = () => {
  const { scene } = useThree();
  const imRef = useRef<THREE.InstancedMesh>(null!);
  const bulletsRef = useRef<Bullet[]>([]);
  const playerRef = useRef<THREE.Object3D | null>(null);
  const muzzleHelperRef = useRef<THREE.Mesh>(null!);
  const lastShotAt = useRef(0);
  const gameGet = useRef(useGame.getState).current;
  const tmpObj = useMemo(() => new THREE.Object3D(), []);
  const tmpVec = useMemo(() => new THREE.Vector3(), []);
  const reloadTimer = useRef(0);

  // Locate the player object once available
  useFrame(() => {
    if (!playerRef.current) {
      playerRef.current = scene.getObjectByName('player') || null;
    }
  });

  const spawnBullet = () => {
    if (!playerRef.current) {
      playerRef.current = scene.getObjectByName('player') || null;
      if (!playerRef.current) return;
    }

    // World position and facing
    const p = playerRef.current.getWorldPosition(tmpVec.set(0, 0, 0));
    const q = playerRef.current.getWorldQuaternion(new THREE.Quaternion());
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(q).normalize();

    // Compute player model center as the muzzle start
    const playerBox = new THREE.Box3().setFromObject(playerRef.current);
    const playerCenter = playerBox.getCenter(new THREE.Vector3());
    const start = playerCenter.clone();

    // Find nearest enemy (by name "zombie") and aim at it if exists
    const nearestTarget = (() => {
      if (!(scene as any)?.traverse) return null;
      let bestPos: THREE.Vector3 | null = null;
      let bestDistSq = Infinity;
      try {
        scene.traverse((obj) => {
          if (!obj?.name) return;
          const n = obj.name.toLowerCase();
          const isMonster =
            n === 'zombie' || n.startsWith('zombie') ||
            n === 'skeleton' || n.startsWith('skeleton') ||
            n === 'ghost' || n.startsWith('ghost') ||
            n === 'vampire' || n.startsWith('vampire');
          if (!isMonster) return;
          const wpos = obj.getWorldPosition(new THREE.Vector3());
          // Aim at the enemy using player's center height to avoid vertical mismatch
          const target = new THREE.Vector3(wpos.x, playerCenter.y, wpos.z);
          const d2 = start.distanceToSquared(target);
          if (d2 < bestDistSq) {
            bestDistSq = d2;
            bestPos = target;
          }
        });
      } catch {}
      return bestPos;
    })();

    const dirCenter = nearestTarget
      ? new THREE.Vector3().subVectors(nearestTarget, start).normalize()
      : forward.clone();

    // Spawn multiple bullets in a symmetrical fan based on bulletCount
    const count = Math.max(1, gameGet().bulletCount ?? 1);
    const baseDamage = gameGet().bulletDamage ?? 1;
    const radial = count >= 5;
    const shotDamage = radial ? Math.max(1, Math.floor(baseDamage * FULL_CIRCLE_DAMAGE_SCALE)) : baseDamage;
    const spreadRad = THREE.MathUtils.degToRad(BULLET_SPREAD_DEG);
    // Compute yaw of center direction
    const yaw = Math.atan2(dirCenter.x, dirCenter.z);

    const makeDirFromYaw = (angle: number) =>
      new THREE.Vector3(Math.sin(angle), 0, Math.cos(angle)).normalize();

    if (count >= 5) {
      // Full 360° radial at max level
      const N = FULL_CIRCLE_BULLETS;
      for (let i = 0; i < N; i++) {
        const angle = (i / N) * Math.PI * 2;
        const dir = makeDirFromYaw(angle);
        bulletsRef.current.push({ position: start.clone(), direction: dir, traveled: 0, damage: shotDamage });
      }
    } else if (count === 1) {
      bulletsRef.current.push({ position: start, direction: dirCenter, traveled: 0, damage: shotDamage });
    } else {
      const half = (count - 1) / 2;
      for (let i = 0; i < count; i++) {
        const offsetIndex = i - half; // symmetric around 0
        const angle = yaw + offsetIndex * spreadRad;
        const dir = makeDirFromYaw(angle);
        bulletsRef.current.push({ position: start.clone(), direction: dir, traveled: 0, damage: shotDamage });
      }
    }
  };

  useFrame((_, delta) => {
    if (gameGet().paused) return;
    lastShotAt.current += delta;
    const store = gameGet();

    // Update muzzle helper (dev only) to visualize spawn position
    const isDev = process.env.NODE_ENV !== 'production';
    if (isDev) {
      if (!playerRef.current) {
        playerRef.current = scene.getObjectByName('player') || null;
      }
      if (playerRef.current && muzzleHelperRef.current) {
        const box = new THREE.Box3().setFromObject(playerRef.current);
        const center = box.getCenter(new THREE.Vector3());
        const start = center.clone();
        muzzleHelperRef.current.position.copy(start);
        muzzleHelperRef.current.visible = true;
      } else if (muzzleHelperRef.current) {
        muzzleHelperRef.current.visible = false;
      }
    } else if (muzzleHelperRef.current) {
      muzzleHelperRef.current.visible = false;
    }

    // Auto fire every AUTO_FIRE_INTERVAL seconds when not reloading
    if (!store.reloading && lastShotAt.current >= AUTO_FIRE_INTERVAL) {
      const infinite = store.infiniteAmmo ?? false;
      if (infinite || store.ammo > 0) {
        spawnBullet();
        lastShotAt.current = 0;
        if (!infinite) store.consumeAmmo(1);
      } else {
        // trigger reload if empty
        store.startReload();
        reloadTimer.current = 0;
      }
    }

    // Auto start reload if empty even without pressing
    if (!store.infiniteAmmo && !store.reloading && store.ammo === 0) {
      store.startReload();
      reloadTimer.current = 0;
    }

    // Progress reload timer
    if (!store.infiniteAmmo && store.reloading) {
      reloadTimer.current += delta;
      if (reloadTimer.current >= RELOAD_TIME) {
        store.reloadAmmo();
        store.setReloading(false);
        reloadTimer.current = 0;
      }
    }

    // Update bullets
    const arr = bulletsRef.current;
    let write = 0;
    const len = arr.length;
    for (let read = 0; read < len; read++) {
      const b = arr[read];
      const step = BULLET_SPEED * delta;
      b.traveled += step;
      b.position.addScaledVector(b.direction, step);

      let keep = b.traveled <= BULLET_RANGE;

      // Collision against monsters: bounding-sphere test using their Box3 sphere
      if (keep && (scene as any)?.traverse) {
        const pierce = (gameGet().bulletDamage ?? 1) >= 5;
        let hit = false;
        try {
          scene.traverse((obj) => {
            if (!pierce && hit) return;
            if (!obj?.name) return;
            const n2 = obj.name.toLowerCase();
            const isMonster2 =
              n2 === 'zombie' || n2.startsWith('zombie') ||
              n2 === 'skeleton' || n2.startsWith('skeleton') ||
              n2 === 'ghost' || n2.startsWith('ghost') ||
              n2 === 'vampire' || n2.startsWith('vampire');
            if (!isMonster2) return;
            if (!(obj as any).visible) return;

            const box = new THREE.Box3().setFromObject(obj);
            const sphere = new THREE.Sphere();
            box.getBoundingSphere(sphere);
            const radius = Math.max(0.2, sphere.radius * 0.6);
            const dist = sphere.center.distanceTo(b.position);
            if (dist <= radius + BULLET_SIZE * 0.5) {
              const z: any = obj as any;
              const name = (z.name || '').toLowerCase();
              const defaultMax = name.startsWith('zombie') || name === 'zombie'
                ? ZOMBIE_HP
                : name.startsWith('skeleton') || name === 'skeleton'
                ? SKELETON_HP
                : name.startsWith('ghost') || name === 'ghost'
                ? GHOST_HP
                : name.startsWith('vampire') || name === 'vampire'
                ? VAMPIRE_HP
                : 2;
              const maxHp = z.userData?.maxHp ?? defaultMax;
              const curHp = z.userData?.hp ?? maxHp;
              const dmg = (b as any).damage ?? (gameGet().bulletDamage ?? 1);
              const nextHp = Math.max(0, curHp - dmg);
              z.userData = { ...z.userData, hp: nextHp, maxHp };
              if (!pierce) {
                keep = false; // bullet consumed on hit
                hit = true;
              }
              if (nextHp <= 0) {
                // 僅標記死亡與隱藏，讓 Spawner 接手卸載/重生
                z.userData = { ...z.userData, killed: true };
                z.visible = false;
                try {
                  gameGet().addKill?.();
                } catch {}
                // Drop chance: vampire always drop, others by chance
                try {
                  const nameLow = name;
                  const isVampire = nameLow === 'vampire' || nameLow.startsWith('vampire');
                  const drop = isVampire || Math.random() < (HEART_DROP_CHANCE as number);
                  if (drop) {
                    const c = sphere.center;
                    useGame.getState().addHeartDrop?.([c.x, 0, c.z]);
                  }
                } catch {}
                // 可在此處增加計分或掉落物觸發
              }
            }
          });
        } catch {}
      }

      if (keep) {
        // keep and write in-place
        arr[write++] = b;
      }
    }
    if (write !== len) arr.length = write; // truncate removed bullets

    // Update instanced matrices
    const im = imRef.current;
    const count = Math.min(arr.length, MAX_BULLETS);
    im.count = count as unknown as number; // narrow for TS
    for (let i = 0; i < count; i++) {
      const b = arr[i];
      tmpObj.position.copy(b.position);
      tmpObj.rotation.set(0, 0, 0);
      tmpObj.scale.setScalar(1);
      tmpObj.updateMatrix();
      im.setMatrixAt(i, tmpObj.matrix);
    }
    im.instanceMatrix.needsUpdate = true;
  });

  // Clean up when unmounting
  useEffect(() => () => void (bulletsRef.current = []), []);

  return (
    <>
      <instancedMesh
        ref={imRef}
        args={[undefined as any, undefined as any, MAX_BULLETS]}
        frustumCulled={false}
      >
        <sphereGeometry args={[BULLET_SIZE, 12, 12]} />
        <meshBasicMaterial color="#fff46b" toneMapped={false} />
      </instancedMesh>
      {process.env.NODE_ENV !== 'production' && (
        <mesh ref={muzzleHelperRef} frustumCulled={false} renderOrder={1000}>
          <sphereGeometry args={[BULLET_SIZE * 1.2, 8, 8]} />
          <meshBasicMaterial
            color="#ff3bd1"
            toneMapped={false}
            depthTest={false}
            transparent
            opacity={0.9}
          />
        </mesh>
      )}
    </>
  );
};

export default Bullets;
