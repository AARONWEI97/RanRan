import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import localforage from 'localforage';
import type { Photo, Album, Tag } from '../../types';
import { compressImageInWorker } from '../../services/imageWorker';

// 创建独立的存储实例，避免污染全局配置
const metadataStorage = localforage.createInstance({
  name: 'RanRan',
  storeName: 'photos_metadata', // 专门用于存储元数据
});

const blobStorage = localforage.createInstance({
  name: 'RanRan',
  storeName: 'photos_blob', // 专门用于存储大图
});

// 定义异步存储适配器，用于 Zustand 持久化元数据
const asyncStorage = createJSONStorage(() => ({
  getItem: async (name: string) => {
    return await metadataStorage.getItem(name);
  },
  setItem: async (name: string, value: string) => {
    await metadataStorage.setItem(name, value);
  },
  removeItem: async (name: string) => {
    await metadataStorage.removeItem(name);
  },
}));

interface PhotoState {
  photos: Photo[];
  albums: Album[];
  tags: Tag[];
  currentAlbumId: string | null;
  selectedPhotoId: string | null;
  searchQuery: string;
  isLoading: boolean;
  layoutMode: 'galaxy'; // Force Galaxy mode
  sortOption: 'date-desc' | 'date-asc' | 'name-asc' | 'name-desc';
  filterTags: string[];
}

interface PhotoActions {
  addPhoto: (file: File, albumId: string) => Promise<Photo>;
  removePhoto: (id: string) => void;
  updatePhoto: (id: string, updates: Partial<Photo>) => void;
  addAlbum: (name: string, description?: string) => Album;
  removeAlbum: (id: string) => void;
  updateAlbum: (id: string, updates: Partial<Album>) => void;
  addTag: (name: string, color: string) => Tag;
  removeTag: (id: string) => void;
  createTag: (name: string) => Tag;
  addTagToPhoto: (photoId: string, tagName: string) => void;
  removeTagFromPhoto: (photoId: string, tagName: string) => void;
  setCurrentAlbum: (albumId: string | null) => void;
  setSelectedPhoto: (photoId: string | null) => void;
  setSearchQuery: (query: string) => void;
  // setLayoutMode: (mode: 'galaxy') => void; // Layout mode is fixed now
  setSortOption: (option: 'date-desc' | 'date-asc' | 'name-asc' | 'name-desc') => void;
  toggleFilterTag: (tag: string) => void;
  clearFilters: () => void;
  getFilteredPhotos: () => Photo[];
  initializeDefaultAlbum: () => void;
}

export type PhotoStore = PhotoState & PhotoActions;

