import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { GenerateReportsComponent } from './generate-reports.component';
import { of, throwError } from 'rxjs';
import { ReportService } from '../../../services/report.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { AttendanceReport, ConsultedDoctorsReport, UsersDNIReport, WaitingTimeReport } from '../../../modelos/report.model';

interface MGlobal {
  Modal: {
    init: jasmine.Spy;
    getInstance: jasmine.Spy;
  };
  closeModal: jasmine.Spy;
}

describe('GenerateReportsComponent', () => {
  let component: GenerateReportsComponent;
  let fixture: ComponentFixture<GenerateReportsComponent>;
  let mockReportService: jasmine.SpyObj<ReportService>;
  let mockM: MGlobal;

  beforeEach(async () => {
    mockReportService = jasmine.createSpyObj('ReportService', [
      'getAttendanceReport',
      'getWaitingTimeReport',
      'getUsersDNIReport',
      'getMostConsultedDoctors',
    ]);

    // Mock de Materialize para evitar errores durante las pruebas
    mockM = {
      Modal: {
        init: jasmine.createSpy('init'),
        getInstance: jasmine.createSpy('getInstance').and.returnValue({
          open: jasmine.createSpy('open'),
          close: jasmine.createSpy('close'),
        }),
      },
      closeModal: jasmine.createSpy('closeModal'),
    };
    (window as unknown as { M: MGlobal }).M = mockM;

    await TestBed.configureTestingModule({
      imports: [GenerateReportsComponent, FormsModule, CommonModule, HttpClientTestingModule],
      providers: [],
    }).compileComponents();

    fixture = TestBed.createComponent(GenerateReportsComponent);
    component = fixture.componentInstance;
    mockReportService = TestBed.inject(ReportService) as jasmine.SpyObj<ReportService>;
    fixture.detectChanges();

  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('selectReport', () => {
    beforeEach(() => {
      spyOn(component, 'showModal');
      spyOn(component, 'generateAttendanceReport');
      spyOn(component, 'generateWaitingTimeReport');
      spyOn(component, 'generateUsersDNIReport');
      spyOn(component, 'generateConsultedDoctorsReport');
    });

    it('should show error modal if startDate or endDate is empty', () => {
      component.selectReport('attendance');
      expect(component.showModal).toHaveBeenCalledWith(
        'errorModal',
        'Por favor, selecciona una fecha de inicio y fin.'
      );
    });

    it('should show error modal if endDate is in the future', () => {
      component.startDate = '2023-01-01';
      component.endDate = new Date().toISOString().split('T')[0];
      component.selectReport('attendance');
      expect(component.showModal).toHaveBeenCalledWith(
        'errorModal',
        'La fecha de fin no puede ser mayor o igual a la fecha actual.'
      );
    });

    it('should call generateAttendanceReport for attendance report type', () => {
      component.startDate = '2023-01-01';
      component.endDate = '2023-01-02';
      component.selectReport('attendance');
      expect(component.generateAttendanceReport).toHaveBeenCalled();
    });

    it('should call generateWaitingTimeReport for waitingTime report type', () => {
      component.startDate = '2023-01-01';
      component.endDate = '2023-01-02';
      component.selectReport('waitingTime');
      expect(component.generateWaitingTimeReport).toHaveBeenCalled();
    });

    it('should call generateConsultedDoctorsReport for mostConsultedDoctors report type', () => {
      component.startDate = '2023-01-01';
      component.endDate = '2023-01-02';
      component.selectReport('mostConsultedDoctors');
      expect(component.generateConsultedDoctorsReport).toHaveBeenCalled();
    });
  });

  // Pruebas para el método generateWaitingTimeReport
  it('should fetch attendance report and generate charts', () => {
    const mockData: AttendanceReport = 
      { 
        attending_patients: 10, 
        'non-attending_patients': 5, 
        attendance_percentage: 66.67, 
        'non-attendance_percentage': 33.33 
      };

    // Configura el mock del servicio
    mockReportService.getAttendanceReport = jasmine.createSpy('getAttendanceReport').and.returnValue(of(mockData));

    spyOn(component, 'loadAttendanceChart');
    spyOn(component, 'loadAttendancePieChart');

    // Llama al método
    component.generateAttendanceReport();

    // Verifica que el servicio fue llamado con los parámetros correctos
    expect(mockReportService.getAttendanceReport).toHaveBeenCalledWith(component.startDate, component.endDate);

    // Verifica que los datos fueron asignados correctamente
    expect(component.attendanceReport).toEqual(mockData);

    // Verifica que se llamaron los métodos de generación de gráficos
    expect(component.loadAttendanceChart).toHaveBeenCalled();
    expect(component.loadAttendancePieChart).toHaveBeenCalled();
  });

  // Pruebas para el método generateWaitingTimeReport
  it('should handle error when fetching attendance report', () => {
    mockReportService.getAttendanceReport = jasmine.createSpy('getAttendanceReport').and.returnValue(throwError('Error fetching report'));
  
    component.generateAttendanceReport();
  
    expect(component.attendanceReport).toEqual({
      attending_patients: 0,
      'non-attending_patients': 0,
      attendance_percentage: 0,
      'non-attendance_percentage': 0,
    });
  });

  it('should fetch waiting time report and format dates correctly', () => {
    const mockReport: WaitingTimeReport = {
      average_per_day: { '2024-12-01': 15, '2024-12-02': 20 },
      days_with_max_waiting_time: '2024-12-01T00:00:00Z',
      days_with_min_waiting_time: '2024-12-05T00:00:00Z',
    };

    spyOn(component, 'loadWaitingTimeChart'); // Espía la función que genera el gráfico
    mockReportService.getWaitingTimeReport = jasmine.createSpy('getWaitingTimeReport').and.returnValue(of(mockReport)); // Configura el mock del servicio

    component.generateWaitingTimeReport();

    expect(component.waitingTimeReport).toEqual(mockReport);
    expect(component.formattedMaxWaitingDate).toBe('01/12/2024'); // Fecha formateada
    expect(component.formattedMinWaitingDate).toBe('05/12/2024'); // Fecha formateada
    expect(component.loadWaitingTimeChart).toHaveBeenCalled(); // Verifica que se genera el gráfico
  });

  it('should handle error when fetching waiting time report', () => {
    spyOn(console, 'error'); // Espía la consola para errores
    mockReportService.getWaitingTimeReport = jasmine.createSpy('getWaitingTimeReport').and.returnValue(throwError(new Error('Error fetching report'))); // Configura el mock del servicio
  
    component.generateWaitingTimeReport();
  
    expect(console.error).toHaveBeenCalledWith('Error fetching waiting time report:', jasmine.any(Error));
    expect(component.waitingTimeReport).toBeUndefined(); // No se asigna ningún valor
    expect(component.formattedMaxWaitingDate).toBe(''); // Valor predeterminado del componente
    expect(component.formattedMinWaitingDate).toBe(''); // Valor predeterminado del componente
  });

  it('should fetch users DNI report', () => {
    const mockReport: UsersDNIReport = {
      cc_users: 10,
      ti_users: 5,
      tp_users: 15,
      cc_percentage: 33.33,
      ti_percentage: 16.67,
      tp_percentage: 50,
    };

    spyOn(component, 'loadUserDNIChart');
    mockReportService.getUsersDNIReport = jasmine.createSpy('getUsersDNIReport').and.returnValue(of(mockReport));

    component.generateUsersDNIReport();

    expect(component.usersDNIReport).toEqual(mockReport);
    expect(component.loadUserDNIChart).toHaveBeenCalled();
  });

  it('should handle error when fetching users DNI report', () => {
    spyOn(console, 'error');
    mockReportService.getUsersDNIReport = jasmine
      .createSpy('getUsersDNIReport')
      .and.returnValue(throwError(new Error('Error fetching report')));
  
    component.generateUsersDNIReport();
  
    expect(console.error).toHaveBeenCalledWith(
      'Error fetching users DNI report:',
      jasmine.any(Error)
    );
    expect(component.usersDNIReport).toEqual({
      cc_users: 0,
      ti_users: 0,
      tp_users: 0,
      cc_percentage: 0,
      ti_percentage: 0,
      tp_percentage: 0,
    });
  });

  it('should fetch consulted doctors report', () => {
    const mockReport: ConsultedDoctorsReport = {
      doctors: { 'Dr. House': 10, 'Dr. Strange': 5 },
    };

    spyOn(component, 'loadDoctorsChart');
    mockReportService.getMostConsultedDoctors = jasmine.createSpy('getMostConsultedDoctors').and.returnValue(of(mockReport));

    component.generateConsultedDoctorsReport();

    expect(component.consultedDoctorsReport).toEqual(mockReport);
    expect(component.loadDoctorsChart).toHaveBeenCalled();
  });

  it('should handle error when fetching consulted doctors report', () => {
    spyOn(console, 'error');
    mockReportService.getMostConsultedDoctors = jasmine
      .createSpy('getMostConsultedDoctors')
      .and.returnValue(throwError(new Error('Error fetching report')));
  
    component.generateConsultedDoctorsReport();
  
    expect(console.error).toHaveBeenCalledWith(
      'Error fetching doctors report:',
      jasmine.any(Error)
    );
  
    // Actualiza la expectativa a null
    expect(component.consultedDoctorsReport).toBeNull();
  });

});



// ng test --include src/app/modules/report/generate-reports/generate-reports.component.spec.ts --code-coverage