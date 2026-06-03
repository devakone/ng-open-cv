/* tslint:disable:no-unused-variable */
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { of } from 'rxjs';

import { NgOpenCVService } from '../../../projects/ng-open-cv/src/public_api';
import { HelloComponent } from './hello.component';

describe('HelloComponent', () => {
  let component: HelloComponent;
  let fixture: ComponentFixture<HelloComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [HelloComponent],
      providers: [
        {
          provide: NgOpenCVService,
          useValue: {
            isReady$: of({ ready: false, error: false, loading: false }),
            loadImageToHTMLCanvas: () => of(void 0)
          }
        }
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HelloComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
