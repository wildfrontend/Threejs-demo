'use client';

import { OrbitControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';

import Map from '@/components/map';

function Sandbox() {
  return (
    <Canvas shadows camera={{ position: [15, 18, 15], fov: 50 }}>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 20, 10]} intensity={1.2} castShadow />
      <Suspense fallback={null}>
        <Map />
      </Suspense>
      <OrbitControls target={[0, 0, 0]} maxPolarAngle={Math.PI / 2.2} />
    </Canvas>
  );
}

export default Sandbox;
