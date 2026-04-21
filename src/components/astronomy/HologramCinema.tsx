import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, SkipBack, SkipForward } from 'lucide-react';

interface HologramCinemaProps {
  isOpen: boolean;
  onClose: () => void;
  videoSrc?: string;
  videoList?: string[]; // 支持视频列表
}

const HologramFrame: React.FC<{ children: React.ReactNode }> = memo(({ children }) => (
  <div className="relative">
    <motion.div
      className="absolute -inset-4 rounded-xl"
      style={{
        background: 'radial-gradient(ellipse at center, rgba(0,255,255,0.15) 0%, rgba(138,43,226,0.1) 50%, transparent 70%)',
        filter: 'blur(20px)'
      }}
      animate={{
        opacity: [0.4, 0.7, 0.4],
        scale: [1, 1.02, 1]
      }}
      transition={{
        duration: 3,
        repeat: Infinity,
        ease: 'easeInOut'
      }}
    />
    
    <div className="absolute -inset-2 rounded-lg overflow-hidden">
      <motion.div
        className="absolute inset-0"
        style={{
          border: '2px solid transparent',
          borderImage: 'linear-gradient(135deg, #00ffff, #8a2be2, #00ffff) 1',
        }}
        animate={{
          opacity: [0.6, 1, 0.6]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
      />
    </div>

    <motion.div
      className="absolute -inset-1 rounded-lg"
      style={{
        boxShadow: `
          0 0 20px rgba(0,255,255,0.3),
          0 0 40px rgba(0,255,255,0.2),
          0 0 60px rgba(138,43,226,0.15),
          inset 0 0 20px rgba(0,255,255,0.1)
        `
      }}
      animate={{
        boxShadow: [
          '0 0 20px rgba(0,255,255,0.3), 0 0 40px rgba(0,255,255,0.2), 0 0 60px rgba(138,43,226,0.15), inset 0 0 20px rgba(0,255,255,0.1)',
          '0 0 30px rgba(0,255,255,0.4), 0 0 60px rgba(0,255,255,0.3), 0 0 90px rgba(138,43,226,0.2), inset 0 0 30px rgba(0,255,255,0.15)',
          '0 0 20px rgba(0,255,255,0.3), 0 0 40px rgba(0,255,255,0.2), 0 0 60px rgba(138,43,226,0.15), inset 0 0 20px rgba(0,255,255,0.1)'
        ]
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut'
      }}
    />
    
    <div className="relative z-10">
      {children}
    </div>

    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute left-0 right-0 h-px"
          style={{ 
            top: `${i * 5}%`,
            background: `linear-gradient(90deg, transparent 0%, rgba(0,255,255,${0.05 + (i % 3) * 0.03}) 50%, transparent 100%)`
          }}
          animate={{
            x: ['-100%', '100%'],
          }}
          transition={{
            duration: 10 + i * 0.5,
            repeat: Infinity,
            ease: 'linear'
          }}
        />
      ))}
    </div>
  </div>
));

HologramFrame.displayName = 'HologramFrame';

const ScanLine: React.FC = memo(() => (
  <motion.div
    className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent pointer-events-none z-20"
    animate={{ top: ['0%', '100%'] }}
    transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
  />
));

ScanLine.displayName = 'ScanLine';

