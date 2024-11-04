import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AddAppointmentComponent } from './add-appointment/add-appointment.component';
import { ConsultHoursComponent } from './consult-hours/consult-hours.component';
import { CancelAppointmentComponent } from './cancel-appointment/cancel-appointment.component';

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
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AppointmentRoutingModule { }