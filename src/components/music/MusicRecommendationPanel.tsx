import { useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Music, Sparkles, X } from 'lucide-react';
import { recommendMusicForPhotos, type MusicRecommendation } from '../../services/musicRecommendation';
import type { Photo } from '../../types';

interface MusicRecommendationPanelProps {
  photos: Photo[];
  onPlayMusic?: (recommendation: MusicRecommendation) => void;
  isOpen: boolean;
  onClose: () => void;
}

function MusicRecommendationPanel({ photos, onPlayMusic, isOpen, onClose }: MusicRecommendationPanelProps) {
  const recommendations = useMemo(() => {
    return recommendMusicForPhotos(photos);
  }, [photos]);

  const handleRecommendationClick = useCallback((rec: MusicRecommendation) => {
    onPlayMusic?.(rec);
  }, [onPlayMusic]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="w-full max-w-2xl mx-4 bg-dark-card/90 border border-cyber-blue/30 rounded-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <Music className="w-6 h-6 text-cyber-blue" />
                <h2 className="text-xl font-cyber text-cyber-blue">情绪音乐推荐</h2>
                <Sparkles className="w-4 h-4 text-cyber-purple" />
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-white/10 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              {recommendations.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Music className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>上传照片以获取个性化音乐推荐</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-gray-400 mb-4">
                    根据照片的时间、标签和情绪，为你推荐以下音乐：
                  </p>
                  
                  <div className="grid gap-3">
                    {recommendations.map((rec, index) => (
                      <motion.button
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        onClick={() => handleRecommendationClick(rec)}
                        className="flex items-start gap-4 p-4 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyber-blue/30 transition-all text-left"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-br from-cyber-blue/20 to-cyber-purple/20 flex items-center justify-center">
                          <Music className="w-6 h-6 text-cyber-blue" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-white truncate">{rec.title}</h3>
                          <p className="text-sm text-gray-400">{rec.artist}</p>
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{rec.description}</p>
                        </div>

                        <div className="flex-shrink-0 flex flex-wrap gap-1">
                          {rec.tags.slice(0, 2).map((tag, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 text-xs rounded-full bg-cyber-blue/10 text-cyber-blue/80"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default MusicRecommendationPanel;
