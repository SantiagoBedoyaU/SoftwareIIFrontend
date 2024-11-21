import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PasswordChangeComponent } from './password-change.component';
import { HttpClientModule } from '@angular/common/http';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';

describe('PasswordChangeComponent', () => {
  let component: PasswordChangeComponent;
  let fixture: ComponentFixture<PasswordChangeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PasswordChangeComponent, HttpClientModule, RouterTestingModule]
    })
      .compileComponents();

    interface MaterializeMock {
      Datepicker: {
        init: jasmine.Spy;
      };
      Modal: {
        init: jasmine.Spy;
        getInstance: jasmine.Spy;
      };
    }

    // Mock de Materialize para evitar errores durante las pruebas
    (window as unknown as { M: MaterializeMock }).M = {
      Datepicker: {
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

    fixture = TestBed.createComponent(PasswordChangeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // 1. Prueba: Validación contraseña actual
  it('verifica que el campo contraseña actual es obligatorio', () => {
    const oldPasswordControl = component.GetFormGroup['oldPassword'];
    oldPasswordControl.markAsTouched();

    fixture.detectChanges();
    const errorElement = fixture.nativeElement.querySelector('.show-errors');

    expect(errorElement).toBeTruthy();
    expect(errorElement.textContent).toContain('Este campo es obligatorio');
  });

  // 2. Prueba: Validación nueva contraseña
  it('verifica que el campo nieva contraseña es obligatorio', () => {
    const newPasswordControl = component.GetFormGroup['newPassword'];
    newPasswordControl.markAsTouched();

    fixture.detectChanges();
    const errorElement = fixture.nativeElement.querySelector('.show-errors');

    expect(errorElement).toBeTruthy();
    expect(errorElement.textContent).toContain('Este campo es obligatorio');
  });

  // 3. Prueba: Validación confirmación de contraseña
  it('verifica que el campo de confirmación de contraseña es obligatorio', () => {
    const confirmPasswordControl = component.GetFormGroup['confirmPassword'];
    confirmPasswordControl.markAsTouched();

    fixture.detectChanges();
    const errorElement = fixture.nativeElement.querySelector('.show-errors');

    expect(errorElement).toBeTruthy();
    expect(errorElement.textContent).toContain('Este campo es obligatorio');
  });

  // 4. Prueba: Visibilidad de contraseña (1)
  it('verifica que al hacer click en contraseña actual la contraseña se muestra u oculta', () => {
    const icon = fixture.nativeElement.querySelector('.toggle-last-password');
    const passwordInput = fixture.nativeElement.querySelector('#lastPassword');
    expect(passwordInput.type).toBe('password');

    icon.click();
    fixture.detectChanges();
    expect(passwordInput.type).toBe('text');

    icon.click();
    fixture.detectChanges();
    expect(passwordInput.type).toBe('password');
  });

  // 5. Prueba: Visibilidad de contraseña (2)
  it('verifica que al hacer click en nueva contraseña la contraseña se muestra u oculta', () => {
    const icon = fixture.nativeElement.querySelector('.toggle-password');
    const passwordInput = fixture.nativeElement.querySelector('#password');
    expect(passwordInput.type).toBe('password');

    icon.click();
    fixture.detectChanges();
    expect(passwordInput.type).toBe('text');

    icon.click();
    fixture.detectChanges();
    expect(passwordInput.type).toBe('password');
  });

  // 6. Prueba: Visibilidad de contraseña (3)
  it('verifica que al hacer click en confirmar contraseña la contraseña se muestra u oculta', () => {
    const icon = fixture.nativeElement.querySelector('.toggle-password-confirm');
    const passwordInput = fixture.nativeElement.querySelector('#confirmPassword');
    expect(passwordInput.type).toBe('password');

    icon.click();
    fixture.detectChanges();
    expect(passwordInput.type).toBe('text');

    icon.click();
    fixture.detectChanges();
    expect(passwordInput.type).toBe('password');
  });

  // 8. Botón de envío deshabilitado
  it('verifica que el botón se deshabilita si el formulario es inválido', () => {
    const submitButton = fixture.nativeElement.querySelector('button[type="submit"]');
    expect(submitButton.disabled).toBeTrue();

    component.fGroup.setValue({
      oldPassword: 'oldPass123',
      newPassword: 'newPass123',
      confirmPassword: 'newPass123'
    });

    fixture.detectChanges();
    expect(submitButton.disabled).toBeFalse();
  });

  // 9. Prueba: El servicio es llamado correctamente cuando las contraseñas coinciden
  it('verifica que la petición es llamada correctamente cuando las contraseñas coinciden', () => {
    const changePasswordSpy = spyOn(component['securityService'], 'changePassword').and.callThrough();

    component.fGroup.setValue({
      oldPassword: 'oldPassword123',
      newPassword: 'newPassword123',
      confirmPassword: 'newPassword123',
    });

    component.ChangePassword();
    expect(changePasswordSpy).toHaveBeenCalledWith('newPassword123');
  });

  // 9. Prueba: Contraseñas no coinciden
  it('verifica que se muestra un modal si las contraseñas no coinciden', () => {
    component.fGroup.setValue({
      oldPassword: 'oldPassword123',
      newPassword: 'newPassword123',
      confirmPassword: 'differentPassword123',
    });

    component.ChangePassword();
    fixture.detectChanges();

    setTimeout(() => {
      const warningModal = document.getElementById('warningModal');
      const modalInstance = M.Modal.getInstance(warningModal!);
      expect(modalInstance.isOpen).toBeTrue();
    }, 300);
  });

  // 10. Prueba: Modal de error cuando ocurre un error en el cambio de contraseña
  it('verifica que se muestra un modal de error si la petición falla', () => {
    spyOn(component['securityService'], 'changePassword').and.returnValue(
      throwError(() => new Error('Error de servidor'))
    );
    const modalSpy = jasmine.createSpyObj('modal', ['open']);
    (M.Modal.getInstance as jasmine.Spy).and.returnValue(modalSpy);

    component.fGroup.setValue({
      oldPassword: 'oldPassword123',
      newPassword: 'newPassword123',
      confirmPassword: 'newPassword123',
    });

    component.ChangePassword();
    expect(modalSpy.open).toHaveBeenCalled();
  });

  // 11. Prueba: Redirección a login
  it('verifica que redirige a la página de logout cuando se llama a redirectToLogin()', () => {
    const routerSpy = spyOn(component['router'], 'navigate');
    component.redirectToLogin();
    expect(routerSpy).toHaveBeenCalledWith(['/security/logout']);
  });

  // 12. Prueba: Modal de advertencia cuando el formulario es inválido
  it('verifica que se muestra un modal de advertencia si el formulario es inválido', () => {
    const modalSpy = jasmine.createSpyObj('modal', ['open']);
    (M.Modal.getInstance as jasmine.Spy).and.returnValue(modalSpy);

    component.fGroup.setValue({
      oldPassword: '',
      newPassword: '',
      confirmPassword: ''
    });

    component.ChangePassword();
    expect(modalSpy.open).toHaveBeenCalled();
  });

  // 13. Prueba: Modal de éxito, contraseña exitosa
  it('debe llamar al servicio de seguridad y abrir el modo de éxito en caso de cambio de contraseña exitoso', () => {
    const securityServiceSpy = spyOn(component['securityService'], 'changePassword').and.returnValue(of({}));
    component.fGroup.setValue({
      oldPassword: 'oldPass123',
      newPassword: 'newPass123',
      confirmPassword: 'newPass123'
    });
    component.ChangePassword();
    expect(securityServiceSpy).toHaveBeenCalledWith('newPass123');
    expect(document.getElementById('modal1')).toBeTruthy();
  });

});

// ng test --include src/app/modules/security/password-change/password-change.component.spec.ts --code-coverage