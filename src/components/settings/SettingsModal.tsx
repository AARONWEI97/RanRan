import { motion } from 'framer-motion';
import { useUiStore } from '../../store/modules/uiStore';
import { usePhotoStore } from '../../store/usePhotoStore';
import { defaultThemes } from '../../types';
import { Volume2, VolumeX, Grid3X3, RotateCw, Sparkles, Download, Upload, Palette } from 'lucide-react';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import { exportAllData, downloadAsJson, readJsonFile, importData } from '../../services/dataExport';
import { useRef } from 'react';
import GradientSelector from './GradientSelector';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { settings, updateSettings, showSuccess, showError, currentGradient, setGradient } = useUiStore();
  const { photos, albums, tags } = usePhotoStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    try {
      const data = await exportAllData();
      data.photos = photos.map(p => ({
        id: p.id,
        name: p.name,
        tags: p.tags,
        albumId: p.albumId,
        description: p.description,
        type: p.type,
        createdAt: p.createdAt,
        thumbnail: p.thumbnail,
      }));
      data.albums = albums;
      data.tags = tags;
      downloadAsJson(data);
      showSuccess('数据导出成功！');
    } catch {
      showError('导出失败，请重试');
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      const data = await readJsonFile(file);
      const result = await importData(data);
      showSuccess(`导入成功：${result.importedPhotos} 张照片，${result.importedBlobs} 个文件`);
    } catch (err) {
      showError((err as Error).message || '导入失败');
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="设置" size="lg">
      <div className="space-y-8">
        <div className="space-y-4">
          <h3 className="text-lg font-cyber text-white flex items-center gap-2">
            <Sparkles size={20} className="text-cyber-blue" />
            主题风格
          </h3>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {defaultThemes.map((theme) => (
              <motion.button
                key={theme.id}
                className={`
                  relative p-4 rounded-xl border-2 transition-all duration-300
                  ${settings.theme.id === theme.id 
                    ? 'border-cyber-blue bg-cyber-blue/10' 
                    : 'border-dark-border hover:border-cyber-blue/50 bg-dark-card'
                  }
                `}
                onClick={() => updateSettings({ theme })}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-8 h-8 rounded-full"
                    style={{ background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})` }}
                  />
                  <span className="font-cyber text-sm text-white">{theme.name}</span>
                </div>
                
                <div className="flex gap-1">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: theme.primaryColor }}
                  />
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: theme.secondaryColor }}
                  />
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: theme.particleColor }}
                  />
                </div>
                
                {settings.theme.id === theme.id && (
                  <motion.div
                    layoutId="theme-selected"
                    className="absolute inset-0 border-2 border-cyber-blue rounded-xl"
                    initial={false}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
              </motion.button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-cyber text-white flex items-center gap-2">
            <Palette size={20} className="text-cyber-purple" />
            渐变色彩系统
          </h3>
          
          <div className="cyber-glass rounded-xl p-4">
            <GradientSelector
              currentGradient={currentGradient}
              onSelectGradient={setGradient}
              isDark={true}
            />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-cyber text-white flex items-center gap-2">
            <Volume2 size={20} className="text-cyber-purple" />
            音频设置
          </h3>
          
          <div className="cyber-glass rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {settings.backgroundMusic ? (
                  <Volume2 size={20} className="text-cyber-blue" />
                ) : (
                  <VolumeX size={20} className="text-gray-500" />
                )}
                <span className="text-gray-300">背景音乐</span>
              </div>
              
              <button
                className={`
                  relative w-14 h-7 rounded-full transition-colors duration-300
                  ${settings.backgroundMusic ? 'bg-cyber-blue' : 'bg-dark-border'}
                `}
                onClick={() => updateSettings({ backgroundMusic: !settings.backgroundMusic })}
              >
                <motion.div
                  className="absolute top-1 w-5 h-5 bg-white rounded-full shadow-lg"
                  animate={{ left: settings.backgroundMusic ? '32px' : '4px' }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              </button>
            </div>
            
            {settings.backgroundMusic && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-400">
                  <span>音量</span>
                  <span>{Math.round(settings.musicVolume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={settings.musicVolume}
                  onChange={(e) => updateSettings({ musicVolume: parseFloat(e.target.value) })}
                  className="w-full h-2 bg-dark-border rounded-full appearance-none cursor-pointer
                    [&::-webkit-slider-thumb]:appearance-none
                    [&::-webkit-slider-thumb]:w-4
                    [&::-webkit-slider-thumb]:h-4
                    [&::-webkit-slider-thumb]:rounded-full
                    [&::-webkit-slider-thumb]:bg-cyber-blue
                    [&::-webkit-slider-thumb]:cursor-pointer
                    [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(0,245,255,0.5)]
                  "
                />
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-cyber text-white flex items-center gap-2">
            <Grid3X3 size={20} className="text-cyber-green" />
            显示设置
          </h3>
          
          <div className="cyber-glass rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Grid3X3 size={20} className="text-cyber-blue" />
                <span className="text-gray-300">显示网格</span>
              </div>
              
              <button
                className={`
                  relative w-14 h-7 rounded-full transition-colors duration-300
                  ${settings.showGrid ? 'bg-cyber-blue' : 'bg-dark-border'}
                `}
                onClick={() => updateSettings({ showGrid: !settings.showGrid })}
              >
                <motion.div
                  className="absolute top-1 w-5 h-5 bg-white rounded-full shadow-lg"
                  animate={{ left: settings.showGrid ? '32px' : '4px' }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              </button>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <RotateCw size={20} className="text-cyber-purple" />
                <span className="text-gray-300">自动旋转</span>
              </div>
              
              <button
                className={`
                  relative w-14 h-7 rounded-full transition-colors duration-300
                  ${settings.autoRotate ? 'bg-cyber-purple' : 'bg-dark-border'}
                `}
                onClick={() => updateSettings({ autoRotate: !settings.autoRotate })}
              >
                <motion.div
                  className="absolute top-1 w-5 h-5 bg-white rounded-full shadow-lg"
                  animate={{ left: settings.autoRotate ? '32px' : '4px' }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              </button>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-400">
                <span>粒子强度</span>
                <span>{Math.round(settings.particleIntensity * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={settings.particleIntensity}
                onChange={(e) => updateSettings({ particleIntensity: parseFloat(e.target.value) })}
                className="w-full h-2 bg-dark-border rounded-full appearance-none cursor-pointer
                  [&::-webkit-slider-thumb]:appearance-none
                  [&::-webkit-slider-thumb]:w-4
                  [&::-webkit-slider-thumb]:h-4
                  [&::-webkit-slider-thumb]:rounded-full
                  [&::-webkit-slider-thumb]:bg-cyber-purple
                  [&::-webkit-slider-thumb]:cursor-pointer
                  [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(184,41,221,0.5)]
                "
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-cyber text-white">过渡效果</h3>
          
          <div className="flex gap-2 flex-wrap">
            {(['fade', 'slide', 'zoom', 'flip'] as const).map((effect) => (
              <button
                key={effect}
                className={`
                  px-4 py-2 rounded-lg font-cyber text-sm uppercase tracking-wider transition-all
                  ${settings.transitionEffect === effect 
                    ? 'bg-cyber-blue text-dark-bg' 
                    : 'bg-dark-card text-gray-400 hover:text-white'
                  }
                `}
                onClick={() => updateSettings({ transitionEffect: effect })}
              >
                {effect === 'fade' && '淡入淡出'}
                {effect === 'slide' && '滑动'}
                {effect === 'zoom' && '缩放'}
                {effect === 'flip' && '翻转'}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-cyber text-white flex items-center gap-2">
            <Download size={20} className="text-cyber-blue" />
            数据管理
          </h3>
          
          <div className="flex gap-3">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-dark-card border border-dark-border hover:border-cyber-blue/50 text-white font-cyber text-sm transition-all"
            >
              <Download size={16} />
              导出数据
            </button>
            
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
            
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-dark-card border border-dark-border hover:border-cyber-blue/50 text-white font-cyber text-sm transition-all"
            >
              <Upload size={16} />
              导入数据
            </button>
          </div>
          
          <p className="text-xs text-gray-500">
            导出将保存所有照片元数据和缩略图。大图数据存储在浏览器 IndexedDB 中。
          </p>
        </div>

        <div className="flex justify-end pt-4 border-t border-cyber-blue/10">
          <Button variant="primary" onClick={onClose}>
            完成
          </Button>
        </div>
      </div>
    </Modal>
  );
}
