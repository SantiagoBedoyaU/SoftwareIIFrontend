import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AddNewHistoryComponent } from './add-new-history.component';
import { AppointmentService } from '../../../services/appointment.service';
import { SecurityService } from '../../../services/security.service';
import { of, throwError } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Appointment } from '../../../modelos/appointment.model';
import { UserModel } from '../../../modelos/user.model';

interface ModalInstance {
  open: jasmine.Spy;
  close: jasmine.Spy;
  isOpen: boolean;
  destroy: jasmine.Spy;
  id: string;
  el: HTMLDivElement;
  options: object;
}

interface MGlobal {
  Modal: {
    init: jasmine.Spy;
    getInstance: jasmine.Spy;
  };
  Datepicker: {
    init: jasmine.Spy;
  };
}

describe('AddNewHistoryComponent', () => {
  let component: AddNewHistoryComponent;
  let fixture: ComponentFixture<AddNewHistoryComponent>;
  let mockAppointmentService: jasmine.SpyObj<AppointmentService>;
  let mockSecurityService: jasmine.SpyObj<SecurityService>;

  const mockModalInstance: ModalInstance = {
    open: jasmine.createSpy('open'),
    close: jasmine.createSpy('close'),
    isOpen: false,
    destroy: jasmine.createSpy('destroy'),
    id: 'mock-modal',
    el: document.createElement('div'),
    options: {},
  };

  // Antes de cada prueba
  beforeEach(() => {
    // Tipificar globalThis correctamente usando MGlobal
    (globalThis as unknown as { M: MGlobal }).M = {
      Modal: {
        init: jasmine.createSpy('init'),
        getInstance: jasmine.createSpy('getInstance').and.returnValue(mockModalInstance),
      },
      Datepicker: {
        init: jasmine.createSpy('init'),
      },
    };

    // Crear elementos de prueba para los modales
    const modalIds = ['missingDniModal', 'userNotFoundModal', 'noAppointmentsModal', 'successModal', 'emptyFieldsModal'];
    modalIds.forEach((id) => {
      const modalElement = document.createElement('div');
      modalElement.id = id;
      document.body.appendChild(modalElement);
    });
  });

  afterEach(() => {
    const modalIds = ['missingDniModal', 'userNotFoundModal', 'noAppointmentsModal', 'successModal', 'emptyFieldsModal'];
    modalIds.forEach(id => {
      const modalElement = document.getElementById(id);
      if (modalElement) {
        document.body.removeChild(modalElement);
      }
    });
  });

  beforeEach(async () => {
    mockAppointmentService = jasmine.createSpyObj('AppointmentService', ['getAppointmentsByPatient', 'addProcedure']);
    mockSecurityService = jasmine.createSpyObj('SecurityService', ['GetUserData', 'getUserByDNI']);

    await TestBed.configureTestingModule({
      imports: [AddNewHistoryComponent, FormsModule, CommonModule], // Mover aquí AddNewHistoryComponent
      providers: [
        { provide: AppointmentService, useValue: mockAppointmentService },
        { provide: SecurityService, useValue: mockSecurityService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AddNewHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should validate DNI correctly', () => {
    component.dni = 'abc123';
    component.validateDni();
    expect(component.dniErrorMessage).toBe('El DNI solo debe contener números.');

    component.dni = '123456';
    component.validateDni();
    expect(component.dniErrorMessage).toBe('');
  });

  it('should return early if dniErrorMessage is present', () => {
    // Configura un mensaje de error simulado
    component.dniErrorMessage = 'El DNI no es válido';
    spyOn(console, 'log'); // Espía para asegurarse de que no se ejecuten otras acciones

    // Ejecuta el método
    component.searchPatient();

    // Validaciones: flujo debe detenerse
    expect(console.log).not.toHaveBeenCalled(); // Nada más debe ejecutarse
    expect(component.patient).toBeNull(); // Paciente no cargado
    expect(component.appointments.length).toBe(0); // Ninguna cita cargada
  });

  it('should not proceed if dniErrorMessage is set, even when DNI is valid', () => {
    // Configura un DNI válido pero con un mensaje de error
    component.dni = '123456';
    component.dniErrorMessage = 'El DNI no es válido'; // Mensaje de error simulado

    // Asegúrate de que el espía ya configurado no se llame
    expect(mockSecurityService.getUserByDNI).not.toHaveBeenCalled();

    // Ejecuta el método
    component.searchPatient();

    // Validaciones: el flujo debe detenerse antes de llamar a los servicios
    expect(mockSecurityService.getUserByDNI).not.toHaveBeenCalled();
    expect(mockAppointmentService.getAppointmentsByPatient).not.toHaveBeenCalled();
    expect(component.patient).toBeNull(); // No debe asignarse ningún paciente
    expect(component.appointments.length).toBe(0); // No deben cargarse citas
  });



  it('should show a modal if DNI is not provided', () => {
    component.dni = '';
    component.searchPatient();

    const missingDniModal = document.getElementById('missingDniModal');
    expect(missingDniModal).not.toBeNull();
    if (missingDniModal) {
      const modalInstance = globalThis.M.Modal.getInstance(missingDniModal);
      expect(modalInstance.open).toHaveBeenCalled();
    }
  });


  it('should load patient and appointments successfully', () => {
    const mockUser = { first_name: 'John', last_name: 'Doe', address: '123 Street', phone: '555-1234', dni: '123456' };
    const mockAppointments = [
      { id: '1', start_date: '2024-11-25T10:00:00', end_date: '2024-11-25T11:00:00', doctor_id: '123456', status: 0 },
    ];

    mockSecurityService.GetUserData.and.returnValue(of({ role: 1, dni: '123456' }));
    mockSecurityService.getUserByDNI.and.returnValue(of(mockUser));
    mockAppointmentService.getAppointmentsByPatient.and.returnValue(of(mockAppointments));

    component.dni = '123456';
    component.searchPatient();

    // Validación del paciente
    expect(component.patient).toEqual(mockUser);

    // Validación de citas
    expect(component.appointments.length).toBe(1); // Debe haber exactamente 1 cita
    expect(component.appointments[0]).toEqual(mockAppointments[0]);
  });

  it('should handle error when searching for a patient', () => {
    mockSecurityService.GetUserData.and.returnValue(of({ role: 1 }));
    mockSecurityService.getUserByDNI.and.returnValue(throwError(() => new Error('Error al buscar')));

    spyOn(console, 'error');

    component.dni = '123456';
    component.searchPatient();

    expect(console.error).toHaveBeenCalledWith('Error al buscar el paciente:', jasmine.any(Error));
    expect(component.patient).toBeNull();
  });

  it('should handle error when fetching appointments', () => {
    const mockUser = { dni: '123456' };
    mockSecurityService.GetUserData.and.returnValue(of({ role: 1, dni: '123456' }));
    mockSecurityService.getUserByDNI.and.returnValue(of(mockUser));
    mockAppointmentService.getAppointmentsByPatient.and.returnValue(throwError(() => new Error('Error al obtener citas')));

    spyOn(console, 'error');

    component.dni = '123456';
    component.searchPatient();

    expect(console.error).toHaveBeenCalledWith('Error al obtener las citas:', jasmine.any(Error));
    expect(component.appointments).toEqual([]);
  });

  it('should handle error when adding a procedure', () => {
    component.selectedAppointment = { id: '1', procedures: [] } as Appointment;
    component.typeOfConsultation = 'Consulta General';
    component.procedureDescription = 'Detalles';

    mockAppointmentService.addProcedure.and.returnValue(throwError(() => new Error('Error al agregar procedimiento')));

    spyOn(console, 'error');
    spyOn(window, 'alert');

    component.addProcedure();

    expect(console.error).toHaveBeenCalledWith('Error al agregar el procedimiento', jasmine.any(Error));
    expect(window.alert).toHaveBeenCalledWith('Hubo un error al agregar la historia clínica. Por favor intente de nuevo.');
  });

  it('should log an error if the user does not have permissions', () => {
    // Configurar el DNI válido y sin errores para que el flujo pase a la validación de rol
    component.dni = '123456';
    component.dniErrorMessage = ''; // Asegurar que no hay errores de validación de DNI

    const mockUserData = { role: 2 }; // Usuario con un rol diferente a doctor
    mockSecurityService.GetUserData.and.returnValue(of(mockUserData));

    spyOn(console, 'error');

    component.searchPatient();

    // Verificar que se registre el error en la consola
    expect(console.error).toHaveBeenCalledWith('El usuario no tiene permisos para agregar una historia clínica');
  });

  it('should log an error when the user does not have permissions', () => {
    const mockUserData = { role: 2 }; // Usuario con rol diferente a doctor
    mockSecurityService.GetUserData.and.returnValue(of(mockUserData));

    spyOn(console, 'error');

    component.dni = '123456';
    component.searchPatient();

    expect(console.error).toHaveBeenCalledWith('El usuario no tiene permisos para agregar una historia clínica');
  });

  it('should log an error if there is an error validating the user role', () => {
    mockSecurityService.GetUserData.and.returnValue(throwError('Error al validar el rol'));

    spyOn(console, 'error');

    component.dni = '123456';
    component.searchPatient();

    expect(console.error).toHaveBeenCalledWith('Error al validar el rol del usuario:', 'Error al validar el rol');
  });

  it('should log an error if there is an error searching for the patient', () => {
    const mockUserData = { role: 1 };
    mockSecurityService.GetUserData.and.returnValue(of(mockUserData));
    mockSecurityService.getUserByDNI.and.returnValue(throwError('Error al buscar el paciente'));

    spyOn(console, 'error');

    component.dni = '123456';
    component.searchPatient();

    expect(console.error).toHaveBeenCalledWith('Error al buscar el paciente:', 'Error al buscar el paciente');
  });

  it('should log an error if there is an error getting appointments', () => {
    const mockUserData = { dni: '123456' };
    mockSecurityService.GetUserData.and.returnValue(of(mockUserData));
    mockAppointmentService.getAppointmentsByPatient.and.returnValue(throwError('Error al obtener las citas'));

    spyOn(console, 'error');

    component.dni = '123456';
    component.loadPendingAppointments();

    expect(console.error).toHaveBeenCalledWith('Error al obtener las citas:', 'Error al obtener las citas');
    expect(component.appointments).toEqual([]);
  });

  it('should log an error if there is an error getting user data', () => {
    mockSecurityService.GetUserData.and.returnValue(throwError('Error al obtener los datos del usuario'));

    spyOn(console, 'error');

    component.dni = '123456';
    component.loadPendingAppointments();

    expect(console.error).toHaveBeenCalledWith('Error al obtener los datos del usuario:', 'Error al obtener los datos del usuario');
  });

  it('should log an error if no appointment is selected', () => {
    spyOn(console, 'error');

    component.addProcedure();

    expect(console.error).toHaveBeenCalledWith('No se ha seleccionado una cita');
  });

  it('should log an error if the appointment ID is invalid', () => {
    component.selectedAppointment = {} as Partial<Appointment>; // Sin ID de cita

    spyOn(console, 'error');

    component.addProcedure();

    expect(console.error).toHaveBeenCalledWith('No se ha encontrado un ID de cita válido');
  });

  it('should log an error if there is an error adding the procedure', () => {
    const mockAppointment: Partial<Appointment> = { id: '1', procedures: [] };
    component.selectedAppointment = mockAppointment as Appointment; 
    component.typeOfConsultation = 'Consulta General';
    component.procedureDescription = 'Detalles';

    mockAppointmentService.addProcedure.and.returnValue(throwError(() => new Error('Error al agregar procedimiento')));

    spyOn(console, 'error');
    spyOn(window, 'alert');

    component.addProcedure();

    expect(console.error).toHaveBeenCalledWith('Error al agregar el procedimiento', jasmine.any(Error));
    expect(window.alert).toHaveBeenCalledWith('Hubo un error al agregar la historia clínica. Por favor intente de nuevo.');
  });

  it('should set dniErrorMessage when DNI contains non-numeric characters', () => {
    component.dni = '123ABC';
    component.validateDni();
    expect(component.dniErrorMessage).toBe('El DNI solo debe contener números.');
  });

  it('should clear dniErrorMessage when DNI is valid', () => {
    component.dni = '123456';
    component.validateDni();
    expect(component.dniErrorMessage).toBe('');
  });

  it('should return early if there is a dniErrorMessage', () => {
    component.dniErrorMessage = 'Error de prueba';
    spyOn(console, 'error');
    component.searchPatient();
    expect(console.error).not.toHaveBeenCalled();
  });

  it('should log an error if no appointment is selected', () => {
    component.selectedAppointment = null;
    spyOn(console, 'error');
    component.addProcedure();
    expect(console.error).toHaveBeenCalledWith('No se ha seleccionado una cita');
  });

  it('should initialize procedures if appointment has no procedures', () => {
    const mockAppointment: Partial<Appointment> = { id: '1', procedures: [] }; 
    component.selectAppointment(mockAppointment as Appointment); 
    expect(mockAppointment.procedures).toEqual([]); 
  });

  it('should set the selected appointment', () => {
    const mockAppointment: Partial<Appointment> = { id: '1', procedures: [] }; 
    component.selectAppointment(mockAppointment as Appointment); 
    expect(component.selectedAppointment).toEqual(mockAppointment as Appointment);
  });

  it('should show a modal if patient is not found', () => {
    const mockUserData = { role: 1, dni: '123456' };
    mockSecurityService.GetUserData.and.returnValue(of(mockUserData));
    mockSecurityService.getUserByDNI.and.returnValue(of(null));

    component.dni = '123456';
    component.searchPatient();

    const userNotFoundModal = document.getElementById('userNotFoundModal');
    expect(userNotFoundModal).not.toBeNull(); 
    if (userNotFoundModal) {
      const modalInstance = globalThis.M.Modal.getInstance(userNotFoundModal);
      expect(modalInstance.open).toHaveBeenCalled();
    }
  });

  it('should show noAppointmentsModal if there are no pending appointments', () => {
    const mockUser = { first_name: 'John', last_name: 'Doe', address: '123 Street', phone: '555-1234', dni: '123456' };

    mockSecurityService.GetUserData.and.returnValue(of({ role: 1 }));
    mockSecurityService.getUserByDNI.and.returnValue(of(mockUser));
    mockAppointmentService.getAppointmentsByPatient.and.returnValue(of([]));

    component.dni = '123456';
    component.searchPatient();

    const noAppointmentsModal = document.getElementById('noAppointmentsModal');
    expect(noAppointmentsModal).not.toBeNull(); // Verificar que el modal exista
    if (noAppointmentsModal) {
      const modalInstance = globalThis.M.Modal.getInstance(noAppointmentsModal);
      expect(modalInstance.open).toHaveBeenCalled();
    }
  });

  it('should add a procedure successfully', () => {
    component.selectedAppointment = { id: '1', procedures: [] } as Appointment; // Usa Appointment
    component.typeOfConsultation = 'Consulta General';
    component.procedureDescription = 'Detalles de la consulta';

    mockAppointmentService.addProcedure.and.returnValue(of({})); // Simula una respuesta exitosa

    component.addProcedure();

    const successModal = document.getElementById('successModal');
    expect(successModal).not.toBeNull(); // Verificar que el modal exista
    if (successModal) {
      const modalInstance = globalThis.M.Modal.getInstance(successModal);
      expect(modalInstance.open).toHaveBeenCalled();
    }
  });

  it('should show emptyFieldsModal if required fields are empty', () => {
    component.selectedAppointment = { id: '1', procedures: [] } as Appointment; 
    component.typeOfConsultation = '';
    component.procedureDescription = '';

    component.addProcedure();

    const emptyFieldsModal = document.getElementById('emptyFieldsModal');
    expect(emptyFieldsModal).not.toBeNull(); // Verificar que el modal exista
    if (emptyFieldsModal) {
      const modalInstance = globalThis.M.Modal.getInstance(emptyFieldsModal);
      expect(modalInstance.open).toHaveBeenCalled();
    }
  });

  it('should clear fields after adding a procedure', () => {
    component.dni = '123456';
    component.patient = { first_name: 'John', last_name: 'Doe' } as Partial<UserModel>; 
    component.appointments = [{ id: '1', procedures: [] }] as Appointment[];
    component.selectedAppointment = { id: '1', procedures: [] } as Appointment; 
    component.typeOfConsultation = 'Consulta General';
    component.procedureDescription = 'Detalles';

    component.clearFields();

    expect(component.dni).toBe('');
    expect(component.patient).toBeNull();
    expect(component.appointments).toEqual([]);
    expect(component.selectedAppointment).toBeNull();
    expect(component.typeOfConsultation).toBe('');
    expect(component.procedureDescription).toBe('');
  });

  it('should initialize procedures if undefined and set the selected appointment', () => {
    const mockAppointment: Appointment = { id: '1', procedures: undefined };

    // Llama al método selectAppointment
    component.selectAppointment(mockAppointment);

    // Validaciones
    expect(mockAppointment.procedures).toEqual([]); // Se espera que procedures sea inicializado como []
    expect(component.selectedAppointment).toEqual(mockAppointment); // La cita seleccionada debe coincidir
  });

  it('should not overwrite procedures if already defined', () => {
    // Configura un objeto Appointment con un array de procedimientos
    const mockAppointment: Appointment = { id: '2', procedures: [{ description: 'Procedure 1' }] };

    // Llama al método selectAppointment
    component.selectAppointment(mockAppointment);

    // Validaciones
    expect(mockAppointment.procedures).toEqual([{ description: 'Procedure 1' }]); // Se espera que no cambie
    expect(component.selectedAppointment).toEqual(mockAppointment); // La cita seleccionada debe coincidir
  });
});

//ng test --include src/app/modules/appointment/add-new-history/add-new-history.component.spec.ts
