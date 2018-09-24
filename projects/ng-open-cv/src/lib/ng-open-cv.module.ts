import { NgModule, ModuleWithProviders } from '@angular/core';
import { NgOpenCVService, OPEN_CV_CONFIGURATION } from './ng-open-cv.service';
import { OpenCVOptions } from './ng-open-cv.models';

@NgModule({
  imports: [],
  declarations: [],
  exports: [],
  providers: [NgOpenCVService]
})
export class NgOpenCVModule {
  /**
   *
   * Setup the module in your application's root bootstrap.
   *
   *
   * @memberOf NgOpenCvModule
   */
  static forRoot(config: OpenCVOptions): ModuleWithProviders {
    return {
      ngModule: NgOpenCVModule,
      providers: [{ provide: OPEN_CV_CONFIGURATION, useValue: config }]
    };
  }
}
