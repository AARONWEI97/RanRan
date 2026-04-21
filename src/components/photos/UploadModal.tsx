import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Image, X, FolderOpen } from 'lucide-react';
import { usePhotoStore } from '../../store/usePhotoStore';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Modal from '../ui/Modal';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UploadModal({ isOpen, onClose }: UploadModalProps) {
  const { albums, currentAlbumId, addPhoto, addAlbum } = usePhotoStore();
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [selectedAlbum, setSelectedAlbum] = useState<string>(currentAlbumId || 'default');
  const [newAlbumName, setNewAlbumName] = useState('');
  const [showNewAlbum, setShowNewAlbum] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files).filter(
      (file) => file.type.startsWith('image/')
    );

    if (files.length + droppedFiles.length > 20) {
      alert('单次上传最多支持 20 张照片，已自动截取前 20 张。');
      const remainingSlots = 20 - files.length;
      if (remainingSlots > 0) {
        setFiles((prev) => [...prev, ...droppedFiles.slice(0, remainingSlots)]);
      }
      return;
    }

    setFiles((prev) => [...prev, ...droppedFiles]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      
      if (files.length + selectedFiles.length > 20) {
        alert('单次上传最多支持 20 张照片，已自动截取前 20 张。');
        const remainingSlots = 20 - files.length;
        if (remainingSlots > 0) {
          setFiles((prev) => [...prev, ...selectedFiles.slice(0, remainingSlots)]);
        }
      } else {
        setFiles((prev) => [...prev, ...selectedFiles]);
      }
      
      // 清空 input 值，确保可以重复选择相同文件
      e.target.value = '';
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const [uploadProgress, setUploadProgress] = useState(0);

  const handleUpload = async (e?: React.MouseEvent) => {
    // 阻止任何可能的默认提交行为
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (files.length === 0 || uploading) return;
    
    let albumId = selectedAlbum;
    
    try {
      if (showNewAlbum && newAlbumName.trim()) {
        const newAlbum = addAlbum(newAlbumName.trim());
        albumId = newAlbum.id;
      }
      
      setUploading(true);
      setUploadProgress(0);
      
      // 降低并发量到1，确保绝对稳定，避免OOM崩溃
      const BATCH_SIZE = 1;
      let completedCount = 0;
      
      for (let i = 0; i < files.length; i += BATCH_SIZE) {
        const chunk = files.slice(i, i + BATCH_SIZE);
        await Promise.all(chunk.map(async (file) => {
          try {
            await addPhoto(file, albumId);
            // 每次上传后稍微暂停，给GC时间
            await new Promise(resolve => setTimeout(resolve, 50));
          } catch (err) {
            console.error(`Failed to upload ${file.name}:`, err);
          } finally {
            completedCount++;
            setUploadProgress(Math.round((completedCount / files.length) * 100));
          }
        }));
      }
      
      // 上传成功后清理状态
      setFiles([]);
      setNewAlbumName('');
      setShowNewAlbum(false);
      
      // 提示用户上传成功
      alert(`成功上传 ${files.length} 张照片！`);
      
      onClose();
    } catch (error) {
      console.error('Upload critical error:', error);
      alert('上传失败：存储空间不足或图片格式不正确，请清理浏览器缓存后重试。');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleClose = () => {
    setFiles([]);
    setNewAlbumName('');
    setShowNewAlbum(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="上传照片" size="lg">
      <div className="space-y-6">
        <div
          className={`
            relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300
            ${dragActive 
              ? 'border-cyber-blue bg-cyber-blue/10' 
              : 'border-dark-border hover:border-cyber-blue/50'
            }
          `}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={inputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <motion.div
            className="flex flex-col items-center gap-4"
            animate={{ scale: dragActive ? 1.02 : 1 }}
          >
            <div className="w-16 h-16 rounded-full bg-cyber-blue/10 flex items-center justify-center">
              <Upload size={32} className="text-cyber-blue" />
            </div>
            
            <div>
              <p className="text-lg font-cyber text-white mb-1">拖放照片到这里</p>
              <p className="text-gray-400 text-sm">或者</p>
            </div>
            
            <Button
              variant="primary"
              onClick={() => inputRef.current?.click()}
              icon={<Image size={18} />}
            >
              选择文件
            </Button>
            
            <p className="text-gray-500 text-xs">
              支持 JPG, PNG, GIF, WebP 格式
            </p>
          </motion.div>
        </div>

        <div className="space-y-3">
          <label className="block text-sm font-cyber text-gray-400 uppercase tracking-wider">
            选择相册
          </label>
          
          {showNewAlbum ? (
            <div className="flex gap-2">
              <Input
                placeholder="新相册名称"
                value={newAlbumName}
                onChange={(e) => setNewAlbumName(e.target.value)}
                icon={<FolderOpen size={18} />}
              />
              <Button variant="ghost" onClick={() => setShowNewAlbum(false)}>
                取消
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <select
                value={selectedAlbum}
                onChange={(e) => setSelectedAlbum(e.target.value)}
                className="flex-1 bg-dark-card border border-dark-border rounded-lg px-4 py-3 text-white font-body focus:outline-none focus:border-cyber-blue"
              >
                {albums.map((album) => (
                  <option key={album.id} value={album.id}>
                    {album.name} ({album.photoCount})
                  </option>
                ))}
              </select>
              <Button variant="secondary" onClick={() => setShowNewAlbum(true)}>
                新建
              </Button>
            </div>
          )}
        </div>

        {files.length > 0 && (
          <div className="space-y-3">
            <label className="block text-sm font-cyber text-gray-400 uppercase tracking-wider">
              已选择 {files.length} 张照片
            </label>
            
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-40 overflow-y-auto">
              <AnimatePresence>
                {files.map((file, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="relative aspect-square rounded-lg overflow-hidden group"
                  >
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-cyber-pink rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeFile(index)}
                    >
                      <X size={12} className="text-white" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={handleClose}>
            取消
          </Button>
          <Button
            variant="primary"
            onClick={handleUpload}
            isLoading={uploading}
            disabled={files.length === 0}
          >
            {uploading ? `上传中 ${uploadProgress}%` : `上传 ${files.length > 0 ? `(${files.length})` : ''}`}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
