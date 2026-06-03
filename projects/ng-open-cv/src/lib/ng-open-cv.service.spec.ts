import { TestBed } from '@angular/core/testing';

import { OPEN_CV_CONFIGURATION, NgOpenCVService } from './ng-open-cv.service';
import { OpenCVLoadResult } from './ng-open-cv.models';

describe('NgOpenCVService', () => {
  let script: HTMLScriptElement;
  let insertBefore: jasmine.Spy;

  beforeEach(() => {
    script = {
      async: false,
      type: '',
      src: '',
      addEventListener: jasmine.createSpy('addEventListener')
    } as unknown as HTMLScriptElement;
    insertBefore = jasmine.createSpy('insertBefore');
    spyOn(document, 'createElement').and.returnValue(script);
    spyOn(document, 'getElementsByTagName').and.returnValue([
      { parentNode: { insertBefore } } as unknown as HTMLScriptElement
    ] as unknown as HTMLCollectionOf<HTMLScriptElement>);

    TestBed.configureTestingModule({
      providers: [
        {
          provide: OPEN_CV_CONFIGURATION,
          useValue: {
            scriptUrl: 'assets/opencv/asm/3.4/opencv.js',
            usingWasm: false,
            locateFile: () => 'assets/opencv/asm/3.4/opencv.js',
            onRuntimeInitialized: () => {}
          }
        }
      ]
    });
  });

  it('should be created without loading a real OpenCV script', () => {
    const service = TestBed.inject(NgOpenCVService);
    expect(service).toBeTruthy();
    expect(service.OPENCV_URL).toBe('assets/opencv/asm/3.4/opencv.js');
    expect(script.addEventListener).toHaveBeenCalledWith('load', jasmine.any(Function));
    expect(script.addEventListener).toHaveBeenCalledWith('error', jasmine.any(Function));
    expect(insertBefore).toHaveBeenCalled();
  });

  it('should expose a ready state observable', (done) => {
    const service = TestBed.inject(NgOpenCVService);
    service.isReady$.subscribe((state: OpenCVLoadResult) => {
      expect(state).toEqual({ ready: false, error: false, loading: true });
      done();
    });
  });

  it('should allow updating the script URL explicitly', () => {
    const service = TestBed.inject(NgOpenCVService);
    service.setScriptUrl('assets/custom/opencv.js');
    expect(service.OPENCV_URL).toBe('assets/custom/opencv.js');
  });
});
