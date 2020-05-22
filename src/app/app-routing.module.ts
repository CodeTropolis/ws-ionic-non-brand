import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';

const routes: Routes = [
  // { path: '', loadChildren: './tabs/tabs.module#TabsPageModule' },
  { path: '', loadChildren: './pages/login/login.module#LoginPageModule' },
  { path: 'login', loadChildren: './pages/login/login.module#LoginPageModule' },
  { path: 'students', loadChildren: './pages/students/students.module#StudentsPageModule', canLoad: [AuthGuard] },
  { path: 'financials', loadChildren: './pages/financials/financials.module#FinancialsPageModule', canLoad: [AuthGuard] },
  // { path: 'charges-report', loadChildren: './pages/modals/charges-report/charges-report.module#ChargesReportPageModule' },
  // { path: 'family-info', loadChildren: '.pages/modals/family-info/family-info.module#FamilyInfoPageModule' },

];
// Prevent 500 error upon refresh: https://stackoverflow.com/a/57355797
@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules, useHash: true })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
