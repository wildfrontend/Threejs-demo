'use client';

import { useGLTF, useKeyboardControls } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';

import { useGame } from '@/store/game';

type Controls = {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  shoot: boolean;
};

const Player = () => {
  const group = useRef<THREE.Group>(null!);
  const { scene } = useGLTF('/assets/character-digger.glb');
  const [, get] = useKeyboardControls<Controls>();
  const prevShoot = useRef(false);
  const gameGet = useRef(useGame.getState).current;

  useEffect(() => {
    if (!scene) return;
    scene.scale.set(1, 1, 1);
    scene.traverse((child: any) => {
      child.castShadow = true;
      child.receiveShadow = true;
    });
  }, [scene]);

  useFrame((_, delta) => {
    // Update invincibility timers
    gameGet().updateInvincible?.(delta);

    if (gameGet().paused) return;
    const { forward, backward, left, right, shoot } = get();
    // Edge trigger for invincibility
    if (shoot && !prevShoot.current) {
      gameGet().triggerInvincible?.();
    }
    prevShoot.current = shoot;

    const dir = new THREE.Vector3(
      (left ? -1 : 0) + (right ? 1 : 0),
      0,
      (forward ? -1 : 0) + (backward ? 1 : 0)
    );

    const speed = gameGet().moveSpeed ?? 6; // units per second
    if (dir.lengthSq() > 0 && group.current) {
      dir.normalize();
      group.current.position.addScaledVector(dir, speed * delta);
      // Face movement direction
      const yaw = Math.atan2(dir.x, dir.z);
      group.current.rotation.y = yaw;
    }

    // Keep on ground plane
    if (group.current) group.current.position.y = 0;
  });

  return (
    <group name="player" position={[0, 0, 0]} ref={group}>
      <primitive object={scene} />
    </group>
  );
};

useGLTF.preload('/assets/character-digger.glb');

export default Player;
