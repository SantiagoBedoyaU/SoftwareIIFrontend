import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ViewHistoryForPatientComponent } from './view-history-for-patient.component';
import { AppointmentService } from '../../../services/appointment.service';
import { SecurityService } from '../../../services/security.service';
import { of, throwError } from 'rxjs';
import { Appointment } from '../../../modelos/appointment.model';
import { HttpErrorResponse } from '@angular/common/http';
import M from 'materialize-css';

describe('ViewHistoryForPatientComponent', () => {
  let component: ViewHistoryForPatientComponent;
  let fixture: ComponentFixture<ViewHistoryForPatientComponent>;
  let mockAppointmentService: jasmine.SpyObj<AppointmentService>;
  let mockSecurityService: jasmine.SpyObj<SecurityService>;

  beforeEach(async () => {
    mockAppointmentService = jasmine.createSpyObj('AppointmentService', ['getMyHistory']);
    mockSecurityService = jasmine.createSpyObj('SecurityService', ['getUserByDNI']);
    
    await TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, ViewHistoryForPatientComponent], // Importar el componente
      providers: [
        { provide: AppointmentService, useValue: mockAppointmentService },
        { provide: SecurityService, useValue: mockSecurityService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ViewHistoryForPatientComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize modals and load appointments on init', fakeAsync(() => {
    const modalInitSpy = spyOn(M.Modal, 'init');
    const loadAppointmentsSpy = spyOn(component, 'loadMyAppointments').and.callThrough();

    const mockAppointments: Appointment[] = [
      { id: '1', doctor_id: 'doc1', start_date: new Date().toISOString(), end_date: new Date().toISOString(), status: 2, procedures: [] }
    ];
    mockAppointmentService.getMyHistory.and.returnValue(of(mockAppointments));
    mockSecurityService.getUserByDNI.and.returnValue(of({ first_name: 'John', last_name: 'Doe' }));

    component.ngOnInit();
    tick(); // simulate passage of time to allow for subscriptions to resolve

    expect(modalInitSpy).toHaveBeenCalled();
    expect(loadAppointmentsSpy).toHaveBeenCalled();
    expect(component.appointments.length).toBe(1);
    expect(component.appointments[0].id).toBe('1');
    expect(component.appointments[0].doctor_name).toBe('John Doe');
  }));

  it('should load appointments and filter completed ones', fakeAsync(() => {
    const mockAppointments: Appointment[] = [
      { id: '1', doctor_id: 'doc1', start_date: new Date().toISOString(), end_date: new Date().toISOString(), status: 2, procedures: [] },
      { id: '2', doctor_id: 'doc2', start_date: new Date().toISOString(), end_date: new Date().toISOString(), status: 1, procedures: [] },
    ];
    
    mockAppointmentService.getMyHistory.and.returnValue(of(mockAppointments));
    mockSecurityService.getUserByDNI.and.returnValue(of({ first_name: 'John', last_name: 'Doe' }));

    component.loadMyAppointments();
    tick(); // simulate passage of time to allow for subscriptions to resolve

    expect(component.appointments.length).toBe(1);
    expect(component.appointments[0].id).toBe('1');
    expect(component.appointments[0].doctor_name).toBe('John Doe');
  }));

  it('should handle error when loading appointments', () => {
    const errorResponse = new HttpErrorResponse({ error: 'test error', status: 500, statusText: 'Internal Server Error' });
    mockAppointmentService.getMyHistory.and.returnValue(throwError(() => errorResponse));

    const consoleErrorSpy = spyOn(console, 'error');

    component.loadMyAppointments();

    expect(consoleErrorSpy).toHaveBeenCalledWith('Error al obtener mis citas:', errorResponse);
    expect(component.appointments.length).toBe(0);
  });

  it('should show no appointments modal if there are no completed appointments', fakeAsync(() => {
    const modalElement = document.createElement('div');
    modalElement.id = 'noAppointmentsModal';
    document.body.appendChild(modalElement);
  
    const modalInstance: Partial<M.Modal> = {
      open: jasmine.createSpy('open'),
    };
  
    spyOn(M.Modal, 'getInstance').and.returnValue(modalInstance as M.Modal);
  
    mockAppointmentService.getMyHistory.and.returnValue(of([]));
  
    component.loadMyAppointments();
    tick();
  
    expect(modalInstance.open).toHaveBeenCalled();
    document.body.removeChild(modalElement);
  }));
  
  

  it('should fetch and set doctor name for each appointment', fakeAsync(() => {
    const mockAppointments: Appointment[] = [
      { id: '1', doctor_id: 'doc1', start_date: new Date().toISOString(), end_date: new Date().toISOString(), status: 2, procedures: [] },
    ];

    mockAppointmentService.getMyHistory.and.returnValue(of(mockAppointments));
    mockSecurityService.getUserByDNI.and.returnValue(of({ first_name: 'John', last_name: 'Doe' }));

    component.loadMyAppointments();
    tick(); // simulate passage of time to allow for subscriptions to resolve

    expect(mockSecurityService.getUserByDNI).toHaveBeenCalledWith('doc1');
    expect(component.appointments[0].doctor_name).toBe('John Doe');
  }));

  it('should set doctor_name to "Nombre no disponible" if doctor data is not available', fakeAsync(() => {
    const mockAppointments: Appointment[] = [
      { id: '1', doctor_id: undefined, start_date: new Date().toISOString(), end_date: new Date().toISOString(), status: 2, procedures: [] },
    ];

    mockAppointmentService.getMyHistory.and.returnValue(of(mockAppointments));
    mockSecurityService.getUserByDNI.and.returnValue(of(null)); // Simulating no doctor data

    component.loadMyAppointments();
    tick(); // simulate passage of time to allow for subscriptions to resolve

    expect(mockSecurityService.getUserByDNI).toHaveBeenCalledWith(''); // should call with empty string
    expect(component.appointments[0].doctor_name).toBe('Nombre no disponible');
  }));

  it('should handle error when fetching doctor name and set doctor_name to "Nombre no disponible"', fakeAsync(() => {
    const mockAppointments: Appointment[] = [
      { id: '1', doctor_id: undefined, start_date: new Date().toISOString(), end_date: new Date().toISOString(), status: 2, procedures: [] },
    ];

    mockAppointmentService.getMyHistory.and.returnValue(of(mockAppointments));
    mockSecurityService.getUserByDNI.and.returnValue(throwError(() => new Error('Not found')));

    component.loadMyAppointments();
    tick(); // simulate passage of time to allow for subscriptions to resolve

    expect(mockSecurityService.getUserByDNI).toHaveBeenCalledWith(''); // should call with empty string
    expect(component.appointments[0].doctor_name).toBe('Nombre no disponible');
  }));

  it('should select an appointment', () => {
    const appointment = { id: '1', doctor_id: 'doc1', start_date: new Date().toISOString(), end_date: new Date().toISOString(), status: 2, procedures: [] };
    
    component.selectAppointment(appointment);
    
    expect(component.selectedAppointment).toBe(appointment);
  });

  it('should format start_date and end_date correctly or set them to empty strings if null', fakeAsync(() => {
    const mockAppointments: Appointment[] = [
      { id: '1', doctor_id: 'doc1', start_date: '2024-12-08T10:00:00Z', end_date: '2024-12-08T11:00:00Z', status: 2, procedures: [] },
      { id: '2', doctor_id: 'doc2', start_date: undefined, end_date: undefined, status: 2, procedures: [] },
    ];
  
    // Mock responses
    mockAppointmentService.getMyHistory.and.returnValue(of(mockAppointments));
    mockSecurityService.getUserByDNI.and.returnValue(of({ first_name: 'Jane', last_name: 'Doe' }));
  
    // Espiar el método para controlar la salida
    spyOn(component, 'convertToLocalDateTime').and.callFake((dateString: string) => {
      if (dateString === '2024-12-08T10:00:00Z') return '08/12/2024, 05:00 a. m.';
      if (dateString === '2024-12-08T11:00:00Z') return '08/12/2024, 06:00 a. m.';
      return '';
    });
  
    // Ejecutar método
    component.loadMyAppointments();
    tick(); // Simular la resolución de las suscripciones
  
    // Validar que las fechas se formatearon correctamente
    expect(component.convertToLocalDateTime).toHaveBeenCalledTimes(2);
    expect(component.appointments[0].start_date).toBe('08/12/2024, 05:00 a. m.'); // Fecha formateada correctamente
    expect(component.appointments[0].end_date).toBe('08/12/2024, 06:00 a. m.');   // Fecha formateada correctamente
    expect(component.appointments[1].start_date).toBe('');                         // Fecha vacía para `null`
    expect(component.appointments[1].end_date).toBe('');                           // Fecha vacía para `null`
  }));
  
  
});


//ng test --include src/app/modules/appointment/view-history-for-patient/view-history-for-patient.component.spec.ts