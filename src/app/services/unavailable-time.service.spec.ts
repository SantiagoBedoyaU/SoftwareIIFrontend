import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { UnavailableTimeService } from './unavailable-time.service';
import { SecurityService } from './security.service';
import { UnavailableTime } from '../modelos/unavaibale-times.model';
import { of } from 'rxjs';

describe('UnavailableTimeService', () => {
  let service: UnavailableTimeService;
  let httpMock: HttpTestingController;
  let securityServiceMock: jasmine.SpyObj<SecurityService>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('SecurityService', ['GetToken', 'GetUserData']);
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        UnavailableTimeService,
        { provide: SecurityService, useValue: spy }
      ]
    });

    service = TestBed.inject(UnavailableTimeService);
    httpMock = TestBed.inject(HttpTestingController);
    securityServiceMock = TestBed.inject(SecurityService) as jasmine.SpyObj<SecurityService>;
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('GetUserData', () => {
    it('should return user data from SecurityService', () => {
      const mockUserData = { id: '123', name: 'John Doe', email: 'john@example.com' }; // Ajusta según tu UserModel
      securityServiceMock.GetUserData.and.returnValue(of(mockUserData));

      service.GetUserData().subscribe((data) => {
        expect(data).toEqual(mockUserData);
      });

      expect(securityServiceMock.GetUserData).toHaveBeenCalled();
    });
  });

  describe('getUnavailableTimes', () => {
    it('should return unavailable times for a doctor', () => {
      const mockUnavailableTimes: UnavailableTime[] = [
        { id: '1', start_date: '2024-01-01', end_date: '2024-01-02', doctor_id: 'doc123' },
        { id: '2', start_date: '2024-02-01', end_date: '2024-02-02', doctor_id: 'doc123' }
      ];
      const startDate = '2024-01-01';
      const endDate = '2024-02-01';
      const doctorId = 'doc123';

      securityServiceMock.GetToken.and.returnValue('fake-token');

      service.getUnavailableTimes(startDate, endDate, doctorId).subscribe((data) => {
        expect(data).toEqual(mockUnavailableTimes);
      });

      const req = httpMock.expectOne(`${service.urlBase}unavailable-times?start_date=${startDate}&end_date=${endDate}&doctor_id=${doctorId}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockUnavailableTimes);
    });
  });

  describe('updateUnavailableTimes', () => {
    it('should update an unavailable time', () => {
      const mockUnavailableTime: UnavailableTime = {
        id: '1',
        start_date: '2024-01-01',
        end_date: '2024-01-02',
        doctor_id: 'doc123'
      };

      securityServiceMock.GetToken.and.returnValue('fake-token');

      service.updateUnavailableTimes(mockUnavailableTime.id!, mockUnavailableTime).subscribe((data) => {
        expect(data).toEqual(mockUnavailableTime);
      });

      const req = httpMock.expectOne(`${service.urlBase}unavailable-times/${mockUnavailableTime.id}`);
      expect(req.request.method).toBe('PATCH');
      req.flush(mockUnavailableTime);
    });
  });

  describe('deleteUnavailableTimes', () => {
    it('should delete an unavailable time', () => {
      const id = '1';

      securityServiceMock.GetToken.and.returnValue('fake-token');

      service.deleteUnavailableTimes(id).subscribe((data) => {
        expect(data).toBeNull();
      });

      const req = httpMock.expectOne(`${service.urlBase}unavailable-times/${id}`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });

  describe('createUnavailableTimes', () => {
    it('should create a new unavailable time', () => {
      const newUnavailableTime: UnavailableTime = {
        id: '3',
        start_date: '2024-03-01',
        end_date: '2024-03-02',
        doctor_id: 'doc456'
      };

      securityServiceMock.GetToken.and.returnValue('fake-token');

      service.createUnavailableTimes(newUnavailableTime).subscribe((data) => {
        expect(data).toEqual(newUnavailableTime);
      });

      const req = httpMock.expectOne(`${service.urlBase}unavailable-times`);
      expect(req.request.method).toBe('POST');
      req.flush(newUnavailableTime);
    });
  });
});

// ng test --include src/app/services/unavailable-time.service.spec.ts --code-coverage