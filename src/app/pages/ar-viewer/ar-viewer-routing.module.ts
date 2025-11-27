import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ArViewerPage } from './ar-viewer.page';

const routes: Routes = [
  {
    path: '',
    component: ArViewerPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ArViewerPageRoutingModule {}
