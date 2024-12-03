import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { GenerateReportsComponent } from './generate-reports/generate-reports.component';

const routes: Routes = [
  {
    path: 'generateReports',
    component: GenerateReportsComponent,
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ReportRoutingModule { }
