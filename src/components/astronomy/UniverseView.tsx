import { useState, useEffect, useCallback, Suspense } from 'react';
import { motion } from 'framer-motion';
import { Canvas } from '@react-three/fiber';
import localforage from 'localforage';
import type { Photo } from '../../types';
import { dbService } from '../../services/database';
import { videoManager } from '../../services/videoElementManager';
import { getPerformanceConfig } from '../../utils/performance';
import { CONSTELLATIONS, type ConstellationKey } from './constants';
import UniverseIntro from './UniverseIntro';
import HologramCinema from './HologramCinema';
import VideoManager from './VideoManager';
import Scene, { type ViewMode } from './Scene';
import ConstellationSelector from './ConstellationSelector';

interface UniverseViewProps {
  photos: Photo[];
  onPhotoClick?: (photoId: string) => void;
}

const UniverseView: React.FC<UniverseViewProps> = ({ photos, onPhotoClick }) => {
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(true);
  const [selectedConstellation, setSelectedConstellation] = useState<ConstellationKey | null>(null);
  const [constellationPhotos, setConstellationPhotos] = useState<Record<ConstellationKey, Photo | null>>({} as Record<ConstellationKey, Photo | null>);
  const [showIntro, setShowIntro] = useState(true);
  const [isUniverseReady, setIsUniverseReady] = useState(false);
  const [showCinema, setShowCinema] = useState(false);
  const [showVideoManager, setShowVideoManager] = useState(false);
  const [currentVideoUrl, setCurrentVideoUrl] = useState<string | null>(null);
  const [videoList, setVideoList] = useState<string[]>([]);
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('solar');

  useEffect(() => {
    const video = videoManager.createVideo('https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4');
    
    const handlePlaying = () => setVideoElement(video);
    const handleLoadedMetadata = () => {
      video.play().catch(() => {});
    };
    
    videoManager.addListener('playing', handlePlaying);
    videoManager.addListener('loadedmetadata', handleLoadedMetadata);
    
    video.play().then(() => {
      setVideoElement(video);
    }).catch(() => {
      setVideoElement(video);
    });
    
    return () => {
      videoManager.removeListener('playing');
      videoManager.removeListener('loadedmetadata');
      videoManager.destroyVideo();
    };
  }, []);

  useEffect(() => {
    const loadSavedVideos = async () => {
      try {
        const videos = await dbService.getAllCinemaVideos();
        
        if (videos.length > 0) {
          const sortedVideos = videos.sort((a, b) => b.createdAt - a.createdAt);
          const urls = sortedVideos.map(v => URL.createObjectURL(v.data));
          
          setVideoList(urls);
          setCurrentVideoUrl(urls[0]);
          
          const existingVideo = videoManager.getVideo();
          if (existingVideo) {
            videoManager.updateSrc(urls[0]);
            existingVideo.play().then(() => {
              setVideoElement(existingVideo);
            }).catch(() => {});
          }
        }
      } catch (error) {
        console.error('Failed to load saved videos:', error);
      }
    };
    loadSavedVideos();
  }, []);

  useEffect(() => {
    const loadCachedBackgrounds = async () => {
      try {
        const cachedBackgrounds = await dbService.getAllConstellationBackgrounds();
        const loadedPhotos: Record<ConstellationKey, Photo | null> = {} as Record<ConstellationKey, Photo | null>;
        
        for (const bg of cachedBackgrounds) {
          const matchingPhoto = photos.find(p => p.id === bg.photoId);
          if (matchingPhoto) {
            loadedPhotos[bg.constellationKey as ConstellationKey] = matchingPhoto;
          } else {
            const url = URL.createObjectURL(bg.photoData);
            const virtualPhoto: Photo = {
              id: bg.photoId,
              url: url,
              thumbnail: bg.thumbnail,
              name: `Cached Background`,
              tags: [],
              albumId: '',
              createdAt: bg.createdAt
            };
            loadedPhotos[bg.constellationKey as ConstellationKey] = virtualPhoto;
          }
        }
        
        setConstellationPhotos(prev => ({ ...prev, ...loadedPhotos }));
      } catch (error) {
        console.error('Failed to load cached backgrounds:', error);
      }
    };
    
    if (photos.length >= 0) {
      loadCachedBackgrounds();
    }
  }, [photos]);

  const handlePhotoSelect = useCallback((id: string) => {
    setSelectedPhotoId(id);
    if (onPhotoClick) {
      onPhotoClick(id);
    }
  }, [onPhotoClick]);

  const toggleTheme = useCallback(() => {
    setIsDark(prev => !prev);
  }, []);

  const handleConstellationSelect = useCallback((key: ConstellationKey | null) => {
    setSelectedConstellation(key);
  }, []);

  const handleConstellationPhotoSelect = useCallback(async (constellationKey: ConstellationKey, photo: Photo | null) => {
    setConstellationPhotos(prev => ({
      ...prev,
      [constellationKey]: photo
    }));
    
    if (photo) {
      try {
        let photoBlob: Blob;
        
        if (photo.url && photo.url.startsWith('data:')) {
          const response = await fetch(photo.url);
          photoBlob = await response.blob();
        } else if (photo.url && photo.url.startsWith('blob:')) {
          const response = await fetch(photo.url);
          photoBlob = await response.blob();
        } else {
          const storedUrl = await localforage.getItem<string>(photo.id);
          if (storedUrl) {
            const response = await fetch(storedUrl);
            photoBlob = await response.blob();
          } else {
            return;
          }
        }
        
        await dbService.saveConstellationBackground(
          constellationKey,
          photo.id,
          photoBlob,
          photo.thumbnail
        );
      } catch (error) {
        console.error('Failed to save constellation background:', error);
      }
    } else {
      try {
        await dbService.deleteConstellationBackground(constellationKey);
      } catch (error) {
        console.error('Failed to delete constellation background:', error);
      }
    }
  }, []);

  const handleIntroComplete = useCallback(() => {
    setShowIntro(false);
    
    setTimeout(() => {
      if (videoElement) {
        videoElement.play().catch(console.error);
      }
      setIsUniverseReady(true);
    }, 100);
  }, [videoElement]);

  return (
    <div className="w-full h-full relative">
      {showIntro && (
        <UniverseIntro onComplete={handleIntroComplete} />
      )}
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isUniverseReady ? 1 : 0 }}
        transition={{ duration: 1 }}
        className="w-full h-full"
      >
        <Canvas
        camera={{ fov: 60, near: 0.1, far: 1000 }}
        dpr={[1, getPerformanceConfig().maxDpr]}
        gl={{ 
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance'
        }}
      >
        <Suspense fallback={null}>
          <Scene 
            photos={photos}
            selectedPhotoId={selectedPhotoId}
            onPhotoSelect={handlePhotoSelect}
            isDark={isDark}
            selectedConstellation={selectedConstellation}
            constellationPhotos={constellationPhotos}
            onOpenCinema={() => setShowCinema(true)}
            isUniverseReady={isUniverseReady}
            videoUrl={currentVideoUrl}
            videoElement={videoElement}
            videoList={videoList}
            viewMode={viewMode}
          />
        </Suspense>
      </Canvas>

      <div className="absolute top-4 left-4 z-50 flex items-center gap-2">
        <button
          onClick={toggleTheme}
          className={`
            px-3 py-1.5 rounded-lg text-sm font-medium transition-all
            ${isDark 
              ? 'bg-white/10 hover:bg-white/20 text-white border border-white/20' 
              : 'bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-200'}
            backdrop-blur-sm
          `}
        >
          {isDark ? '🌙 深色' : '☀️ 浅色'}
        </button>
        <button
          onClick={() => setViewMode(prev => prev === 'solar' ? 'spiral' : 'solar')}
          className={`
            px-3 py-1.5 rounded-lg text-sm font-medium transition-all
            ${isDark 
              ? 'bg-white/10 hover:bg-white/20 text-white border border-white/20' 
              : 'bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-200'}
            backdrop-blur-sm
          `}
        >
          {viewMode === 'solar' ? '🌀 螺旋臂' : '☀️ 太阳系'}
        </button>
      </div>

      <ConstellationSelector
        selectedConstellation={selectedConstellation}
        onSelect={handleConstellationSelect}
        isDark={isDark}
        photos={photos}
        constellationPhotos={constellationPhotos}
        onSelectPhoto={handleConstellationPhotoSelect}
      />

      <HologramCinema
        isOpen={showCinema}
        onClose={() => setShowCinema(false)}
        videoSrc={currentVideoUrl || undefined}
        videoList={videoList}
      />

      <VideoManager
        isOpen={showVideoManager}
        onClose={() => setShowVideoManager(false)}
        onSelectVideo={(url) => {
          setCurrentVideoUrl(url);
          
          const existingVideo = videoManager.getVideo();
          if (existingVideo) {
            videoManager.updateSrc(url);
            existingVideo.play().then(() => {
              setVideoElement(existingVideo);
            }).catch(() => {
              setVideoElement(existingVideo);
            });
          }
        }}
        onSelectMultipleVideos={(urls) => {
          setVideoList(urls);
          if (urls.length > 0) {
            setCurrentVideoUrl(urls[0]);
          }
        }}
      />

      <div className="absolute top-4 right-16 z-50 flex items-center gap-2">
        <button
          onClick={() => setShowVideoManager(true)}
          className={`
            px-3 py-1.5 rounded-lg text-sm font-medium transition-all
            ${isDark 
              ? 'bg-white/10 hover:bg-white/20 text-white border border-white/20' 
              : 'bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-200'}
            backdrop-blur-sm
          `}
        >
          🎬 视频管理
        </button>
      </div>

      <div className="absolute bottom-4 left-4 z-50">
        <div className={`
          px-3 py-1.5 rounded-lg text-xs
          ${isDark ? 'bg-black/60 text-gray-300' : 'bg-white/80 text-gray-600'}
          backdrop-blur-sm
        `}>
          🌌 宇宙视图 · {photos.length} 颗行星 · {Object.keys(CONSTELLATIONS).length} 个星座
        </div>
      </div>

      <div className="absolute bottom-4 right-4 z-50">
        <div className={`
          px-3 py-1.5 rounded-lg text-xs
          ${isDark ? 'bg-black/60 text-gray-400' : 'bg-white/80 text-gray-500'}
          backdrop-blur-sm
        `}>
          🖱️ 拖拽旋转 | 滚轮缩放 | 点击行星查看
        </div>
      </div>


      </motion.div>
    </div>
  );
};

export default UniverseView;
