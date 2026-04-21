export interface Photo {
  id: string;
  url: string;
  thumbnail?: string;
  name: string;
  description?: string;
  tags: string[];
  albumId: string;
  createdAt: number;
  width?: number;
  height?: number;
  type?: 'image' | 'video';
  duration?: number; // For video
}

export interface Album {
  id: string;
  name: string;
  description?: string;
  coverPhotoId?: string;
  createdAt: number;
  photoCount: number;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  count: number;
}

export interface Theme {
  id: string;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  particleColor: string;
  backgroundColor: string;
}

export interface AppSettings {
  theme: Theme;
  backgroundMusic: boolean;
  musicVolume: number;
  particleIntensity: number;
  showGrid: boolean;
  autoRotate: boolean;
  transitionEffect: 'fade' | 'slide' | 'zoom' | 'flip';
}

export const defaultThemes: Theme[] = [
  {
    id: 'cyber-blue',
    name: '赛博蓝',
    primaryColor: '#00f5ff',
    secondaryColor: '#b829dd',
    particleColor: '#00f5ff',
    backgroundColor: '#0a0a0f',
  },
  {
    id: 'neon-pink',
    name: '霓虹粉',
    primaryColor: '#ff2d75',
    secondaryColor: '#ff6b9d',
    particleColor: '#ff2d75',
    backgroundColor: '#0f0a10',
  },
  {
    id: 'matrix-green',
    name: '矩阵绿',
    primaryColor: '#39ff14',
    secondaryColor: '#00ff88',
    particleColor: '#39ff14',
    backgroundColor: '#0a0f0a',
  },
  {
    id: 'sunset-orange',
    name: '落日橙',
    primaryColor: '#ff6b35',
    secondaryColor: '#f7931e',
    particleColor: '#ff6b35',
    backgroundColor: '#0f0a05',
  },
  {
    id: 'galaxy-purple',
    name: '星河紫',
    primaryColor: '#b829dd',
    secondaryColor: '#8b5cf6',
    particleColor: '#b829dd',
    backgroundColor: '#0a0510',
  },
  {
    id: 'dark-abyss',
    name: '暗黑深渊',
    primaryColor: '#cc1a1a',
    secondaryColor: '#4a0000',
    particleColor: '#ff3333',
    backgroundColor: '#050000',
  },
];

export const defaultSettings: AppSettings = {
  theme: defaultThemes[0],
  backgroundMusic: false,
  musicVolume: 0.5,
  particleIntensity: 1,
  showGrid: true,
  autoRotate: true,
  transitionEffect: 'fade',
};
