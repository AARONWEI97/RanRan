import { memo, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings, 
  Upload, 
  FolderOpen, 
  Tag, 
  Search,
  Menu,
  X
} from 'lucide-react';
import { usePhotoStore } from '../../store/usePhotoStore';
import Button from '../ui/Button';
import Input from '../ui/Input';
import SortControl from './SortControl';

interface NavbarProps {
  onOpenSettings: () => void;
  onOpenUpload: () => void;
  onOpenAlbums: () => void;
  onOpenTags: () => void;
}

const Navbar = memo(({ onOpenSettings, onOpenUpload, onOpenAlbums, onOpenTags }: NavbarProps) => {
  const { searchQuery, setSearchQuery } = usePhotoStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, [setSearchQuery]);

  const toggleMobileMenu = useCallback(() => {
    setMobileMenuOpen(prev => !prev);
  }, []);

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 left-0 right-0 z-40"
      role="navigation"
      aria-label="主导航栏"
    >
      <div className="cyber-glass border-b border-cyber-blue/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <motion.div
                className="flex items-center gap-2"
                whileHover={{ scale: 1.02 }}
              >
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyber-blue to-cyber-purple flex items-center justify-center">
                  <span className="text-xl font-cyber font-bold text-dark-bg">R</span>
                </div>
                <span className="hidden sm:block text-xl font-cyber cyber-text">RanRan</span>
              </motion.div>
            </div>

            <div className="hidden md:flex items-center gap-4">
              <SortControl />

              <div className="relative w-64">
                <Input
                  placeholder="搜索照片..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  icon={<Search size={18} />}
                />
              </div>
              
              <Button variant="primary" size="sm" onClick={onOpenUpload} icon={<Upload size={16} />} aria-label="上传照片">
                上传
              </Button>
              
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" onClick={onOpenAlbums} icon={<FolderOpen size={18} />} aria-label="相册管理" />
                <Button variant="ghost" size="sm" onClick={onOpenTags} icon={<Tag size={18} />} aria-label="标签管理" />
                <Button variant="ghost" size="sm" onClick={onOpenSettings} icon={<Settings size={18} />} aria-label="设置" />
              </div>
            </div>

            <button
              className="md:hidden p-2 text-gray-400 hover:text-cyber-blue"
              onClick={toggleMobileMenu}
              aria-label={mobileMenuOpen ? '关闭菜单' : '打开菜单'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="md:hidden cyber-glass border-b border-cyber-blue/10"
        >
          <div className="px-4 py-4 space-y-4">
            <Input
              placeholder="搜索照片..."
              value={searchQuery}
              onChange={handleSearchChange}
              icon={<Search size={18} />}
            />
            
            <div className="flex justify-center gap-2">
              <SortControl />
            </div>

            <div className="flex gap-2">
              <Button variant="primary" size="sm" onClick={onOpenUpload} icon={<Upload size={16} />} className="flex-1">
                上传
              </Button>
            </div>
            
            <div className="flex justify-center gap-2">
              <Button variant="ghost" size="sm" onClick={onOpenAlbums} icon={<FolderOpen size={18} />} />
              <Button variant="ghost" size="sm" onClick={onOpenTags} icon={<Tag size={18} />} />
              <Button variant="ghost" size="sm" onClick={onOpenSettings} icon={<Settings size={18} />} />
            </div>
          </div>
        </motion.div>
      )}
    </motion.nav>
  );
});

Navbar.displayName = 'Navbar';

export default Navbar;
