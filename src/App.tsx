import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Music } from 'lucide-react';
import { usePhotoStore } from './store/usePhotoStore';
import { useUiStore } from './store/modules/uiStore';
import { applyThemeToDocument } from './styles/theme';
import { dbService } from './services/database';
import { useMusicPlayer } from './services/musicPlayer';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import type { MusicRecommendation } from './services/musicRecommendation';
import MetaverseBackground from './components/3d/MetaverseBackground';
import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';
import PhotoGrid from './components/photos/PhotoGrid';
import HolographicViewer from './components/photos/HolographicViewer';
import UploadModal from './components/photos/UploadModal';
import SettingsModal from './components/settings/SettingsModal';
import TagsModal from './components/settings/TagsModal';
import MusicPlayer from './components/music/MusicPlayer';
import Toast from './components/ui/Toast';
import OnboardingGuide from './components/ui/OnboardingGuide';
import TimelineView from './components/photos/TimelineView';
import MusicRecommendationPanel from './components/music/MusicRecommendationPanel';

function App() {
  const { 
    selectedPhotoId, 
    setSelectedPhoto, 
    initializeDefaultAlbum,
    getFilteredPhotos 
  } = usePhotoStore();
  const { currentTheme, currentGradient } = useUiStore();
  const { isPlaying, pauseMusic, resumeMusic } = useMusicPlayer();
  const photos = useMemo(() => getFilteredPhotos(), [getFilteredPhotos]);  
  const [showSidebar, setShowSidebar] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showTags, setShowTags] = useState(false);
  const [showViewer, setShowViewer] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(() => {
    return !localStorage.getItem('ranran-onboarding-completed');
  });
  const [showTimeline, setShowTimeline] = useState(false);
  const [showMusicRecommendation, setShowMusicRecommendation] = useState(false);

  const handlePhotoClick = useCallback((photoId: string) => {
    setSelectedPhoto(photoId);
    setShowViewer(true);
  }, [setSelectedPhoto]);

  const handleViewerClose = useCallback(() => {
    setShowViewer(false);
    setSelectedPhoto(null);
  }, [setSelectedPhoto]);

  const handlePrevPhoto = useCallback(() => {
    const currentIndex = photos.findIndex((p) => p.id === selectedPhotoId);
    if (currentIndex > 0) {
      setSelectedPhoto(photos[currentIndex - 1].id);
    } else if (photos.length > 0) {
      setSelectedPhoto(photos[photos.length - 1].id);
    }
  }, [photos, selectedPhotoId, setSelectedPhoto]);

  const handleNextPhoto = useCallback(() => {
    const currentIndex = photos.findIndex((p) => p.id === selectedPhotoId);
    if (currentIndex < photos.length - 1) {
      setSelectedPhoto(photos[currentIndex + 1].id);
    } else if (photos.length > 0) {
      setSelectedPhoto(photos[0].id);
    }
  }, [photos, selectedPhotoId, setSelectedPhoto]);

  const handleToggleMusic = useCallback(() => {
    if (isPlaying) {
      pauseMusic();
    } else {
      resumeMusic();
    }
  }, [isPlaying, pauseMusic, resumeMusic]);

  const handleCloseTopModal = useCallback(() => {
    if (showOnboarding) {
      setShowOnboarding(false);
      localStorage.setItem('ranran-onboarding-completed', 'true');
    } else if (showViewer) {
      handleViewerClose();
    } else if (showUpload) {
      setShowUpload(false);
    } else if (showSettings) {
      setShowSettings(false);
    } else if (showTags) {
      setShowTags(false);
    } else if (showSidebar) {
      setShowSidebar(false);
    }
  }, [showOnboarding, showViewer, showUpload, showSettings, showTags, showSidebar, handleViewerClose]);

  useKeyboardShortcuts({
    onEscape: handleCloseTopModal,
    onPrevPhoto: showViewer ? handlePrevPhoto : undefined,
    onNextPhoto: showViewer ? handleNextPhoto : undefined,
    onToggleMusic: handleToggleMusic,
    onUpload: () => setShowUpload(true),
    onSettings: () => setShowSettings(true),
    isViewerOpen: showViewer,
  });

  useEffect(() => {
    applyThemeToDocument(currentTheme, currentGradient);
  }, [currentTheme, currentGradient]);

  useEffect(() => {
    const initDB = async () => {
      try {
        // 清理旧的 LocalStorage 存储，防止数据冲突
        const legacyData = localStorage.getItem('ranran-photo-storage');
        if (legacyData) {
          console.log('Cleaning up legacy LocalStorage data...');
          // 仅在初始加载且确定有旧数据时清理一次
          localStorage.removeItem('ranran-photo-storage');
          // 只有清理后才考虑是否需要强制刷新来应用新状态
          // window.location.reload(); 
        }

        await dbService.init();
        console.log('Database initialized successfully');
      } catch (error) {
        console.error('Failed to initialize database:', error);
      }
    };

    initDB();
  }, []); // 仅在挂载时运行一次

  useEffect(() => {
    initializeDefaultAlbum();
  }, [initializeDefaultAlbum]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-dark-bg">
      <MetaverseBackground />
      
      <div className="relative z-10 w-full h-full flex flex-col">
        <Navbar
          onOpenSettings={() => setShowSettings(true)}
          onOpenUpload={() => setShowUpload(true)}
          onOpenAlbums={() => setShowSidebar(true)}
          onOpenTags={() => setShowTags(true)}
        />
        
        <main className="flex-1 pt-16 overflow-hidden">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="h-full"
          >
            <PhotoGrid onPhotoClick={handlePhotoClick} />
          </motion.div>
        </main>
      </div>

      <Sidebar isOpen={showSidebar} onClose={() => setShowSidebar(false)} />
      
      <UploadModal isOpen={showUpload} onClose={() => setShowUpload(false)} />
      
      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
      
      <TagsModal isOpen={showTags} onClose={() => setShowTags(false)} />
      
      <HolographicViewer
        isOpen={showViewer}
        photoId={selectedPhotoId}
        onClose={handleViewerClose}
        onPrev={handlePrevPhoto}
        onNext={handleNextPhoto}
      />

      <MusicPlayer />
      
      <MusicRecommendationPanel
        photos={photos}
        isOpen={showMusicRecommendation}
        onClose={() => setShowMusicRecommendation(false)}
        onPlayMusic={(rec: MusicRecommendation) => {
          console.log('Playing recommended music:', rec);
        }}
      />

      <TimelineView
        photos={photos}
        onPhotoClick={handlePhotoClick}
        isDark={currentTheme.backgroundColor === '#050000' || currentTheme.backgroundColor === '#0a0a0f'}
        isOpen={showTimeline}
        onClose={() => setShowTimeline(false)}
      />

      <Toast />

      {showOnboarding && (
        <OnboardingGuide
          onComplete={() => {
            setShowOnboarding(false);
            localStorage.setItem('ranran-onboarding-completed', 'true');
          }}
        />
      )}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="fixed right-4 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-2"
      >
        <button
          className="p-3 cyber-glass rounded-full border border-cyber-blue/20 hover:border-cyber-blue/50 transition-colors hover:scale-110"
          onClick={() => setShowMusicRecommendation(true)}
          title="情绪音乐推荐"
        >
          <Music size={18} className="text-cyan-400" />
        </button>
        <button
          className="p-3 cyber-glass rounded-full border border-cyber-blue/20 hover:border-cyber-blue/50 transition-colors hover:scale-110"
          onClick={() => setShowTimeline(true)}
          title="时间轴"
        >
          <Calendar size={18} className="text-cyan-400" />
        </button>
        <button
          className="p-3 cyber-glass rounded-full border border-cyber-blue/20 hover:border-cyber-blue/50 transition-colors hover:scale-110"
          onClick={() => setShowSidebar(true)}
          title="侧边栏"
        >
          <div className="w-3 h-3 rounded-full bg-cyber-blue animate-pulse" />
        </button>
      </motion.div>
    </div>
  );
}

export default App;
