import { Inject, Injectable, InjectionToken, Optional } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

import { OpenCVLoadResult, OpenCVOptions } from './ng-open-cv.models';

declare const cv: any;

declare global {
  interface Window {
    Module?: Record<string, unknown>;
  }
}

export const OPEN_CV_CONFIGURATION = new InjectionToken<OpenCVOptions>(
  'Angular OpenCV Configuration Object'
);

@Injectable({
  providedIn: 'root'
})
export class NgOpenCVService {
  errorOutput?: HTMLElement;
  src: any = null;
  dstC1: any = null;
  dstC3: any = null;
  dstC4: any = null;

  stream: MediaStream | null = null;
  video: HTMLVideoElement | null = null;

  private readonly isReadySubject = new BehaviorSubject<OpenCVLoadResult>({
    ready: false,
    error: false,
    loading: true
  });

  readonly isReady$: Observable<OpenCVLoadResult> = this.isReadySubject.asObservable();

  onCameraStartedCallback?: (stream: MediaStream, video: HTMLVideoElement) => void;
  OPENCV_URL = 'opencv.js';

  DEFAULT_OPTIONS: OpenCVOptions = {
    scriptUrl: 'assets/opencv/asm/3.4/opencv.js',
    wasmBinaryFile: 'wasm/3.4/opencv_js.wasm',
    usingWasm: false,
    locateFile: this.locateFile.bind(this),
    onRuntimeInitialized: () => {}
  };

  constructor(@Optional() @Inject(OPEN_CV_CONFIGURATION) options: OpenCVOptions | null) {
    const mergedOptions = { ...this.DEFAULT_OPTIONS, ...(options ?? {}) };
    this.setScriptUrl(mergedOptions.scriptUrl);

    if (typeof document !== 'undefined') {
      this.loadOpenCv(mergedOptions);
    } else {
      this.isReadySubject.next({
        ready: false,
        error: false,
        loading: false
      });
    }
  }

  private locateFile(path: string, scriptDirectory: string): string {
    return `${scriptDirectory}${path}`;
  }

  setScriptUrl(url: string): void {
    this.OPENCV_URL = url;
  }

  loadOpenCv(options: OpenCVOptions): void {
    this.isReadySubject.next({
      ready: false,
      error: false,
      loading: true
    });

    (globalThis as { Module?: Record<string, unknown> }).Module = { ...options };

    const script = document.createElement('script');
    script.async = true;
    script.type = 'text/javascript';

    script.addEventListener('load', () => {
      cv.onRuntimeInitialized = () => {
        options.onRuntimeInitialized?.();
        this.isReadySubject.next({
          ready: true,
          error: false,
          loading: false
        });
      };
    });

    script.addEventListener('error', () => {
      const message = `Failed to load ${this.OPENCV_URL}`;
      this.printError(message);
      this.isReadySubject.next({
        ready: false,
        error: true,
        loading: false
      });
      this.isReadySubject.error(new Error(message));
    });

    script.src = this.OPENCV_URL;
    const node = document.getElementsByTagName('script')[0];
    if (node?.parentNode) {
      node.parentNode.insertBefore(script, node);
    } else {
      document.head.appendChild(script);
    }
  }

  createFileFromUrl(path: string, url: string): Observable<void> {
    const request = new XMLHttpRequest();
    request.open('GET', url, true);
    request.responseType = 'arraybuffer';

    return new Observable<void>((observer) => {
      request.onload = () => {
        if (request.readyState !== 4) {
          return;
        }

        if (request.status === 200) {
          const data = new Uint8Array(request.response);
          cv.FS_createDataFile('/', path, data, true, false, false);
          observer.next();
          observer.complete();
        } else {
          this.printError(`Failed to load ${url} status: ${request.status}`);
          observer.error(new Error(`Failed to load ${url}`));
        }
      };

      request.onerror = () => {
        const message = `Failed to load ${url}`;
        this.printError(message);
        observer.error(new Error(message));
      };

      request.send();
    });
  }

