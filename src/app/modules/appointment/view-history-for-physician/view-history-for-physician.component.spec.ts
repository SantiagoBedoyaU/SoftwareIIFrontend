import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ViewHistoryForPhysicianComponent } from './view-history-for-physician.component';
import { AppointmentService } from '../../../services/appointment.service';
import { SecurityService } from '../../../services/security.service';
import { of, throwError } from 'rxjs';
import { Appointment } from '../../../modelos/appointment.model';
import { UserModel } from '../../../modelos/user.model';
import { FormsModule } from '@angular/forms';
import M from 'materialize-css';
import { HttpErrorResponse } from '@angular/common/http';

describe('ViewHistoryForPhysicianComponent', () => {
  let component: ViewHistoryForPhysicianComponent;
  let fixture: ComponentFixture<ViewHistoryForPhysicianComponent>;
  let mockAppointmentService: jasmine.SpyObj<AppointmentService>;
  let mockSecurityService: jasmine.SpyObj<SecurityService>;

  beforeEach(async () => {
    mockAppointmentService = jasmine.createSpyObj('AppointmentService', ['getAppointmentsByPatient']);
    mockSecurityService = jasmine.createSpyObj('SecurityService', ['getUserByDNI']);

    await TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, FormsModule, ViewHistoryForPhysicianComponent], // Importar el componente
      providers: [
        { provide: AppointmentService, useValue: mockAppointmentService },
        { provide: SecurityService, useValue: mockSecurityService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ViewHistoryForPhysicianComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });


  it('should initialize modals after view init', () => {
    const modalInitSpy = spyOn(M.Modal, 'init');

    component.ngAfterViewInit();

    expect(modalInitSpy).toHaveBeenCalled();
  });

  it('should open noAppointmentsModal if there are no completed appointments', fakeAsync(() => {
    const noAppointmentsModal: Partial<M.Modal> = { 
      open: jasmine.createSpy('open') 
    };
    spyOn(M.Modal, 'getInstance').and.returnValue(noAppointmentsModal as M.Modal);
  
    component.dni = '123456';
    mockAppointmentService.getAppointmentsByPatient.and.returnValue(of([])); // Simula que no hay citas
  
    component.loadCompletedAppointments();
    tick();
  
    expect(noAppointmentsModal.open).toHaveBeenCalled();
    expect(component.appointments.length).toBe(0);
  }));
  

  it('should set doctor_name to "Nombre no disponible" if doctor_id is not present', fakeAsync(() => {
    const mockAppointments: Appointment[] = [
      { id: '1', doctor_id: undefined, start_date: new Date().toISOString(), end_date: new Date().toISOString(), status: 2, procedures: [] },
    ];

    mockAppointmentService.getAppointmentsByPatient.and.returnValue(of(mockAppointments));

    component.loadCompletedAppointments();
    tick();

    expect(component.appointments[0].doctor_name).toBe('Nombre no disponible');
  }));

  it('should load completed appointments and assign correct doctor name if doctor_id is valid', fakeAsync(() => {
    const mockAppointments: Appointment[] = [
      { id: '1', doctor_id: 'doc1', start_date: new Date().toISOString(), end_date: new Date().toISOString(), status: 2, procedures: [] },
    ];

    const mockDoctor = { first_name: 'John', last_name: 'Doe' };

    mockAppointmentService.getAppointmentsByPatient.and.returnValue(of(mockAppointments));
    mockSecurityService.getUserByDNI.and.returnValue(of(mockDoctor));

    component.loadCompletedAppointments();
    tick();

    expect(component.appointments[0].doctor_name).toBe('John Doe');
  }));

  it('should process all appointments and set doctor_name correctly or to "Nombre no disponible"', fakeAsync(() => {
    const mockAppointments: Appointment[] = [
      { id: '1', doctor_id: 'doc1', start_date: new Date().toISOString(), end_date: new Date().toISOString(), status: 2, procedures: [] },
      { id: '2', doctor_id: undefined, start_date: new Date().toISOString(), end_date: new Date().toISOString(), status: 2, procedures: [] },
    ];

    const mockDoctor = { first_name: 'John', last_name: 'Doe' };

    mockAppointmentService.getAppointmentsByPatient.and.returnValue(of(mockAppointments));
    mockSecurityService.getUserByDNI.and.callFake((id) =>
      id === 'doc1' ? of(mockDoctor) : of(null)
    );

    component.loadCompletedAppointments();
    tick();

    expect(component.appointments[0].doctor_name).toBe('John Doe');
    expect(component.appointments[1].doctor_name).toBe('Nombre no disponible');
  }));


  it('should validate DNI correctly', () => {
    component.dni = '1234ABC';
    component.validateDni();
    expect(component.dniErrorMessage).toBe('El DNI solo debe contener números.');

    component.dni = '123456';
    component.validateDni();
    expect(component.dniErrorMessage).toBe('');
  });

  it('should open missingDniModal if DNI is not provided', () => {
    component.dni = '';
  
    // Crear un mock parcial de la instancia del modal
    const missingDniModal: Partial<M.Modal> = { open: jasmine.createSpy('open') };
    spyOn(M.Modal, 'getInstance').and.returnValue(missingDniModal as M.Modal);
  
    component.searchPatient();
  
    // Verificar que el modal fue abierto
    expect(missingDniModal.open).toHaveBeenCalled();
  });
  

  it('should call loadCompletedAppointments when user is found', () => {
    const mockUser = { dni: '12345678', first_name: 'John', last_name: 'Doe' } as UserModel;
    mockSecurityService.getUserByDNI.and.returnValue(of(mockUser));
    spyOn(component, 'loadCompletedAppointments');

    component.dni = '12345678';
    component.searchPatient();

    expect(component.loadCompletedAppointments).toHaveBeenCalled();
  });

  it('should handle error when searching for patient', () => {
    component.dni = '123456';
    mockSecurityService.getUserByDNI.and.returnValue(throwError(() => new Error('test error')));

    const consoleErrorSpy = spyOn(console, 'error');

    component.searchPatient();

    expect(consoleErrorSpy).toHaveBeenCalledWith('Error al buscar el paciente:', new Error('test error'));
    expect(component.patient).toBeNull();
  });

  it('should return early if there is a dniErrorMessage', () => {
    component.dni = '12345678';
    component.dniErrorMessage = 'El DNI solo debe contener números.';

    component.searchPatient();

    // Verificamos que ningún método haya sido llamado después del return
    expect(component.patient).toBeNull();
    expect(component.appointments.length).toBe(0);
  });



  it('should open userNotFoundModal if patient is not found', fakeAsync(() => {
    component.dni = '123456';
  
    // Configurar el mock para el servicio
    mockSecurityService.getUserByDNI.and.returnValue(of(null));
  
    // Crear un mock parcial de la instancia del modal
    const userNotFoundModal: Partial<M.Modal> = { open: jasmine.createSpy('open') };
    spyOn(M.Modal, 'getInstance').and.returnValue(userNotFoundModal as M.Modal);
  
    component.searchPatient();
    tick(); // Simular el paso del tiempo para resolver las suscripciones
  
    // Verificaciones
    expect(userNotFoundModal.open).toHaveBeenCalled();
    expect(component.patient).toBeNull();
    expect(component.appointments.length).toBe(0);
  }));
  

  it('should load completed appointments and set doctor names', fakeAsync(() => {
    component.dni = '123456';
    const mockAppointments: Appointment[] = [
      { id: '1', doctor_id: 'doc1', start_date: new Date().toISOString(), end_date: new Date().toISOString(), status: 2, procedures: [] },
    ];

    mockSecurityService.getUserByDNI.and.returnValue(of({ first_name: 'John', last_name: 'Doe' }));
    mockAppointmentService.getAppointmentsByPatient.and.returnValue(of(mockAppointments));

    component.loadCompletedAppointments();
    tick();

    expect(component.appointments.length).toBe(1);
    expect(component.appointments[0].doctor_name).toBe('John Doe');
  }));

  it('should handle error when loading appointments', () => {
    const errorResponse = new HttpErrorResponse({ error: 'test error', status: 500, statusText: 'Internal Server Error' });
    mockAppointmentService.getAppointmentsByPatient.and.returnValue(throwError(() => errorResponse));

    const consoleErrorSpy = spyOn(console, 'error');

    component.loadCompletedAppointments();

    expect(consoleErrorSpy).toHaveBeenCalledWith('Error al obtener las citas:', errorResponse);
    expect(component.appointments.length).toBe(0);
  });

  it('should set doctor_name to "Nombre no disponible" if doctor data is not available', fakeAsync(() => {
    component.dni = '123456';
    const mockAppointments: Appointment[] = [
      { id: '1', doctor_id: 'doc1', start_date: new Date().toISOString(), end_date: new Date().toISOString(), status: 2, procedures: [] },
    ];

    mockSecurityService.getUserByDNI.and.returnValue(of(null)); // Simulating no doctor data
    mockAppointmentService.getAppointmentsByPatient.and.returnValue(of(mockAppointments));

    component.loadCompletedAppointments();
    tick();

    expect(component.appointments[0].doctor_name).toBe('Nombre no disponible');
  }));

  it('should handle error when fetching doctor name and set doctor_name to "Nombre no disponible"', fakeAsync(() => {
    component.dni = '123456';
    const mockAppointments: Appointment[] = [
      { id: '1', doctor_id: 'doc1', start_date: new Date().toISOString(), end_date: new Date().toISOString(), status: 2, procedures: [] },
    ];

    mockSecurityService.getUserByDNI.and.returnValue(throwError(() => new Error('Not found')));
    mockAppointmentService.getAppointmentsByPatient.and.returnValue(of(mockAppointments));

    component.loadCompletedAppointments();
    tick();

    expect(component.appointments[0].doctor_name).toBe('Nombre no disponible');
  }));

  it('should select an appointment', () => {
    const appointment = { id: '1', doctor_id: 'doc1', start_date: new Date().toISOString(), end_date: new Date().toISOString(), status: 2, procedures: [] };

    component.selectAppointment(appointment);

    expect(component.selectedAppointment).toBe(appointment);
  });
});


//ng test --include src/app/modules/appointment/view-history-for-physician/view-history-for-physician.component.spec.ts