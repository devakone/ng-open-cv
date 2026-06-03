/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { NgOpenCVService } from 'ng-open-cv';

import { FaceDetectionComponent } from './face-detection.component';

describe('FaceDetectionComponent', () => {
  let component: FaceDetectionComponent;
  let fixture: ComponentFixture<FaceDetectionComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FaceDetectionComponent ],
      providers: [
        {
          provide: NgOpenCVService,
          useValue: {
            isReady$: of({ ready: false, error: false, loading: true }),
            createFileFromUrl: () => of(null),
            loadImageToHTMLCanvas: () => of(null)
          }
        }
      ]
    })
    .compileComponents();
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
