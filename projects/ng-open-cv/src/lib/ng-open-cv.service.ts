import { Inject, Injectable, InjectionToken } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

import { OpenCVLoadResult, OpenCVOptions } from './ng-open-cv.models';

/*
Angular modifification of the OpenCV utils script found at https://docs.opencv.org/master/utils.js
*/
declare var cv: any;

export const OPEN_CV_CONFIGURATION = new InjectionToken<OpenCVOptions>('Angular OpenCV Configuration Object');

@Injectable({
  providedIn: 'root'
})
export class NgOpenCVService {
  errorOutput: HTMLElement;
  src = null;
  dstC1 = null;
  dstC3 = null;
  dstC4 = null;

  stream: any;
  video: any;
  private isReady = new BehaviorSubject<OpenCVLoadResult>({
    ready: false,
    error: false,
    loading: true
  });
  isReady$: Observable<OpenCVLoadResult> = this.isReady.asObservable();
  onCameraStartedCallback: (a, b) => void;
  OPENCV_URL = 'opencv.js';
  DEFAULT_OPTIONS = {
    scriptUrl: 'assets/opencv/asm/3.4/opencv.js',
    wasmBinaryFile: 'wasm/3.4/opencv_js.wasm',
    usingWasm: false,
    locateFile: this.locateFile.bind(this),
    onRuntimeInitialized: () => {}
  };

  constructor(@Inject(OPEN_CV_CONFIGURATION) options: OpenCVOptions) {
    this.setScriptUrl(options.scriptUrl);
    const opts = { ...this.DEFAULT_OPTIONS, options };
    this.loadOpenCv(opts);
  }

  private locateFile(path, scriptDirectory): string {
    if (path === 'opencv_js.wasm') {
      return scriptDirectory + '/wasm/' + path;
    } else {
      return scriptDirectory + path;
    }
  }

  setScriptUrl(url: string) {
    this.OPENCV_URL = url;
  }

  loadOpenCv(options: OpenCVOptions) {
    this.isReady.next({
      ready: false,
      error: false,
      loading: true
    });
    window['Module'] = { ...options };
    const script = document.createElement('script');
    script.setAttribute('async', '');
    script.setAttribute('type', 'text/javascript');
    script.addEventListener('load', () => {
      const onRuntimeInitializedCallback = () => {
        if (options.onRuntimeInitialized) {
          options.onRuntimeInitialized();
        }
        this.isReady.next({
          ready: true,
          error: false,
          loading: false
        });
      };
      cv.onRuntimeInitialized = onRuntimeInitializedCallback;
    });
    script.addEventListener('error', () => {
      const err = this.printError('Failed to load ' + this.OPENCV_URL);
      this.isReady.next({
        ready: false,
        error: true,
        loading: false
      });
      this.isReady.error(err);
    });
    script.src = this.OPENCV_URL;
    const node = document.getElementsByTagName('script')[0];
    if (node) {
      node.parentNode.insertBefore(script, node);
    } else {
      document.head.appendChild(script);
    }
  }

  createFileFromUrl(path, url) {
    const request = new XMLHttpRequest();
    request.open('GET', url, true);
    request.responseType = 'arraybuffer';
    return new Observable(observer => {
      const { next, error: catchError, complete } = observer;
      request.onload = ev => {
        if (request.readyState === 4) {
          if (request.status === 200) {
            const data = new Uint8Array(request.response);
            cv.FS_createDataFile('/', path, data, true, false, false);
            observer.next();
            observer.complete();
          } else {
            this.printError('Failed to load ' + url + ' status: ' + request.status);
            observer.error();
          }
        }
      };
      request.send();
    });
  }

  loadImageToCanvas(imageUrl, canvasId: string): Observable<any> {
    return Observable.create(observer => {
      const canvas: HTMLCanvasElement = <HTMLCanvasElement>document.getElementById(canvasId);
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0, img.width, img.height);
        observer.next();
        observer.complete();
      };
      img.src = imageUrl;
    });
  }

  loadImageToHTMLCanvas(imageUrl: string, canvas: HTMLCanvasElement): Observable<any> {
    return Observable.create(observer => {
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0, img.width, img.height);
        observer.next();
        observer.complete();
      };
      img.src = imageUrl;
    });
  }

  clearError() {
    this.errorOutput.innerHTML = '';
  }

  printError(err) {
    if (typeof err === 'undefined') {
      err = '';
    } else if (typeof err === 'number') {
      if (!isNaN(err)) {
        if (typeof cv !== 'undefined') {
          err = 'Exception: ' + cv.exceptionFromPtr(err).msg;
        }
      }
    } else if (typeof err === 'string') {
      const ptr = Number(err.split(' ')[0]);
      if (!isNaN(ptr)) {
        if (typeof cv !== 'undefined') {
          err = 'Exception: ' + cv.exceptionFromPtr(ptr).msg;
        }
      }
    } else if (err instanceof Error) {
      err = err.stack.replace(/\n/g, '<br>');
    }
    throw new Error(err);
  }

  loadCode(scriptId, textAreaId) {
    const scriptNode = <HTMLScriptElement>document.getElementById(scriptId);
    const textArea = <HTMLTextAreaElement>document.getElementById(textAreaId);
    if (scriptNode.type !== 'text/code-snippet') {
      throw Error('Unknown code snippet type');
    }
    textArea.value = scriptNode.text.replace(/^\n/, '');
  }

  addFileInputHandler(fileInputId, canvasId) {
    const inputElement = document.getElementById(fileInputId);
    inputElement.addEventListener(
      'change',
      e => {
        const files = e.target['files'];
        if (files.length > 0) {
          const imgUrl = URL.createObjectURL(files[0]);
          this.loadImageToCanvas(imgUrl, canvasId);
        }
      },
      false
    );
  }

  onVideoCanPlay() {
    if (this.onCameraStartedCallback) {
      this.onCameraStartedCallback(this.stream, this.video);
    }
  }

  startCamera(resolution, callback, videoId) {
    const constraints = {
      qvga: { width: { exact: 320 }, height: { exact: 240 } },
      vga: { width: { exact: 640 }, height: { exact: 480 } }
    };
    let video = <HTMLVideoElement>document.getElementById(videoId);
    if (!video) {
      video = document.createElement('video');
    }

    let videoConstraint = constraints[resolution];
    if (!videoConstraint) {
      videoConstraint = true;
    }

    navigator.mediaDevices
      .getUserMedia({ video: videoConstraint, audio: false })
      .then(stream => {
        video.srcObject = stream;
        video.play();
        this.video = video;
        this.stream = stream;
        this.onCameraStartedCallback = callback;
        video.addEventListener('canplay', this.onVideoCanPlay.bind(this), false);
      })
      .catch(err => {
        this.printError('Camera Error: ' + err.name + ' ' + err.message);
      });
  }

  stopCamera() {
    if (this.video) {
      this.video.pause();
      this.video.srcObject = null;
      this.video.removeEventListener('canplay', this.onVideoCanPlay.bind(this));
    }
    if (this.stream) {
      this.stream.getVideoTracks()[0].stop();
    }
  }

  getContours(src, width, height) {
    cv.cvtColor(src, this.dstC1, cv.COLOR_RGBA2GRAY);
    cv.threshold(this.dstC1, this.dstC4, 120, 200, cv.THRESH_BINARY);
    const contours = new cv.MatVector();
    const hierarchy = new cv.Mat();
    cv.findContours(this.dstC4, contours, hierarchy, cv.RETR_CCOMP, cv.CHAIN_APPROX_SIMPLE, {
      x: 0,
      y: 0
    });
    this.dstC3.delete();
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
