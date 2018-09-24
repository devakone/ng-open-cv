import { TestBed } from '@angular/core/testing';

import { NgOpenCVService } from './ng-open-cv.service';

describe('NgOpenCVService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: NgOpenCVService = TestBed.get(NgOpenCVService);
    expect(service).toBeTruthy();
  });
});
