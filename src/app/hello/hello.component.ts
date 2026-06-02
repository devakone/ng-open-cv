import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { fromEvent, Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { NgOpenCVService, OpenCVLoadResult } from '../../../projects/ng-open-cv/src/public_api';

type NgOpenCVServiceCompat = {
  isReady$: Observable<OpenCVLoadResult>;
  loadImageToHTMLCanvas(imageUrl: string, canvas: HTMLCanvasElement): Observable<void>;
};

@Component({
  standalone: false,
  selector: 'app-hello',
  templateUrl: './hello.component.html',
  styleUrls: ['./hello.component.css']
})
export class HelloComponent implements OnInit {
  openCVLoadResult!: Observable<OpenCVLoadResult>;

  @ViewChild('fileInput')
  fileInput!: ElementRef;

  @ViewChild('canvasOutput')
  canvasOutput!: ElementRef;

  constructor(private ngOpenCVService: NgOpenCVService) {}

  ngOnInit() {
    const openCVService = this.ngOpenCVService as unknown as NgOpenCVServiceCompat;
    this.openCVLoadResult = openCVService.isReady$;
  }

  loadImage(event: any) {
    if (event.target.files.length) {
      const reader = new FileReader();
      const load$ = fromEvent(reader, 'load');
      load$
        .pipe(
          switchMap(() => {
            const openCVService = this.ngOpenCVService as unknown as NgOpenCVServiceCompat;
            return openCVService.loadImageToHTMLCanvas(`${reader.result}`, this.canvasOutput.nativeElement);
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
}
