import { Component, OnInit } from '@angular/core';
import { SecurityService } from '../../../services/security.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-logout',
  standalone: true,
  imports: [],
  templateUrl: './logout.component.html',
  styleUrl: './logout.component.css'
})


export class LogoutComponent implements OnInit {
  constructor(
    private securityService: SecurityService,
    private router: Router,
  ) {}

  ngOnInit() {
    this.logout();
  }

  logout() {
    this.securityService.RemoveLoggedUserData();
    this.router.navigate(['']).then(() => {
      window.location.reload(); // Ahora depende del objeto inyectado
    });
  }
}