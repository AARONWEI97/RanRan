import { useRef, useMemo, memo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface SpiralGalaxyProps {
  isDark: boolean;
  particleMultiplier?: number;
}

const SpiralGalaxy: React.FC<SpiralGalaxyProps> = memo(({ isDark, particleMultiplier = 1.0 }) => {
  const galaxyRef = useRef<THREE.Points>(null);
  const coreRef = useRef<THREE.Points>(null);
  const dustRef = useRef<THREE.Points>(null);
  
  const { spiralPositions, spiralColors, spiralSizes } = useMemo(() => {
    const count = Math.floor(8000 * particleMultiplier);
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      
      const arm = Math.floor(Math.random() * 4);
      const armAngle = (arm / 4) * Math.PI * 2;
      
      const distance = 30 + Math.random() * 150;
      const spiralAngle = armAngle + (distance / 30) * 0.5 + (Math.random() - 0.5) * 0.3;
      const spread = (Math.random() - 0.5) * (distance * 0.1);
      
      positions[i3] = Math.cos(spiralAngle) * distance + spread;
      positions[i3 + 1] = (Math.random() - 0.5) * 8 * (1 - distance / 180);
      positions[i3 + 2] = Math.sin(spiralAngle) * distance + spread;
      
      const isBlue = Math.random() > 0.7;
      const isYellow = Math.random() > 0.85;
      
      if (isYellow) {
        colors[i3] = 1.0;
        colors[i3 + 1] = 0.9;
        colors[i3 + 2] = 0.6;
      } else if (isBlue) {
        colors[i3] = 0.6;
        colors[i3 + 1] = 0.8;
        colors[i3 + 2] = 1.0;
      } else {
        colors[i3] = 0.9;
        colors[i3 + 1] = 0.95;
        colors[i3 + 2] = 1.0;
      }
      
      sizes[i] = 0.3 + Math.random() * 0.8;
    }
    
    return { spiralPositions: positions, spiralColors: colors, spiralSizes: sizes };
  }, []);

  const { corePositions, coreColors, coreSizes } = useMemo(() => {
    const count = Math.floor(2000 * particleMultiplier);
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      
      const radius = Math.random() * 25;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta) * 0.3;
      positions[i3 + 2] = radius * Math.cos(phi);
      
      const brightness = 0.8 + Math.random() * 0.2;
      colors[i3] = 1.0 * brightness;
      colors[i3 + 1] = 0.95 * brightness;
      colors[i3 + 2] = 0.8 * brightness;
      
      sizes[i] = 0.5 + Math.random() * 1.0;
    }
    
    return { corePositions: positions, coreColors: colors, coreSizes: sizes };
  }, []);

  const { dustPositions, dustColors } = useMemo(() => {
    const count = Math.floor(1500 * particleMultiplier);
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      
      const arm = Math.floor(Math.random() * 4);
      const armAngle = (arm / 4) * Math.PI * 2;
      
      const distance = 40 + Math.random() * 100;
      const spiralAngle = armAngle + (distance / 35) * 0.5;
      
      positions[i3] = Math.cos(spiralAngle) * distance + (Math.random() - 0.5) * 15;
      positions[i3 + 1] = (Math.random() - 0.5) * 3;
      positions[i3 + 2] = Math.sin(spiralAngle) * distance + (Math.random() - 0.5) * 15;
      
      colors[i3] = 0.2 + Math.random() * 0.1;
      colors[i3 + 1] = 0.15 + Math.random() * 0.1;
      colors[i3 + 2] = 0.1 + Math.random() * 0.05;
    }
    
    return { dustPositions: positions, dustColors: colors };
  }, []);

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    
    if (galaxyRef.current) {
      galaxyRef.current.rotation.y = time * 0.015;
    }
    if (coreRef.current) {
      coreRef.current.rotation.y = time * 0.02;
    }
    if (dustRef.current) {
      dustRef.current.rotation.y = time * 0.012;
    }
  });

  return (
    <group rotation={[-0.3, 0, 0]}>
      <points ref={coreRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[corePositions, 3]} />
          <bufferAttribute attach="attributes-color" args={[coreColors, 3]} />
          <bufferAttribute attach="attributes-size" args={[coreSizes, 1]} />
        </bufferGeometry>
        <pointsMaterial
          size={1.2}
          vertexColors
          transparent
          opacity={isDark ? 0.9 : 0.5}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
        />
      </points>
      
      <points ref={galaxyRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[spiralPositions, 3]} />
          <bufferAttribute attach="attributes-color" args={[spiralColors, 3]} />
          <bufferAttribute attach="attributes-size" args={[spiralSizes, 1]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.8}
          vertexColors
          transparent
          opacity={isDark ? 0.7 : 0.4}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
        />
      </points>
      
      <points ref={dustRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[dustPositions, 3]} />
          <bufferAttribute attach="attributes-color" args={[dustColors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={3}
          vertexColors
          transparent
          opacity={isDark ? 0.3 : 0.15}
          sizeAttenuation
          blending={THREE.NormalBlending}
        />
      </points>
    </group>
  );
});

SpiralGalaxy.displayName = 'SpiralGalaxy';

export default SpiralGalaxy;
