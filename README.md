# NgOpenCV

This is a library that integrates Angular v6+ with OpenCVJS, the Javascript port of the popular computer 
vision library. It will allow you to load the library (with its WASM components) and use it in your application. The loading is done asynchrosnously after your Angular app has booted. The attached service makes use of a notifier to indicate when the loading is done and the service and library is ready for use.

[Please read this blog post for the whole background on how this library came together](https://medium.com/@abookone/integrating-opencv-js-with-an-angular-application-20ae11c7e217)



## Installation

### NPM

```
npm install ng-open-cv --save
```


### Yarn

```
yarn add ng-open-cv
```

Once the library is installed you will need to copy the `opencv` content from the `node_modules/ng-open-cv/lib/assets` folder to your own `assets` folder. This folder
contains the actual OpenCV library (v3.4) and its WASM and ASM.js files.

### Data files

OpenCV.js uses classification files to perform certain detection operations. To use those files:

* Get the folders you need from the [OpenCV data repository](https://github.com/opencv/opencv/tree/master/data)
* Add the folders to your app's `assets\opencv\data` folder. Right now the `assets\data` folder that with this library only includes the *haarcascardes* files. 
* Use the `createFileFromUrl` in the NgOpenService class to load the file in memory.

Example:

```



this.ngOpenCVService.createFileFromUrl(
        'haarcascade_frontalface_default.xml',
        'assets/opencv/data/haarcascades/haarcascade_frontalface_default.xml'
      ),


```



3. Typings

To your `src/typings.d.ts` file. add 

```
declare var cv: any;
```

## Demo

[You can visit the demo site here](https://devakone.github.io/ng-open-cv/).

## Usage

If you have installed NgOpenCV and copied the `opencv` folder to your `assets` directory, everything should work out of the box. 


#### 1. Import the `NgOpenCVModule`
Create the configuration object needed to configure the loading of OpenCV.js for your application. By default the 3.4 asm.js version of the library will be loaded. The default options are

```ts
DEFAULT_OPTIONS = {
    scriptUrl: 'assets/opencv/asm/3.4/opencv.js',
    usingWasm: false,
    locateFile: this.locateFile.bind(this),
    onRuntimeInitialized: () => {}
  };
  ```
Adjust the `scriptUrl` to contain the path to your opencvjs file. If you wanted to load the WASM version, you would use a configuration like:

```ts
const openCVConfig: OpenCVOptions = {
  scriptUrl: `assets/opencv/wasm/3.4/opencv.js`,
  wasmBinaryFile: 'wasm/3.4/opencv_js.wasm',
  usingWasm: true
};
```

### Note: WASM is not supported on mobile Safari

Import `NgOpenCVModule.forRoot(config)` in the NgModule of your application.
The `forRoot` method is a convention for modules that provide a singleton service. Pass it the configuration object.

```ts
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { NgOpenCVModule } from 'ng-open-cv';
import { RouterModule } from '@angular/router';
import { AppRoutingModule } from './app-routing.module';
import { OpenCVOptions } from 'projects/ng-open-cv/src/public_api';

const openCVConfig: OpenCVOptions = {
  scriptUrl: `assets/opencv/opencv.js`,
  wasmBinaryFile: 'wasm/opencv_js.wasm',
  usingWasm: true
};

@NgModule({
   declarations: [
      AppComponent,
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
```

If you have multiple NgModules and you use one as a shared NgModule (that you import in all of your other NgModules),
don't forget that you can use it to export the `NgOpenCVModule` that you imported in order to avoid having to import it multiple times.

```ts
...
const openCVConfig: OpenCVOptions = {
  scriptUrl: `assets/opencv/opencv.js`,
  wasmBinaryFile: 'wasm/opencv_js.wasm',
  usingWasm: true
};

@NgModule({
    imports: [
        BrowserModule,
        NgOpenCVModule.forRoot(openCVConfig)
    ],
    exports: [BrowserModule, NgOpenCvModule],
})
export class SharedModule {
}
```

#### 3. Use the `NgOpenCVService` for your application
- Import `NgOpenCVService` from `ng-open-cv` in your application code:

```ts
import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { fromEvent, Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { NgOpenCVService, OpenCVLoadResult } from 'ng-open-cv';

@Component({
  selector: 'app-hello',
  templateUrl: './hello.component.html',
  styleUrls: ['./hello.component.css']
})
export class HelloComponent implements OnInit {

  // Keep tracks of the ready
  openCVLoadResult: Observable<OpenCVLoadResult>;

  // HTML Element references
  @ViewChild('fileInput')
  fileInput: ElementRef;
  @ViewChild('canvasOutput')
  canvasOutput: ElementRef;

  constructor(private ngOpenCVService: NgOpenCVService) { }

  ngOnInit() {
    this.openCVLoadResult = this.ngOpenCVService.isReady$;
  }

  loadImage(event) {
    if (event.target.files.length) {
      const reader = new FileReader();
      const load$ = fromEvent(reader, 'load');
      load$
        .pipe(
          switchMap(() => {
            return this.ngOpenCVService.loadImageToHTMLCanvas(`${reader.result}`, this.canvasOutput.nativeElement);
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

```
 
 The NgOpenCVService exposes a `isReady$` observable which you should always subscribe too before attempting to do anything OpenCV related. It emits an [OpenCVLoadResult](projects/ng-open-cv/src/lib/ng-open-cv.models.ts) object that is structured as:


 ```ts

export interface OpenCVLoadResult {
  ready: boolean;
  error: boolean;
  loading: boolean;
}

 ````
 
 
 The following function gives you an example of how to use it your code:

 ```ts
 detectFace() {
    // before detecting the face we need to make sure that
    // 1. OpenCV is loaded
    // 2. The classifiers have been loaded
    this.ngOpenCVService.isReady$
      .pipe(
        filter((result: OpenCVLoadResult) => result.ready),
        switchMap(() => {
          return this.classifiersLoaded$;
        }),
        tap(() => {
          this.clearOutputCanvas();
          this.findFaceAndEyes();
        })
      )
      .subscribe(() => {
        console.log('Face detected');
      });
  }
 ```

You can view more of this example code in the [Face Detection Component](src/app/face-detection/face-detection.component.ts)

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `--prod` flag for a production build.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via [Protractor](http://www.protractortest.org/).

# Credits 
 [OpenCV.js](https://github.com/opencv/opencv)
 
 [How to build a library for Angular apps](https://medium.com/@tomsu/how-to-build-a-library-for-angular-apps-4f9b38b0ed11)

# License
 [MIT](/LICENSE)
