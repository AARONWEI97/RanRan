import localforage from 'localforage';
import type { Photo, Album, Tag } from '../types';

const blobStorage = localforage.createInstance({
  name: 'RanRan',
  storeName: 'photos_blob',
});

export interface ExportData {
  version: string;
  exportDate: string;
  photos: Array<{
    id: string;
    name: string;
    tags: string[];
    albumId: string;
    description?: string;
    type?: string;
    createdAt: number;
    thumbnail?: string;
  }>;
  albums: Album[];
  tags: Tag[];
  blobs: Record<string, string>;
}

export async function exportAllData(): Promise<ExportData> {
  const photos: Photo[] = [];
  const albums: Album[] = [];
  const tags: Tag[] = [];
  
  const blobs: Record<string, string> = {};
  
  try {
    const keys = await blobStorage.keys();
    for (const key of keys) {
      const data = await blobStorage.getItem<string>(key);
      if (data) {
        blobs[key] = data;
      }
    }
  } catch {}

  return {
    version: '1.0.0',
    exportDate: new Date().toISOString(),
    photos,
    albums,
    tags,
    blobs,
  };
}

export async function importData(data: ExportData): Promise<{
  importedPhotos: number;
  importedAlbums: number;
  importedTags: number;
  importedBlobs: number;
}> {
  let importedBlobs = 0;
  
  if (data.blobs) {
    for (const [key, value] of Object.entries(data.blobs)) {
      try {
        await blobStorage.setItem(key, value);
        importedBlobs++;
      } catch {}
    }
  }

  return {
    importedPhotos: data.photos?.length || 0,
    importedAlbums: data.albums?.length || 0,
    importedTags: data.tags?.length || 0,
    importedBlobs,
  };
}

export function downloadAsJson(data: ExportData, filename?: string): void {
  const json = JSON.stringify(data);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `ranran-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function readJsonFile(file: File): Promise<ExportData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (!data.version || !data.photos) {
          reject(new Error('无效的备份文件格式'));
          return;
        }
        resolve(data as ExportData);
      } catch {
        reject(new Error('无法解析备份文件'));
      }
    };
    reader.onerror = () => reject(new Error('读取文件失败'));
    reader.readAsText(file);
  });
}
