import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';

import { ConsultHoursComponent } from './consult-hours.component';
import { HttpClientModule } from '@angular/common/http';
import { FormControl, FormGroup, NgForm, ReactiveFormsModule } from '@angular/forms';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { AppointmentService } from '../../../services/appointment.service';
import { of, throwError } from 'rxjs';
import { SecurityService } from '../../../services/security.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { EventClickArg, ViewApi } from '@fullcalendar/core/index.js';
import { DateClickArg } from '@fullcalendar/interaction/index.js';
import { UnavailableTimeService } from '../../../services/unavailable-time.service';
import { UnavailableTime } from '../../../modelos/unavaibale-times.model';

interface MGlobal {
  Modal: {
    init: jasmine.Spy;
    getInstance: jasmine.Spy;
  };
  Datepicker: {
    init: jasmine.Spy;
  };
  toast: jasmine.Spy;
  closeModal: jasmine.Spy;
}

describe('ConsultHoursComponent', () => {
  let component: ConsultHoursComponent;
  let fixture: ComponentFixture<ConsultHoursComponent>;
  let appointmentService: jasmine.SpyObj<AppointmentService>;
  let securityService: jasmine.SpyObj<SecurityService>;
  let unavailableTimeService: jasmine.SpyObj<UnavailableTimeService>;
  let mockM: MGlobal; // Asegúrate de que está declarado aquí

  beforeEach(async () => {
    appointmentService = jasmine.createSpyObj('AppointmentService', ['getAppointmentsByDoctor']);
    securityService = jasmine.createSpyObj('SecurityService', ['getUserByDNI']);
    unavailableTimeService = jasmine.createSpyObj('UnavailableTimeService', ['updateUnavailableTimes', 'createUnavailableTimes', 'deleteUnavailableTimes', 'getUnavailableTimes']);

    await TestBed.configureTestingModule({
      imports: [
        ConsultHoursComponent, // Solo se importa porque es standalone
        ReactiveFormsModule,
        HttpClientModule,
        HttpClientTestingModule
      ],
      schemas: [NO_ERRORS_SCHEMA],
      providers: []
    }).compileComponents();

    // Mock de Materialize para evitar errores durante las pruebas
    mockM = {
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
      toast: jasmine.createSpy('toast'),
      closeModal: jasmine.createSpy('closeModal'),
    };
    (window as unknown as { M: MGlobal }).M = mockM;

    fixture = TestBed.createComponent(ConsultHoursComponent);
    component = fixture.componentInstance;
    appointmentService = TestBed.inject(AppointmentService) as jasmine.SpyObj<AppointmentService>;
    securityService = TestBed.inject(SecurityService) as jasmine.SpyObj<SecurityService>;
    unavailableTimeService = TestBed.inject(UnavailableTimeService) as jasmine.SpyObj<UnavailableTimeService>;

    // Mock del servicio para retornar un array vacío por defecto
    spyOn(appointmentService, 'getAppointmentsByDoctor').and.returnValue(of([]));
    fixture.detectChanges();
    component.selectedUnavailableTime = {
      id: '1',
      start_date: '2024-12-01T10:00:00Z',
      end_date: '2024-12-01T11:00:00Z',
      doctor_id: 'doc123'
    };
    component.fGroup = new FormGroup({
      startDate: new FormControl('2024-12-01'),
      endDate: new FormControl('2024-12-01'),
    });
  });

  it('debería cargar el ID del doctor desde el servicio', () => {
    const mockDoctorData = { dni: '12345' };
    spyOn(securityService, 'GetUserData').and.returnValue(of(mockDoctorData));
    component.loadDoctorId();
    expect(component.doctorID).toEqual('12345');
  });

  it('debería manejar un error al cargar el ID del doctor', () => {
    spyOn(securityService, 'GetUserData').and.returnValue(throwError(() => new Error('Error')));
    component.loadDoctorId();
    expect(component.doctorID).toBe('');
  });

  // 5. Prueba: Formato de fechas incorrecto
  it('debería validar que el formato de fechas es correcto', () => {
    component.fGroup.controls['startDate'].setValue('2024-11-01');
    component.fGroup.controls['endDate'].setValue('2024-30-11'); // Formato incorrecto

    spyOn(component, 'showModal'); // Espiar la función showModal

    component.searchAppointments(); // Llamar al método que dispara la validación de fechas

    // Verificar que showModal se haya llamado con el ID de modal y el mensaje esperado
    expect(component.showModal).toHaveBeenCalledWith('validationErrorModal', 'El formato de la fecha es incorrecto');
  });

  // 6. Prueba: Rango de fechas válido
  it('debería validar que la fecha inicial es anterior a la final', () => {
    // Configurar el formulario con fechas no válidas
    component.fGroup.controls['startDate'].setValue('2024-12-01');
    component.fGroup.controls['endDate'].setValue('2024-11-01');

    const spyShowModal = spyOn(component, 'showModal').and.callThrough();
    component.searchAppointments();

    expect(spyShowModal).toHaveBeenCalledWith('validationErrorModal', 'La fecha de inicio no puede ser mayor a la fecha de fin.');
  });



  // 7. Prueba: Comportamiento modal de error
  it('debería mostrar un modal de error si la búsqueda falla', () => {
    component.fGroup.controls['startDate'].setValue('2024-09-01');
    component.fGroup.controls['endDate'].setValue('2024-09-10');
    spyOn(component, 'showModal');
    component.searchAppointments();

    fixture.detectChanges();
    expect(component.showModal).toHaveBeenCalledWith('errorModal', 'No se encontraron citas en las fechas seleccionadas.');
  });

  it('debería retornar las etiquetas de estado correctas', () => {
    expect(component.getStatusLabel(0)).toEqual('Pendiente');
    expect(component.getStatusLabel(1)).toEqual('Cancelada');
    expect(component.getStatusLabel(2)).toEqual('Completada');
    expect(component.getStatusLabel(3)).toEqual('Desconocido');
  });

  it('debería actualizar los valores del formulario en onClose', () => {
    const mockElement = document.createElement('input');
    mockElement.value = '2024-11-15';

    spyOn(document, 'querySelectorAll').and.returnValue([mockElement] as unknown as NodeListOf<Element>);
    spyOn(component.fGroup, 'get').and.callThrough();

    component.initDatepickers();

    const pickerOptions = (globalThis as unknown as { M: MGlobal }).M.Datepicker.init.calls.mostRecent().args[1];
    pickerOptions.onClose();

    expect(component.fGroup.get('startDate')?.value).toBe('2024-11-15');


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

  // 12. Prueba: Formato de fechas correcto
  it('debería manejar una instancia de Date y devolver UTC sin milisegundos', () => {
    const date = new Date('2024-12-06T12:34:56.789Z');
    const result = (component as unknown as { formatDateToUTC: (date: string | Date) => string }).formatDateToUTC(date);
    expect(result).toBe('2024-12-06T12:34:56Z');
  });

  // 13. Prueba: Horarios no disponibles
  it('debería manejar eventos de "Horario No Disponible" y mostrar un modal', () => {
    const mockEvent = {
      event: {
        id: '1',
        title: 'Horario No Disponible',
        extendedProps: {
          startTime: '2024-12-06T10:00:00Z',
          endTime: '2024-12-06T12:00:00Z',
        },
      },
    } as unknown as EventClickArg;

    spyOn(component, 'showModal');
    component.handleEventClick(mockEvent);

    expect(component.selectedUnavailableTime).toEqual({
      id: '1',
      start_date: '2024-12-06T10:00:00Z',
      end_date: '2024-12-06T12:00:00Z',
      doctor_id: component.doctorID,
    });

    expect(component.showModal).toHaveBeenCalledWith(
      'unavailableTimesModal',
      jasmine.stringMatching(/Horario No Disponible/)
    );
  });

  // 16. Prueba: Cita cancelada
  it('debería capturar la fecha seleccionada', () => {
    const mockInfo: DateClickArg = {
      dateStr: '2024-12-06',
      date: new Date('2024-12-06'),
      allDay: true,
      dayEl: {} as HTMLElement,
      jsEvent: {} as MouseEvent,
      view: {} as ViewApi,
    };

    // Llama al método
    component.handleDateClick(mockInfo);

    // Verifica que la fecha seleccionada se haya almacenado correctamente
    expect(component.selectedDate).toBe('2024-12-06');
  });

  // Llamar al modal de edición
  it('debería llamar al modal de edición', () => {
    // Configura el espía dentro de la prueba, antes de la llamada al método
    const spy = spyOn(component, 'showModal');

    // Llama al método
    component.editUnavailableTime();

    // Verifica que showModal se haya llamado con el ID del modal de edición
    expect(spy).toHaveBeenCalledWith('editUnavailableTimeModal');
  });

  it('debería eliminar el horario no disponible y mostrar el modal de éxito', fakeAsync(() => {
    // Asegúrate de que el espía esté configurado correctamente
    unavailableTimeService.deleteUnavailableTimes = jasmine.createSpy('deleteUnavailableTimes').and.returnValue(of(null));
  
    // Configurar selectedUnavailableTime con un valor válido
    component.selectedUnavailableTime = {
      id: '123',
      start_date: '2024-12-06T09:00:00',
      end_date: '2024-12-06T10:00:00',
      doctor_id: '456',
    };
  
    // Mock del formulario reactivo con valores
    component.fGroup = new FormGroup({
      value: new FormControl({
        startDate: '2024-12-01',
        endDate: '2024-12-31',
      }),
    });
  
    // Espiar métodos internos del componente
    spyOn(component, 'showModal');
    spyOn(component, 'closeModal');
    spyOn(component, 'loadUnavailableTimes');
  
    // Llamar al método confirmDelete
    component.confirmDelete();
    tick(2000); // Simular el tiempo transcurrido en el setTimeout
  
    // Verificar que deleteUnavailableTimes fue llamado con el ID correcto
    expect(unavailableTimeService.deleteUnavailableTimes).toHaveBeenCalledWith('123');
  
    // Verificar que se llamó a showModal con los parámetros correctos
    expect(component.showModal).toHaveBeenCalledWith('successModal', 'Horario eliminado con éxito.');
  
    // Verificar que loadUnavailableTimes fue llamado con las fechas correctas
    expect(component.loadUnavailableTimes).toHaveBeenCalledWith(
      component.fGroup.value.startDate,
      component.fGroup.value.endDate
    );
  
    // Verificar que se cerraron los modales después del tiempo
    expect(component.closeModal).toHaveBeenCalledWith('successModal');
    expect(component.closeModal).toHaveBeenCalledWith('unavailableTimesModal');
    expect(component.closeModal).toHaveBeenCalledWith('deleteConfirmationModal');
  }));
  
  // 18. Prueba: Error al eliminar horario
  it('debería manejar un error al intentar eliminar el horario', () => {
    // Configurar el espía para que lance un error
    unavailableTimeService.deleteUnavailableTimes = jasmine.createSpy('deleteUnavailableTimes').and.returnValue(throwError(new Error('Error')));
    // Espiar console.error y alert
    spyOn(console, 'error');
    spyOn(window, 'alert');

    // Configurar selectedUnavailableTime con un valor válido
    component.selectedUnavailableTime = {
      id: '123',
      start_date: '2024-12-06T09:00:00',
      end_date: '2024-12-06T10:00:00',
      doctor_id: '456',
    };

    // Llamar al método confirmDelete
    component.confirmDelete();

    // Verificar que el error fue manejado correctamente
    expect(console.error).toHaveBeenCalledWith('Error al eliminar el horario:', jasmine.any(Error));
    expect(window.alert).toHaveBeenCalledWith('Hubo un error al eliminar el horario.');
  });

  it('debería mostrar un modal de confirmación al intentar eliminar un horario', () => {
    // Configurar el horario seleccionado
    component.selectedUnavailableTime = {
      id: '123',
      start_date: '2024-12-06T09:00:00',
      end_date: '2024-12-06T10:00:00',
      doctor_id: '456',
    };

    // Espiar el método showModal
    const spyShowModal = spyOn(component, 'showModal');

    // Llamar al método deleteUnavailableTime
    component.deleteUnavailableTime();

    // Verificar que se haya llamado a showModal con el mensaje correcto
    const expectedMessage = '¿Estás seguro de que deseas eliminar el horario seleccionado?';
    expect(spyShowModal).toHaveBeenCalledWith('deleteConfirmationModal', expectedMessage);
  });

  describe('saveUnavailableTime', () => {
    let form: NgForm;
  
    beforeEach(() => {
      // Configuramos un formulario simulado
      form = {
        valid: true,
        value: {
          startTime: '10:00',
          endTime: '12:00'
        }
      } as NgForm;
  
      component.selectedDate = '2024-12-06'; // Establecer una fecha seleccionada
      component.doctorID = '456'; // Establecer un ID de doctor simulado
    });
  
    afterEach(() => {
      // Restablecer espías después de cada prueba
      jasmine.clock().uninstall();
    });
  
    it('debería agregar un horario no disponible correctamente', () => {
      const newUnavailableTime: UnavailableTime = {
        start_date: '2024-12-06T10:00:00Z',
        end_date: '2024-12-06T12:00:00Z',
        doctor_id: '456'
      };
  
      // Espiar el servicio para verificar que se llame a createUnavailableTimes
      unavailableTimeService.createUnavailableTimes = jasmine.createSpy('createUnavailableTimes').and.returnValue(of(null));
      spyOn(component, 'showModal');
      spyOn(component, 'loadUnavailableTimes').and.callThrough();
      spyOn(component, 'closeModal');
  
      component.saveUnavailableTime(form);
  
      expect(unavailableTimeService.createUnavailableTimes).toHaveBeenCalledWith(newUnavailableTime);
      expect(component.showModal).toHaveBeenCalledWith('successModal', 'Horario agregado correctamente.');
      expect(component.loadUnavailableTimes).toHaveBeenCalledWith(component.fGroup.value.startDate, component.fGroup.value.endDate);
    });
  
    it('debería cerrar los modales después de agregar un horario', fakeAsync(() => {
      unavailableTimeService.createUnavailableTimes = jasmine.createSpy('createUnavailableTimes').and.returnValue(of(null));
      spyOn(component, 'closeModal');
  
      component.saveUnavailableTime(form);
      tick(2000); // Simular el tiempo transcurrido en el setTimeout
  
      expect(component.closeModal).toHaveBeenCalledWith('successModal');
      expect(component.closeModal).toHaveBeenCalledWith('addUnavailableTimeModal');
    }));

    it('debería mostrar un mensaje de error si ocurre un error al agregar el horario no disponible', () => {
      const error = { error: 'Error al guardar el horario no disponible' };
      unavailableTimeService.createUnavailableTimes = jasmine.createSpy('createUnavailableTimes').and.returnValue(throwError(error));
      spyOn(console, 'error');
      spyOn(console, 'log');
  
      component.saveUnavailableTime(form);
  
      expect(mockM.toast).toHaveBeenCalledWith({ html: 'Error al guardar el horario no disponible' });
      expect(console.error).toHaveBeenCalledWith('Error al agregar el horario:', error);
      expect(console.log).toHaveBeenCalledWith('Error:', error.error);
    });
  }); 
  
  it('debería actualizar el horario no disponible correctamente', () => {
    const form = {
      valid: true,
      value: {
        editStartTime: '12:00',
        editEndTime: '13:00'
      }
    };
  
    // Asegúrate de que el objeto devuelto coincida con la estructura de UnavailableTime
    const updatedUnavailableTime: UnavailableTime = {
      id: '1',
      start_date: '2024-12-01T12:00:00Z',
      end_date: '2024-12-01T13:00:00Z',
      doctor_id: 'doc123'
    };
  
    // Simula la respuesta del servicio como un objeto UnavailableTime
    unavailableTimeService.updateUnavailableTimes = jasmine.createSpy('updateUnavailableTimes').and.returnValue(of(updatedUnavailableTime));
    spyOn(console, 'log');
    spyOn(component, 'showModal');
    spyOn(component, 'loadUnavailableTimes');
    spyOn(component, 'closeModal');
  
    component.saveUpdatedUnavailableTime(form as NgForm);
  
    expect(unavailableTimeService.updateUnavailableTimes).toHaveBeenCalledWith('1', {
      id: '1',
      start_date: '2024-12-01T12:00:00Z',
      end_date: '2024-12-01T13:00:00Z',
      doctor_id: 'doc123'
    });
    expect(console.log).toHaveBeenCalledWith('Data sent to server:', {
      id: '1',
      start_date: '2024-12-01T12:00:00Z',
      end_date: '2024-12-01T13:00:00Z',
      doctor_id: 'doc123'
    });
    expect(component.showModal).toHaveBeenCalledWith('successModal', 'Horario actualizado correctamente.');
    expect(component.loadUnavailableTimes).toHaveBeenCalledWith('2024-12-01', '2024-12-01');
    expect(component.selectedUnavailableTime).toBeNull();
  });

  // 21. Prueba: Error al actualizar horario
  it('debería mostrar un mensaje de error si el formulario no es válido', () => {
    const form = {
      valid: false,
      value: {}
    };
  
    component.saveUpdatedUnavailableTime(form as NgForm);
  
    expect(mockM.toast).toHaveBeenCalledWith({ html: 'Por favor, completa todos los campos' });
  });

  // 22. Prueba: Error al actualizar horario
  it('debería manejar el error al actualizar el horario', () => {
    const form = {
      valid: true,
      value: {
        editStartTime: '12:00',
        editEndTime: '13:00'
      }
    };

    unavailableTimeService.updateUnavailableTimes = jasmine.createSpy('updateUnavailableTimes').and.returnValue(throwError('Error'));

    spyOn(console, 'error');

    component.saveUpdatedUnavailableTime(form as NgForm);

    expect(console.error).toHaveBeenCalledWith('Error al actualizar el horario:', 'Error');
    expect(mockM.toast).toHaveBeenCalledWith({ html: 'Error al actualizar el horario no disponible' });

  });
  
});  

//ng test --include src/app/modules/appointment/consult-hours/consult-hours.component.spec.ts --code-coverage
