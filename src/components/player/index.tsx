import { useGLTF } from '@react-three/drei';
import { useEffect } from 'react';

import heroModel from '@/assets/hero.glb';

const Player = () => {
  const { scene } = useGLTF('/assets/glb/character-digger.glb');
  useEffect(() => {
    if (scene) {
      scene.scale.set(1, 1, 1);
      scene.traverse((child: any) => {
        child.castShadow = true;
      });
    }
  }, [scene]);

  return <primitive object={scene} position={[0, 0, 0]} />;
};

useGLTF.preload('/assets/glb/character-digger.glb');

export default Player;
