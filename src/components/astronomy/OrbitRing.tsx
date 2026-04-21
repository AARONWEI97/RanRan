import { useMemo, memo } from 'react';
import * as THREE from 'three';

interface OrbitRingProps {
  radius: number;
  isDark: boolean;
}

const OrbitRing: React.FC<OrbitRingProps> = memo(({ radius, isDark }) => {
  const points = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 64; i++) {
      const angle = (i / 64) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius));
    }
    return pts;
  }, [radius]);

  return (
    <line>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[new Float32Array(points.flatMap(p => [p.x, p.y, p.z])), 3]}
        />
      </bufferGeometry>
      <lineBasicMaterial 
        color={isDark ? "#ffffff" : "#666666"} 
        transparent 
        opacity={0.08} 
      />
    </line>
  );
});

OrbitRing.displayName = 'OrbitRing';

export default OrbitRing;
