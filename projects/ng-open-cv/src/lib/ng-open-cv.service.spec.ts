import { TestBed } from '@angular/core/testing';

import { NgOpenCVService, OPEN_CV_CONFIGURATION } from './ng-open-cv.service';

describe('NgOpenCVService', () => {
  beforeEach(() => TestBed.configureTestingModule({
    providers: [
      {
        provide: OPEN_CV_CONFIGURATION,
        useValue: {
          scriptUrl: 'assets/opencv/asm/3.4/opencv.js',
          usingWasm: false
        }
      }
    ]
  }));

  it('should be created', () => {
    spyOn(NgOpenCVService.prototype, 'loadOpenCv').and.stub();

    const service: NgOpenCVService = TestBed.get(NgOpenCVService);
    expect(service).toBeTruthy();
  });
});
