import { Routes } from '@angular/router';
import { HomeComponent } from './public/home/home.component';
import { RouteNotFoundComponent } from './public/errors/route-not-found/route-not-found.component';

export const routes: Routes = [
    {
        path: "home",
        component: HomeComponent
      },
      {
        path:"",
        pathMatch: "full",
        redirectTo: "/home"
      },
      {
        path: "**",
        component: RouteNotFoundComponent
      }
];
