"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useGame } from "@/store/game";

import Skeleton from "@/components/monsters/skeleton";
import Zombie from "@/components/monsters/zombie";
import Ghost from "@/components/monsters/ghost";
import Vampire from "@/components/monsters/vampire";

type MonsterKind = "skeleton" | "zombie" | "ghost" | "vampire";

type Slot = {
  id: number;
  alive: boolean;
  position: [number, number, number];
  respawnAt: number | null; // epoch seconds
  justSpawnedAt: number | null; // epoch seconds, grace period to avoid false-kill
};

type Props = {
  kind: MonsterKind;
  count: number;
  spawnMin: number;
  spawnMax: number;
  respawnDelay: number;
};

const COMPONENTS: Record<MonsterKind, any> = {
  skeleton: Skeleton,
  zombie: Zombie,
  ghost: Ghost,
  vampire: Vampire,
};

const GenericSpawner = ({ kind, count, spawnMin, spawnMax, respawnDelay }: Props) => {
  const { scene } = useThree();
  const prefix = kind;
  const gameGet = useRef(useGame.getState).current;

  const [slots, setSlots] = useState<Slot[]>(() => {
    const now = 0;
    return Array.from({ length: Math.max(0, count) }, (_, i) => ({
      id: i,
      alive: true,
      position: [0, 0, 0] as [number, number, number],
      respawnAt: null,
      justSpawnedAt: now,
    }));
  });
  const nowRef = useRef(0);
  const tmpVec = useMemo(() => new THREE.Vector3(), []);

  const randomSpawnPosAroundPlayer = (scene: THREE.Scene, tmp: THREE.Vector3): [number, number, number] => {
    let center = tmp.set(0, 0, 0);
    try {
      const player = scene.getObjectByName("player");
      if (player) center = player.getWorldPosition(tmp.set(0, 0, 0));
    } catch {}
    const angle = Math.random() * Math.PI * 2;
    const radius = spawnMin + Math.random() * (spawnMax - spawnMin);
    const x = center.x + Math.cos(angle) * radius;
    const z = center.z + Math.sin(angle) * radius;
    return [x, 0, z];
  };

  // Adjust slot pool size when target count changes
  useEffect(() => {
    setSlots((prev) => {
      const next: Slot[] = [...prev];
      if (count > prev.length) {
        const now = nowRef.current;
        for (let i = prev.length; i < count; i++) {
          next.push({
            id: i,
            alive: true,
            position: randomSpawnPosAroundPlayer(scene, tmpVec),
            respawnAt: null,
            justSpawnedAt: now,
          });
        }
      } else if (count < prev.length) {
        // remove extras and their objects in scene
        for (let i = count; i < prev.length; i++) {
          try {
            const obj = scene.getObjectByName(`${prefix}-${i}`);
            if (obj) obj.parent?.remove(obj);
          } catch {}
        }
        next.length = count;
      }
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count]);

  // Initialize positions immediately on mount to avoid first-frame overlap at origin
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

  // Poll scene to detect killed/removed monsters and schedule respawn
  useFrame((_, delta) => {
    if (gameGet().paused) return;
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
            const obj = scene.getObjectByName(`${prefix}-${slot.id}`) as any;
            const inGrace = slot.justSpawnedAt !== null && nowRef.current - slot.justSpawnedAt < 0.5;
            const killed = !inGrace && (!obj || obj.userData?.killed || obj.visible === false);
            if (killed) {
              slot.alive = false;
              slot.respawnAt = nowRef.current + respawnDelay;
              slot.justSpawnedAt = null;
              changed = true;
            }
          } catch {
            slot.alive = false;
            slot.respawnAt = nowRef.current + respawnDelay;
            slot.justSpawnedAt = null;
            changed = true;
          }
        } else {
          // If dead, check for respawn (only if this slot index is still within target count)
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

  // Clean up on mount for existing objects with matching names
  useEffect(() => {
    try {
      for (let i = 0; i < 256; i++) {
        const obj = scene.getObjectByName(`${prefix}-${i}`);
        if (obj) obj.parent?.remove(obj);
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const Comp = COMPONENTS[kind];
  return (
    <group>
      {slots.map((slot) =>
        slot.alive ? (
          <Comp key={slot.id} position={slot.position} name={`${prefix}-${slot.id}`} />
        ) : null
      )}
    </group>
  );
};

export default GenericSpawner;