const compressImage = (file: File, maxWidth: number = 1920): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // 优化图片质量，减少体积
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);
          // 使用 0.7 质量，足够清晰且显著减小体积
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        } else {
          reject(new Error('Canvas context not available'));
        }
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const createThumbnail = (file: File, size: number = 600): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ratio = Math.max(size / img.width, size / img.height);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          // 恢复高质量缩略图，既然已经使用 IndexedDB，空间不再是瓶颈
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        } else {
          reject(new Error('Canvas context not available'));
        }
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const usePhotoStore = create<PhotoStore>()(
  persist(
    (set, get) => ({
      // State
      photos: [],
      albums: [],
      tags: [],
      currentAlbumId: null,
      selectedPhotoId: null,
      searchQuery: '',
      isLoading: false,
      layoutMode: 'galaxy',
      sortOption: 'date-desc',
      filterTags: [],

      // Actions
      addPhoto: async (file: File, albumId: string) => {
        set({ isLoading: true });
        
        let url: string;
        let thumbnail: string;
        
        try {
          const result = await compressImageInWorker(file);
          url = result.compressed;
          thumbnail = result.thumbnail;
        } catch {
          const [compressedUrl, thumbUrl] = await Promise.all([
            compressImage(file),
            createThumbnail(file),
          ]);
          url = compressedUrl;
          thumbnail = thumbUrl;
        }
        
        const photoId = uuidv4();
        
        await blobStorage.setItem(photoId, url);
        
        const photo: Photo = {
          id: photoId,
          url: '', 
          thumbnail,
          name: file.name.replace(/\.[^/.]+$/, ''),
          tags: [],
          albumId,
          createdAt: Date.now(),
        };
        
        set((state) => {
          const updatedAlbums = state.albums.map((album) =>
            album.id === albumId
              ? { ...album, photoCount: album.photoCount + 1 }
              : album
          );
          
          return {
            photos: [...state.photos, photo],
            albums: updatedAlbums,
            isLoading: false,
          };
        });
        
        return photo;
      },

      removePhoto: (id: string) => {
        set((state) => {
          const photo = state.photos.find((p) => p.id === id);
          const updatedAlbums = state.albums.map((album) =>
            album.id === photo?.albumId
              ? { ...album, photoCount: Math.max(0, album.photoCount - 1) }
              : album
          );
          
          localforage.removeItem(id);
          blobStorage.removeItem(id);
          
          return {
            photos: state.photos.filter((p) => p.id !== id),
            albums: updatedAlbums,
            selectedPhotoId: state.selectedPhotoId === id ? null : state.selectedPhotoId,
          };
        });
      },

      updatePhoto: (id: string, updates: Partial<Photo>) => {
        set((state) => ({
          photos: state.photos.map((photo) =>
            photo.id === id ? { ...photo, ...updates } : photo
          ),
        }));
      },

      addAlbum: (name: string, description?: string) => {
        const album: Album = {
          id: uuidv4(),
          name,
          description,
          createdAt: Date.now(),
          photoCount: 0,
        };
        
        set((state) => ({
          albums: [...state.albums, album],
        }));
        
        return album;
      },

      removeAlbum: (id: string) => {
        set((state) => {
          const photosToRemove = state.photos.filter((p) => p.albumId === id);
          photosToRemove.forEach((p) => {
             localforage.removeItem(p.id);
             blobStorage.removeItem(p.id);
          });
          
          return {
            albums: state.albums.filter((a) => a.id !== id),
            photos: state.photos.filter((p) => p.albumId !== id),
            currentAlbumId: state.currentAlbumId === id ? null : state.currentAlbumId,
          };
        });
      },

      updateAlbum: (id: string, updates: Partial<Album>) => {
        set((state) => ({
          albums: state.albums.map((album) =>
            album.id === id ? { ...album, ...updates } : album
          ),
        }));
      },

      addTag: (name: string, color: string) => {
        const tag: Tag = {
          id: uuidv4(),
          name,
          color,
          count: 0,
        };
        
        set((state) => ({
          tags: [...state.tags, tag],
        }));
        
        return tag;
      },

      removeTag: (id: string) => {
        set((state) => ({
          tags: state.tags.filter((t) => t.id !== id),
          photos: state.photos.map((photo) => ({
            ...photo,
            tags: photo.tags.filter((tagId) => tagId !== id),
          })),
        }));
      },

      createTag: (name: string) => {
        const id = uuidv4();
        const colors = ['#00f5ff', '#ff2d75', '#39ff14', '#ff6b35', '#b829dd'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        const tag: Tag = { id, name, color, count: 0 };
        set((state) => ({ tags: [...state.tags, tag] }));
        return tag;
      },

      addTagToPhoto: (photoId: string, tagName: string) => {
        set((state) => ({
          photos: state.photos.map((photo) => {
            if (photo.id !== photoId) return photo;
            if (photo.tags.includes(tagName)) return photo;
            return { ...photo, tags: [...photo.tags, tagName] };
          }),
        }));
      },

      removeTagFromPhoto: (photoId: string, tagName: string) => {
        set((state) => ({
          photos: state.photos.map((photo) => {
            if (photo.id !== photoId) return photo;
            return { ...photo, tags: photo.tags.filter(t => t !== tagName) };
          }),
        }));
      },

      setCurrentAlbum: (albumId: string | null) => {
        set({ currentAlbumId: albumId });
      },

      setSelectedPhoto: (photoId: string | null) => {
        set({ selectedPhotoId: photoId });
      },

      setSearchQuery: (query: string) => {
        set({ searchQuery: query });
      },

      /* setLayoutMode: (mode: 'galaxy') => {
        set({ layoutMode: mode });
      }, */

      setSortOption: (option: 'date-desc' | 'date-asc' | 'name-asc' | 'name-desc') => {
        set({ sortOption: option });
      },

      toggleFilterTag: (tag: string) => {
        set((state) => ({
          filterTags: state.filterTags.includes(tag)
            ? state.filterTags.filter((t) => t !== tag)
            : [...state.filterTags, tag],
        }));
      },

      clearFilters: () => {
        set({ filterTags: [], searchQuery: '' });
      },

      getFilteredPhotos: () => {
        const { photos, currentAlbumId, searchQuery, sortOption, filterTags } = get();
        
        let filtered = photos;
        
        if (currentAlbumId) {
          filtered = filtered.filter((p) => p.albumId === currentAlbumId);
        }
        
        if (filterTags && filterTags.length > 0) {
          filtered = filtered.filter((p) => 
            filterTags.every((tag) => p.tags.includes(tag))
          );
        }
        
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          filtered = filtered.filter(
            (p) =>
              p.name.toLowerCase().includes(query) ||
              p.description?.toLowerCase().includes(query) ||
              p.tags.some((t) => t.toLowerCase().includes(query))
          );
        }
        
        return filtered.sort((a, b) => {
          switch (sortOption) {
            case 'date-asc':
              return a.createdAt - b.createdAt;
            case 'name-asc':
              return a.name.localeCompare(b.name);
            case 'name-desc':
              return b.name.localeCompare(a.name);
            case 'date-desc':
            default:
              return b.createdAt - a.createdAt;
          }
        });
      },

      initializeDefaultAlbum: () => {
        const { albums, photos, currentAlbumId } = get();
        
        const validPhotos = photos.filter(photo => {
          const url = photo.thumbnail || photo.url;
          return url.startsWith('data:image/');
        });
        
        if (validPhotos.length !== photos.length) {
          set({ photos: validPhotos });
        }
        
        if (albums.length === 0) {
          const defaultAlbum: Album = {
            id: 'default',
            name: '我的狗狗',
            description: '默认相册',
            createdAt: Date.now(),
            photoCount: 0,
          };
          set({ albums: [defaultAlbum], currentAlbumId: 'default' });
        } else if (!currentAlbumId) {
          set({ currentAlbumId: albums[0].id });
        }
      },
    }),
    {
      name: 'ranran-photo-storage',
      storage: asyncStorage, // 使用异步 IndexedDB 存储元数据，解决 5MB 限制问题
      partialize: (state) => ({
        photos: state.photos,
        albums: state.albums,
        tags: state.tags,
        currentAlbumId: state.currentAlbumId,
        layoutMode: state.layoutMode,
      }),
    }
  )
);