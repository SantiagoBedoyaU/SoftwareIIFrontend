import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';

import { ConsultHoursComponent } from './consult-hours.component';
import { HttpClientModule } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { By } from '@angular/platform-browser';
import { AppointmentService } from '../../../services/appointment.service';
import { of, throwError } from 'rxjs';
import { SecurityService } from '../../../services/security.service';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
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

describe('ConsultHoursComponent', () => {
  let component: ConsultHoursComponent;
  let fixture: ComponentFixture<ConsultHoursComponent>;
  let appointmentService: jasmine.SpyObj<AppointmentService>;
  let securityService: jasmine.SpyObj<SecurityService>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    appointmentService = jasmine.createSpyObj('AppointmentService', ['getAppointmentsByDoctor']);
    securityService = jasmine.createSpyObj('SecurityService', ['getUserByDNI']);
    await TestBed.configureTestingModule({
      imports: [
        ConsultHoursComponent, // Solo se importa porque es standalone
        ReactiveFormsModule,
        HttpClientModule,
        HttpClientTestingModule
      ],
      schemas: [
        NO_ERRORS_SCHEMA
      ],
      providers: [
        
      ]
    }).compileComponents();

    // Mock de Materialize para evitar errores durante las pruebas
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

    fixture = TestBed.createComponent(ConsultHoursComponent);
    component = fixture.componentInstance;
    appointmentService = TestBed.inject(AppointmentService) as jasmine.SpyObj<AppointmentService>;
    securityService = TestBed.inject(SecurityService) as jasmine.SpyObj<SecurityService>;
    httpMock = TestBed.inject(HttpTestingController);

    // Mock del servicio para retornar un array vacío por defecto
    spyOn(appointmentService, 'getAppointmentsByDoctor').and.returnValue(of([]));
    fixture.detectChanges();
  });


  // 1. Prueba: Formulario de búsqueda válido
  it('debería enviar el formulario correctamente cuando las fechas son válidas', () => {
    component.fGroup.controls['startDate'].setValue('2024-11-01');
    component.fGroup.controls['endDate'].setValue('2024-11-30');
    spyOn(component, 'searchAppointments');

    const button = fixture.debugElement.query(By.css('.btn-search'));
    button.triggerEventHandler('click', null);

    expect(component.searchAppointments).toHaveBeenCalled();
    expect(component.fGroup.valid).toBeTrue();
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

  // 2. Prueba: Formulario con fechas vacías
  it('debería no enviar el formulario si alguna fecha está vacía', () => {
    component.fGroup.controls['startDate'].setValue('');
    component.fGroup.controls['endDate'].setValue('2024-11-30');
    spyOn(component, 'showModal');

    const button = fixture.debugElement.query(By.css('.btn-search'));
    button.triggerEventHandler('click', null);

    expect(component.showModal).toHaveBeenCalledWith('validationErrorModal', 'Por favor ingrese fechas válidas.');
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

    spyOn(document, 'querySelectorAll').and.returnValue([mockElement] as any);
    spyOn(component.fGroup, 'get').and.callThrough();

    component.initDatepickers();

    const pickerOptions = (window as any).M.Datepicker.init.calls.mostRecent().args[1];
    pickerOptions.onClose();

    expect(component.fGroup.get('startDate')?.value).toBe('2024-11-15');


  });

  it('debería obtener información de cada paciente y actualizar el nombre en las citas', fakeAsync(() => {
    // Reconfigurar el spy existente
    (appointmentService.getAppointmentsByDoctor as jasmine.Spy).and.returnValue(of([
      { patient_id: '12345', patient_name: '' },
      { patient_id: '67890', patient_name: '' }
    ]));

    spyOn(securityService, 'getUserByDNI').and.returnValues(
      of({ first_name: 'John', last_name: 'Doe' }),
      of({ first_name: 'Jane', last_name: 'Smith' })
    );

    // Configurar fechas válidas en el formulario
    component.fGroup.controls['startDate'].setValue('2024-11-01');
    component.fGroup.controls['endDate'].setValue('2024-11-30');

    // Ejecutar la búsqueda
    component.searchAppointments();

    // Avanzar en el tiempo para resolver las suscripciones
    tick();

    // Verificar que los nombres de los pacientes se hayan actualizado
    expect(component.appointments[0].patient_name).toBe('John Doe');
    expect(component.appointments[1].patient_name).toBe('Jane Smith');
    // Verificar que el servicio se haya llamado con los DNI correctos
    expect(securityService.getUserByDNI).toHaveBeenCalledWith('12345');
    expect(securityService.getUserByDNI).toHaveBeenCalledWith('67890');
  }));

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


});

//ng test --include src/app/modules/appointment/consult-hours/consult-hours.component.spec.ts --code-coverage
