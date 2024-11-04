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

  /**
   * 
   * @param appointmentData 
   * @returns 
   */
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

  /**
   * 
   * @param appointmentData 
   * @returns 
   */
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

  /**
   * 
   * @param startDate 
   * @param endDate 
   * @param doctorID 
   * @returns data of the appointments
   */
  getAppointmentsByDoctor(startDate: string, endDate: string, doctorID: string): Observable<any> {
    const token = this.securityService.GetToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);	

    const queryParams = `?start_date=${startDate}&end_date=${endDate}&doctor_id=${doctorID}`;
    return this.http.get(`${this.urlBase}appointments${queryParams}`, { headers });
  }

}
