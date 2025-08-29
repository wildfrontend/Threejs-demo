'use client';

import { KeyboardControls } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Suspense, useMemo, useRef } from 'react';
import * as THREE from 'three';

import Bullets from '@/components/combat/bullets';
import CollisionRange from '@/components/indicators/collision-range';
import ShootRange from '@/components/indicators/shoot-range';
import Map from '@/components/map';
import Player from '@/components/player';
import Director from '@/components/director';

function Sandbox() {
  return (
    <KeyboardControls
      map={[
        { name: 'forward', keys: ['KeyW', 'ArrowUp'] },
        { name: 'backward', keys: ['KeyS', 'ArrowDown'] },
        { name: 'left', keys: ['KeyA', 'ArrowLeft'] },
        { name: 'right', keys: ['KeyD', 'ArrowRight'] },
        { name: 'shoot', keys: ['Space', 'Enter'] },
      ]}
    >
      <Canvas camera={{ position: [0, 14, 0], fov: 45 }} shadows>
        <ambientLight intensity={0.5} />
        <directionalLight castShadow intensity={1.2} position={[10, 20, 10]} />
        <Suspense fallback={null}>
          <Map />
          <Player />
          <Director />
          <FollowCamera />
          <CollisionRange />
          <ShootRange />
          <Bullets />
        </Suspense>
      </Canvas>
    </KeyboardControls>
  );
}

export default Sandbox;

function FollowCamera() {
  const { camera, scene } = useThree();
  const playerRef = useRef<THREE.Object3D | null>(null);
  const tmp = useMemo(() => new THREE.Vector3(), []);
  const tiltDeg = 60;
  const height = 14; // keep the player roughly this far below the camera
  const tiltRad = useMemo(() => THREE.MathUtils.degToRad(tiltDeg), [tiltDeg]);
  const fixedQuat = useMemo(
    () => new THREE.Quaternion().setFromEuler(new THREE.Euler(-tiltRad, 0, 0)),
    [tiltRad]
  );
  const forward = useMemo(
    () => new THREE.Vector3(0, 0, -1).applyQuaternion(fixedQuat),
    [fixedQuat]
  );
  const distance = useMemo(() => height / Math.sin(tiltRad), [height, tiltRad]);

  useFrame(() => {
    if (!playerRef.current) {
      playerRef.current = scene.getObjectByName('player') || null;
      if (!playerRef.current) return;
    }

    const p = playerRef.current.getWorldPosition(tmp.set(0, 0, 0));
    // Place camera so its fixed forward vector points at the player
    camera.position.copy(p).sub(tmp.copy(forward).multiplyScalar(distance));
    camera.quaternion.copy(fixedQuat);
  });

  return null;
}
