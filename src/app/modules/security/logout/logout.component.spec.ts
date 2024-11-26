import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { LogoutComponent } from './logout.component';
import { SecurityService } from '../../../services/security.service';

describe('LogoutComponent', () => {
  let component: LogoutComponent;
  let fixture: ComponentFixture<LogoutComponent>;
  let mockSecurityService: jasmine.SpyObj<SecurityService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let originalLocation: Location; // Almacenar el objeto original de location

  beforeEach(async () => {
    mockSecurityService = jasmine.createSpyObj('SecurityService', ['RemoveLoggedUserData']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockRouter.navigate.and.returnValue(Promise.resolve(true)); // Simula navegación exitosa

    // Guardar el objeto original de location
    originalLocation = window.location;

    // Mock completo del objeto location
    Object.defineProperty(window, 'location', {
      value: {
        ...window.location,
        reload: jasmine.createSpy('reload'),
      },
      configurable: true,
    });

    await TestBed.configureTestingModule({
      imports: [LogoutComponent],
      providers: [
        { provide: SecurityService, useValue: mockSecurityService },
        { provide: Router, useValue: mockRouter },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LogoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    // Restaurar el objeto original de location
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      configurable: true,
    });
  });

  it('should call RemoveLoggedUserData on logout', () => {
    component.logout();
    expect(mockSecurityService.RemoveLoggedUserData).toHaveBeenCalled();
  });

  it('should navigate to home on logout', async () => {
    await component.logout();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['']);
  });

  it('should call window.location.reload after navigation', async () => {
    await component.logout();
    expect(window.location.reload).toHaveBeenCalled();
  });
});


// ng test --include src/app/modules/security/logout/logout.component.spec.ts --code-coverage