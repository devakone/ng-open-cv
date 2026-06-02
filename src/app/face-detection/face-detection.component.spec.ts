/* tslint:disable:no-unused-variable */
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';
import { of } from 'rxjs';

import { NgOpenCVService } from '../../../projects/ng-open-cv/src/public_api';
import { FaceDetectionComponent } from './face-detection.component';

describe('FaceDetectionComponent', () => {
  let component: FaceDetectionComponent;
  let fixture: ComponentFixture<FaceDetectionComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [FaceDetectionComponent],
      providers: [
        {
          provide: NgOpenCVService,
          useValue: {
            isReady$: of({ ready: false, error: false, loading: false }),
            loadImageToHTMLCanvas: () => of(void 0),
            createFileFromUrl: () => of(void 0)
          }
        }
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FaceDetectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
