import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AppointmentService } from './appointment.service';
import { SecurityService } from './security.service';
import { Appointment, Procedure } from '../modelos/appointment.model';
import { HttpErrorResponse } from '@angular/common/http';

describe('AppointmentService', () => {
  let service: AppointmentService;
  let httpMock: HttpTestingController;
  let securityService: jasmine.SpyObj<SecurityService>;

  beforeEach(() => {
    const securitySpy = jasmine.createSpyObj('SecurityService', ['GetToken']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [{ provide: SecurityService, useValue: securitySpy }]
    });

    service = TestBed.inject(AppointmentService);
    httpMock = TestBed.inject(HttpTestingController);
    securityService = TestBed.inject(SecurityService) as jasmine.SpyObj<SecurityService>;
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // Prueba: Manejar error al cancelar una cita
  it('debe manejar un error al cancelar una cita', () => {
    const mockAppointmentId = '123';

    securityService.GetToken.and.returnValue('mockAccessToken');

    service.cancelAppointment(mockAppointmentId).subscribe({
      next: () => fail('La llamada debería haber fallado'),
      error: (error) => {
        // Verificar el código de estado y el mensaje en el objeto error
        expect(error.status).toBe(500); // Código de error esperado
        expect(error.error.message).toBe('Error al cancelar la cita'); // Mensaje del error esperado
      },
    });

    const req = httpMock.expectOne(`${service.urlBase}appointments/${mockAppointmentId}`);
    expect(req.request.method).toBe('PATCH');
    req.flush({ message: 'Error al cancelar la cita' }, { status: 500, statusText: 'Internal Server Error' }); // Simula un error
  });

  // Prueba: Manejar error al obtener citas por paciente
  it('debe manejar un error al obtener citas por paciente', () => {
    const startDate = '2024-11-01';
    const endDate = '2024-11-30';
    const patientID = '456';

    securityService.GetToken.and.returnValue('mockAccessToken');

    service.getAppointmentsByPatient(startDate, endDate, patientID).subscribe({
      next: () => fail('La llamada debería haber fallado'),
      error: (error) => {
        // Verificar el código de estado y el mensaje en el objeto error
        expect(error.status).toBe(500); // Código de error esperado
        expect(error.error.message).toBe('Error al obtener citas'); // Mensaje del error esperado
      },
    });

    const req = httpMock.expectOne(
      `${service.urlBase}appointments?start_date=${startDate}&end_date=${endDate}&patient_id=${patientID}`
    );
    expect(req.request.method).toBe('GET');
    req.flush({ message: 'Error al obtener citas' }, { status: 500, statusText: 'Internal Server Error' }); // Simula un error
  });

  // Prueba: Obtener citas por paciente exitosamente
  it('debe obtener citas por paciente exitosamente', () => {
    const startDate = '2024-11-01';
    const endDate = '2024-11-30';
    const patientID = '456';
    const mockResponse: Appointment[] = [
      {
        id: '1',
        start_date: '2024-11-15T10:00:00',
        end_date: '2024-11-15T11:00:00',
        doctor_id: 'doc1',
        doctor_name: 'Dr. Smith',
      },
    ];

    securityService.GetToken.and.returnValue('mockAccessToken');

    service.getAppointmentsByPatient(startDate, endDate, patientID).subscribe((response) => {
      expect(response).toEqual(mockResponse); // Valida la respuesta
    });

    const req = httpMock.expectOne(
      `${service.urlBase}appointments?start_date=${startDate}&end_date=${endDate}&patient_id=${patientID}`
    );
    expect(req.request.method).toBe('GET'); // Verifica el método HTTP
    expect(req.request.headers.get('Authorization')).toBe('Bearer mockAccessToken'); // Verifica el encabezado
    req.flush(mockResponse); // Simula una respuesta exitosa
  });

  // Prueba: Manejar error al obtener citas por paciente
it('debe manejar un error al obtener citas por paciente', () => {
  const startDate = '2024-11-01';
  const endDate = '2024-11-30';
  const patientID = '456';

  securityService.GetToken.and.returnValue('mockAccessToken');

  service.getAppointmentsByPatient(startDate, endDate, patientID).subscribe({
    next: () => fail('La llamada debería haber fallado'),
    error: (error) => {
      // Validar las propiedades específicas del error
      expect(error.status).toBe(500); // Código de error esperado
      expect(error.error.message).toBe('Error al obtener citas'); // Mensaje de error esperado
    },
  });

  const req = httpMock.expectOne(
    `${service.urlBase}appointments?start_date=${startDate}&end_date=${endDate}&patient_id=${patientID}`
  );
  expect(req.request.method).toBe('GET');
  
  // Simulación del error con las propiedades esperadas
  req.flush({ message: 'Error al obtener citas' }, { status: 500, statusText: 'Internal Server Error' });
});


// Caso de éxito: Obtener citas completadas por paciente
it('debe obtener citas completadas de un paciente exitosamente', () => {
  const startDate = '2024-11-01';
  const endDate = '2024-11-30';
  const patientID = '123456';
  const mockAppointments: Appointment[] = [
    {
      id: '1',
      start_date: '2024-11-25T10:00:00',
      end_date: '2024-11-25T11:00:00',
      doctor_id: 'doc1',
      status: 2,
    },
  ];

  securityService.GetToken.and.returnValue('mockAccessToken');

  service.getAppointmentsByPatient(startDate, endDate, patientID).subscribe((appointments) => {
    expect(appointments).toEqual(mockAppointments); // Valida las citas obtenidas
  });

  const req = httpMock.expectOne(
    `${service.urlBase}appointments?start_date=${startDate}&end_date=${endDate}&patient_id=${patientID}`
  );
  expect(req.request.method).toBe('GET');
  expect(req.request.headers.get('Authorization')).toBe('Bearer mockAccessToken'); // Verifica el token
  req.flush(mockAppointments); // Simula una respuesta exitosa
});

// Caso de error: Fallo al obtener citas completadas por paciente
it('debe manejar un error al obtener citas completadas de un paciente', () => {
  const startDate = '2024-11-01';
  const endDate = '2024-11-30';
  const patientID = '123456';

  securityService.GetToken.and.returnValue('mockAccessToken');

  service.getAppointmentsByPatient(startDate, endDate, patientID).subscribe({
    next: () => fail('La llamada debería haber fallado'),
    error: (error: HttpErrorResponse) => {
      expect(error.status).toBe(500); // Código de error esperado
      expect(error.error.message).toBe('Error al obtener citas'); // Mensaje esperado
    },
  });

  const req = httpMock.expectOne(
    `${service.urlBase}appointments?start_date=${startDate}&end_date=${endDate}&patient_id=${patientID}`
  );
  expect(req.request.method).toBe('GET');
  req.flush({ message: 'Error al obtener citas' }, { status: 500, statusText: 'Internal Server Error' });
});

// Caso de éxito: Obtener el historial del usuario autenticado
it('debe obtener el historial del usuario autenticado exitosamente', () => {
  const mockAppointments: Appointment[] = [
    {
      id: '1',
      start_date: '2024-11-20T10:00:00',
      end_date: '2024-11-20T11:00:00',
      doctor_id: 'doc1',
      status: 2,
      procedures: [],
    },
  ];

  securityService.GetToken.and.returnValue('mockAccessToken');

  service.getMyHistory().subscribe((appointments) => {
    expect(appointments).toEqual(mockAppointments); // Valida el historial obtenido
  });

  const req = httpMock.expectOne(`${service.urlBase}appointments/my-history`);
  expect(req.request.method).toBe('GET');
  expect(req.request.headers.get('Authorization')).toBe('Bearer mockAccessToken');
  req.flush(mockAppointments); // Simula una respuesta exitosa
});

// Caso de error: Fallo al obtener el historial del usuario autenticado
it('debe manejar un error al obtener el historial del usuario autenticado', () => {
  securityService.GetToken.and.returnValue('mockAccessToken');

  service.getMyHistory().subscribe({
    next: () => fail('La llamada debería haber fallado'),
    error: (error: HttpErrorResponse) => {
      expect(error.status).toBe(500); // Código de error esperado
      expect(error.error.message).toBe('Error al obtener el historial del usuario'); // Mensaje esperado
    },
  });

  const req = httpMock.expectOne(`${service.urlBase}appointments/my-history`);
  expect(req.request.method).toBe('GET');
  req.flush({ message: 'Error al obtener el historial del usuario' }, { status: 500, statusText: 'Internal Server Error' });
});

// Prueba: Adicionar un procedimiento exitosamente
it('debe adicionar un procedimiento a una cita exitosamente', () => {
  const mockAppointmentId = '1';
  const mockProcedure: Procedure = {
    description: 'Consulta General - Detalles de la consulta',
  };
  const mockResponse = { success: true };

  securityService.GetToken.and.returnValue('mockAccessToken');

  service.addProcedure(mockAppointmentId, mockProcedure).subscribe((response) => {
    expect(response).toEqual(mockResponse); // Valida la respuesta
  });

  const req = httpMock.expectOne(`${service.urlBase}appointments/${mockAppointmentId}/add-procedure`);
  expect(req.request.method).toBe('PATCH'); // Verifica que el método sea PATCH
  expect(req.request.headers.get('Authorization')).toBe('Bearer mockAccessToken'); // Verifica el encabezado de autorización
  expect(req.request.body).toEqual(mockProcedure); // Verifica el cuerpo de la solicitud
  req.flush(mockResponse); // Simula una respuesta exitosa
});

// Prueba: Manejar error al adicionar un procedimiento
it('debe manejar un error al adicionar un procedimiento a una cita', () => {
  const mockAppointmentId = '1';
  const mockProcedure: Procedure = {
    description: 'Consulta General - Detalles de la consulta',
  };

  securityService.GetToken.and.returnValue('mockAccessToken');

  service.addProcedure(mockAppointmentId, mockProcedure).subscribe({
    next: () => fail('La llamada debería haber fallado'),
    error: (error) => {
      // Valida las propiedades del error
      expect(error.status).toBe(500); // Código de error esperado
      expect(error.error.message).toBe('Error al agregar el procedimiento'); // Mensaje de error esperado
    },
  });

  const req = httpMock.expectOne(`${service.urlBase}appointments/${mockAppointmentId}/add-procedure`);
  expect(req.request.method).toBe('PATCH'); // Verifica el método PATCH
  req.flush({ message: 'Error al agregar el procedimiento' }, { status: 500, statusText: 'Internal Server Error' }); // Simula un error
});

});


//ng test --include src/app/services/appointment.service.spec.ts