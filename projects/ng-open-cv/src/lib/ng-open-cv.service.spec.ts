import { TestBed } from '@angular/core/testing';

import { NgOpenCVService } from './ng-open-cv.service';

describe('NgOpenCVService', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [
        {
          provide: NgOpenCVService,
          useValue: {
            isReady$: { subscribe: () => ({ unsubscribe: () => {} }) }
          }
        }
      ]
    })
  );

  it('should be created', () => {
    const service: NgOpenCVService = TestBed.inject(NgOpenCVService);
    expect(service).toBeTruthy();
  });
});