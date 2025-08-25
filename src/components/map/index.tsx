import { FC, useEffect } from 'react';
import { ThreeElements } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';

// Helper component for loading glb models from the public assets folder
const Model: FC<{ url: string } & ThreeElements['group']> = ({ url, ...props }) => {
  const { scene } = useGLTF(url);

  useEffect(() => {
    scene.traverse((child: any) => {
      child.castShadow = true;
      child.receiveShadow = true;
    });
  }, [scene]);

  return <primitive object={scene} {...props} />;
};

const Map: FC<ThreeElements['group']> = (props) => {
  return (
    <group {...props}>
      {/* Ground */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[60, 60, 1, 1]} />
        <meshStandardMaterial color={'#2a2a2a'} />
      </mesh>

      {/* Scene objects */}
      <Model position={[0, 0, 0]} url="/assets/glb/crypt-small.glb" />
      <Model position={[2, 0, 3]} url="/assets/glb/gravestone-cross.glb" />
      <Model position={[-3, 0, 2]} url="/assets/glb/gravestone-round.glb" />
      <Model position={[5, 0, -4]} url="/assets/glb/pine.glb" />
      <Model position={[-4, 0, -3]} url="/assets/glb/pumpkin.glb" />
      <Model position={[0, 0, -5]} url="/assets/glb/fence.glb" />
      <Model
        position={[5, 0, 0]}
        rotation={[0, Math.PI / 2, 0]}
        url="/assets/glb/fence.glb"
      />
      <Model
        position={[-5, 0, 0]}
        rotation={[0, Math.PI / 2, 0]}
        url="/assets/glb/fence.glb"
      />
      <Model position={[0, 0, 5]} url="/assets/glb/fence.glb" />
    </group>
  );
};

useGLTF.preload('/assets/glb/crypt-small.glb');
useGLTF.preload('/assets/glb/gravestone-cross.glb');
useGLTF.preload('/assets/glb/gravestone-round.glb');
useGLTF.preload('/assets/glb/pine.glb');
useGLTF.preload('/assets/glb/pumpkin.glb');
useGLTF.preload('/assets/glb/fence.glb');

export default Map;
