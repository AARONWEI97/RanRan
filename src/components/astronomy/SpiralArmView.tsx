import { useRef, useMemo, useState, useEffect, memo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import type { Photo } from '../../types';
import { usePhotoUrl } from '../../hooks/usePhotoUrl';
import { PLANET_COLORS } from './constants';

interface SpiralArmPlanetProps {
  photo: Photo;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  isDark: boolean;
  spiralAngle: number;
  spiralRadius: number;
  spiralY: number;
}

const SpiralArmPlanet: React.FC<SpiralArmPlanetProps> = memo(({
  photo,
  index,
  isSelected,
  onSelect,
  isDark,
  spiralAngle,
  spiralRadius,
  spiralY,
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const imageUrl = usePhotoUrl(photo);

  const planetColor = useMemo(() => PLANET_COLORS[index % PLANET_COLORS.length], [index]);
  const planetSize = useMemo(() => 0.8 + (index % 3) * 0.2, [index]);

  useEffect(() => {
    if (!imageUrl && !photo.thumbnail) return;
    let isMounted = true;
    const loader = new THREE.TextureLoader();
    const url = photo.thumbnail || imageUrl;
    if (!url) return;

    loader.load(url, (loadedTexture) => {
      if (isMounted) {
        loadedTexture.colorSpace = THREE.SRGBColorSpace;
        loadedTexture.minFilter = THREE.LinearMipmapLinearFilter;
        setTexture(prev => { if (prev) prev.dispose(); return loadedTexture; });
      } else {
        loadedTexture.dispose();
      }
    });
    return () => { isMounted = false; };
  }, [imageUrl, photo.thumbnail]);

  useEffect(() => {
    return () => { if (texture) texture.dispose(); };
  }, [texture]);

  useFrame(() => {
    if (meshRef.current) {
      const scale = isSelected ? 1.5 : isHovered ? 1.2 : 1;
      meshRef.current.scale.lerp(new THREE.Vector3(scale, scale, scale), 0.1);
    }
  });

  const position = useMemo((): [number, number, number] => [
    Math.cos(spiralAngle) * spiralRadius,
    spiralY,
    Math.sin(spiralAngle) * spiralRadius,
  ], [spiralAngle, spiralRadius, spiralY]);

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        onClick={(e) => { e.stopPropagation(); onSelect(); }}
        onPointerOver={(e) => { e.stopPropagation(); setIsHovered(true); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { setIsHovered(false); document.body.style.cursor = 'default'; }}
      >
        <sphereGeometry args={[planetSize, 16, 16]} />
        {texture ? (
          <meshStandardMaterial
            map={texture}
            roughness={0.7}
            metalness={0.1}
            emissive={new THREE.Color(planetColor)}
            emissiveIntensity={isSelected ? 0.3 : isHovered ? 0.15 : 0.05}
          />
        ) : (
          <meshStandardMaterial
            color={planetColor}
            roughness={0.7}
            metalness={0.1}
            emissive={new THREE.Color(planetColor)}
            emissiveIntensity={0.2}
          />
        )}
      </mesh>

      {(isHovered || isSelected) && (
        <Html center position={[0, planetSize + 1, 0]}>
          <div className={`
            px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap
            ${isDark ? 'bg-black/80 text-white border border-cyan-500/20' : 'bg-white/90 text-gray-800 border border-gray-200'}
            backdrop-blur-sm shadow-lg
          `}>
            {photo.name || `照片 ${index + 1}`}
          </div>
        </Html>
      )}

      {(isSelected || isHovered) && (
        <mesh scale={[1.1, 1.1, 1.1]}>
          <sphereGeometry args={[planetSize, 16, 16]} />
          <meshBasicMaterial
            color={planetColor}
            transparent
            opacity={0.15}
            side={THREE.BackSide}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      )}
    </group>
  );
});

SpiralArmPlanet.displayName = 'SpiralArmPlanet';

interface SpiralArmViewProps {
  photos: Photo[];
  selectedPhotoId: string | null;
  onPhotoSelect: (id: string) => void;
  isDark: boolean;
}

const SPIRAL_CONFIG = {
  arms: 4,
  minRadius: 15,
  maxRadius: 80,
  heightSpread: 4,
  tightness: 0.6,
  rotationSpeed: 0.008,
};

const SpiralArmView: React.FC<SpiralArmViewProps> = memo(({
  photos,
  selectedPhotoId,
  onPhotoSelect,
  isDark,
}) => {
  const groupRef = useRef<THREE.Group>(null);

  const spiralData = useMemo(() => {
    return photos.map((photo, index) => {
      const arm = index % SPIRAL_CONFIG.arms;
      const armBaseAngle = (arm / SPIRAL_CONFIG.arms) * Math.PI * 2;
      const t = index / Math.max(photos.length - 1, 1);
      const radius = SPIRAL_CONFIG.minRadius + t * (SPIRAL_CONFIG.maxRadius - SPIRAL_CONFIG.minRadius);
      const spiralAngle = armBaseAngle + t * Math.PI * 2 * SPIRAL_CONFIG.tightness;
      const y = (Math.random() - 0.5) * SPIRAL_CONFIG.heightSpread * (1 - t * 0.5);

      return { photo, index, spiralAngle, spiralRadius: radius, spiralY: y };
    });
  }, [photos]);

  const { armParticlePositions, armParticleColors } = useMemo(() => {
    const particlesPerArm = 600;
    const totalParticles = SPIRAL_CONFIG.arms * particlesPerArm;
    const positions = new Float32Array(totalParticles * 3);
    const colors = new Float32Array(totalParticles * 3);

    for (let arm = 0; arm < SPIRAL_CONFIG.arms; arm++) {
      const armBaseAngle = (arm / SPIRAL_CONFIG.arms) * Math.PI * 2;
      for (let i = 0; i < particlesPerArm; i++) {
        const idx = (arm * particlesPerArm + i) * 3;
        const t = i / particlesPerArm;
        const radius = SPIRAL_CONFIG.minRadius + t * (SPIRAL_CONFIG.maxRadius - SPIRAL_CONFIG.minRadius);
        const angle = armBaseAngle + t * Math.PI * 2 * SPIRAL_CONFIG.tightness;
        const spread = (Math.random() - 0.5) * 8 * (1 + t);

        positions[idx] = Math.cos(angle) * radius + spread;
        positions[idx + 1] = (Math.random() - 0.5) * 3;
        positions[idx + 2] = Math.sin(angle) * radius + spread;

        const brightness = 0.3 + Math.random() * 0.4;
        colors[idx] = 0.4 * brightness;
        colors[idx + 1] = 0.7 * brightness;
        colors[idx + 2] = 1.0 * brightness;
      }
    }

    return { armParticlePositions: positions, armParticleColors: colors };
  }, []);

  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = clock.getElapsedTime() * SPIRAL_CONFIG.rotationSpeed;
    }
  });

  return (
    <group ref={groupRef} rotation={[-0.15, 0, 0]}>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[armParticlePositions, 3]} />
          <bufferAttribute attach="attributes-color" args={[armParticleColors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.5}
          vertexColors
          transparent
          opacity={isDark ? 0.6 : 0.3}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {spiralData.map(({ photo, index, spiralAngle, spiralRadius, spiralY }) => (
        <SpiralArmPlanet
          key={photo.id}
          photo={photo}
          index={index}
          isSelected={selectedPhotoId === photo.id}
          onSelect={() => onPhotoSelect(photo.id)}
          isDark={isDark}
          spiralAngle={spiralAngle}
          spiralRadius={spiralRadius}
          spiralY={spiralY}
        />
      ))}
    </group>
  );
});

SpiralArmView.displayName = 'SpiralArmView';

export default SpiralArmView;
