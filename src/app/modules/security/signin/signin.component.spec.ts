import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SigninComponent } from './signin.component';
import { HttpClientModule } from '@angular/common/http';
import { RouterTestingModule } from '@angular/router/testing';
import { SecurityService } from '../../../services/security.service';
import { Router } from '@angular/router';
import { By } from '@angular/platform-browser';
import { of, throwError } from 'rxjs';

interface MaterializeMock {
  Dropdown: {
    init: jasmine.Spy;
  };
  Modal: {
    init: jasmine.Spy;
    getInstance: jasmine.Spy;
  };
}

describe('SigninComponent', () => {
  let component: SigninComponent;
  let fixture: ComponentFixture<SigninComponent>;
  let securityService: SecurityService;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SigninComponent, HttpClientModule, RouterTestingModule]
    })
      .compileComponents();

    // Mock de Materialize para evitar errores durante las pruebas
    (window as unknown as { M: MaterializeMock }).M = {
      Dropdown: {
        init: jasmine.createSpy('init')
      },
      Modal: {
        init: jasmine.createSpy('init'),
        getInstance: jasmine.createSpy('getInstance').and.returnValue({
          open: jasmine.createSpy('open'),
          close: jasmine.createSpy('close')
        })
      }
    };

    fixture = TestBed.createComponent(SigninComponent);
    component = fixture.componentInstance;
    securityService = TestBed.inject(SecurityService);
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  // 1. Prueba: Inicializar el formulario con valores predeterminados
  it('debe inicializar el formulario con los valores predeterminados', () => {
    expect(component.fGroup).toBeDefined();
    expect(component.fGroup.get('document_type')?.value).toBe('');
    expect(component.fGroup.get('document_number')?.value).toBe('');
    expect(component.fGroup.get('password')?.value).toBe('');
  });

  // 2. Prueba: Cambiar la visibilidad de la contraseña
  it('debería alternar la visibilidad de la contraseña', () => {
    const passwordInput = fixture.debugElement.query(By.css('#password')).nativeElement;
    const toggleIcon = fixture.debugElement.query(By.css('.toggle-password')).nativeElement;

    expect(passwordInput.type).toBe('password');
    toggleIcon.click();
    fixture.detectChanges();

    expect(passwordInput.type).toBe('text');
    toggleIcon.click();
    fixture.detectChanges();

    expect(passwordInput.type).toBe('password');
  });

  // 3. Prueba: Inicializar el dropdown
  it('debe seleccionar un tipo de documento y establecer el valor de control del formulario', () => {
    component.selectDocumentType(new Event('click'), 'Cédula de ciudadanía (CC)');
    fixture.detectChanges();

    expect(component.selectedType).toBe('Cédula de ciudadanía (CC)');
    expect(component.fGroup.get('document_type')?.value).toBe('Cédula de ciudadanía (CC)');
  });

  // 4. Prueba: formulario válido
  it('debe intentar iniciar sesión cuando el formulario sea válido', () => {
    const mockResponse = { access_token: 'mockToken' };
    spyOn(securityService, 'SignIn').and.returnValue(of(mockResponse));
    spyOn(securityService, 'StoreToken');
    spyOn(securityService, 'UpdateUserBehavior');
    spyOn(router, 'navigate');

    component.fGroup.patchValue({
      document_type: 'Cédula de ciudadanía (CC)',
      document_number: '1234567890',
      password: 'password123',
    });

    component.SignIn();

    expect(securityService.SignIn).toHaveBeenCalledWith('1234567890', 'password123');
    expect(securityService.StoreToken).toHaveBeenCalledWith('mockToken');
    expect(securityService.UpdateUserBehavior).toHaveBeenCalledWith({
      user: undefined,
      token: 'mockToken',
    });
    expect(router.navigate).toHaveBeenCalledWith(['/home']);
  });

  // 5. Prueba: formulario inválido
  it('debe mostrar una alerta si el formulario es inválido', () => {
    component.fGroup.controls['document_type'].setValue('');
    component.fGroup.controls['document_number'].setValue('');
    component.fGroup.controls['password'].setValue('');

    component.SignIn();
    fixture.detectChanges();

    setTimeout(() => {
      const warningModal = document.getElementById('warningModal');
      if (warningModal) {
        const modalInstance = M.Modal.getInstance(warningModal);
        expect(modalInstance.isOpen).toBeTrue();
      }
    }, 300);
  });

  // 6. Prueba: error en la solicitud de inicio de sesión
  it('verifica que se muestra un modal de error si la petición de inicio de sesión falla', () => {
    spyOn(component['securityService'], 'SignIn').and.returnValue(
      throwError(() => new Error('Error de servidor'))
    );

    const modalSpy = jasmine.createSpyObj('modal', ['open']);
    (M.Modal.getInstance as jasmine.Spy).and.returnValue(modalSpy);

    component.fGroup.setValue({
      document_type: 'CC',
      document_number: '123456789',
      password: 'password123',
    });

    component.SignIn();
    expect(modalSpy.open).toHaveBeenCalled();
  });

});

// ng test --include src/app/modules/security/signin/signin.component.spec.ts --code-coverage