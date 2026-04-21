export type PerformanceTier = 'high' | 'medium' | 'low';

export interface PerformanceConfig {
  tier: PerformanceTier;
  enableBloom: boolean;
  enableVignette: boolean;
  enableParticles: boolean;
  particleCount: number;
  maxDpr: number;
  enablePostProcessing: boolean;
  galaxyParticleMultiplier: number;
  enablePlanetRings: boolean;
  enableAsteroids: boolean;
  enableNebula: boolean;
  starCount: number;
}

const PERFORMANCE_PRESETS: Record<PerformanceTier, PerformanceConfig> = {
  high: {
    tier: 'high',
    enableBloom: true,
    enableVignette: true,
    enableParticles: true,
    particleCount: 2000,
    maxDpr: 2,
    enablePostProcessing: true,
    galaxyParticleMultiplier: 1.0,
    enablePlanetRings: true,
    enableAsteroids: true,
    enableNebula: true,
    starCount: 15000,
  },
  medium: {
    tier: 'medium',
    enableBloom: true,
    enableVignette: true,
    enableParticles: true,
    particleCount: 1000,
    maxDpr: 1.5,
    enablePostProcessing: true,
    galaxyParticleMultiplier: 0.6,
    enablePlanetRings: true,
    enableAsteroids: false,
    enableNebula: false,
    starCount: 8000,
  },
  low: {
    tier: 'low',
    enableBloom: false,
    enableVignette: false,
    enableParticles: true,
    particleCount: 500,
    maxDpr: 1,
    enablePostProcessing: false,
    galaxyParticleMultiplier: 0.3,
    enablePlanetRings: false,
    enableAsteroids: false,
    enableNebula: false,
    starCount: 3000,
  },
};

function detectGPUTier(): PerformanceTier {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    
    if (!gl) return 'low';
    
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    const renderer = debugInfo 
      ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL).toLowerCase() 
      : '';
    
    const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
    const maxRenderbufferSize = gl.getParameter(gl.MAX_RENDERBUFFER_SIZE);
    
    canvas.remove();
    
    if (maxTextureSize < 4096 || maxRenderbufferSize < 4096) {
      return 'low';
    }
    
    const lowEndPatterns = [
      'mali-4', 'mali-t6', 'adreno 3', 'adreno 4', 'adreno 5',
      'powervr sgx', 'intel hd graphics', 'intel uhd graphics 6',
      'apple gpu', 'swiftshader', 'llvmpipe',
    ];
    
    const highEndPatterns = [
      'nvidia', 'geforce rtx', 'geforce gtx 10', 'geforce gtx 16',
      'geforce gtx 20', 'radeon rx', 'radeon pro', 'apple m1',
      'apple m2', 'apple m3', 'apple m4', 'apple gpu',
      'adreno 7', 'adreno 8', 'mali-g7', 'mali-g610',
    ];
    
    for (const pattern of highEndPatterns) {
      if (renderer.includes(pattern)) return 'high';
    }
    
    for (const pattern of lowEndPatterns) {
      if (renderer.includes(pattern)) return 'low';
    }
    
    if (maxTextureSize >= 8192) return 'high';
    if (maxTextureSize >= 4096) return 'medium';
    
    return 'medium';
  } catch {
    return 'medium';
  }
}

let cachedConfig: PerformanceConfig | null = null;

export function getPerformanceConfig(forceTier?: PerformanceTier): PerformanceConfig {
  if (cachedConfig && !forceTier) return cachedConfig;
  
  const tier = forceTier || detectGPUTier();
  cachedConfig = { ...PERFORMANCE_PRESETS[tier] };
  
  return cachedConfig;
}

export function clearPerformanceCache(): void {
  cachedConfig = null;
}

export { detectGPUTier };
