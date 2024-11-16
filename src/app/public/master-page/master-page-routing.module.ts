import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AfterViewInit } from '@angular/core';

declare const M: any;
const routes: Routes = [];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MasterPageRoutingModule { ngAfterViewInit() {
  // Inicializar sidenav para dispositivos móviles
  const elems = document.querySelectorAll('.sidenav');
  M.Sidenav.init(elems, { edge: 'right' }); // Alineado a la derecha
}}





