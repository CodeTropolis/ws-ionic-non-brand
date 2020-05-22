import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { FinancialsPage } from './financials.page';
import { MaterialModule } from '../../material.module';
import { HistoryComponent } from './history/history.component';
import { TaxFormPageModule } from '../modals/tax-form/tax-form.module';
import { ChargesReportPageModule } from '../modals/charges-report/charges-report.module';
import { ScreenOrientation } from '@ionic-native/screen-orientation/ngx';
import { StudentService } from '../students/students.service';

const routes: Routes = [
  {
    path: '',
    component: FinancialsPage
  }
];

@NgModule({
  imports: [
    CommonModule,
    IonicModule,
    RouterModule.forChild(routes),
    MaterialModule,
    ReactiveFormsModule,
    TaxFormPageModule,
    ChargesReportPageModule,
  ],
  declarations: [FinancialsPage, HistoryComponent],
  providers: [ScreenOrientation, StudentService]
})
export class FinancialsPageModule {}
