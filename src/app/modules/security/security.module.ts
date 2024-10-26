import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SecurityRoutingModule } from './security-routing.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SigninComponent } from './signin/signin.component';
import { PatientDoctorRegistrationComponent } from './patient-doctor-registration/patient-doctor-registration.component';


@NgModule({
  declarations: [
    PatientDoctorRegistrationComponent
  ],
  imports: [
    CommonModule,
    SecurityRoutingModule,
    ReactiveFormsModule,
    FormsModule,
    SigninComponent
  ]
})
export class SecurityModule { }