  loadImageToCanvas(imageUrl: string, canvasId: string): Observable<void> {
    return new Observable<void>((observer) => {
      const canvas = document.getElementById(canvasId) as HTMLCanvasElement | null;
      if (!canvas) {
        observer.error(new Error(`Canvas element not found: ${canvasId}`));
        return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        observer.error(new Error(`Unable to get 2d context for canvas: ${canvasId}`));
        return;
      }

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0, img.width, img.height);
        observer.next();
        observer.complete();
      };
      img.onerror = () => {
        observer.error(new Error(`Failed to load image: ${imageUrl}`));
      };
      img.src = imageUrl;
    });
  }

  loadImageToHTMLCanvas(imageUrl: string, canvas: HTMLCanvasElement): Observable<void> {
    return new Observable<void>((observer) => {
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        observer.error(new Error('Unable to get 2d context for output canvas'));
        return;
      }

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0, img.width, img.height);
        observer.next();
        observer.complete();
      };
      img.onerror = () => {
        observer.error(new Error(`Failed to load image: ${imageUrl}`));
      };
      img.src = imageUrl;
    });
  }

  clearError(): void {
    if (this.errorOutput) {
      this.errorOutput.innerHTML = '';
    }
  }

  printError(err: unknown): string {
    let message: string;

    if (typeof err === 'undefined') {
      message = '';
    } else if (typeof err === 'number') {
      if (!Number.isNaN(err) && typeof cv !== 'undefined') {
        message = `Exception: ${cv.exceptionFromPtr(err).msg}`;
      } else {
        message = String(err);
      }
    } else if (typeof err === 'string') {
      const ptr = Number(err.split(' ')[0]);
      if (!Number.isNaN(ptr) && typeof cv !== 'undefined') {
        message = `Exception: ${cv.exceptionFromPtr(ptr).msg}`;
      } else {
        message = err;
      }
    } else if (err instanceof Error) {
      message = err.stack?.replace(/\n/g, '<br>') ?? err.message;
    } else {
      message = String(err);
    }

    throw new Error(message);
  }

  loadCode(scriptId: string, textAreaId: string): void {
    const scriptNode = document.getElementById(scriptId) as HTMLScriptElement | null;
    const textArea = document.getElementById(textAreaId) as HTMLTextAreaElement | null;

    if (!scriptNode || !textArea) {
      throw new Error('Code snippet elements not found');
    }

    if (scriptNode.type !== 'text/code-snippet') {
      throw new Error('Unknown code snippet type');
    }

    textArea.value = scriptNode.text.replace(/^\n/, '');
  }

  addFileInputHandler(fileInputId: string, canvasId: string): void {
    const inputElement = document.getElementById(fileInputId) as HTMLInputElement | null;
    if (!inputElement) {
      throw new Error(`Input element not found: ${fileInputId}`);
    }

    inputElement.addEventListener('change', (event: Event) => {
      const target = event.target as HTMLInputElement | null;
      const files = target?.files;
      if (files && files.length > 0) {
        const imgUrl = URL.createObjectURL(files[0]);
        this.loadImageToCanvas(imgUrl, canvasId).subscribe();
      }
    });
  }

  onVideoCanPlay(): void {
    if (this.onCameraStartedCallback && this.stream && this.video) {
      this.onCameraStartedCallback(this.stream, this.video);
    }
  }

  startCamera(
    resolution: 'qvga' | 'vga' | string,
    callback: (stream: MediaStream, video: HTMLVideoElement) => void,
    videoId: string
  ): void {
    const constraints = {
      qvga: { width: { exact: 320 }, height: { exact: 240 } },
      vga: { width: { exact: 640 }, height: { exact: 480 } }
    } as const;

    let video = document.getElementById(videoId) as HTMLVideoElement | null;
    if (!video) {
      video = document.createElement('video');
    }

    const videoConstraint = (constraints as Record<string, MediaTrackConstraints>)[resolution] ?? true;

    navigator.mediaDevices
      .getUserMedia({ video: videoConstraint, audio: false })
      .then((stream) => {
        video!.srcObject = stream;
        void video!.play();
        this.video = video;
        this.stream = stream;
        this.onCameraStartedCallback = callback;
        video!.addEventListener('canplay', this.onVideoCanPlay.bind(this), false);
      })
      .catch((err: DOMException) => {
        this.printError(`Camera Error: ${err.name} ${err.message}`);
      });
  }

  stopCamera(): void {
    if (this.video) {
      this.video.pause();
      this.video.srcObject = null;
      this.video.removeEventListener('canplay', this.onVideoCanPlay.bind(this));
    }

    if (this.stream) {
      this.stream.getVideoTracks()[0]?.stop();
    }
  }

  getContours(src: any, width: number, height: number): any {
    cv.cvtColor(src, this.dstC1, cv.COLOR_RGBA2GRAY);
    cv.threshold(this.dstC1, this.dstC4, 120, 200, cv.THRESH_BINARY);
    const contours = new cv.MatVector();
    const hierarchy = new cv.Mat();
    cv.findContours(this.dstC4, contours, hierarchy, cv.RETR_CCOMP, cv.CHAIN_APPROX_SIMPLE, {
      x: 0,
      y: 0
    });
    this.dstC3?.delete?.();
    this.dstC3 = cv.Mat.ones(height, width, cv.CV_8UC3);
    for (let i = 0; i < contours.size(); ++i) {
      const color = new cv.Scalar(0, 255, 0);
      cv.drawContours(this.dstC3, contours, i, color, 1, cv.LINE_8, hierarchy);
    }
    contours.delete();
    hierarchy.delete();
    return this.dstC3;
  }
}
