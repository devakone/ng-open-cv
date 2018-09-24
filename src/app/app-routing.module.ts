import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { FaceDetectionComponent } from './face-detection/face-detection.component';
import { ExampleListComponent } from './example-list/example-list.component';
import { HelloComponent } from './hello/hello.component';

const routes: Routes = [
  { path: 'hello', component: HelloComponent },
  { path: 'face-detection', component: FaceDetectionComponent },
  { path: 'example-list', component: ExampleListComponent },
  { path: '', redirectTo: '/example-list', pathMatch: 'full' },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes)
  ],
  declarations: []
})
export class AppRoutingModule { }
