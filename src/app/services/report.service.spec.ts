import { TestBed } from '@angular/core/testing';

import { ReportService } from './report.service';
import { AttendanceReport, ConsultedDoctorsReport, UsersDNIReport, WaitingTimeReport } from '../modelos/report.model';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { SecurityService } from './security.service';

describe('ReportService', () => {
  let service: ReportService;
  let httpMock: HttpTestingController;
  let securityServiceMock: jasmine.SpyObj<SecurityService>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('SecurityService', ['GetToken']);
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ReportService,
        { provide: SecurityService, useValue: spy }
      ]
    });

    service = TestBed.inject(ReportService);
    httpMock = TestBed.inject(HttpTestingController);
    securityServiceMock = TestBed.inject(SecurityService) as jasmine.SpyObj<SecurityService>;
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should return attendance report data', () => {
    const mockAttendanceReport: AttendanceReport = {
      attending_patients: 120,
      'non-attending_patients': 30,
      attendance_percentage: 80,
      'non-attendance_percentage': 20
    };
    const startDate = '2024-01-01';
    const endDate = '2024-01-31';

    securityServiceMock.GetToken.and.returnValue('fake-token');

    service.getAttendanceReport(startDate, endDate).subscribe((data) => {
      expect(data).toEqual(mockAttendanceReport);
    });

    const req = httpMock.expectOne(`${service.urlBase}reports/attendance-report?start_date=${startDate}&end_date=${endDate}`);
    expect(req.request.method).toBe('GET');
    req.flush(mockAttendanceReport);
  });

  it('should return waiting time report data', () => {
    const mockWaitingTimeReport: WaitingTimeReport = {
      average_per_day: {
        '2024-01-01': 10,
        '2024-01-02': 15
      },
      days_with_max_waiting_time: '2024-01-02',
      days_with_min_waiting_time: '2024-01-01'
    };
    const startDate = '2024-01-01';
    const endDate = '2024-01-31';

    securityServiceMock.GetToken.and.returnValue('fake-token');

    service.getWaitingTimeReport(startDate, endDate).subscribe((data) => {
      expect(data).toEqual(mockWaitingTimeReport);
    });

    const req = httpMock.expectOne(`${service.urlBase}reports/waiting-time-report?start_date=${startDate}&end_date=${endDate}`);
    expect(req.request.method).toBe('GET');
    req.flush(mockWaitingTimeReport);
  });

  it('should return users DNI report data', () => {
    const mockUsersDNIReport: UsersDNIReport = {
      cc_users: 200,
      ti_users: 150,
      tp_users: 50,
      cc_percentage: 40,
      ti_percentage: 30,
      tp_percentage: 30
    };

    securityServiceMock.GetToken.and.returnValue('fake-token');

    service.getUsersDNIReport().subscribe((data) => {
      expect(data).toEqual(mockUsersDNIReport);
    });

    const req = httpMock.expectOne(`${service.urlBase}reports/users-dni-report`);
    expect(req.request.method).toBe('GET');
    req.flush(mockUsersDNIReport);
  });

  it('should return most consulted doctors report data', () => {
    const mockConsultedDoctorsReport: ConsultedDoctorsReport = {
      doctors: {
        'Dr. Smith': 100,
        'Dr. Johnson': 120
      }
    };
    const startDate = '2024-01-01';
    const endDate = '2024-01-31';

    securityServiceMock.GetToken.and.returnValue('fake-token');

    service.getMostConsultedDoctors(startDate, endDate).subscribe((data) => {
      expect(data).toEqual(mockConsultedDoctorsReport);
    });

    const req = httpMock.expectOne(`${service.urlBase}reports/most-consulted-doctors?start_date=${startDate}&end_date=${endDate}`);
    expect(req.request.method).toBe('GET');
    req.flush(mockConsultedDoctorsReport);
  });
});

// ng test --include src/app/services/report.service.spec.ts --code-coverage
