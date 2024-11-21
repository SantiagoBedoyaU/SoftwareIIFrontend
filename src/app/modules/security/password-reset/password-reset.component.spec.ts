import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PasswordResetComponent } from './password-reset.component';
import { HttpClientModule } from '@angular/common/http';
import { RouterTestingModule } from '@angular/router/testing';
import { SecurityService } from '../../../services/security.service';
import { of, throwError } from 'rxjs';

interface MaterializeMock {
  Datepicker: {
    init: jasmine.Spy;
  };
  Modal: {
    init: jasmine.Spy;
    getInstance: jasmine.Spy;
  };
}

describe('PasswordResetComponent', () => {
  let component: PasswordResetComponent;
  let fixture: ComponentFixture<PasswordResetComponent>;
  let securityService: SecurityService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PasswordResetComponent, HttpClientModule, RouterTestingModule]
    })
      .compileComponents();

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

    fixture = TestBed.createComponent(PasswordResetComponent);
    component = fixture.componentInstance;
    securityService = TestBed.inject(SecurityService);
    fixture.detectChanges();
  });

  // 1. Prueba: Validación contraseña (coinciden)
  it('debe establecer contraseñaMismatch en falso y el formulario es válido si las contraseñas coinciden', () => {
    component.fGroup.controls['password'].setValue('password123');
    component.fGroup.controls['confirmPassword'].setValue('password123');
    component.ResetPassword();

    expect(component.passwordMismatch).toBe(false);
    expect(component.fGroup.valid).toBe(true);
  });

  // 2. Prueba: Visbilidad contraseña (1)
  it('debe alternar isPasswordVisible cuando se hace clic en el icono de visibilidad', () => {
    const initialVisibility = component.isPasswordVisible;
    const passwordInput = document.getElementById('password') as HTMLInputElement;
    const toggleIcon = document.querySelector('.toggle-password') as HTMLElement;

    toggleIcon.click();
    fixture.detectChanges();

    expect(component.isPasswordVisible).toBe(!initialVisibility);
    expect(passwordInput.type).toBe(component.isPasswordVisible ? 'text' : 'password');
  });

  // 3. Visibilidad Contraseña (2)
  it('debe alternar isPasswordVisible2 cuando se hace clic en el icono de confirmación de visibilidad de contraseña', () => {
    const initialVisibility = component.isPasswordVisible2;
    const confirmPasswordInput = document.getElementById('confirmPassword') as HTMLInputElement;
    const toggleIcon = document.querySelector('.toggle-password-confirm') as HTMLElement;

    toggleIcon.click();
    fixture.detectChanges();

    expect(component.isPasswordVisible2).toBe(!initialVisibility);
    expect(confirmPasswordInput.type).toBe(component.isPasswordVisible2 ? 'text' : 'password');
  });

  // 4. Prueba: mostrar modal de error
  it('debe abrir el modal de error si la solicitud de restablecimiento falla', () => {
    spyOn(securityService, 'resetPassword').and.returnValue(of(new Error('Error')));
    const modalError = (window as unknown as { M: MaterializeMock }).M.Modal.getInstance(document.getElementById('modal2')!);

    component.fGroup.controls['password'].setValue('password123');
    component.fGroup.controls['confirmPassword'].setValue('password123');
    component.ResetPassword();

    expect(modalError.open).toHaveBeenCalled();
  });

  // 5. Prueba: redirigir a /security/signin
  it('debe redirigir a /security/signin cuando se llama redirectToLogin', () => {
    const routerSpy = spyOn(component['router'], 'navigate');
    component.redirectToLogin();
    expect(routerSpy).toHaveBeenCalledWith(['/security/signin']);
  });

  // 6. Prueba: Validación contraseña (no coinciden)
  it('debe abrir el modal de advertencia si las contraseñas no coinciden', () => {
    const modalWarning = window.M.Modal.getInstance(document.getElementById('warningModal')!);
    component.fGroup.controls['password'].setValue('password123');
    component.fGroup.controls['confirmPassword'].setValue('differentPassword');
    component.ResetPassword();

    expect(modalWarning.open).toHaveBeenCalled();
  });

  // 7. Prueba: Validación contraseña (vacías)
  it('debe mostrar una alerta si el formulario es inválido', () => {
    spyOn(window, 'alert');
    component.fGroup.controls['password'].setValue('');
    component.fGroup.controls['confirmPassword'].setValue('');

    component.ResetPassword();
    expect(window.alert).toHaveBeenCalledWith('Introduce una contraseña válida');
  });

  // 8. Prueba: Error en la solicitud de restablecimiento
  it('debe abrir el modal de error si ocurre un error durante la solicitud de restablecimiento', () => {
    spyOn(securityService, 'resetPassword').and.returnValue(
      throwError(() => new Error('Error en el servicio')) // Simular un error
    );

    const modalError = window.M.Modal.getInstance(
      document.getElementById('modal2')!
    );

    component.fGroup.controls['password'].setValue('password123');
    component.fGroup.controls['confirmPassword'].setValue('password123');

    component.ResetPassword();
    expect(modalError.open).toHaveBeenCalled();
  });

  it('debe cambiar el campo password a tipo "password" y el icono a "visibility_off" cuando isPasswordVisible es true', () => {
    component.isPasswordVisible = true;
    fixture.detectChanges();

    const passwordInput = document.getElementById('password') as HTMLInputElement;
    const toggleIcon = document.querySelector('.toggle-password') as HTMLElement;

    toggleIcon.click();
    fixture.detectChanges();

    expect(passwordInput.type).toBe('password');
    expect(toggleIcon.textContent).toBe('visibility_off');
    expect(component.isPasswordVisible).toBe(false);
  });

  it('debe cambiar el campo confirmPassword a tipo "password" y el icono a "visibility_off" cuando isPasswordVisible2 es true', () => {
    component.isPasswordVisible2 = true;
    fixture.detectChanges();

    const confirmPasswordInput = document.getElementById('confirmPassword') as HTMLInputElement;
    const toggleIcon = document.querySelector('[toggle="#confirmPassword"]') as HTMLElement;

    toggleIcon.click();
    fixture.detectChanges();

    expect(confirmPasswordInput.type).toBe('password');
    expect(toggleIcon.textContent).toBe('visibility_off');
    expect(component.isPasswordVisible2).toBe(false);
  });

});

// ng test --include src/app/modules/security/password-reset/password-reset.component.spec.ts --code-coverage
