import { Injectable } from '@angular/core';
import { ConfigurationRoutesBackend } from '../config/configuration.routes.backend';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { SecurityService } from './security.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  urlBase: string = ConfigurationRoutesBackend.urlBackend;

  constructor(
    private http: HttpClient,
    private securityService: SecurityService
  ) { }

  /**
   * Method to get the user data
   * @returns Observable with the user data
   */
  GetUserData(): Observable<any> {
    return this.securityService.GetUserData();
  }

  /**
   * Method to update the user data
   * @param data User data to update
   * @returns Observable with the response
   */
  UpdateUserData(data: any) {
    const token = this.securityService.GetToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.patch(`${this.urlBase}users/me`, data, { headers });
  }
}
