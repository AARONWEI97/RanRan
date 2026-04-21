import { useRef, useMemo, useState, useEffect, memo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { SUN_CONFIG } from './constants';

interface SunProps {
  onClick?: () => void;
}

const SolarFlare: React.FC<{ angle: number; speed: number; size: number; delay: number }> = memo(({ angle, speed, size, delay }) => {
  const flareRef = useRef<THREE.Mesh>(null);
  const startTime = useRef(delay);

  useFrame(({ clock }) => {
    if (!flareRef.current) return;
    const time = clock.getElapsedTime() - startTime.current;
    if (time < 0) return;
    
    const cycle = (time * speed) % 4;
    
    if (cycle < 2) {
      const t = cycle / 2;
      const scale = Math.sin(t * Math.PI) * size;
      flareRef.current.scale.set(scale, scale, scale);
      flareRef.current.position.y = t * 3;
      (flareRef.current.material as THREE.MeshBasicMaterial).opacity = Math.sin(t * Math.PI) * 0.8;
    } else {
      flareRef.current.scale.set(0, 0, 0);
    }
  });

  return (
    <mesh ref={flareRef} position={[Math.cos(angle) * 5.5, 0, Math.sin(angle) * 5.5]} scale={[0, 0, 0]}>
      <sphereGeometry args={[0.8, 8, 8]} />
      <meshBasicMaterial 
        color="#ffaa00" 
        transparent 
        opacity={0}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
});

SolarFlare.displayName = 'SolarFlare';

const Sun: React.FC<SunProps> = memo(({ onClick }) => {
  const sunRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const coronaRef = useRef<THREE.Mesh>(null);
  const pulseRef = useRef<THREE.Mesh>(null);
  const [isHovered, setIsHovered] = useState(false);

  const sunMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        color1: { value: new THREE.Color('#ffdd00') },
        color2: { value: new THREE.Color('#ff6600') },
        color3: { value: new THREE.Color('#ff2200') }
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vPosition;
        void main() {
          vUv = uv;
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform vec3 color1;
        uniform vec3 color2;
        uniform vec3 color3;
        varying vec2 vUv;
        varying vec3 vPosition;
        
        float noise(vec3 p) {
          return fract(sin(dot(p, vec3(12.9898, 78.233, 45.164))) * 43758.5453);
        }
        
        float smoothNoise(vec3 p) {
          vec3 i = floor(p);
          vec3 f = fract(p);
          f = f * f * (3.0 - 2.0 * f);
          
          float n = mix(
            mix(mix(noise(i), noise(i + vec3(1,0,0)), f.x),
                mix(noise(i + vec3(0,1,0)), noise(i + vec3(1,1,0)), f.x), f.y),
            mix(mix(noise(i + vec3(0,0,1)), noise(i + vec3(1,0,1)), f.x),
                mix(noise(i + vec3(0,1,1)), noise(i + vec3(1,1,1)), f.x), f.y), f.z
          );
          return n;
        }
        
        void main() {
          vec3 pos = vPosition * 0.5;
          float n = smoothNoise(pos + time * 0.5);
          float n2 = smoothNoise(pos * 2.0 - time * 0.3);
          float n3 = smoothNoise(pos * 3.0 + time * 0.2);
          
          vec3 color = mix(color1, color2, n);
          color = mix(color, color3, n2 * 0.5);
          color += vec3(0.2, 0.05, 0.0) * n3;
          
          float brightness = 1.0 + n * 0.3 + sin(time * 1.5) * 0.1;
          gl_FragColor = vec4(color * brightness, 1.0);
        }
      `
    });
  }, []);

  const glowMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        glowColor: { value: new THREE.Color('#ff8800') }
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform vec3 glowColor;
        varying vec3 vNormal;
        varying vec3 vPosition;
        
        void main() {
          float intensity = pow(0.7 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
          
          float pulse = 0.8 + 0.2 * sin(time * 2.0);
          float breathe = 0.9 + 0.1 * sin(time * 0.8);
          float flicker = 0.95 + 0.05 * sin(time * 7.0 + vPosition.x * 3.0);
          
          gl_FragColor = vec4(glowColor, intensity * pulse * breathe * flicker * 0.6);
        }
      `,
      transparent: true,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending
    });
  }, []);

  const coronaMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        coronaColor: { value: new THREE.Color('#ff4400') }
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec2 vUv;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform vec3 coronaColor;
        varying vec3 vNormal;
        varying vec2 vUv;
        
        void main() {
          float intensity = pow(0.5 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.0);
          
          float streamer1 = sin(vUv.y * 20.0 + time * 3.0) * 0.5 + 0.5;
          float streamer2 = sin(vUv.y * 15.0 - time * 2.0) * 0.5 + 0.5;
          float streamers = mix(streamer1, streamer2, 0.5);
          
          float pulse = 0.7 + 0.3 * sin(time * 1.5);
          float burst = max(0.0, sin(time * 0.3) - 0.8) * 5.0;
          
          float alpha = intensity * (0.15 + streamers * 0.1) * pulse + burst * 0.05;
          gl_FragColor = vec4(coronaColor, alpha);
        }
      `,
      transparent: true,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending
    });
  }, []);

  useEffect(() => {
    return () => {
      sunMaterial.dispose();
      glowMaterial.dispose();
      coronaMaterial.dispose();
    };
  }, [sunMaterial, glowMaterial, coronaMaterial]);

  const flareConfigs = useMemo(() => [
    { angle: 0.5, speed: 0.8, size: 1.5, delay: 0 },
    { angle: 1.8, speed: 1.2, size: 1.2, delay: 1.5 },
    { angle: 3.2, speed: 0.6, size: 1.8, delay: 3.0 },
    { angle: 4.5, speed: 1.0, size: 1.3, delay: 0.8 },
    { angle: 5.8, speed: 0.9, size: 1.6, delay: 2.2 },
  ], []);

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    
    if (sunRef.current) {
      sunRef.current.rotation.y += 0.002;
      const pulseScale = 1 + Math.sin(time * 1.5) * 0.02;
      sunRef.current.scale.set(pulseScale, pulseScale, pulseScale);
      sunMaterial.uniforms.time.value = time;
    }
    
    if (glowRef.current) {
      glowMaterial.uniforms.time.value = time;
      const glowPulse = 1.2 + Math.sin(time * 2.0) * 0.05;
      glowRef.current.scale.set(glowPulse, glowPulse, glowPulse);
    }
    
    if (coronaRef.current) {
      coronaRef.current.rotation.y -= 0.001;
      coronaRef.current.rotation.z += 0.0005;
      coronaMaterial.uniforms.time.value = time;
      const coronaPulse = 1.5 + Math.sin(time * 1.5) * 0.1;
      coronaRef.current.scale.set(coronaPulse, coronaPulse, coronaPulse);
    }

    if (pulseRef.current) {
      const pulseScale = 1.3 + Math.sin(time * 0.8) * 0.15;
      pulseRef.current.scale.set(pulseScale, pulseScale, pulseScale);
      (pulseRef.current.material as THREE.MeshBasicMaterial).opacity = 
        0.05 + Math.sin(time * 0.8) * 0.03;
    }
  });

  return (
    <group>
      <mesh 
        ref={sunRef} 
        material={sunMaterial}
        onClick={onClick}
        onPointerOver={() => setIsHovered(true)}
        onPointerOut={() => setIsHovered(false)}
      >
        <sphereGeometry args={[SUN_CONFIG.radius, 64, 64]} />
      </mesh>
      
      <mesh ref={glowRef} material={glowMaterial}>
        <sphereGeometry args={[SUN_CONFIG.radius * 1.2, 32, 32]} />
      </mesh>
      
      <mesh ref={coronaRef} material={coronaMaterial}>
        <sphereGeometry args={[SUN_CONFIG.radius * 1.5, 32, 32]} />
      </mesh>

      <mesh ref={pulseRef}>
        <sphereGeometry args={[SUN_CONFIG.radius * 1.8, 32, 32]} />
        <meshBasicMaterial 
          color="#ff4400" 
          transparent 
          opacity={0.05}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {flareConfigs.map((config, i) => (
        <SolarFlare key={i} {...config} />
      ))}
      
      {isHovered && (
        <Html center position={[0, SUN_CONFIG.radius + 2, 0]}>
          <div className="px-3 py-1.5 rounded-lg bg-black/80 text-white text-sm border border-yellow-500/30 backdrop-blur-sm whitespace-nowrap">
            ☀️ 太阳 · 中心恒星
          </div>
        </Html>
      )}
      
      <pointLight 
        color="#ffdd00" 
        intensity={3} 
        distance={200} 
        decay={0.5}
      />
      <pointLight 
        color="#ff8800" 
        intensity={1.5} 
        distance={150} 
        decay={0.3}
      />
    </group>
  );
});

Sun.displayName = 'Sun';

export default Sun;
