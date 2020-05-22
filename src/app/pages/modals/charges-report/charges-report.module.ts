import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { ChargesReportPage } from './charges-report.page';

const routes: Routes = [
  {
    path: 'charges-report',
    component: ChargesReportPage
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes)
  ],
  declarations: [ChargesReportPage]
})
export class ChargesReportPageModule {}
