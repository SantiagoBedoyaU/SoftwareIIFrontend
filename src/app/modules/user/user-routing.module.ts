import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { GetPersonalDataComponent } from './get-personal-data/get-personal-data.component';
import { PatchPersonalDataComponent } from './patch-personal-data/patch-personal-data.component';

const routes: Routes = [
  {
    path: "get-personal-data",
    component: GetPersonalDataComponent
  },
  {
    path: "patch-personal-data",
    component: PatchPersonalDataComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UserRoutingModule { }
