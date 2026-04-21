import { useRef, useMemo, memo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { ORBIT_CONFIG, PLANET_COLORS } from './constants';

interface DistantPlanetParticlesProps {
  photos: Array<{
    id: string;
    index: number;
    totalPhotos: number;
  }>;
  onPhotoClick: (id: string) => void;
  isDark: boolean;
}

const VISIBLE_DISTANCE = 150;

const DistantPlanetParticles: React.FC<DistantPlanetParticlesProps> = memo(({ 
  photos, 
  onPhotoClick,
  isDark 
}) => {
  const pointsRef = useRef<THREE.Points>(null);
  const { camera } = useThree();

  const { positions, colors, ids } = useMemo(() => {
    const pos = new Float32Array(photos.length * 3);
    const col = new Float32Array(photos.length * 3);
    const idList: string[] = [];
    
    for (let i = 0; i < photos.length; i++) {
      const { index, totalPhotos } = photos[i];
      const minR = ORBIT_CONFIG.minDistance;
      const maxR = ORBIT_CONFIG.maxDistance;
      const orbitRadius = minR + (index / Math.max(totalPhotos - 1, 1)) * (maxR - minR);
      const angle = (index / totalPhotos) * Math.PI * 2;
      
      pos[i * 3] = Math.cos(angle) * orbitRadius;
      pos[i * 3 + 1] = 0;
      pos[i * 3 + 2] = Math.sin(angle) * orbitRadius;
      
      const color = new THREE.Color(PLANET_COLORS[index % PLANET_COLORS.length]);
      col[i * 3] = color.r;
      col[i * 3 + 1] = color.g;
      col[i * 3 + 2] = color.b;
      
      idList.push(photos[i].id);
    }
    
    return { positions: pos, colors: col, ids: idList };
  }, [photos]);

  useFrame(({ clock }) => {
    if (!pointsRef.current) return;
    
    const time = clock.getElapsedTime();
    const geometry = pointsRef.current.geometry;
    const posAttr = geometry.getAttribute('position');
    
    for (let i = 0; i < photos.length; i++) {
      const { index, totalPhotos } = photos[i];
      const orbitRadius = ORBIT_CONFIG.minDistance + (index / Math.max(totalPhotos - 1, 1)) * (ORBIT_CONFIG.maxDistance - ORBIT_CONFIG.minDistance);
      const orbitSpeed = ORBIT_CONFIG.baseSpeed * (1 - index * 0.015);
      const initialAngle = (index / totalPhotos) * Math.PI * 2;
      const angle = initialAngle + time * orbitSpeed;
      
      posAttr.setXYZ(
        i,
        Math.cos(angle) * orbitRadius,
        0,
        Math.sin(angle) * orbitRadius
      );
    }
    
    posAttr.needsUpdate = true;
  });

  if (photos.length === 0) return null;

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={3}
        vertexColors
        transparent
        opacity={isDark ? 0.8 : 0.5}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
});

DistantPlanetParticles.displayName = 'DistantPlanetParticles';

export default DistantPlanetParticles;
