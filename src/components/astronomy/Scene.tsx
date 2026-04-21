import { useMemo, useState, useCallback, useEffect, memo } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { Stars, OrbitControls } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import type { Photo } from '../../types';
import { getPerformanceConfig, type PerformanceConfig } from '../../utils/performance';
import { ORBIT_CONFIG, REAL_STARS, CONSTELLATIONS, CONSTELLATION_POSITIONS, type ConstellationKey } from './constants';
import Sun from './Sun';
import PhotoPlanet from './PhotoPlanet';
import OrbitRing from './OrbitRing';
import BackgroundStar from './BackgroundStar';
import SpiralGalaxy from './SpiralGalaxy';
import HologramScreen from './HologramScreen';
import { ConstellationPattern, ConstellationTextureLoader } from './ConstellationPattern';
import AsteroidBelt from './AsteroidBelt';
import Nebula from './Nebula';
import DistantPlanetParticles from './DistantPlanetParticles';
import SpiralArmView from './SpiralArmView';

export type ViewMode = 'solar' | 'spiral';

const MAX_FULL_RENDER_PLANETS = 30;
const VIRTUALIZE_DISTANCE = 150;

interface SceneProps {
  photos: Photo[];
  selectedPhotoId: string | null;
  onPhotoSelect: (id: string) => void;
  isDark: boolean;
  selectedConstellation: ConstellationKey | null;
  constellationPhotos: Record<ConstellationKey, Photo | null>;
  onOpenCinema: () => void;
  isUniverseReady: boolean;
  videoUrl?: string | null;
  videoElement?: HTMLVideoElement | null;
  videoList?: string[];
  viewMode?: ViewMode;
}

