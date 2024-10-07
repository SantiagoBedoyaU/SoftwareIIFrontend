import { Component } from '@angular/core';
import { SecurityService } from '../../../services/security.service';
import { Router } from '@angular/router';
import { UserValidateModel } from '../../../modelos/user.validate.model';

@Component({
  selector: 'app-logout',
  standalone: true,
  imports: [],
  templateUrl: './logout.component.html',
  styleUrl: './logout.component.css'
})
export class LogoutComponent {

  constructor(
    private securityService: SecurityService,
    private router: Router
  ) { }

  ngOnInit() {
    this.logout();
  }

  logout() {
    this.securityService.RemoveLoggedUserData();
    this.securityService.UpdateUserBehavior(new UserValidateModel()); 
this.router.navigate(['']);
  }

}
