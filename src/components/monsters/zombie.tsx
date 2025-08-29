"use client";

import { useGLTF } from "@react-three/drei";
import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

type ZombieProps = {
  position?: [number, number, number];
  speed?: number; // units per second
  name?: string;
};

const Zombie = ({ position = [5, 0, -5], speed = 2.2, name = "zombie" }: ZombieProps) => {
  const group = useRef<THREE.Group>(null!);
  const { scene: model } = useGLTF("/assets/character-zombie.glb");
  const { scene } = useThree();

  // Cache helpers
  const tmp = useMemo(() => new THREE.Vector3(), []);
  const playerRef = useRef<THREE.Object3D | null>(null);

  useEffect(() => {
    if (!model) return;
    model.scale.set(1, 1, 1);
    model.traverse((child: any) => {
      child.castShadow = true;
      child.receiveShadow = true;
    });
  }, [model]);

  useFrame((_, delta) => {
    // Track player
    if (!playerRef.current) {
      playerRef.current = scene.getObjectByName("player") || null;
    }
    if (!playerRef.current || !group.current) return;

    // Seek player on XZ plane
    const p = playerRef.current.getWorldPosition(tmp.set(0, 0, 0));
    const g = group.current.position;
    const dir = tmp.set(p.x - g.x, 0, p.z - g.z);
    const distSq = dir.lengthSq();
    if (distSq > 1e-4) {
      dir.normalize();
      g.addScaledVector(dir, speed * delta);
      // face movement direction
      const yaw = Math.atan2(dir.x, dir.z);
      group.current.rotation.y = yaw;
    }
    // Keep grounded
    group.current.position.y = 0;
  });

  return (
    <group ref={group} position={position} name={name}>
      <primitive object={model} />
    </group>
  );
};

useGLTF.preload("/assets/character-zombie.glb");

export default Zombie;

