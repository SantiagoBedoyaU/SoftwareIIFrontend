import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SigninComponent } from './signin/signin.component';
import { LogoutComponent } from './logout/logout.component';

const routes: Routes = [
  {
    path: "signin",
    component: SigninComponent
  },
  {
    path: "logout",
    component: LogoutComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SecurityRoutingModule { }
