// This file is required by karma.conf.js and loads the app specs.

import 'zone.js';
import 'zone.js/testing';
import { getTestBed } from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting
} from '@angular/platform-browser-dynamic/testing';

import './app/app.component.spec';
import './app/example-list/example-list.component.spec';
import './app/face-detection/face-detection.component.spec';
import './app/hello/hello.component.spec';

// First, initialize the Angular testing environment.
getTestBed().initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting()
);
