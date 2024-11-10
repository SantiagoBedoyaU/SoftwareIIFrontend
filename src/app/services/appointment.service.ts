import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { urlBackend } from '../config/configuration.routes.backend';
import { catchError } from 'rxjs/operators';
import { SecurityService } from './security.service';
import { Appointment } from '../modelos/appointment.model';
import { UserModel } from '../modelos/user.model';

@Injectable({
  providedIn: 'root'
})
export class AppointmentService {
  urlBase: string = urlBackend;

  constructor(private http: HttpClient, private securityService: SecurityService) {}

  /**
   * 
   * @param appointmentData 
   * @returns 
   */
  createAppointment(appointmentData: Appointment): Observable<Appointment> {
    const token = this.securityService.GetToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.post<Appointment>(`${this.urlBase}appointments`, appointmentData, { headers }).pipe(
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
  getDoctors(): Observable<UserModel[]> {
    const token = this.securityService.GetToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get<UserModel[]>(`${this.urlBase}users?role=1`, { headers }).pipe(
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
  getAppointmentsByDoctor(startDate: string, endDate: string, doctorID: string): Observable<Appointment[]> {
    const token = this.securityService.GetToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);	

    const queryParams = `?start_date=${startDate}&end_date=${endDate}&doctor_id=${doctorID}`;
    return this.http.get<Appointment[]>(`${this.urlBase}appointments${queryParams}`, { headers });
  }

   /**
  * @param startDate
  * @param endDate
  * @param patientID
  * @returns data of the appointments
  */
   getAppointmentsByPatient(startDate: string, endDate: string, patientID: string): Observable<Appointment[]> {
    const token = this.securityService.GetToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);	

    const queryParams = `?start_date=${startDate}&end_date=${endDate}&patient_id=${patientID}`;
    return this.http.get<Appointment[]>(`${this.urlBase}appointments${queryParams}`, { headers });
  }  

  
  /**
   * @param appointmentId 
   * @returns 
   */
  // Cancel an appointment by its ID 
  cancelAppointment(appointmentId: string): Observable<Appointment> {
    const token = this.securityService.GetToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.patch(`${this.urlBase}appointments/${appointmentId}`, {}, { headers }).pipe(
      catchError((error) => {
        console.error('Error al cancelar la cita:', error);
        return throwError(() => error);
      })
    );
  }
}
