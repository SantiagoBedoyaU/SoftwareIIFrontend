import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GetPersonalDataComponent } from './get-personal-data.component';
import { HttpClientModule } from '@angular/common/http';
import { UserService } from '../../../services/user.service';
import { ActivatedRoute, ActivatedRouteSnapshot, ParamMap, Router } from '@angular/router';
import { of, throwError } from 'rxjs';

describe('GetPersonalDataComponent', () => {
  let component: GetPersonalDataComponent;
  let fixture: ComponentFixture<GetPersonalDataComponent>;
  let userService: jasmine.SpyObj<UserService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockActivatedRoute: Partial<ActivatedRoute>;

  // Datos simulados para las pruebas
  const mockUserData = {
    first_name: 'John',
    last_name: 'Doe',
    email: 'john.doe@example.com',
    dni: '12345678',
    address: '123 Main St',
    phone: '1234567890'
  };

  // Mock completo para ParamMap
  const mockParamMap: ParamMap = {
    has: (key: string) => key === 'id',
    get: (key: string) => (key === 'id' ? '123' : null),
    getAll: (key: string) => (key === 'id' ? ['123'] : []),
    keys: ['id']
  };

  // Mock completo para ActivatedRouteSnapshot
  const mockActivatedRouteSnapshot: ActivatedRouteSnapshot = {
    paramMap: mockParamMap,
    queryParamMap: mockParamMap, 
    url: [],
    params: {},
    queryParams: {},
    fragment: null,
    data: {},
    title: 'Mock Title', 
    outlet: 'primary',
    component: null,
    routeConfig: null,
    root: {} as unknown as ActivatedRouteSnapshot,
    parent: null,
    firstChild: null,
    children: [],
    pathFromRoot: [],
    toString: () => 'MockActivatedRouteSnapshot'
  };

  beforeEach(async () => {
    userService = jasmine.createSpyObj('UserService', ['GetUserData']);
    userService.GetUserData.and.returnValue(of(mockUserData));

    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    // Mock de ActivatedRoute con snapshot
    mockActivatedRoute = {
      snapshot: mockActivatedRouteSnapshot
    };

    await TestBed.configureTestingModule({
      imports: [GetPersonalDataComponent, HttpClientModule],
      providers: [
        { provide: UserService, useValue: userService },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute }
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(GetPersonalDataComponent);
    component = fixture.componentInstance;
    userService = TestBed.inject(UserService) as jasmine.SpyObj<UserService>;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    fixture.detectChanges();
  });

  // 1. Prueba: Inicialización del componente
  it('debe inicializar el grupo de formularios al inicializar el componente', () => {
    expect(component.fGroup).toBeTruthy();
    expect(component.fGroup.controls['firstName']).toBeTruthy();
    expect(component.fGroup.controls['lastName']).toBeTruthy();
    expect(component.fGroup.controls['email']).toBeTruthy();
    expect(component.fGroup.controls['dni']).toBeTruthy();
    expect(component.fGroup.controls['address']).toBeTruthy();
    expect(component.fGroup.controls['phone']).toBeTruthy();
  });

  // 2. Prueba: Cargar datos del usuario
  it('debe cargar los datos del usuario y rellenar el formulario', () => {
    expect(userService.GetUserData).toHaveBeenCalled();
    expect(component.fGroup.value).toEqual({
      firstName: mockUserData.first_name,
      lastName: mockUserData.last_name,
      email: mockUserData.email,
      dni: mockUserData.dni,
      address: mockUserData.address,
      phone: mockUserData.phone
    });
  });

  // 3. Prueba: Gestionar errores al cargar los datos del usuario
  it('debe gestionar los errores al cargar los datos del usuario', () => {
    userService.GetUserData.and.returnValue(throwError(() => new Error('Error loading user data')));

    component.LoadUserData(); 
    expect(component.fGroup.value).toEqual({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      dni: '12345678',
      address: '123 Main St',
      phone: '1234567890'
    });
  });

  // 4. Prueba: Actualizar datos del usuario
  it('debe devolver controles de formulario mediante GetFormGroup', () => {
    const formControls = component.GetFormGroup;
    expect(formControls).toBe(component.fGroup.controls);
  });

});

// ng test --include src/app/modules/user/get-personal-data/get-personal-data.component.spec.ts --code-coverage