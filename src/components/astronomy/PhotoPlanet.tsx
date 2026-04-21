import { useRef, useMemo, useState, useEffect, useCallback, memo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import type { Photo } from '../../types';
import { usePhotoUrl } from '../../hooks/usePhotoUrl';
import { ORBIT_CONFIG, PLANET_COLORS } from './constants';
import PlanetRing from './PlanetRing';
import PlanetInfoCard from './PlanetInfoCard';

interface PhotoPlanetProps {
  photo: Photo;
  index: number;
  totalPhotos: number;
  isSelected: boolean;
  onSelect: () => void;
  isDark: boolean;
}

const LOD_DISTANCE_HIGH = 60;
const LOD_DISTANCE_MEDIUM = 120;

const PhotoPlanet: React.FC<PhotoPlanetProps> = memo(({ 
  photo, 
  index, 
  totalPhotos, 
  isSelected, 
  onSelect,
  isDark 
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const orbitRef = useRef<THREE.Group>(null);
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const [hasError, setHasError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [lodLevel, setLodLevel] = useState<'low' | 'medium' | 'high'>('low');
  const [highResLoaded, setHighResLoaded] = useState(false);

  const imageUrl = usePhotoUrl(photo);
  const thumbnailUrl = photo.thumbnail || '';

  const { camera } = useThree();

  const orbitRadius = useMemo(() => {
    const minR = ORBIT_CONFIG.minDistance;
    const maxR = ORBIT_CONFIG.maxDistance;
    return minR + (index / Math.max(totalPhotos - 1, 1)) * (maxR - minR);
  }, [index, totalPhotos]);

  const orbitSpeed = useMemo(() => {
    return ORBIT_CONFIG.baseSpeed * (1 - index * 0.015);
  }, [index]);

  const orbitTilt = useMemo(() => {
    return (index * 0.05) - 0.15;
  }, [index]);

  const initialAngle = useMemo(() => {
    return (index / totalPhotos) * Math.PI * 2;
  }, [index, totalPhotos]);

  const planetColor = useMemo(() => {
    return PLANET_COLORS[index % PLANET_COLORS.length];
  }, [index]);

  const planetSize = useMemo(() => {
    return 1.2 + (index % 3) * 0.3;
  }, [index]);

  const hasRing = useMemo(() => {
    return index % 3 === 0;
  }, [index]);

  const ringColor = useMemo(() => {
    return PLANET_COLORS[(index + 2) % PLANET_COLORS.length];
  }, [index]);

  const atmosphereColor = useMemo(() => {
    return PLANET_COLORS[index % PLANET_COLORS.length];
  }, [index]);

  const geometryDetail = useMemo(() => {
    if (isSelected || isHovered) return 32;
    if (lodLevel === 'high') return 24;
    if (lodLevel === 'medium') return 16;
    return 12;
  }, [lodLevel, isSelected, isHovered]);

  const loadTexture = useCallback((url: string) => {
    let isMounted = true;
    const loader = new THREE.TextureLoader();

    loader.load(
      url,
      (loadedTexture) => {
        if (isMounted) {
          loadedTexture.colorSpace = THREE.SRGBColorSpace;
          loadedTexture.minFilter = THREE.LinearMipmapLinearFilter;
          loadedTexture.magFilter = THREE.LinearFilter;
          setTexture(prev => {
            if (prev) prev.dispose();
            return loadedTexture;
          });
        } else {
          loadedTexture.dispose();
        }
      },
      undefined,
      () => {
        if (isMounted) setHasError(true);
      }
    );

    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    if (isSelected || isHovered) {
      if (imageUrl) {
        setHighResLoaded(true);
        return loadTexture(imageUrl);
      }
    }
    
    if (lodLevel === 'high' && imageUrl) {
      setHighResLoaded(true);
      return loadTexture(imageUrl);
    }
    
    if (lodLevel === 'medium' && !highResLoaded) {
      if (thumbnailUrl) {
        return loadTexture(thumbnailUrl);
      }
    }
    
    if (lodLevel === 'low') {
      if (thumbnailUrl) {
        return loadTexture(thumbnailUrl);
      }
      if (!thumbnailUrl) setHasError(true);
    }

    return undefined;
  }, [lodLevel, isSelected, isHovered, imageUrl, thumbnailUrl, highResLoaded, loadTexture]);

  useEffect(() => {
    return () => {
      if (texture) {
        texture.dispose();
      }
    };
  }, [texture]);

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    
    if (orbitRef.current) {
      orbitRef.current.rotation.y = initialAngle + time * orbitSpeed;
      
      const worldPos = new THREE.Vector3();
      orbitRef.current.getWorldPosition(worldPos);
      const distance = camera.position.distanceTo(worldPos);
      
      let newLod: 'low' | 'medium' | 'high';
      if (distance < LOD_DISTANCE_HIGH || isSelected || isHovered) {
        newLod = 'high';
      } else if (distance < LOD_DISTANCE_MEDIUM) {
        newLod = 'medium';
      } else {
        newLod = 'low';
      }
      
      if (newLod !== lodLevel) {
        setLodLevel(newLod);
      }
    }
    
    if (meshRef.current) {
      meshRef.current.rotation.y += ORBIT_CONFIG.rotationSpeed * 0.02;
      
      const scale = isSelected ? 1.4 : isHovered ? 1.2 : 1;
      meshRef.current.scale.lerp(new THREE.Vector3(scale, scale, scale), 0.1);
    }
  });

  if (hasError) {
    return null;
  }

  if (!texture) {
    return (
      <mesh position={[orbitRadius, 0, 0]}>
        <sphereGeometry args={[planetSize * 0.5, 8, 8]} />
        <meshBasicMaterial color={planetColor} transparent opacity={0.3} />
      </mesh>
    );
  }

  return (
    <group ref={orbitRef} rotation={[orbitTilt, 0, orbitTilt * 0.5]}>
      <mesh 
        ref={meshRef}
        position={[orbitRadius, 0, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setIsHovered(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setIsHovered(false);
          document.body.style.cursor = 'default';
        }}
      >
        <sphereGeometry args={[planetSize, geometryDetail, geometryDetail]} />
        <meshStandardMaterial 
          map={texture}
          roughness={0.7}
          metalness={0.1}
          emissive={new THREE.Color(planetColor)}
          emissiveIntensity={isSelected ? 0.3 : isHovered ? 0.15 : 0.05}
        />
      </mesh>
      
      {(isSelected || isHovered || lodLevel === 'high') && (
        <group position={[orbitRadius, 0, 0]}>
          <mesh scale={[1.06, 1.06, 1.06]}>
            <sphereGeometry args={[planetSize, geometryDetail, geometryDetail]} />
            <meshBasicMaterial 
              color={atmosphereColor}
              transparent
              opacity={isHovered || isSelected ? 0.2 : 0.08}
              side={THREE.BackSide}
              blending={THREE.AdditiveBlending}
            />
          </mesh>

          <mesh rotation={[0.1, 0, 0.2]}>
            <sphereGeometry args={[planetSize * 1.03, geometryDetail, geometryDetail]} />
            <meshStandardMaterial
              color="#ffffff"
              transparent
              opacity={0.06}
              roughness={1}
              metalness={0}
              depthWrite={false}
            />
          </mesh>
          
          {isSelected && (
            <mesh scale={[1.15, 1.15, 1.15]}>
              <sphereGeometry args={[planetSize, geometryDetail, geometryDetail]} />
              <meshBasicMaterial 
                color="#00ffff"
                transparent
                opacity={0.3}
                side={THREE.BackSide}
                blending={THREE.AdditiveBlending}
              />
            </mesh>
          )}
        </group>
      )}
      
      {hasRing && (isSelected || isHovered || lodLevel !== 'low') && (
        <group position={[orbitRadius, 0, 0]}>
          <PlanetRing
            innerRadius={planetSize * 1.4}
            outerRadius={planetSize * 2.5}
            color={ringColor}
            opacity={0.5}
            tilt={0.4}
            hasAsteroids
          />
        </group>
      )}
      
      {(isHovered || isSelected) && (
        <Html position={[orbitRadius, planetSize + 1.5, 0]} center>
          <PlanetInfoCard photo={photo} isDark={isDark} />
        </Html>
      )}
    </group>
  );
});

PhotoPlanet.displayName = 'PhotoPlanet';

export default PhotoPlanet;
