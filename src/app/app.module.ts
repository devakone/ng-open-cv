import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { NgOpenCVModule } from 'ng-open-cv';
import { FaceDetectionComponent } from './face-detection/face-detection.component';
import { RouterModule } from '@angular/router';
import { AppRoutingModule } from './app-routing.module';
import { OpenCVOptions } from 'projects/ng-open-cv/src/public_api';
import { ExampleListComponent } from './example-list/example-list.component';
import { HelloComponent } from './hello/hello.component';

const openCVConfig: OpenCVOptions = {
  scriptUrl: `assets/opencv/opencv.js`,
  wasmBinaryFile: 'wasm/opencv_js.wasm',
  usingWasm: true
};

@NgModule({
   declarations: [
      AppComponent,
      FaceDetectionComponent,
      ExampleListComponent,
      HelloComponent
   ],
   imports: [
      BrowserModule,
      NgOpenCVModule.forRoot(openCVConfig),
      RouterModule,
      AppRoutingModule
   ],
   providers: [],
   bootstrap: [
      AppComponent
   ]
})
export class AppModule { }
