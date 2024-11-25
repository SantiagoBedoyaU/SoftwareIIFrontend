import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { CancelAppointmentComponent } from './cancel-appointment.component';
import { AppointmentService } from '../../../services/appointment.service';
import { SecurityService } from '../../../services/security.service';
import { of, throwError } from 'rxjs';
import { Appointment } from '../../../modelos/appointment.model';

interface MGlobal {
  Modal: {
    init: jasmine.Spy;
    getInstance: jasmine.Spy;
  };
  Datepicker: {
    init: jasmine.Spy;
  };
}

describe('CancelAppointmentComponent', () => {
  let component: CancelAppointmentComponent;
  let fixture: ComponentFixture<CancelAppointmentComponent>;
  let mockAppointmentService: jasmine.SpyObj<AppointmentService>;
  let mockSecurityService: jasmine.SpyObj<SecurityService>;

  const mockM: MGlobal = {
    Modal: {
      init: jasmine.createSpy('init'),
      getInstance: jasmine.createSpy('getInstance').and.returnValue({
        open: jasmine.createSpy('open'),
        close: jasmine.createSpy('close'),
      }),
    },
    Datepicker: {
      init: jasmine.createSpy('init').and.callFake(() => ({
        open: jasmine.createSpy('open'),
        close: jasmine.createSpy('close'),
      })),
    },
  };
  (window as unknown as { M: MGlobal }).M = mockM;

  beforeEach(async () => {
    mockAppointmentService = jasmine.createSpyObj('AppointmentService', ['getAppointmentsByPatient', 'cancelAppointment']);
    mockSecurityService = jasmine.createSpyObj('SecurityService', ['GetUserData', 'getUserByDNI']);

    mockSecurityService.GetUserData.and.returnValue(of({
      first_name: 'John',
      last_name: 'Doe',
      dni: '123456',
      email: 'john.doe@example.com',
    }));

    await TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, CancelAppointmentComponent],
      providers: [
        FormBuilder,
        { provide: AppointmentService, useValue: mockAppointmentService },
        { provide: SecurityService, useValue: mockSecurityService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CancelAppointmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should set doctor_name to "Nombre no disponible" when getUserByDNI returns null', () => {
    const appointments: Appointment[] = [
      { id: '1', start_date: '2024-11-23T10:00:00', end_date: '2024-11-23T11:00:00', doctor_id: 'doc1' },
    ];

    mockAppointmentService.getAppointmentsByPatient.and.returnValue(of(appointments));
    mockSecurityService.getUserByDNI.and.returnValue(of(null));

    component.fGroup.setValue({ startDate: '2024-11-20', endDate: '2024-11-25' });
    component.searchAppointments();

    expect(mockSecurityService.getUserByDNI).toHaveBeenCalledWith('doc1');
    expect(component.appointments[0].doctor_name).toBe('Nombre no disponible');
  });

  it('should set doctor_name to "Nombre no disponible" when doctor_id is null or empty', () => {
    const appointments: Appointment[] = [
      { id: '1', start_date: '2024-11-23T10:00:00', end_date: '2024-11-23T11:00:00', doctor_id: undefined },
    ];

    mockAppointmentService.getAppointmentsByPatient.and.returnValue(of(appointments));
    mockSecurityService.getUserByDNI.and.returnValue(of(null)); 

    component.fGroup.setValue({ startDate: '2024-11-20', endDate: '2024-11-25' });
    component.searchAppointments();

    expect(mockSecurityService.getUserByDNI).not.toHaveBeenCalled(); // Verifica que no se llama al servicio
    expect(component.appointments[0].doctor_name).toBe('Nombre no disponible'); // Valida que el nombre sea asignado correctamente
  });

  it('should open the datepicker when the date icon is clicked', () => {
    // Simular jerarquía del DOM
    const parentDiv = document.createElement('div');
    const dateInput = document.createElement('input') as HTMLInputElement;
    dateInput.classList.add('datepicker');
    const dateIcon = document.createElement('i');
    dateIcon.classList.add('date-icon');

    // Establecer relaciones DOM
    parentDiv.appendChild(dateInput);
    parentDiv.appendChild(dateIcon);

    // Espiar querySelectorAll para devolver elementos simulados
    spyOn(document, 'querySelectorAll').and.returnValue(
      [dateInput] as unknown as NodeListOf<Element>
    );

    // Espiar addEventListener en el ícono para capturar clics
    const addEventListenerSpy = spyOn(dateIcon, 'addEventListener').and.callFake(
      (event: string, handler: EventListener) => {
        if (event === 'click') {
          handler(new Event('click')); // Simula clic
        }
      }
    );

    // Espiar Datepicker.init para simular comportamiento
    const pickerMock = {
      open: jasmine.createSpy('open'),
    };
    (globalThis as unknown as { M: MGlobal }).M.Datepicker.init.and.returnValue(
      pickerMock
    );

    // Llamar al método de inicialización de datepickers
    component.initDatepickers();

    // Verificar que se llamó addEventListener
    expect(addEventListenerSpy).toHaveBeenCalledWith(
      'click',
      jasmine.any(Function)
    );

    // Verificar que se abrió el picker
    expect(pickerMock.open).toHaveBeenCalled();
  });


  it('should set patientID when userData contains a valid dni', () => {
    // Simula datos del usuario con un DNI válido
    const mockUserData = { dni: '123456' };
    mockSecurityService.GetUserData.and.returnValue(of(mockUserData));

    component.loadPatientID();

    // Verifica que el método del servicio se haya llamado
    expect(mockSecurityService.GetUserData).toHaveBeenCalled();

    // Verifica que patientID se haya asignado correctamente
    expect(component.patientID).toBe('123456');
  });

  it('should set patientID to an empty string when userData contains no dni', () => {
    // Simula datos del usuario sin DNI
    const mockUserData = { dni: undefined };
    mockSecurityService.GetUserData.and.returnValue(of(mockUserData));

    component.loadPatientID();

    // Verifica que el método del servicio se haya llamado
    expect(mockSecurityService.GetUserData).toHaveBeenCalled();

    // Verifica que patientID se haya asignado como un string vacío
    expect(component.patientID).toBe('');
  });

  it('should log an error when GetUserData fails', () => {
    const consoleErrorSpy = spyOn(console, 'error'); // Espía en console.error
    mockSecurityService.GetUserData.and.returnValue(throwError(() => new Error('Error al cargar')));

    component.loadPatientID();

    // Verifica que el método del servicio se haya llamado
    expect(mockSecurityService.GetUserData).toHaveBeenCalled();

    // Verifica que se haya registrado un error en la consola
    expect(consoleErrorSpy).toHaveBeenCalledWith('Error al cargar el ID del paciente:', jasmine.any(Error));
  });

  it('should set doctor_name correctly when getUserByDNI returns valid data', () => {
    const appointments: Appointment[] = [
      { id: '1', start_date: '2024-11-23T10:00:00', end_date: '2024-11-23T11:00:00', doctor_id: 'doc1' },
    ];
    const doctorData = { first_name: 'Dr.', last_name: 'Smith' };

    mockAppointmentService.getAppointmentsByPatient.and.returnValue(of(appointments));
    mockSecurityService.getUserByDNI.and.returnValue(of(doctorData));

    component.fGroup.setValue({ startDate: '2024-11-20', endDate: '2024-11-25' });
    component.searchAppointments();

    expect(mockSecurityService.getUserByDNI).toHaveBeenCalledWith('doc1');
    expect(component.appointments[0].doctor_name).toBe('Dr. Smith');
  });

  it('should set doctor_name to "Nombre no disponible" when getUserByDNI returns null', () => {
    const appointments: Appointment[] = [
      { id: '1', start_date: '2024-11-23T10:00:00', end_date: '2024-11-23T11:00:00', doctor_id: 'doc1' },
    ];

    mockAppointmentService.getAppointmentsByPatient.and.returnValue(of(appointments));
    mockSecurityService.getUserByDNI.and.returnValue(of(null));

    component.fGroup.setValue({ startDate: '2024-11-20', endDate: '2024-11-25' });
    component.searchAppointments();

    expect(mockSecurityService.getUserByDNI).toHaveBeenCalledWith('doc1');
    expect(component.appointments[0].doctor_name).toBe('Nombre no disponible');
  });

  it('should set doctor_name to "Nombre no disponible" when getUserByDNI throws an error', () => {
    const appointments: Appointment[] = [
      { id: '1', start_date: '2024-11-23T10:00:00', end_date: '2024-11-23T11:00:00', doctor_id: 'doc1' },
    ];

    mockAppointmentService.getAppointmentsByPatient.and.returnValue(of(appointments));
    mockSecurityService.getUserByDNI.and.returnValue(throwError(() => new Error('Error fetching doctor data')));

    component.fGroup.setValue({ startDate: '2024-11-20', endDate: '2024-11-25' });
    component.searchAppointments();

    expect(mockSecurityService.getUserByDNI).toHaveBeenCalledWith('doc1');
    expect(component.appointments[0].doctor_name).toBe('Nombre no disponible');
  });

  it('should set startDate when the first Datepicker closes', () => {
    // Crear un elemento de entrada para la fecha
    const dateInput = document.createElement('input') as HTMLInputElement;
    dateInput.classList.add('datepicker');
    dateInput.value = '2024-12-01';

    // Espiar querySelectorAll para devolver el elemento simulado
    spyOn(document, 'querySelectorAll').and.returnValue(
      [dateInput] as unknown as NodeListOf<Element>
    );

    // Inicializar los datepickers
    component.initDatepickers();

    // Obtener las opciones de configuración del datepicker
    const datePickerOptions = (globalThis as unknown as { M: MGlobal }).M.Datepicker.init.calls.mostRecent().args[1];

    // Simular el cierre del datepicker
    datePickerOptions.onClose();

    // Verificar que el valor de startDate sea el esperado
    expect(component.fGroup.get('startDate')?.value).toBe('2024-12-01');
  });

  it('should set endDate when the second Datepicker closes', () => {
    // Crear entradas simuladas para las fechas
    const dateInputs: HTMLInputElement[] = [document.createElement('input'), document.createElement('input')];
    dateInputs[1].classList.add('datepicker');
    dateInputs[1].value = '2024-12-15';

    // Espiar querySelectorAll para devolver las entradas simuladas
    spyOn(document, 'querySelectorAll').and.returnValue(
      dateInputs as unknown as NodeListOf<Element>
    );

    // Inicializar los datepickers
    component.initDatepickers();

    // Obtener las opciones de configuración del datepicker
    const datePickerOptions = (globalThis as unknown as { M: MGlobal }).M.Datepicker.init.calls.mostRecent().args[1];

    // Simular el cierre del datepicker
    datePickerOptions.onClose();

    // Verificar que el valor de endDate sea el esperado
    expect(component.fGroup.get('endDate')?.value).toBe('2024-12-15');
  });

  it('should set patientID correctly when GetUserData succeeds', () => {
    const mockUserData = { dni: '123456' }; // Datos simulados
    mockSecurityService.GetUserData.and.returnValue(of(mockUserData)); // Simula la respuesta exitosa

    component.loadPatientID(); // Llama a la función

    expect(mockSecurityService.GetUserData).toHaveBeenCalled(); // Verifica que se haya llamado al servicio
    expect(component.patientID).toBe('123456'); // Verifica que el patientID se haya asignado correctamente
  });

  it('should show validation error modal when the form is invalid', () => {
    spyOn(component, 'showModal');

    component.fGroup.setValue({ startDate: '', endDate: '' }); // Formulario inválido
    component.searchAppointments();

    expect(component.showModal).toHaveBeenCalledWith('validationErrorModal');
  });

  it('should reset the form and show noAppointmentsModal when no appointments are found', () => {
    mockAppointmentService.getAppointmentsByPatient.and.returnValue(of([]));
    spyOn(component, 'showModal');
    spyOn(component.fGroup, 'reset');

    component.fGroup.setValue({ startDate: '2024-11-20', endDate: '2024-11-25' });
    component.searchAppointments();

    expect(component.showModal).toHaveBeenCalledWith('noAppointmentsModal');
    expect(component.fGroup.reset).toHaveBeenCalled();
    expect(component.appointments.length).toBe(0);
  });

  it('should close loading modal and show error modal on appointment service error', () => {
    mockAppointmentService.getAppointmentsByPatient.and.returnValue(throwError(() => new Error('Network error')));
    spyOn(component, 'showModal');
    spyOn(component, 'closeModal');

    component.fGroup.setValue({ startDate: '2024-11-20', endDate: '2024-11-25' });
    component.searchAppointments();

    expect(component.closeModal).toHaveBeenCalledWith('loadingModal');
    expect(component.showModal).toHaveBeenCalledWith('errorModal');
  });

  it('should handle error when GetUserData fails', () => {
    const consoleErrorSpy = spyOn(console, 'error'); // Espía en el método `console.error`
    mockSecurityService.GetUserData.and.returnValue(throwError(() => new Error('Error al cargar'))); // Simula un error

    component.loadPatientID(); // Llama a la función

    expect(mockSecurityService.GetUserData).toHaveBeenCalled(); // Verifica que se haya llamado al servicio
    expect(consoleErrorSpy).toHaveBeenCalledWith('Error al cargar el ID del paciente:', jasmine.any(Error)); // Verifica que se haya registrado el error en la consola
  });

  it('should set doctor_name to "Nombre no disponible" if doctor data is not found or error occurs', () => {
    // Configura citas con doctor_id para buscar
    const appointments: Appointment[] = [
      {
        id: '1',
        start_date: '2024-11-23T10:00:00',
        end_date: '2024-11-23T11:00:00',
        doctor_id: 'invalidDoctorId',
      },
    ];
    mockAppointmentService.getAppointmentsByPatient.and.returnValue(of(appointments));

    // Configura el SecurityService para devolver un error o datos nulos
    mockSecurityService.getUserByDNI.and.returnValue(throwError(() => new Error('Doctor not found')));

    component.fGroup.setValue({ startDate: '2024-11-20', endDate: '2024-11-25' });
    component.searchAppointments();

    // Verifica que el nombre del doctor sea 'Nombre no disponible' después del error
    expect(mockSecurityService.getUserByDNI).toHaveBeenCalledWith('invalidDoctorId');
    expect(component.appointments[0].doctor_name).toBe('Nombre no disponible');
  });

  it('should set doctor_name to "Nombre no disponible" if doctorData is null', () => {
    const appointments: Appointment[] = [
      { id: '1', start_date: '2024-11-23T10:00:00', end_date: '2024-11-23T11:00:00', doctor_id: 'doc1' },
    ];
    mockAppointmentService.getAppointmentsByPatient.and.returnValue(of(appointments));

    // Simula que getUserByDNI devuelve null
    mockSecurityService.getUserByDNI.and.returnValue(of(null));

    component.fGroup.setValue({ startDate: '2024-11-20', endDate: '2024-11-25' });
    component.searchAppointments();

    expect(component.appointments[0].doctor_name).toBe('Nombre no disponible');
  });

  it('should update the modal message if a message is provided', () => {
    // Crear un elemento modal simulado
    const modalElement = document.createElement('div');
    modalElement.id = 'testModal';
    modalElement.innerHTML = '<div class="modal-content"><p></p></div>';
    document.body.appendChild(modalElement);

    // Espiar getElementById para devolver el modal simulado
    spyOn(document, 'getElementById').and.returnValue(modalElement);

    // Obtener el mock del modal
    const modalSpy = (globalThis as unknown as { M: MGlobal }).M.Modal.getInstance(modalElement);

    // Llamar al método showModal con un mensaje de prueba
    component.showModal('testModal', 'Mensaje de prueba');

    // Verificar que el mensaje del modal se haya actualizado
    const messageElement = modalElement.querySelector('.modal-content p');
    expect(messageElement?.textContent).toBe('Mensaje de prueba');

    // Verificar que el modal se haya abierto
    expect(modalSpy.open).toHaveBeenCalled();

    // Limpiar el DOM después de la prueba
    document.body.removeChild(modalElement);
  });

  it('should initialize the form with required controls', () => {
    expect(component.fGroup.contains('startDate')).toBeTrue();
    expect(component.fGroup.contains('endDate')).toBeTrue();
  });

  it('should load patient ID successfully', () => {
    const mockUserData = { dni: '123456' };
    mockSecurityService.GetUserData.and.returnValue(of(mockUserData));

    component.loadPatientID();

    expect(mockSecurityService.GetUserData).toHaveBeenCalled();
    expect(component.patientID).toBe('123456');
  });

  it('should initialize datepickers', () => {
    component.initDatepickers();

    // Verificar que M.Datepicker.init haya sido llamado
    expect((globalThis as unknown as { M: MGlobal }).M.Datepicker.init).toHaveBeenCalled();
  });

  it('should load patient ID on initialization', () => {
    component.loadPatientID();
    expect(component.patientID).toBe('123456');
  });

  it('should show validation error modal when form is invalid', () => {
    spyOn(component, 'showModal');

    component.fGroup.setValue({ startDate: '', endDate: '' });
    component.searchAppointments();

    expect(component.showModal).toHaveBeenCalledWith('validationErrorModal');
  });

  it('should handle error while loading patient ID', () => {
    const consoleErrorSpy = spyOn(console, 'error');
    mockSecurityService.GetUserData.and.returnValue(throwError(() => new Error('Error al cargar')));

    component.loadPatientID();

    expect(mockSecurityService.GetUserData).toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalledWith('Error al cargar el ID del paciente:', jasmine.any(Error));
  });

  it('should handle error when searching for appointments', () => {
    const consoleErrorSpy = spyOn(console, 'error');
    mockAppointmentService.getAppointmentsByPatient.and.returnValue(throwError(() => new Error('Error al buscar')));

    component.fGroup.setValue({ startDate: '2024-11-01', endDate: '2024-11-30' });
    component.searchAppointments();

    expect(mockAppointmentService.getAppointmentsByPatient).toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalledWith('Error al obtener las citas:', jasmine.any(Error));
  });

  it('should show modal on cancel appointment', () => {
    // Llamar al método que abre el modal de confirmación
    component.onCancelAppointment('1');

    // Obtener la instancia del modal con el tipo correcto
    const modalSpy = (globalThis as unknown as { M: MGlobal }).M.Modal.getInstance();

    // Verificar que se haya llamado al método `open` del modal
    expect(modalSpy.open).toHaveBeenCalled();

    // Verificar que se haya configurado correctamente el ID de la cita seleccionada
    expect(component.selectedAppointmentId).toBe('1');
  });

  it('should search for appointments and handle results correctly', () => {
    const appointments: Appointment[] = [
      {
        id: '1',
        start_date: '2024-11-23T10:00:00',
        end_date: '2024-11-23T11:00:00',
        doctor_id: 'doc1',
      },
    ];
    mockAppointmentService.getAppointmentsByPatient.and.returnValue(of(appointments));

    spyOn(component, 'showModal');
    mockSecurityService.getUserByDNI.and.returnValue(of({ first_name: 'Dr.', last_name: 'Smith' }));

    component.fGroup.setValue({ startDate: '2024-11-20', endDate: '2024-11-25' });
    component.searchAppointments();

    expect(component.appointments.length).toBe(1);
    expect(component.appointments[0].doctor_name).toBe('Dr. Smith');
    expect(component.showModal).not.toHaveBeenCalledWith('noAppointmentsModal');
  });

  it('should show noAppointmentsModal when no appointments are found', () => {
    mockAppointmentService.getAppointmentsByPatient.and.returnValue(of([]));

    spyOn(component, 'showModal');
    component.fGroup.setValue({ startDate: '2024-11-20', endDate: '2024-11-25' });
    component.searchAppointments();

    expect(component.appointments.length).toBe(0);
    expect(component.showModal).toHaveBeenCalledWith('noAppointmentsModal');
  });

  it('should handle error when searching for appointments', () => {
    mockAppointmentService.getAppointmentsByPatient.and.returnValue(throwError(() => new Error('Network error')));

    spyOn(component, 'showModal');
    component.fGroup.setValue({ startDate: '2024-11-20', endDate: '2024-11-25' });
    component.searchAppointments();

    expect(component.showModal).toHaveBeenCalledWith('errorModal');
  });

  it('should open confirmation modal before canceling an appointment', () => {
    spyOn(component, 'showModal');

    component.onCancelAppointment('1');
    expect(component.selectedAppointmentId).toBe('1');
    expect(component.showModal).toHaveBeenCalledWith('confirmCancelModal');
  });

  it('should cancel an appointment successfully', () => {
    // Obtener la instancia del modal usando un tipo explícito
    const modalSpy = (globalThis as unknown as { M: MGlobal }).M.Modal.getInstance();

    // Configurar el servicio simulado para devolver un resultado exitoso
    mockAppointmentService.cancelAppointment.and.returnValue(of({}));

    // Configurar la cita seleccionada y la lista de citas
    component.selectedAppointmentId = '1';
    component.appointments = [
      { id: '1', start_date: '2024-11-23T10:00:00', doctor_id: '123', doctor_name: 'John Doe' },
    ];

    // Confirmar la cancelación de la cita
    component.confirmCancelAppointment();

    // Verificar que el servicio de cancelación fue llamado con el ID correcto
    expect(mockAppointmentService.cancelAppointment).toHaveBeenCalledWith('1');

    // Verificar que el método `open` del modal fue llamado
    expect(modalSpy.open).toHaveBeenCalled();

    // Verificar que la cita haya sido eliminada de la lista
    expect(component.appointments.length).toBe(0);
  });

  it('should handle error when canceling an appointment', () => {
    const consoleErrorSpy = spyOn(console, 'error');
    mockAppointmentService.cancelAppointment.and.returnValue(throwError(() => new Error('Error al cancelar')));

    component.selectedAppointmentId = '1';
    component.confirmCancelAppointment();

    expect(mockAppointmentService.cancelAppointment).toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalledWith('Error al cancelar la cita:', jasmine.any(Error));
  });

  it('should show a modal', () => {
    const modalElement = document.createElement('div');
    modalElement.id = 'testModal';
    document.body.appendChild(modalElement);

    // Espiar el método getElementById para devolver el modal simulado
    spyOn(document, 'getElementById').and.returnValue(modalElement);

    // Configurar el tipo explícito para la instancia del modal
    const modalSpy = (globalThis as unknown as { M: MGlobal }).M.Modal.getInstance(modalElement);

    // Llamar al método que muestra el modal
    component.showModal('testModal');

    // Verificar que el método `open` del modal fue llamado
    expect(modalSpy.open).toHaveBeenCalled();

    // Limpiar el DOM después de la prueba
    document.body.removeChild(modalElement);
  });

  it('should close a modal', () => {
    const modalElement = document.createElement('div');
    modalElement.id = 'testModal';
    document.body.appendChild(modalElement);

    // Espiar el método getElementById para devolver el modal simulado
    spyOn(document, 'getElementById').and.returnValue(modalElement);

    // Configurar el tipo explícito para la instancia del modal
    const modalSpy = (globalThis as unknown as { M: MGlobal }).M.Modal.getInstance(modalElement);

    // Llamar al método que cierra el modal
    component.closeModal('testModal');

    // Verificar que el método `close` del modal fue llamado
    expect(modalSpy.close).toHaveBeenCalled();

    // Limpiar el DOM después de la prueba
    document.body.removeChild(modalElement);
  });
});


//ng test --include src/app/modules/appointment/cancel-appointment/cancel-appointment.component.spec.ts