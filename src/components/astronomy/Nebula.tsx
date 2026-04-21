import { useRef, useMemo, memo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface NebulaProps {
  position: [number, number, number];
  color1: string;
  color2: string;
  size?: number;
  particleCount?: number;
  isDark: boolean;
}

const Nebula: React.FC<NebulaProps> = memo(({ 
  position, 
  color1, 
  color2, 
  size = 50,
  particleCount = 2000,
  isDark 
}) => {
  const nebulaRef = useRef<THREE.Points>(null);
  const coreRef = useRef<THREE.Points>(null);
  
  const { positions, colors } = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const col = new Float32Array(particleCount * 3);
    
    const c1 = new THREE.Color(color1);
    const c2 = new THREE.Color(color2);
    
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = Math.pow(Math.random(), 0.5) * size;
      
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta) * 0.4;
      const z = r * Math.cos(phi);
      
      pos[i3] = x;
      pos[i3 + 1] = y;
      pos[i3 + 2] = z;
      
      const t = Math.random();
      const mixColor = new THREE.Color().lerpColors(c1, c2, t);
      col[i3] = mixColor.r;
      col[i3 + 1] = mixColor.g;
      col[i3 + 2] = mixColor.b;
      
    }
    
    return { positions: pos, colors: col };
  }, [color1, color2, size, particleCount]);

  const { corePositions, coreColors } = useMemo(() => {
    const count = Math.floor(particleCount * 0.3);
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    
    const c1 = new THREE.Color(color1);
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = Math.pow(Math.random(), 1.5) * size * 0.3;
      
      pos[i3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.4;
      pos[i3 + 2] = r * Math.cos(phi);
      
      col[i3] = c1.r * 1.5;
      col[i3 + 1] = c1.g * 1.5;
      col[i3 + 2] = c1.b * 1.5;
    }
    
    return { corePositions: pos, coreColors: col };
  }, [color1, size, particleCount]);

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    
    if (nebulaRef.current) {
      nebulaRef.current.rotation.y = time * 0.005;
    }
    if (coreRef.current) {
      coreRef.current.rotation.y = -time * 0.008;
    }
  });

  return (
    <group position={position}>
      <points ref={nebulaRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[colors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={2.5}
          vertexColors
          transparent
          opacity={isDark ? 0.4 : 0.2}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
      
      <points ref={coreRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[corePositions, 3]} />
          <bufferAttribute attach="attributes-color" args={[coreColors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={1.5}
          vertexColors
          transparent
          opacity={isDark ? 0.6 : 0.3}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </group>
  );
});

Nebula.displayName = 'Nebula';

export default Nebula;
