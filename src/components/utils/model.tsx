import { FC, useEffect } from 'react';
import { ThreeElements } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';


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

export default Model;