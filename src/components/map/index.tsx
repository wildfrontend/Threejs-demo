import { ThreeElements } from '@react-three/fiber';

const Map = (props: ThreeElements['mesh']) => {
  return (
    <mesh {...props} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[60, 60, 1, 1]} />
      <meshStandardMaterial color={'#2a2a2a'} />
    </mesh>
  );
};

export default Map;
