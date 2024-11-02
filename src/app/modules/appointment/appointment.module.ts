import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AddAppointmentComponent } from './add-appointment/add-appointment.component';
import { AppointmentRoutingModule } from './appointment-routing.module';
import { ReactiveFormsModule } from '@angular/forms';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    AppointmentRoutingModule,
    AddAppointmentComponent,
    ReactiveFormsModule
  ],
})
export class AppointmentModule {}
