import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SigninComponent } from './signin/signin.component';
import { LogoutComponent } from './logout/logout.component';
import { RecoverPasswordComponent } from './recover-password/recover-password.component';
import { PasswordResetComponent } from './password-reset/password-reset.component';
import { PatientDoctorRegistrationComponent } from './patient-doctor-registration/patient-doctor-registration.component';
import { PasswordChangeComponent } from './password-change/password-change.component';

const routes: Routes = [
  {
    path: "signin",
    component: SigninComponent
  },
  {
    path: "logout",
    component: LogoutComponent
  },
  {
    path: "recoverPassword",
    component: RecoverPasswordComponent
  },
  {
    path: "password-reset",
    component: PasswordResetComponent
  },
  {
    path: "patientDoctorRegistration",
    component: PatientDoctorRegistrationComponent
  },
  {
    path: "password-change",
    component: PasswordChangeComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SecurityRoutingModule { }
