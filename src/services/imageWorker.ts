interface CompressResult {
  compressed: string;
  thumbnail: string;
}

let worker: Worker | null = null;

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(
      new URL('../workers/imageCompressor.worker.ts', import.meta.url),
      { type: 'module' }
    );
  }
  return worker;
}

export function compressImageInWorker(
  file: File,
  maxWidth: number = 1920,
  thumbnailSize: number = 600,
  compressQuality: number = 0.7,
  thumbnailQuality: number = 0.85
): Promise<CompressResult> {
  return new Promise(async (resolve, reject) => {
    const w = getWorker();
    
    const fileData = await file.arrayBuffer();
    
    let compressResult = '';
    let thumbnailResult = '';
    let compressDone = false;
    let thumbnailDone = false;
    
    const handleMessage = (e: MessageEvent) => {
      const { type, result, error } = e.data;
      
      if (type === 'error') {
        w.removeEventListener('message', handleMessage);
        reject(new Error(error));
        return;
      }
      
      if (type === 'compress') {
        compressResult = result;
        compressDone = true;
      } else if (type === 'thumbnail') {
        thumbnailResult = result;
        thumbnailDone = true;
      }
      
      if (compressDone && thumbnailDone) {
        w.removeEventListener('message', handleMessage);
        resolve({ compressed: compressResult, thumbnail: thumbnailResult });
      }
    };
    
    w.addEventListener('message', handleMessage);
    
    w.postMessage({
      type: 'compress',
      fileData,
      fileName: file.name,
      maxWidth,
      quality: compressQuality,
    });
    
    w.postMessage({
      type: 'thumbnail',
      fileData,
      fileName: file.name,
      size: thumbnailSize,
      quality: thumbnailQuality,
    });
  });
}

export function terminateWorker(): void {
  if (worker) {
    worker.terminate();
    worker = null;
  }
}
