import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ConfigurationRoutesBackend } from '../config/configuration.routes.backend';
import { catchError } from 'rxjs/operators';
import { SecurityService } from './security.service';

@Injectable({
  providedIn: 'root'
})
export class AppointmentService {
  urlBase: string = ConfigurationRoutesBackend.urlBackend;

  constructor(private http: HttpClient, private securityService: SecurityService) {}

  createAppointment(appointmentData: any): Observable<any> {
    const token = this.securityService.GetToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.post(`${this.urlBase}appointments`, appointmentData, { headers }).pipe(
      catchError((error) => {
        console.error('Error al crear la cita:', error);
        if (error.error) {
          console.error('Detalles del error:', error.error);
        }
        return throwError(() => error);
      })
    );
  }

  getDoctors(): Observable<any[]> {
    const token = this.securityService.GetToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get<any[]>(`${this.urlBase}users?role=1`, { headers }).pipe(
      catchError((error) => {
        console.error('Error al obtener la lista de doctores:', error);
        return throwError(() => error);
      })
    );
  }
}
