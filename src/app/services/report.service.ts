import { Injectable } from '@angular/core';
import { urlBackend } from '../config/configuration.routes.backend';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { SecurityService } from './security.service';
import { Observable } from 'rxjs';
import { AttendanceReport, WaitingTimeReport } from '../modelos/report.model';

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  urlBase: string = urlBackend;

  constructor(
    private http: HttpClient,
    private securityService: SecurityService
  ) { }

  /**
   * 
   * @param startDate 
   * @param endDate 
   * @returns 
   */
  getAttendanceReport(startDate: string, endDate: string): Observable<AttendanceReport> {
    const token = this.securityService.GetToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get<AttendanceReport>(`${this.urlBase}reports/attendance-report?start_date=${startDate}&end_date=${endDate}`, { headers });
  }

  /**
   * 
   * @param startDate 
   * @param endDate 
   * @returns 
   */
  getWaitingTimeReport(startDate: string, endDate: string): Observable<WaitingTimeReport> {
    const token = this.securityService.GetToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get<WaitingTimeReport>(`${this.urlBase}reports/waiting-time-report?start_date=${startDate}&end_date=${endDate}`, { headers });
  }
}