const Scene: React.FC<SceneProps> = memo(({ 
  photos, 
  selectedPhotoId, 
  onPhotoSelect, 
  isDark,
  selectedConstellation,
  constellationPhotos,
  onOpenCinema,
  isUniverseReady,
  videoUrl,
  videoElement,
  videoList,
  viewMode = 'solar'
}) => {
  const { camera } = useThree();
  const [constellationTextures, setConstellationTextures] = useState<Record<ConstellationKey, THREE.Texture | null>>({} as Record<ConstellationKey, THREE.Texture | null>);
  const [visiblePhotoIds, setVisiblePhotoIds] = useState<Set<string>>(new Set(photos.map(p => p.id)));
  
  const perfConfig: PerformanceConfig = useMemo(() => getPerformanceConfig(), []);
  const shouldVirtualize = photos.length > MAX_FULL_RENDER_PLANETS;

  useEffect(() => {
    camera.position.set(0, 40, 100);
    camera.lookAt(0, 0, 0);
  }, [camera]);

  useFrame(() => {
    if (!shouldVirtualize) return;
    
    const camPos = camera.position;
    const newVisible = new Set<string>();
    
    for (const photo of photos) {
      const index = photos.indexOf(photo);
      const orbitRadius = ORBIT_CONFIG.minDistance + (index / Math.max(photos.length - 1, 1)) * (ORBIT_CONFIG.maxDistance - ORBIT_CONFIG.minDistance);
      const angle = (index / photos.length) * Math.PI * 2;
      
      const px = Math.cos(angle) * orbitRadius;
      const pz = Math.sin(angle) * orbitRadius;
      
      const distance = Math.sqrt(
        (camPos.x - px) ** 2 + 
        (camPos.z - pz) ** 2
      );
      
      if (distance < VIRTUALIZE_DISTANCE || selectedPhotoId === photo.id) {
        newVisible.add(photo.id);
      }
    }
    
    if (newVisible.size !== visiblePhotoIds.size || 
        [...newVisible].some(id => !visiblePhotoIds.has(id))) {
      setVisiblePhotoIds(newVisible);
    }
  });

  const handleTextureLoad = useCallback((key: ConstellationKey, texture: THREE.Texture | null) => {
    setConstellationTextures(prev => ({
      ...prev,
      [key]: texture
    }));
  }, []);

  const uniqueOrbitRadii = useMemo(() => {
    const radii = new Set<number>();
    photos.forEach((_, index) => {
      const minR = ORBIT_CONFIG.minDistance;
      const maxR = ORBIT_CONFIG.maxDistance;
      radii.add(minR + (index / Math.max(photos.length - 1, 1)) * (maxR - minR));
    });
    return Array.from(radii);
  }, [photos]);

  const distantPhotos = useMemo(() => {
    if (!shouldVirtualize) return [];
    return photos
      .filter(p => !visiblePhotoIds.has(p.id))
      .map((p) => ({
        id: p.id,
        index: photos.indexOf(p),
        totalPhotos: photos.length,
      }));
  }, [photos, shouldVirtualize, visiblePhotoIds]);

  return (
    <>
      <color attach="background" args={[isDark ? '#000005' : '#030308']} />
      
      <Stars 
        radius={350} 
        depth={200} 
        count={perfConfig.starCount} 
        factor={6} 
        saturation={0} 
        fade 
        speed={0.2}
      />
      
      <SpiralGalaxy isDark={isDark} particleMultiplier={perfConfig.galaxyParticleMultiplier} />
      
      {REAL_STARS.map((star, index) => (
        <BackgroundStar key={star.name} star={star} index={index} />
      ))}
      
      {Object.entries(CONSTELLATIONS).map(([key, constellation]) => {
        const constKey = key as ConstellationKey;
        return (
          <ConstellationPattern
            key={key}
            constellation={constellation}
            position={CONSTELLATION_POSITIONS[constKey]}
            scale={1.5}
            visible={selectedConstellation === null || selectedConstellation === constKey}
            isDark={isDark}
            photoTexture={constellationTextures[constKey] || undefined}
          />
        );
      })}
      
      {(Object.keys(CONSTELLATIONS) as ConstellationKey[]).map(constKey => (
        <ConstellationTextureLoader
          key={`loader-${constKey}`}
          constellationKey={constKey}
          photo={constellationPhotos[constKey] || null}
          onTextureLoad={handleTextureLoad}
        />
      ))}
      
      <HologramScreen 
        position={[30, 35, -90]}
        onClick={() => onOpenCinema()}
        isUniverseReady={isUniverseReady}
        videoUrl={videoUrl}
        videoElement={videoElement}
        videoList={videoList}
      />
      
      <ambientLight intensity={isDark ? 0.1 : 0.15} />
      
      <Sun />
      
      {perfConfig.enableNebula && (
        <>
          <Nebula 
            position={[-150, 30, -120]} 
            color1="#ff4488" 
            color2="#4400ff" 
            size={60}
            isDark={isDark}
          />
          <Nebula 
            position={[180, -20, -100]} 
            color1="#00aaff" 
            color2="#00ff88" 
            size={45}
            isDark={isDark}
          />
          <Nebula 
            position={[-80, 60, 100]} 
            color1="#ffaa00" 
            color2="#ff4400" 
            size={35}
            isDark={isDark}
          />
        </>
      )}
      
      {viewMode === 'solar' && (
        <>
          {perfConfig.enableAsteroids && (
            <AsteroidBelt 
              innerRadius={ORBIT_CONFIG.minDistance - 3} 
              outerRadius={ORBIT_CONFIG.minDistance + 2} 
              count={200}
              isDark={isDark}
            />
          )}

          {uniqueOrbitRadii.slice(0, 15).map((radius, i) => (
            <OrbitRing key={i} radius={radius} isDark={isDark} />
          ))}
          
          {photos.map((photo, index) => (
            <PhotoPlanet
              key={photo.id}
              photo={photo}
              index={index}
              totalPhotos={photos.length}
              isSelected={selectedPhotoId === photo.id}
              onSelect={() => onPhotoSelect(photo.id)}
              isDark={isDark}
            />
          ))}
          
          {shouldVirtualize && distantPhotos.length > 0 && (
            <DistantPlanetParticles
              photos={distantPhotos}
              onPhotoClick={onPhotoSelect}
              isDark={isDark}
            />
          )}
        </>
      )}

      {viewMode === 'spiral' && (
        <SpiralArmView
          photos={photos}
          selectedPhotoId={selectedPhotoId}
          onPhotoSelect={onPhotoSelect}
          isDark={isDark}
        />
      )}
      
      <OrbitControls
        enablePan
        enableZoom
        enableRotate
        minDistance={25}
        maxDistance={300}
        maxPolarAngle={Math.PI * 0.85}
        minPolarAngle={Math.PI * 0.1}
      />
      
      {perfConfig.enablePostProcessing && (
        <EffectComposer>
          <Bloom 
            intensity={1.5} 
            luminanceThreshold={0.15} 
            luminanceSmoothing={0.9}
          />
          <Vignette darkness={0.35} offset={0.3} />
        </EffectComposer>
      )}
    </>
  );
});

Scene.displayName = 'Scene';

export default Scene;
