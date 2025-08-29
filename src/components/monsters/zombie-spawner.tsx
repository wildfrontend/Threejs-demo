'use client';

import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';

import { MAX_ZOMBIES, ZOMBIE_SPEED } from '@/config/gameplay';

import Zombie from './zombie';

type Slot = {
  id: number;
  alive: boolean;
  position: [number, number, number];
  respawnAt: number | null; // epoch seconds
  justSpawnedAt: number | null; // epoch seconds, grace period to avoid false-kill
};

const RESPAWN_DELAY = 2; // seconds
const SPAWN_MIN = 10; // min distance from player
const SPAWN_MAX = 20; // max distance from player

const randomSpawnPosAroundPlayer = (
  scene: THREE.Scene,
  tmp: THREE.Vector3
): [number, number, number] => {
  let center = tmp.set(0, 0, 0);
  try {
    const player = scene.getObjectByName('player');
    if (player) {
      center = player.getWorldPosition(tmp.set(0, 0, 0));
    }
  } catch {}
  const angle = Math.random() * Math.PI * 2;
  const radius = SPAWN_MIN + Math.random() * (SPAWN_MAX - SPAWN_MIN);
  const x = center.x + Math.cos(angle) * radius;
  const z = center.z + Math.sin(angle) * radius;
  return [x, 0, z];
};

const ZombieSpawner = () => {
  const { scene } = useThree();
  const [slots, setSlots] = useState<Slot[]>(() => {
    // initial positions seeded; refined on mount effect using actual player center
    const now = 0;
    return Array.from({ length: MAX_ZOMBIES }, (_, i) => ({
      id: i,
      alive: true,
      position: [0, 0, 0] as [number, number, number],
      respawnAt: null,
      justSpawnedAt: now,
    }));
  });
  const nowRef = useRef(0);
  const tmpVec = useMemo(() => new THREE.Vector3(), []);

  useEffect(() => {
    setSlots((prev) => {
      const now = nowRef.current;
      const next = prev.map((slot) => ({ ...slot }));
      for (const slot of next) {
        if (slot.alive) {
          slot.position = randomSpawnPosAroundPlayer(scene, tmpVec);
          slot.justSpawnedAt = now;
        }
      }
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Poll scene to detect killed/removed zombies and schedule respawn
  useFrame((_, delta) => {
    nowRef.current += delta;

    setSlots((prev) => {
      let changed = false;
      const next = prev.map((slot) => ({ ...slot }));

      for (const slot of next) {
        // If position is at origin (initial), move it around player once
        if (
          slot.alive &&
          slot.position[0] === 0 &&
          slot.position[1] === 0 &&
          slot.position[2] === 0
        ) {
          slot.position = randomSpawnPosAroundPlayer(scene, tmpVec);
          changed = true;
        }
        // If alive, verify existence and not killed in scene
        if (slot.alive) {
          try {
            const obj = scene.getObjectByName(`zombie-${slot.id}`) as any;
            const inGrace =
              slot.justSpawnedAt !== null &&
              nowRef.current - slot.justSpawnedAt < 0.5;
            const killed =
              !inGrace &&
              (!obj || obj.userData?.killed || obj.visible === false);
            if (killed) {
              slot.alive = false;
              slot.respawnAt = nowRef.current + RESPAWN_DELAY;
              slot.justSpawnedAt = null;
              changed = true;
            }
          } catch {
            slot.alive = false;
            slot.respawnAt = nowRef.current + RESPAWN_DELAY;
            slot.justSpawnedAt = null;
            changed = true;
          }
        } else {
          // If dead, check for respawn
          if (slot.respawnAt !== null && nowRef.current >= slot.respawnAt) {
            slot.position = randomSpawnPosAroundPlayer(scene, tmpVec);
            slot.alive = true;
            slot.respawnAt = null;
            slot.justSpawnedAt = nowRef.current;
            changed = true;
          }
        }
      }

      return changed ? next : prev;
    });
  });

  // Ensure any pre-existing zombies with matching names are cleaned up on mount
  useEffect(() => {
    try {
      for (let i = 0; i < MAX_ZOMBIES; i++) {
        const obj = scene.getObjectByName(`zombie-${i}`);
        if (obj) obj.parent?.remove(obj);
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <group>
      {slots.map((slot) =>
        slot.alive ? (
          <Zombie
            key={slot.id}
            position={slot.position}
            speed={ZOMBIE_SPEED}
            name={`zombie-${slot.id}`}
          />
        ) : null
      )}
    </group>
  );
};

export default ZombieSpawner;
