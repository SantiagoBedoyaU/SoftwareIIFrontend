import { TestBed } from '@angular/core/testing';
import { SecurityService } from './security.service';
import { HttpClientModule, HttpErrorResponse } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { UserModel } from '../modelos/user.model';

describe('SecurityService', () => {
  let service: SecurityService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientModule,
        HttpClientTestingModule
      ]
    });
    service = TestBed.inject(SecurityService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  // 1. Prueba: Solicitud POST para recuperar la contraseña
  it('debe enviar una solicitud POST para recuperar la contraseña', () => {
    const mockDni = '10001';
    const mockResponse = { message: 'Recovery email sent' };

    service.recoverPassword(mockDni).subscribe((response) => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${service['urlBase']}recover-password`);
    expect(req.request.method).toBe('POST'); 
    expect(req.request.body).toEqual({ dni: mockDni });
    req.flush(mockResponse);
  });

  // 2. Prueba: Solicitud POST para cambiar la contraseña
  it('debería enviar una solicitud POST para cambiar la contraseña con los encabezados correctos', () => {
    const newPassword = 'newPassword123';
    const token = 'testToken'; 
    const mockResponse = { success: true }; 

    spyOn(service, 'GetToken').and.returnValue(token);

    service.changePassword(newPassword).subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${service.urlBase}users/reset-password`);
    expect(req.request.method).toBe('POST');
    expect(req.request.headers.get('Authorization')).toBe(`Bearer ${token}`);
    expect(req.request.body).toEqual({ new_password: newPassword });
    req.flush(mockResponse);
  });

  // 3. Prueba: Solicitud POST para restablecer la contraseña
  it('debería enviar una solicitud POST para restablecer la contraseña con los datos correctos', () => {
    const token = 'testAccessToken';
    const newPassword = 'newSecurePassword';
    const mockResponse = { success: true }; 

    service.resetPassword(token, newPassword).subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${service.urlBase}reset-password`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      access_token: token,
      password: newPassword
    });
    req.flush(mockResponse);
  });

   // Prueba: Solicitud PATCH para asignar un rol
   it('debe enviar una solicitud PATCH para asignar un rol', () => {
    const mockDni = '12345678';
    const mockNewRole = 1; // Rol: Doctor
    const mockResponse = {
      dni: '12345678',
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
      role: 1,
    };

    // Llama al servicio
    service.updateUserRole(mockDni, mockNewRole).subscribe((response) => {
      expect(response).toEqual(mockResponse); // Valida la respuesta
    });

    // Simula la solicitud al backend
    const req = httpMock.expectOne(`${service['urlBase']}users/assign-role`);
    expect(req.request.method).toBe('PATCH'); // Verifica el método HTTP
    expect(req.request.body).toEqual({ dni: mockDni, new_role: mockNewRole }); // Verifica el cuerpo de la solicitud
    req.flush(mockResponse); // Simula una respuesta exitosa
  });


  // Prueba: Manejo de error al asignar un rol
  it('debe manejar un error 500 al asignar un rol', () => {
    const mockDni = '12345678';
    const mockNewRole = 1;

    service.updateUserRole(mockDni, mockNewRole).subscribe({
      error: (error) => {
        expect(error.status).toBe(500); // Verifica el código de error
      },
    });

    // Simula la solicitud con un error del servidor
    const req = httpMock.expectOne(`${service['urlBase']}users/assign-role`);
    expect(req.request.method).toBe('PATCH');
    req.flush(null, { status: 500, statusText: 'Internal Server Error' }); // Simula un error 500
  });

  // Prueba: Validación del encabezado de autenticación
  it('debe incluir el token de autenticación en el encabezado', () => {
    const mockDni = '12345678';
    const mockNewRole = 2; // Rol: Paciente
    const mockResponse = { dni: '12345678', role: 2 };
    const mockToken = 'mockAccessToken';

    // Simula el token almacenado
    spyOn(service, 'GetToken').and.returnValue(mockToken);

    service.updateUserRole(mockDni, mockNewRole).subscribe((response) => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${service['urlBase']}users/assign-role`);
    expect(req.request.headers.get('Authorization')).toBe(`Bearer ${mockToken}`); // Verifica el encabezado
    req.flush(mockResponse); // Simula una respuesta exitosa
  });

  // Prueba: Verifica la existencia de un usuario por DNI
  it('debe obtener un usuario por DNI exitosamente', () => {
    const mockDni = '12345678';
    const mockResponse = {
      dni: '12345678',
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
      role: 1,
    };

    service.getUserByDNI(mockDni).subscribe((response) => {
      expect(response).toEqual(mockResponse); // Valida la respuesta
    });

    const req = httpMock.expectOne(`${service['urlBase']}users/${mockDni}`);
    expect(req.request.method).toBe('GET'); // Verifica el método HTTP
    req.flush(mockResponse); // Simula una respuesta exitosa
  });

  // Prueba: Manejo de error al verificar la existencia de un usuario
  it('debe manejar un error 500 al obtener un usuario por DNI', () => {
    const mockDni = '12345678';

    service.getUserByDNI(mockDni).subscribe({
      error: (error: HttpErrorResponse) => {
        expect(error.status).toBe(500); // Verifica el código de error
        expect(error.statusText).toBe('Internal Server Error');
      },
    });

    const req = httpMock.expectOne(`${service['urlBase']}users/${mockDni}`);
    expect(req.request.method).toBe('GET');
    req.flush(null, { status: 500, statusText: 'Internal Server Error' }); // Simula un error 500
  });


  it('debe registrar un nuevo administrador exitosamente', () => {
    const mockRequest: UserModel = {
      dni: '87654321',
      first_name: 'Jane',
      last_name: 'Doe',
      typeDNI: '1',
      email: 'jane@example.com',
      password: undefined,
      role: 0, // Administrador
      phone: undefined,
      address: undefined,
    };

    const mockResponse: UserModel = {
      id: '1',
      dni: '87654321',
      first_name: 'Jane',
      last_name: 'Doe',
      typeDNI: '1',
      email: 'jane@example.com',
      password: undefined,
      role: 0, // Administrador
      phone: undefined,
      address: undefined,
    };

    const mockToken = 'mockAccessToken';

    // Simula el token almacenado
    spyOn(service, 'GetToken').and.returnValue(mockToken);

    service.registerUser(mockRequest).subscribe((response) => {
      expect(response).toEqual(mockResponse); // Valida que la respuesta sea correcta
    });

    const req = httpMock.expectOne(`${service['urlBase']}users`);
    expect(req.request.method).toBe('POST'); // Verifica que el método sea POST
    expect(req.request.body).toEqual(mockRequest); // Verifica que el cuerpo de la solicitud sea correcto
    expect(req.request.headers.get('Authorization')).toBe(`Bearer ${mockToken}`); // Verifica que el encabezado incluya el token
    req.flush(mockResponse); // Simula una respuesta exitosa del backend
  });


  it('debe mostrar un error si el usuario con el DNI ya existe', () => {
    const mockDni = '12345678';
    const mockExistingUser: UserModel = {
      id: '1',
      dni: mockDni,
      first_name: 'John',
      last_name: 'Doe',
      typeDNI: '1',
      email: 'john@example.com',
      password: undefined,
      role: 0,
      phone: undefined,
      address: undefined,
    };

    spyOn(service, 'GetToken').and.returnValue('mockAccessToken');

    service.getUserByDNI(mockDni).subscribe((response) => {
      expect(response).toEqual(mockExistingUser);
    });

    const req = httpMock.expectOne(`${service['urlBase']}users/${mockDni}`);
    expect(req.request.method).toBe('GET');
    expect(req.request.headers.get('Authorization')).toBe('Bearer mockAccessToken');
    req.flush(mockExistingUser);
  });



  it('debe continuar con el registro si el usuario con el DNI no existe', () => {
    const mockDni = '87654321';

    spyOn(service, 'GetToken').and.returnValue('mockAccessToken');

    service.getUserByDNI(mockDni).subscribe((response) => {
      expect(response).toBeNull();
    });

    const req = httpMock.expectOne(`${service['urlBase']}users/${mockDni}`);
    expect(req.request.method).toBe('GET');
    expect(req.request.headers.get('Authorization')).toBe('Bearer mockAccessToken');
    req.flush(null); // Simula que no existe el usuario
  });

  it('debe retornar null si el usuario con el DNI no existe (404)', () => {
    const mockDni = '87654321';

    spyOn(service, 'GetToken').and.returnValue('mockAccessToken');

    service.getUserByDNI(mockDni).subscribe((response) => {
      expect(response).toBeNull(); // Valida que el servicio retorne null
    });

    const req = httpMock.expectOne(`${service['urlBase']}users/${mockDni}`);
    expect(req.request.method).toBe('GET'); // Verifica que sea una solicitud GET
    expect(req.request.headers.get('Authorization')).toBe('Bearer mockAccessToken'); // Verifica encabezado
    req.flush(null, { status: 404, statusText: 'Not Found' }); // Simula un error 404
  });

  it('debe cargar un usuario desde un archivo CSV exitosamente', () => {
    const mockFile = new File(['name,dni,email'], 'users.csv', { type: 'text/csv' });
    const formData = new FormData();
    formData.append('file', mockFile);

    // Simula la respuesta esperada por el servicio
    const mockResponse: UserModel = {
      id: '1',
      dni: '12345678',
      first_name: 'John',
      last_name: 'Doe',
      typeDNI: '1',
      email: 'john@example.com',
      role: 2,
      phone: '123456789',
      address: '123 Main St',
      password: undefined,
    };

    // Simula el token
    spyOn(service, 'GetToken').and.returnValue('mockAccessToken');

    service.uploadUsersFromCSV(formData).subscribe((response) => {
      expect(response).toEqual(mockResponse); // Valida que la respuesta sea correcta
    });

    // Simula la solicitud al backend
    const req = httpMock.expectOne(`${service['urlBase']}users/load-by-csv`);
    expect(req.request.method).toBe('POST'); // Verifica que el método sea POST
    expect(req.request.body).toBe(formData); // Verifica que el cuerpo sea el esperado
    expect(req.request.headers.get('Authorization')).toBe('Bearer mockAccessToken'); // Verifica el encabezado
    req.flush(mockResponse); // Simula una respuesta exitosa
  });
});

// ng test --include src/app/services/security.service.spec.ts --code-coverage
