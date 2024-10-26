import { CommonModule } from '@angular/common';
import { Component, AfterViewInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { SecurityService } from '../../../services/security.service';
import { ItemMenuModel } from '../../../modelos/item.menu.model';
import { Subscription } from 'rxjs';
import { RouterLink } from '@angular/router';
import { MenuItem } from '../../../config/configuration.sidebar';
import { UserModel } from '../../../modelos/user.model';

declare var M: any;

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink
  ],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements AfterViewInit, OnDestroy {
  activesession: boolean = false;
  menuItems: MenuItem[] = [];
  user: UserModel | null = null;  
  subscription: Subscription = new Subscription();

  constructor(
    private securityService: SecurityService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.subscription.add(
      this.securityService.GetDataSession().subscribe(data => {
        this.activesession = !!data.token;

        if (this.activesession && data.user) {
          this.user = data.user; // Almacena los datos del usuario.
          const role = data.user.Role ? +data.user.Role : 0;
          this.securityService.UpdateMenu(role);
        } else {
          this.menuItems = [];
          this.user = null; // Limpia los datos si no hay sesión activa.
        }
        this.cdr.detectChanges(); // Fuerza la detección de cambios.
      })
    );

    this.subscription.add(
      this.securityService.getLogoutEvent().subscribe(() => {
        this.activesession = false;
        this.menuItems = [];
        this.user = null; // Limpia los datos del usuario al cerrar sesión.
        this.cdr.detectChanges(); // Actualiza la vista.
      })
    );

    this.subscription.add(
      this.securityService.GetMenuItems().subscribe(items => {
        console.log('Items del menu recibidos:', items);
        this.menuItems = items;
        this.cdr.detectChanges(); // Actualiza la vista cuando cambian los ítems.
      })
    );
  }

  ngAfterViewInit() {
    setTimeout(() => {
      const elems = document.querySelectorAll('.sidenav');
      if (elems) {
        M.Sidenav.init(elems, { edge: 'right' });
      }
    }, 0);
  }

  openSidenav() {
    const sidenav = document.querySelector('#slide-out') as HTMLElement;
    const instance = M.Sidenav.getInstance(sidenav);
    if (instance) {
      instance.open();
    }
  }

  closeSidenav() {
    const sidenav = document.querySelector('#slide-out') as HTMLElement;
    const instance = M.Sidenav.getInstance(sidenav);
    if (instance) {
      instance.close();
    }
  }

  ngOnDestroy() {
    this.subscription.unsubscribe(); // Limpia las suscripciones para evitar fugas de memoria.
  }
}
