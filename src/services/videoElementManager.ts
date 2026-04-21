class VideoElementManager {
  private static instance: VideoElementManager;
  private videoElement: HTMLVideoElement | null = null;
  private listeners: Map<string, EventListener> = new Map();

  private constructor() {}

  static getInstance(): VideoElementManager {
    if (!VideoElementManager.instance) {
      VideoElementManager.instance = new VideoElementManager();
    }
    return VideoElementManager.instance;
  }

  getVideo(): HTMLVideoElement | null {
    return this.videoElement;
  }

  createVideo(src?: string): HTMLVideoElement {
    if (this.videoElement) {
      this.destroyVideo();
    }

    const video = document.createElement('video');
    video.id = 'hologram-cinema-video';
    video.crossOrigin = 'anonymous';
    video.loop = false;
    video.muted = true;
    video.playsInline = true;
    video.autoplay = true;
    video.volume = 0;

    video.setAttribute('crossorigin', 'anonymous');
    video.setAttribute('autoplay', '');
    video.setAttribute('muted', '');
    video.setAttribute('playsinline', '');
    video.setAttribute('preload', 'auto');

    video.style.position = 'fixed';
    video.style.top = '0';
    video.style.left = '0';
    video.style.width = '1px';
    video.style.height = '1px';
    video.style.opacity = '0.01';
    video.style.pointerEvents = 'none';
    video.style.zIndex = '-9999';

    if (src) {
      video.src = src;
    }

    document.body.appendChild(video);
    this.videoElement = video;

    return video;
  }

  updateSrc(src: string): HTMLVideoElement | null {
    if (!this.videoElement) {
      this.createVideo(src);
      return this.videoElement;
    }

    this.videoElement.src = src;
    this.videoElement.load();
    return this.videoElement;
  }

  async play(): Promise<boolean> {
    if (!this.videoElement) return false;
    try {
      await this.videoElement.play();
      return true;
    } catch {
      return false;
    }
  }

  addListener(event: string, listener: EventListener): void {
    if (!this.videoElement) return;
    this.videoElement.addEventListener(event, listener);
    this.listeners.set(event, listener);
  }

  removeListener(event: string): void {
    if (!this.videoElement) return;
    const listener = this.listeners.get(event);
    if (listener) {
      this.videoElement.removeEventListener(event, listener);
      this.listeners.delete(event);
    }
  }

  destroyVideo(): void {
    if (!this.videoElement) return;

    this.listeners.forEach((listener, event) => {
      this.videoElement!.removeEventListener(event, listener);
    });
    this.listeners.clear();

    if (this.videoElement.parentNode) {
      this.videoElement.parentNode.removeChild(this.videoElement);
    }
    this.videoElement = null;
  }
}

export const videoManager = VideoElementManager.getInstance();
export default videoManager;
