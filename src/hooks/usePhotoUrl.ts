import { useState, useEffect } from 'react';
import localforage from 'localforage';
import type { Photo } from '../types';

const blobStorage = localforage.createInstance({
  name: 'RanRan',
  storeName: 'photos_blob',
});

export function usePhotoUrl(photo: Photo | null): string {
  const [url, setUrl] = useState<string>('');

  useEffect(() => {
    if (!photo) {
      setUrl('');
      return;
    }

    let isMounted = true;

    const loadUrl = async () => {
      if (photo.url && (photo.url.startsWith('data:') || photo.url.startsWith('blob:'))) {
        if (isMounted) setUrl(photo.url);
        return;
      }

      try {
        const storedUrl = await blobStorage.getItem<string>(photo.id);
        if (storedUrl && isMounted) {
          setUrl(storedUrl);
          return;
        }
      } catch {}

      try {
        const legacyUrl = await localforage.getItem<string>(photo.id);
        if (legacyUrl && isMounted) {
          setUrl(legacyUrl);
          return;
        }
      } catch {}

      try {
        const legacyUrl2 = await localforage.getItem<string>(`photo_${photo.id}`);
        if (legacyUrl2 && isMounted) {
          setUrl(legacyUrl2);
          return;
        }
      } catch {}

      if (photo.thumbnail && isMounted) {
        setUrl(photo.thumbnail);
      }
    };

    loadUrl();

    return () => {
      isMounted = false;
    };
  }, [photo?.id, photo?.url, photo?.thumbnail]);

  return url;
}

export { blobStorage };
