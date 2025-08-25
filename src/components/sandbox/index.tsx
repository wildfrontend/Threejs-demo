'use client';

import { OrbitControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';

import Map from '@/components/map';

function Sandbox() {
  return (
    <Canvas camera={{ position: [15, 18, 15], fov: 50 }} shadows>
      <ambientLight intensity={0.5} />
      <directionalLight castShadow intensity={1.2} position={[10, 20, 10]} />
      <Suspense fallback={null}>
        <Map />
      </Suspense>
      <OrbitControls maxPolarAngle={Math.PI / 2.2} target={[0, 0, 0]} />
    </Canvas>
  );
}

export default Sandbox;
