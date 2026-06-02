import { Component, OnInit, ViewChild, AfterViewInit, ElementRef } from '@angular/core';
import { forkJoin, Observable, fromEvent, BehaviorSubject } from 'rxjs';
import { tap, switchMap, filter } from 'rxjs/operators';
import { NgOpenCVService, OpenCVLoadResult } from '../../../projects/ng-open-cv/src/public_api';

type NgOpenCVServiceCompat = {
  isReady$: Observable<OpenCVLoadResult>;
  loadImageToHTMLCanvas(imageUrl: string, canvas: HTMLCanvasElement): Observable<void>;
  createFileFromUrl(path: string, url: string): Observable<void>;
};

@Component({
  standalone: false,
  selector: 'app-face-detection',
  templateUrl: './face-detection.component.html',
  styleUrls: ['./face-detection.component.css']
})
export class FaceDetectionComponent implements AfterViewInit, OnInit {
  imageUrl = 'assets/DaveChappelle.jpg';
  private classifiersLoaded = new BehaviorSubject<boolean>(false);
  classifiersLoaded$ = this.classifiersLoaded.asObservable();

  @ViewChild('fileInput')
  fileInput!: ElementRef;
  @ViewChild('canvasInput')
  canvasInput!: ElementRef;
  @ViewChild('canvasOutput')
  canvasOutput!: ElementRef;

  constructor(private ngOpenCVService: NgOpenCVService) {}

  ngOnInit() {
    const openCVService = this.ngOpenCVService as unknown as NgOpenCVServiceCompat;
    openCVService.isReady$
      .pipe(
        filter((result: OpenCVLoadResult) => result.ready),
        switchMap(() => this.loadClassifiers())
      )
      .subscribe(() => {
        this.classifiersLoaded.next(true);
      });
  }

  ngAfterViewInit(): void {
    const openCVService = this.ngOpenCVService as unknown as NgOpenCVServiceCompat;
    openCVService.isReady$
      .pipe(
        filter((result: OpenCVLoadResult) => result.ready),
        tap(() => {
          openCVService.loadImageToHTMLCanvas(this.imageUrl, this.canvasInput.nativeElement).subscribe();
        })
      )
      .subscribe(() => {});
  }

  readDataUrl(event: any) {
    if (event.target.files.length) {
      const reader = new FileReader();
      const load$ = fromEvent(reader, 'load');
      const openCVService = this.ngOpenCVService as unknown as NgOpenCVServiceCompat;
      load$
        .pipe(
          switchMap(() => {
            return openCVService.loadImageToHTMLCanvas(`${reader.result}`, this.canvasInput.nativeElement);
          })
        )
        .subscribe(
          () => {},
          err => {
            console.log('Error loading image', err);
          }
        );
      reader.readAsDataURL(event.target.files[0]);
    }
  }

  loadClassifiers(): Observable<any> {
    const openCVService = this.ngOpenCVService as unknown as NgOpenCVServiceCompat;
    return forkJoin(
      openCVService.createFileFromUrl(
        'haarcascade_frontalface_default.xml',
        `assets/opencv/data/haarcascades/haarcascade_frontalface_default.xml`
      ),
      openCVService.createFileFromUrl(
        'haarcascade_eye.xml',
        `assets/opencv/data/haarcascades/haarcascade_eye.xml`
      )
    );
  }

  detectFace() {
    const openCVService = this.ngOpenCVService as unknown as NgOpenCVServiceCompat;
    openCVService.isReady$
      .pipe(
        filter((result: OpenCVLoadResult) => result.ready),
        switchMap(() => {
          return this.classifiersLoaded$;
        }),
        tap(() => {
          this.clearOutputCanvas();
          this.findFaceAndEyes();
        })
      )
      .subscribe(() => {
        console.log('Face detected');
      });
  }

  clearOutputCanvas() {
    const context = this.canvasOutput.nativeElement.getContext('2d');
    context.clearRect(0, 0, this.canvasOutput.nativeElement.width, this.canvasOutput.nativeElement.height);
  }

  findFaceAndEyes() {
    const src = cv.imread(this.canvasInput.nativeElement.id);
    const gray = new cv.Mat();
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);
    const faces = new cv.RectVector();
    const eyes = new cv.RectVector();
    const faceCascade = new cv.CascadeClassifier();
    const eyeCascade = new cv.CascadeClassifier();
    faceCascade.load('haarcascade_frontalface_default.xml');
    eyeCascade.load('haarcascade_eye.xml');
    const msize = new cv.Size(0, 0);
    faceCascade.detectMultiScale(gray, faces, 1.1, 3, 0, msize, msize);
    for (let i = 0; i < faces.size(); ++i) {
      const roiGray = gray.roi(faces.get(i));
      const roiSrc = src.roi(faces.get(i));
      const point1 = new cv.Point(faces.get(i).x, faces.get(i).y);
      const point2 = new cv.Point(faces.get(i).x + faces.get(i).width, faces.get(i).y + faces.get(i).height);
      cv.rectangle(src, point1, point2, [255, 0, 0, 255]);
      eyeCascade.detectMultiScale(roiGray, eyes);
      for (let j = 0; j < eyes.size(); ++j) {
        const point3 = new cv.Point(eyes.get(j).x, eyes.get(j).y);
        const point4 = new cv.Point(eyes.get(j).x + eyes.get(j).width, eyes.get(j).y + eyes.get(j).height);
        cv.rectangle(roiSrc, point3, point4, [0, 0, 255, 255]);
      }
      roiGray.delete();
      roiSrc.delete();
    }
    cv.imshow(this.canvasOutput.nativeElement.id, src);
    src.delete();
    gray.delete();
    faceCascade.delete();
    eyeCascade.delete();
    faces.delete();
    eyes.delete();
  }
}
