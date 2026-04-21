import { useRef, useState, useEffect, memo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

interface HologramScreenProps {
  position: [number, number, number];
  onClick: () => void;
  isUniverseReady: boolean;
  videoUrl?: string | null;
  videoElement?: HTMLVideoElement | null;
  videoList?: string[];
}

const HologramScreen: React.FC<HologramScreenProps> = memo(({ position, onClick, isUniverseReady, videoElement, videoList }) => {
  const screenRef = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [videoTexture, setVideoTexture] = useState<THREE.VideoTexture | null>(null);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const currentVideoSrc = videoList && videoList.length > 0 
    ? videoList[currentVideoIndex] 
    : null;

  useEffect(() => {
    if (!isUniverseReady) return;

    let video: HTMLVideoElement;
    let isLocalVideo = false;

    if (videoElement) {
        video = videoElement;
        video.loop = false;
        videoRef.current = video;
    } else if (currentVideoSrc) {
        video = document.createElement('video');
        isLocalVideo = true;
        
        video.crossOrigin = 'anonymous';
        video.src = currentVideoSrc;
        video.loop = false;
        video.muted = true;
        video.playsInline = true;
        video.autoplay = true;
        video.volume = 0;
        
        video.setAttribute('crossorigin', 'anonymous');
        video.setAttribute('autoplay', '');
        video.setAttribute('muted', '');
        video.setAttribute('playsinline', '');
        video.setAttribute('preload', 'auto');
        
        video.style.position = 'fixed';
        video.style.top = '0';
        video.style.left = '0';
        video.style.width = '1px';
        video.style.height = '1px';
        video.style.opacity = '0.01';
        video.style.pointerEvents = 'none';
        video.style.zIndex = '-9999';
        
        document.body.appendChild(video);
        videoRef.current = video;
    } else {
        return;
    }

    const onEnded = () => {
        if (videoList && videoList.length > 1) {
            setCurrentVideoIndex(prev => (prev + 1) % videoList.length);
        }
    };

    const onLoadedData = () => {};
    const onError = () => {};
    const onPlaying = () => {
        if (videoTexture) videoTexture.needsUpdate = true;
    };

    video.addEventListener('loadeddata', onLoadedData);
    video.addEventListener('error', onError);
    video.addEventListener('playing', onPlaying);
    video.addEventListener('ended', onEnded);
    
    const updateTexture = () => {
        if (videoTexture) {
             videoTexture.dispose();
        }

        const texture = new THREE.VideoTexture(video);
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.format = THREE.RGBAFormat;
        texture.generateMipmaps = false;
        
        setVideoTexture(texture);
    };

    const dimensionCheckInterval = setInterval(() => {
        if (video.videoWidth > 0 && video.videoHeight > 0) {
            clearInterval(dimensionCheckInterval);
            updateTexture();
        }
    }, 500);

    const playVideo = async () => {
        try {
            if (video.paused) {
                await video.play();
            }
        } catch {}
    };
    
    playVideo();
    
    return () => {
      video.removeEventListener('loadeddata', onLoadedData);
      video.removeEventListener('error', onError);
      video.removeEventListener('playing', onPlaying);
      video.removeEventListener('ended', onEnded);
      
      if (isLocalVideo && video.parentNode) {
        video.parentNode.removeChild(video);
      }
      clearInterval(dimensionCheckInterval);
      
      if (videoTexture) {
          videoTexture.dispose();
      }
      setVideoTexture(null);
    };
  }, [isUniverseReady, videoElement]);

  useEffect(() => {
    if (videoRef.current && videoList && videoList.length > 0) {
        const newSrc = videoList[currentVideoIndex];
        
        videoRef.current.src = newSrc;
        videoRef.current.load();
        
        const onCanPlay = () => {
            if (videoRef.current && videoRef.current.videoWidth > 0) {
                const texture = new THREE.VideoTexture(videoRef.current);
                texture.minFilter = THREE.LinearFilter;
                texture.magFilter = THREE.LinearFilter;
                texture.colorSpace = THREE.SRGBColorSpace;
                texture.format = THREE.RGBAFormat;
                texture.generateMipmaps = false;
                setVideoTexture(texture);
            }
            videoRef.current?.play().catch(() => {});
            videoRef.current?.removeEventListener('canplay', onCanPlay);
        };
        
        videoRef.current.addEventListener('canplay', onCanPlay);
        
        return () => {
            videoRef.current?.removeEventListener('canplay', onCanPlay);
        };
    }
  }, [currentVideoIndex, videoList]);

  useFrame(({ clock }) => {
    if (screenRef.current) {
      screenRef.current.rotation.y = Math.sin(clock.getElapsedTime() * 0.2) * 0.1;
    }
    if (glowRef.current) {
      const material = glowRef.current.material as THREE.MeshBasicMaterial;
      material.opacity = 0.3 + Math.sin(clock.getElapsedTime() * 2) * 0.1;
    }
    if (videoTexture) {
      videoTexture.needsUpdate = true;
    }
  });

  return (
    <group position={position} ref={screenRef}>
      <mesh
        onPointerOver={() => setIsHovered(true)}
        onPointerOut={() => setIsHovered(false)}
        onClick={onClick}
      >
        <boxGeometry args={[80, 60, 0.8]} />
        <meshStandardMaterial
          color="#001020"
          emissive={new THREE.Color(isHovered ? '#1a1a3e' : '#0a0a1a')} 
          emissiveIntensity={isHovered ? 0.5 : 0.2}
          transparent
          opacity={0.9}
        />
      </mesh>
      
      <mesh position={[0, 0, 0.5]}>
        <planeGeometry args={[76, 56]} />
        {videoTexture ? (
          <meshBasicMaterial
            key={videoTexture.uuid}
            map={videoTexture}
            transparent={false}
            opacity={1}
            side={THREE.DoubleSide}
            toneMapped={false}
          />
        ) : (
          <meshBasicMaterial
            color="#000510"
            transparent
            opacity={0.95}
          />
        )}
      </mesh>
        {/* 光晕效果 */}
      <mesh ref={glowRef} position={[0, 0, -0.6]}>
        <planeGeometry args={[85, 60]} />
        <meshBasicMaterial
          color="#1a1a3e"
          transparent
          opacity={0.3}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {!videoTexture && [...Array(8)].map((_, i) => (
        <mesh key={i} position={[0, 11 - i * 3, 0.55]}>
          <planeGeometry args={[38, 0.15]} />
          <meshBasicMaterial
            color="#8a2be2"
            transparent
            opacity={0.1 + i * 0.03}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}

      {!videoTexture && (
        <Html position={[0, 0, 0.6]} center>
          <div 
            className="pointer-events-none text-center"
            style={{ 
              fontFamily: 'monospace',
              color: isHovered ? '#00ffff' : '#00aaff',
              textShadow: '0 0 15px rgba(0,255,255,0.6)',
              whiteSpace: 'nowrap'
            }}
          >
            <div className="text-2xl font-bold tracking-widest">◆ HOLOGRAM CINEMA ◆</div>
            <div className="text-sm mt-2 opacity-70">点击进入全息影院</div>
          </div>
        </Html>
      )}

      {isHovered && !videoTexture && (
        <mesh position={[0, 0, 0.5]}>
          <planeGeometry args={[48, 30]} />
          <meshBasicMaterial
            color="#00ffff"
            transparent
            opacity={0.15}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      )}
    </group>
  );
});

HologramScreen.displayName = 'HologramScreen';

export default HologramScreen;
