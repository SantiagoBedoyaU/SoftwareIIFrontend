import { CommonModule } from '@angular/common';
import { Component, AfterViewInit, OnDestroy } from '@angular/core';
import { SecurityService } from '../../../services/security.service';
import { ItemMenuModel } from '../../../modelos/item.menu.model';
import { Subscription } from 'rxjs';

declare var M: any;

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements AfterViewInit, OnDestroy {
  menulist: ItemMenuModel[] = [];
  activesession: boolean = false;
  subscription: Subscription = new Subscription();

  constructor(private securityService: SecurityService) { }

  ngOnInit() {
    // Suscríbete al BehaviorSubject para recibir actualizaciones del estado de la sesión
    this.subscription = this.securityService.GetDataSession().subscribe(data => {
      this.activesession = !!data.token; // Actualiza el estado de la sesión
    });
  }

  ngAfterViewInit() {
    const elems = document.querySelectorAll('.sidenav');
    M.Sidenav.init(elems, { edge: 'right' });
  }

  ngOnDestroy() {
    this.subscription.unsubscribe(); // Asegúrate de limpiar la suscripción
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
}