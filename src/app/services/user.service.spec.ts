import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { UserService } from './user.service';
import { SecurityService } from './security.service';
import { UserModel } from '../modelos/user.model';
import { of } from 'rxjs';

describe('UserService', () => {
  let service: UserService;
  let httpMock: HttpTestingController;
  let securityServiceSpy: jasmine.SpyObj<SecurityService>;

  // Datos simulados para las pruebas, ajustados al modelo UserModel
  const mockUserData: UserModel = {
    id: '123',
    typeDNI: 'DNI',
    dni: '12345678',
    first_name: 'Test',
    last_name: 'User',
    email: 'testuser@example.com',
    password: 'password123',
    role: 1,
    phone: '1234567890',
    address: '123 Test St'
  };

  const updatedUserData: UserModel = {
    id: '123',
    typeDNI: 'DNI',
    dni: '87654321',
    first_name: 'Updated',
    last_name: 'User',
    email: 'updateduser@example.com',
    password: 'newpassword456',
    role: 2,
    phone: '0987654321',
    address: '456 Updated St'
  };

  beforeEach(() => {
    const spy = jasmine.createSpyObj('SecurityService', ['GetUserData', 'GetToken']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule], // Usa HttpClientTestingModule para manejar HTTP en pruebas
      providers: [
        UserService,
        { provide: SecurityService, useValue: spy }
      ]
    });

    service = TestBed.inject(UserService);
    httpMock = TestBed.inject(HttpTestingController);
    securityServiceSpy = TestBed.inject(SecurityService) as jasmine.SpyObj<SecurityService>;
  });

  afterEach(() => {
    httpMock.verify();
  });

  /**
   * Prueba para el método GetUserData
   */
  it('debe obtener los datos del usuario', (done: DoneFn) => {
    securityServiceSpy.GetUserData.and.returnValue(of(mockUserData));

    service.GetUserData().subscribe((userData) => {
      expect(userData).toEqual(mockUserData);
      done();
    });

    expect(securityServiceSpy.GetUserData).toHaveBeenCalled();
  });

  /**
   * Prueba para el método UpdateUserData
   */
  it('debe actualizar los datos del usuario', (done: DoneFn) => {
    const token = 'fake-jwt-token';
    securityServiceSpy.GetToken.and.returnValue(token);

    service.UpdateUserData(updatedUserData).subscribe((response) => {
      expect(response).toEqual(updatedUserData);
      done();
    });

    const req = httpMock.expectOne(`${service.urlBase}users/me`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.headers.get('Authorization')).toBe(`Bearer ${token}`);

    req.flush(updatedUserData);
  });
});

// ng test --include src/app/services/user.service.spec.ts --code-coverage
