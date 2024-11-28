import { Injectable } from '@angular/core';
import { urlBackend } from '../config/configuration.routes.backend';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { SecurityService } from './security.service';
import { Observable } from 'rxjs';
import { UserModel } from '../modelos/user.model';
import { UnavailableTime } from '../modelos/unavaibale-times.model';

@Injectable({
  providedIn: 'root'
})
export class UnavailableTimeService {
  urlBase: string = urlBackend;

  constructor(
    private http: HttpClient,
    private securityService: SecurityService
  ) { }

  /**
   * Method to get the user data
   * @returns Observable with the user data
   */
  GetUserData(): Observable<UserModel> {
    return this.securityService.GetUserData();
  }

  getUnavailableTimes(startDate: string, endDate: string, doctorId: string): Observable<UnavailableTime[]> {
    const token = this.securityService.GetToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get<UnavailableTime[]>(`${this.urlBase}unavailable-times?start_date=${startDate}&end_date=${endDate}&doctor_id=${doctorId}`, { headers });
  }

  updateUnavailableTimes(id: string, data: UnavailableTime): Observable<UnavailableTime> {
    const token = this.securityService.GetToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.patch<UnavailableTime>(`${this.urlBase}unavailable-times/${id}`, data, {headers});
  }

  deleteUnavailableTimes(id: string): Observable<unknown> {
    const token = this.securityService.GetToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.delete(`${this.urlBase}unavailable-times/${id}`, {headers})
  }

  createUnavailableTimes(data: UnavailableTime): Observable<UnavailableTime> {
    const token = this.securityService.GetToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.post<UnavailableTime>(`${this.urlBase}unavailable-times`, data, {headers});
  }
}