const HologramCinema: React.FC<HologramCinemaProps> = ({ isOpen, onClose, videoSrc, videoList }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);

  const defaultVideo = 'https://www.w3schools.com/html/mov_bbb.mp4';
  
  // 使用 useMemo 缓存播放列表
  const playlist = React.useMemo(() => {
    if (videoList && videoList.length > 0) {
      return videoList;
    }
    return videoSrc ? [videoSrc] : [defaultVideo];
  }, [videoList, videoSrc]);
  
  const currentVideoSrc = playlist[currentVideoIndex] || playlist[0];
  
  // 切换到下一个视频
  const playNextVideo = useCallback(() => {
    setCurrentVideoIndex(prev => {
      const nextIndex = (prev + 1) % playlist.length;
      console.log('HologramCinema: Switching to video', nextIndex + 1, 'of', playlist.length);
      return nextIndex;
    });
  }, [playlist.length]);

  // 切换到上一个视频
  const playPrevVideo = useCallback(() => {
    setCurrentVideoIndex(prev => {
      const prevIndex = (prev - 1 + playlist.length) % playlist.length;
      console.log('HologramCinema: Switching to video', prevIndex + 1, 'of', playlist.length);
      return prevIndex;
    });
  }, [playlist.length]);

  // 视频事件处理器
  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    if (videoRef.current) {
      console.log('HologramCinema: loadedmetadata, duration:', videoRef.current.duration);
      setDuration(videoRef.current.duration);
    }
  }, []);

  const handleDurationChange = useCallback(() => {
    if (videoRef.current && videoRef.current.duration && !isNaN(videoRef.current.duration) && isFinite(videoRef.current.duration)) {
      console.log('HologramCinema: durationchange, duration:', videoRef.current.duration);
      setDuration(videoRef.current.duration);
    }
  }, []);

  const handleCanPlay = useCallback(() => {
    if (videoRef.current && videoRef.current.duration && !isNaN(videoRef.current.duration) && isFinite(videoRef.current.duration)) {
      console.log('HologramCinema: canplay, duration:', videoRef.current.duration);
      setDuration(videoRef.current.duration);
    }
  }, []);

  const handleEnded = useCallback(() => {
    console.log('HologramCinema: Video ended, playing next...');
    playNextVideo();
  }, [playNextVideo]);

  // 当视频源变化时重置状态并播放
  useEffect(() => {
    if (isOpen && videoRef.current) {
      console.log('HologramCinema: Video source changed, resetting...');
      setCurrentTime(0);
      setDuration(0);
      videoRef.current.currentTime = 0;
      videoRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(() => {
        setIsPlaying(false);
      });
    }
  }, [isOpen, currentVideoSrc]);

  // 当打开时重置索引
  useEffect(() => {
    if (isOpen) {
      setCurrentVideoIndex(0);
    }
  }, [isOpen]);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    
    const newTime = parseFloat(e.target.value);
    video.currentTime = newTime;
    setCurrentTime(newTime);
  }, []);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    
    const newVolume = parseFloat(e.target.value);
    video.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  }, []);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isMuted) {
      video.volume = volume || 1;
      setIsMuted(false);
    } else {
      video.volume = 0;
      setIsMuted(true);
    }
  }, [isMuted, volume]);

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;

    if (!isFullscreen) {
      containerRef.current.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen]);

  const skipTime = useCallback((seconds: number) => {
    const video = videoRef.current;
    if (!video) return;
    
    video.currentTime = Math.max(0, Math.min(duration, video.currentTime + seconds));
  }, [duration]);

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleMouseMove = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  }, [isPlaying]);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={containerRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(0,20,40,0.95) 0%, rgba(0,0,0,0.98) 100%)'
          }}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => isPlaying && setShowControls(false)}
        >
          <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
            {[...Array(50)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  background: Math.random() > 0.5 ? '#00ffff' : '#8a2be2',
                  boxShadow: `0 0 6px ${Math.random() > 0.5 ? '#00ffff' : '#8a2be2'}`
                }}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0]
                }}
                transition={{
                  duration: 2 + Math.random() * 2,
                  repeat: Infinity,
                  delay: Math.random() * 2
                }}
              />
            ))}
          </div>

          <motion.div
            initial={{ scale: 0.8, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, y: 50 }}
            transition={{ type: 'spring', damping: 20 }}
            className="relative w-full max-w-7xl mx-4"
          >
            <HologramFrame>
              <div className="relative bg-black/90 rounded-lg overflow-hidden">
                <ScanLine />
                
                <div className="relative aspect-video">
                  <video
                    key={currentVideoSrc}
                    ref={videoRef}
                    src={currentVideoSrc}
                    className="w-full h-full object-contain"
                    style={{
                      filter: 'drop-shadow(0 0 10px rgba(0,255,255,0.2))'
                    }}
                    onClick={togglePlay}
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleLoadedMetadata}
                    onDurationChange={handleDurationChange}
                    onCanPlay={handleCanPlay}
                    onEnded={handleEnded}
                  />

                  {!isPlaying && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="absolute inset-0 flex items-center justify-center bg-black/30"
                    >
                      <motion.button
                        onClick={togglePlay}
                        className="w-20 h-20 rounded-full bg-cyan-400/20 border-2 border-cyan-400 flex items-center justify-center"
                        style={{
                          boxShadow: '0 0 30px rgba(0,255,255,0.5), inset 0 0 20px rgba(0,255,255,0.2)'
                        }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Play size={40} className="text-cyan-400 ml-1" />
                      </motion.button>
                    </motion.div>
                  )}
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: showControls ? 1 : 0, y: showControls ? 0 : 20 }}
                  transition={{ duration: 0.3 }}
                  className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 via-black/60 to-transparent"
                >
                  <div className="mb-3">
                    <div className="relative h-1 bg-white/20 rounded-full overflow-hidden">
                      <motion.div
                        className="absolute left-0 top-0 h-full bg-gradient-to-r from-cyan-400 to-purple-400"
                        style={{ width: `${progress}%` }}
                      />
                      <input
                        type="range"
                        min={0}
                        max={duration || 100}
                        value={currentTime}
                        onChange={handleSeek}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                    </div>
                    <div className="flex justify-between mt-1 text-xs text-cyan-400/80 font-mono">
                      <span>{formatTime(currentTime)}</span>
                      <span>{formatTime(duration)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <motion.button
                        onClick={playPrevVideo}
                        className="p-2 rounded-lg bg-white/10 text-cyan-400 hover:bg-white/20 transition-colors"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <SkipBack size={18} />
                      </motion.button>
                      
                      <motion.button
                        onClick={togglePlay}
                        className="p-3 rounded-full bg-cyan-400/20 border border-cyan-400/50 text-cyan-400 hover:bg-cyan-400/30 transition-colors"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
                      </motion.button>
                      
                      <motion.button
                        onClick={playNextVideo}
                        className="p-2 rounded-lg bg-white/10 text-cyan-400 hover:bg-white/20 transition-colors"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <SkipForward size={18} />
                      </motion.button>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <motion.button
                          onClick={toggleMute}
                          className="p-2 rounded-lg bg-white/10 text-cyan-400 hover:bg-white/20 transition-colors"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                        </motion.button>
                        <input
                          type="range"
                          min={0}
                          max={1}
                          step={0.1}
                          value={isMuted ? 0 : volume}
                          onChange={handleVolumeChange}
                          className="w-20 h-1 bg-white/20 rounded-full appearance-none cursor-pointer
                            [&::-webkit-slider-thumb]:appearance-none
                            [&::-webkit-slider-thumb]:w-3
                            [&::-webkit-slider-thumb]:h-3
                            [&::-webkit-slider-thumb]:rounded-full
                            [&::-webkit-slider-thumb]:bg-cyan-400
                            [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(0,255,255,0.5)]"
                        />
                      </div>

                      <motion.button
                        onClick={toggleFullscreen}
                        className="p-2 rounded-lg bg-white/10 text-cyan-400 hover:bg-white/20 transition-colors"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              </div>
            </HologramFrame>

            <motion.div
              className="absolute -bottom-16 left-0 right-0 text-center"
              animate={{ opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-cyan-400/10 border border-cyan-400/30 rounded-full text-cyan-400 text-xs font-mono backdrop-blur-sm">
                <motion.div
                  className="w-1.5 h-1.5 rounded-full bg-cyan-400"
                  animate={{ scale: [1, 1.5, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
                HOLOGRAM CINEMA
                <motion.div
                  className="w-1.5 h-1.5 rounded-full bg-cyan-400"
                  animate={{ scale: [1, 1.5, 1] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0.5 }}
                />
              </div>
            </motion.div>
          </motion.div>

          <motion.button
            onClick={onClose}
            className="absolute top-4 right-4 p-3 rounded-full bg-cyan-400/10 border border-cyan-400/30 text-cyan-400 hover:bg-cyan-400/20 transition-colors backdrop-blur-sm"
            whileHover={{ scale: 1.1, boxShadow: '0 0 20px rgba(0,255,255,0.3)' }}
            whileTap={{ scale: 0.9 }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </motion.button>

          <div className="absolute top-4 left-4 flex items-center gap-2">
            <motion.div
              className="w-2 h-2 rounded-full bg-green-400"
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
            <span className="text-cyan-400/80 font-mono text-sm">HOLOGRAM CINEMA</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default HologramCinema;
