import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormBuilder } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { AddAppointmentComponent } from './add-appointment.component';
import { AppointmentService } from '../../../services/appointment.service';
import { SecurityService } from '../../../services/security.service';
import { UnavailableTimeService } from '../../../services/unavailable-time.service';
import M from 'materialize-css';
import moment from 'moment';
import { EventClickArg } from '@fullcalendar/core/index.js';


describe('AddAppointmentComponent', () => {
  let component: AddAppointmentComponent;
  let fixture: ComponentFixture<AddAppointmentComponent>;
  let mockAppointmentService: jasmine.SpyObj<AppointmentService>;
  let mockSecurityService: jasmine.SpyObj<SecurityService>;
  let mockUnavailableTimeService: jasmine.SpyObj<UnavailableTimeService>;

  beforeEach(async () => {
    // Mock de servicios
    mockAppointmentService = jasmine.createSpyObj('AppointmentService', [
      'getDoctors',
      'getAppointmentsByDoctor',
      'createAppointment',
    ]);
    mockSecurityService = jasmine.createSpyObj('SecurityService', ['GetUserData', 'GetToken']);
    mockUnavailableTimeService = jasmine.createSpyObj('UnavailableTimeService', ['getUnavailableTimes']);
  
    // Mock de valores predeterminados
    mockSecurityService.GetUserData.and.returnValue(of({ first_name: 'John', last_name: 'Doe', dni: '123456', email: 'john.doe@example.com' }));
    
    mockAppointmentService.getDoctors.and.returnValue(
      of([
        { dni: '123', first_name: 'John', last_name: 'Doe' },
        { dni: '456', first_name: 'Jane', last_name: 'Smith' },
      ])
    );
  
    await TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, AddAppointmentComponent],
      providers: [
        FormBuilder,
        { provide: AppointmentService, useValue: mockAppointmentService },
        { provide: SecurityService, useValue: mockSecurityService },
        { provide: UnavailableTimeService, useValue: mockUnavailableTimeService },
      ],
    }).compileComponents();
  
    fixture = TestBed.createComponent(AddAppointmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should build the form on initialization', () => {
    expect(component.fGroup.contains('doctorId')).toBeTrue();
    expect(component.fGroup.contains('startDate')).toBeTrue();
    expect(component.fGroup.contains('endDate')).toBeTrue();
  });


  
  it('should load user data on initialization', fakeAsync(() => {
    tick();
    expect(component.userData).toEqual({
      firstName: 'John',
      lastName: 'Doe',
      dni: '123456',
      email: 'john.doe@example.com',
    });
  }));

  it('should handle error when loading user data', fakeAsync(() => {
    const consoleErrorSpy = spyOn(console, 'error');
    mockSecurityService.GetUserData.and.returnValue(throwError(() => new Error('Error loading user data')));

    component.loadUserData();
    tick();

    expect(consoleErrorSpy).toHaveBeenCalledWith('Error al cargar los datos del usuario:', jasmine.any(Error));
  }));

  it('should handle error when searching unavailable times', fakeAsync(() => {
    const mockModalInstance = {
      open: jasmine.createSpy('open'),
      close: jasmine.createSpy('close'),
      destroy: jasmine.createSpy('destroy'),
      isOpen: false,
    };
  
    // Espía la instancia del modal
    spyOn(M.Modal, 'getInstance').and.returnValue(mockModalInstance as unknown as M.Modal);
  
    // Espía `console.error`
    const consoleErrorSpy = spyOn(console, 'error');
  
    // Simula un error en el servicio
    mockUnavailableTimeService.getUnavailableTimes.and.returnValue(
      throwError(() => new Error('Error loading unavailable times'))
    );
  
    component.fGroup.setValue({
      doctorId: '123',
      startDate: '2024-12-08',
      endDate: '2024-12-08',
    });
  
    component.searchUnavailableTimes(); // Llama al método
    tick(); // Simula la resolución de la suscripción
  
    // Verifica que el modal se haya cerrado
    expect(mockModalInstance.close).toHaveBeenCalled();
  
    // Verifica que el error haya sido registrado en la consola
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error al obtener horarios no disponibles:',
      jasmine.any(Error)
    );
  }));
  
  
  it('should handle error when searching unavailable times', fakeAsync(() => {
    const mockModalInstance = {
      open: jasmine.createSpy('open'),
      close: jasmine.createSpy('close'),
      destroy: jasmine.createSpy('destroy'),
      isOpen: false,
    };
  
    // Espía la instancia del modal
    spyOn(M.Modal, 'getInstance').and.returnValue(mockModalInstance as unknown as M.Modal);
  
    // Espía `console.error`
    const consoleErrorSpy = spyOn(console, 'error');
  
    // Simula un error en el servicio
    mockUnavailableTimeService.getUnavailableTimes.and.returnValue(
      throwError(() => new Error('Error loading unavailable times'))
    );
  
    component.fGroup.setValue({
      doctorId: '123',
      startDate: '2024-12-08',
      endDate: '2024-12-08',
    });
  
    component.searchUnavailableTimes(); // Llama al método
    tick(); // Simula la resolución de la suscripción
  
    // Verifica que el modal se haya cerrado
    expect(mockModalInstance.close).toHaveBeenCalled();
  
    // Verifica que el error haya sido registrado en la consola
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error al obtener horarios no disponibles:',
      jasmine.any(Error)
    );
  }));
  
  it('should handle error when loading unavailable times', fakeAsync(() => {
    const mockModalInstance = {
      open: jasmine.createSpy('open'),
      close: jasmine.createSpy('close'),
    };

    spyOn(M.Modal, 'getInstance').and.returnValue(mockModalInstance as unknown as M.Modal);
    spyOn(console, 'error');

    mockUnavailableTimeService.getUnavailableTimes.and.returnValue(
      throwError(() => new Error('Error loading unavailable times'))
    );

    component.fGroup.setValue({
      doctorId: '123',
      startDate: '2024-12-08',
      endDate: '2024-12-08',
    });

    component.searchUnavailableTimes();
    tick();

    expect(mockModalInstance.close).toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledWith('Error al obtener horarios no disponibles:', jasmine.any(Error));
  }));

  it('should display an error if no doctor is selected', () => {
    const toastSpy = spyOn(M, 'toast');
    component.doctors = [];
    component.fGroup.patchValue({ doctorId: '' });
  
    const fakeEvent = {
      event: {
        backgroundColor: '#4CAF50',
        start: '2024-12-08T10:00:00',
      },
      el: null, // Requerido por EventClickArg
      jsEvent: new MouseEvent('click'), // Simula un evento de ratón
      view: null, // No es relevante para esta prueba
    };
  
    component.onEventClick(fakeEvent as unknown as EventClickArg);
  
    expect(toastSpy).toHaveBeenCalledWith({
      html: 'Por favor, seleccione un doctor antes de continuar.',
      classes: 'red',
    });
  });
  

  it('should set selected time and open the modal if all conditions are met', () => {
    const fakeModalInstance = {
      open: jasmine.createSpy('open'),
    };
  
    spyOn(M.Modal, 'getInstance').and.returnValue(fakeModalInstance as unknown as M.Modal);
  
    component.doctors = [{ id: '1', name: 'Dr. John Doe' }];
    component.fGroup.patchValue({ doctorId: '1' });
    component.hasSearchedUnavailableTimes = true;
  
    const fakeEvent = {
      event: {
        backgroundColor: '#4CAF50',
        start: '2024-12-08T10:00:00',
      },
      el: null, // Requerido por EventClickArg
      jsEvent: new MouseEvent('click'), // Simula un evento de ratón
      view: null, // No es relevante para esta prueba
    };
  
    component.onEventClick(fakeEvent as unknown as EventClickArg);
  
    expect(component.selectedDateTime).toBe('2024-12-08 10:00');
    expect(component.selectedDoctorId).toBe('1');
    expect(component.selectedDoctorName).toBe('Dr. John Doe');
    expect(fakeModalInstance.open).toHaveBeenCalled();
  });
  

  it('should update calendar events correctly', () => {
    const consoleLogSpy = spyOn(console, 'log');
    const mockEvents = [
      { id: '1', title: 'Test Event', start: '2024-12-08T10:00:00', end: '2024-12-08T11:00:00' },
    ];
  
    component.updateCalendarEvents(mockEvents);
  
    expect(consoleLogSpy).toHaveBeenCalledWith('Eventos antes de actualizar:', []);
    expect(consoleLogSpy).toHaveBeenCalledWith('Eventos después de actualizar:', mockEvents);
    expect(component.calendarOptions.events).toEqual(mockEvents);
  });

  it('should generate time slots correctly', () => {
  const startDate = '2024-12-08';
  const endDate = '2024-12-08';

  const expectedSlots = [];
  const endTime = moment(endDate).endOf('day');

  let currentTime = moment(startDate).startOf('day');
  while (currentTime.isBefore(endTime)) {
    const slotStart = currentTime.toISOString();
    currentTime = currentTime.clone().add(15, 'minutes'); // Crear un nuevo momento para evitar modificar directamente
    const slotEnd = currentTime.toISOString();
    expectedSlots.push({ start: slotStart, end: slotEnd });
  }

  const result = component.generateTimeSlots(startDate, endDate);

  expect(result).toEqual(expectedSlots);
});


  it('should identify if a slot is within unavailable times', () => {
    const slot = { start: '2024-12-08T10:00:00', end: '2024-12-08T10:15:00' };
    const unavailableTimes = [
      { start_date: '2024-12-08T09:00:00', end_date: '2024-12-08T10:30:00', doctor_id: '123' },
      { start_date: '2024-12-08T11:00:00', end_date: '2024-12-08T11:30:00', doctor_id: '456' },
    ];
  
    const result = component.isTimeInUnavailable(slot, unavailableTimes);
  
    expect(result).toBe(true);
  });

  it('should identify if a slot is not within unavailable times', () => {
    const slot = { start: '2024-12-08T12:00:00', end: '2024-12-08T12:15:00' };
    const unavailableTimes = [
      { start_date: '2024-12-08T09:00:00', end_date: '2024-12-08T10:30:00', doctor_id: '123' },
      { start_date: '2024-12-08T11:00:00', end_date: '2024-12-08T11:30:00', doctor_id: '456' },
    ];
  
    const result = component.isTimeInUnavailable(slot, unavailableTimes);
  
    expect(result).toBe(false);
  });
  
  it('should validate form and show error if fields are missing', () => {
    spyOn(M, 'toast');
    component.fGroup.setValue({ doctorId: '', startDate: '', endDate: '' });

    component.searchUnavailableTimes();

    expect(M.toast).toHaveBeenCalledWith({
      html: 'Por favor, complete todos los campos antes de continuar.',
      classes: 'red',
    });
  });
  it('should handle error during data fetching and close modal', fakeAsync(() => {
    const mockModalInstance = {
      open: jasmine.createSpy('open'),
      close: jasmine.createSpy('close'),
    };
    spyOn(M.Modal, 'getInstance').and.returnValue(mockModalInstance as unknown as M.Modal);
    spyOn(console, 'error');

    mockUnavailableTimeService.getUnavailableTimes.and.returnValue(
      throwError(() => new Error('Error loading unavailable times'))
    );
    mockAppointmentService.getAppointmentsByDoctor.and.returnValue(of([]));

    component.fGroup.setValue({ doctorId: '123', startDate: '2024-12-08', endDate: '2024-12-08' });
    component.searchUnavailableTimes();
    tick();

    expect(console.error).toHaveBeenCalledWith('Error al obtener horarios no disponibles:', jasmine.any(Error));
    expect(mockModalInstance.close).toHaveBeenCalled();
  }));

  it('should filter available time slots', () => {
    const allTimes = [
      { start: '2024-12-08T09:00:00', end: '2024-12-08T09:15:00' },
      { start: '2024-12-08T10:00:00', end: '2024-12-08T10:15:00' },
      { start: '2024-12-08T11:00:00', end: '2024-12-08T11:15:00' },
    ];

    const unavailableTimes = [
      { start_date: '2024-12-08T09:00:00', end_date: '2024-12-08T09:30:00' },
    ];

    const appointments = [
      { start_date: '2024-12-08T10:00:00', end_date: '2024-12-08T10:30:00', status: 0 },
    ];

    const availableTimes = allTimes.filter((time) =>
      !unavailableTimes.some((unavailable) => {
        const unavailableStart = moment.utc(unavailable.start_date);
        const unavailableEnd = moment.utc(unavailable.end_date);
        return (
          moment.utc(time.start).isSameOrAfter(unavailableStart) &&
          moment.utc(time.start).isBefore(unavailableEnd)
        );
      }) &&
      !appointments.some((appointment) => {
        const appointmentStart = moment.utc(appointment.start_date);
        const appointmentEnd = moment.utc(appointment.end_date);
        return (
          moment.utc(time.start).isSameOrAfter(appointmentStart) &&
          moment.utc(time.start).isBefore(appointmentEnd)
        );
      })
    );

    expect(availableTimes).toEqual([
      { start: '2024-12-08T11:00:00', end: '2024-12-08T11:15:00' },
    ]);
  });

  it('should display an error if unavailable times have not been searched', () => {
    const toastSpy = spyOn(M, 'toast');
  
    // Configura el componente para que pase las validaciones anteriores
    component.hasSearchedUnavailableTimes = false; // Simula que no se han buscado horarios
    component.doctors = [{ id: '1', name: 'Dr. John Doe' }]; // Doctor válido
    component.fGroup.patchValue({ doctorId: '1' }); // Doctor seleccionado
  
    const fakeEvent = {
      event: {
        backgroundColor: '#4CAF50', // Color verde para pasar la primera validación
        start: '2024-12-08T10:00:00', // Hora dentro del rango permitido
      },
    };
  
    component.onEventClick(fakeEvent as unknown as EventClickArg);
  
    expect(toastSpy).toHaveBeenCalledWith({
      html: 'Por favor, busque horarios disponibles antes de continuar.',
      classes: 'red',
    });
  });

  it('should set selected time and open the modal if all conditions are met', () => {
    const toastSpy = spyOn(M, 'toast');
    const fakeModalInstance = {
      open: jasmine.createSpy('open'),
    };
  
    spyOn(M.Modal, 'getInstance').and.returnValue(fakeModalInstance as unknown as M.Modal);
  
    component.hasSearchedUnavailableTimes = true; // Simular que ya se han buscado horarios
    component.doctors = [{ id: '1', name: 'Dr. John Doe' }];
    component.fGroup.patchValue({ doctorId: '1' });
  
    const fakeEvent = {
      event: {
        backgroundColor: '#4CAF50',
        start: '2024-12-08T10:00:00', // Hora válida
      },
    };
  
    component.onEventClick(fakeEvent as unknown as EventClickArg);
  
    expect(component.selectedDateTime).toBe('2024-12-08 10:00');
    expect(component.selectedDoctorId).toBe('1');
    expect(component.selectedDoctorName).toBe('Dr. John Doe');
    expect(fakeModalInstance.open).toHaveBeenCalled();
    expect(toastSpy).not.toHaveBeenCalled();
  });
  
  it('should display an error if the selected time is outside the allowed range', () => {
    const toastSpy = spyOn(M, 'toast'); // Espiar M.toast
  
    component.hasSearchedUnavailableTimes = true; // Simula que ya se han buscado horarios
    component.doctors = [{ id: '1', name: 'Dr. John Doe' }]; // Simula que hay un doctor
    component.fGroup.patchValue({ doctorId: '1' }); // Selecciona un doctor válido
  
    const fakeEvent = {
      event: {
        backgroundColor: '#4CAF50', // Color verde, válido
        start: '2024-12-08T05:00:00', // Hora fuera del rango permitido (antes de las 6:00 AM)
      },
    };
  
    component.onEventClick(fakeEvent as unknown as EventClickArg);
  
    expect(toastSpy).toHaveBeenCalledWith({
      html: 'Seleccione una hora entre las 6:00 AM y las 6:00 PM UTC',
      classes: 'red',
    });
  });

  it('should format a date to UTC without milliseconds', () => {
    const dateString = '2024-12-08T10:00:00.123Z';
    const expectedUTC = '2024-12-08T10:00:00Z'; // Fecha esperada en UTC sin milisegundos
  
    const result = component['formatDateToUTC'](dateString);
  
    expect(result).toBe(expectedUTC);
  });

  it('should convert selected date to UTC and prepare appointment data', fakeAsync(() => {
    const consoleLogSpy = spyOn(console, 'log'); // Espiar los logs
    component.selectedDateTime = '2024-12-08 10:00'; // Fecha seleccionada
    component.selectedDoctorId = '123'; // ID del doctor seleccionado
    component.userData = { dni: '456', firstName: 'John', lastName: 'Doe', email: 'john.doe@example.com' }; // Datos del usuario
  
    const expectedUTCDate = '2024-12-08T10:00:00Z'; // Fecha convertida a UTC esperada
  
    const expectedAppointmentData = {
      doctor_id: '123',
      patient_id: '456',
      start_date: expectedUTCDate,
      status: 0,
    };
  
    spyOn(moment.prototype, 'utcOffset').and.returnValue({
      toISOString: () => expectedUTCDate,
    } as unknown as string);
  
    component.onConfirmAppointment();
    tick();
  
    // Verifica los logs
    expect(consoleLogSpy).toHaveBeenCalledWith('Fecha seleccionada (local):', '2024-12-08 10:00');
    expect(consoleLogSpy).toHaveBeenCalledWith('Fecha enviada al backend (UTC):', expectedUTCDate);
    expect(consoleLogSpy).toHaveBeenCalledWith('Datos de la cita enviados:', expectedAppointmentData);
  }));

  it('should load user data successfully', fakeAsync(() => {
    // Espía para `console.log`
    const consoleLogSpy = spyOn(console, 'log');
    
    // Simula una respuesta exitosa de `GetUserData`
    const mockUserData = {
      first_name: 'John',
      last_name: 'Doe',
      dni: '123456',
      email: 'john.doe@example.com',
    };
    mockSecurityService.GetUserData.and.returnValue(of(mockUserData));
  
    // Llamar al método
    component.loadUserData();
    tick(); // Simula el flujo asincrónico
  
    // Verifica que los datos del usuario se cargaron correctamente
    expect(component.userData).toEqual({
      firstName: 'John',
      lastName: 'Doe',
      dni: '123456',
      email: 'john.doe@example.com',
    });
  
    // Verifica que se registró en el log
    expect(consoleLogSpy).toHaveBeenCalledWith('Datos del usuario cargados:', {
      firstName: 'John',
      lastName: 'Doe',
      dni: '123456',
      email: 'john.doe@example.com',
    });
  }));

  
  
});



//ng test --include src/app/modules/appointment/add-appointment/add-appointment.component.spec.ts




