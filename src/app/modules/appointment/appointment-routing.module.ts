import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AddAppointmentComponent } from './add-appointment/add-appointment.component';
import { ConsultHoursComponent } from './consult-hours/consult-hours.component';
import { CancelAppointmentComponent } from './cancel-appointment/cancel-appointment.component';
import { AddNewHistoryComponent } from './add-new-history/add-new-history.component';

const routes: Routes = [
  {
    path: 'addAppointment',
    component: AddAppointmentComponent,
  },
  {
    path: 'consultHours',
    component: ConsultHoursComponent,
  },
  {
    path: 'cancelAppointment',
    component: CancelAppointmentComponent,
  },
  {
    path: 'addNewHistory',
    component: AddNewHistoryComponent,
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AppointmentRoutingModule { }