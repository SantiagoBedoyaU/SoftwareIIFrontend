import { TestBed } from '@angular/core/testing';
import { SecurityService } from './security.service';
import { HttpClientModule } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

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
});

// ng test --include src/app/services/security.service.spec.ts --code-coverage
