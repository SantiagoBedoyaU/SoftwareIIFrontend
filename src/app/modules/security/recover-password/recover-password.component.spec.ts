import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RecoverPasswordComponent } from './recover-password.component';
import { HttpClientModule } from '@angular/common/http';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';
import { SecurityService } from '../../../services/security.service';

describe('RecoverPasswordComponent', () => {
  let component: RecoverPasswordComponent;
  let fixture: ComponentFixture<RecoverPasswordComponent>;
  let securityService: SecurityService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecoverPasswordComponent, HttpClientModule, RouterTestingModule]
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

    fixture = TestBed.createComponent(RecoverPasswordComponent);
    component = fixture.componentInstance;
    securityService = TestBed.inject(SecurityService);
    fixture.detectChanges();
  });

  // 1. Mostrar errores de validación
  it('debería mostrar errores de validación', () => {
    component.fGroup.controls['dni'].setValue('');
    component.fGroup.controls['dni'].markAsTouched();
    fixture.detectChanges();

    let errorMessage = fixture.nativeElement.querySelector('.show-errors');
    expect(errorMessage).toBeTruthy();
    expect(errorMessage.textContent).toContain('Introduce un DNI válido');

    component.fGroup.controls['dni'].setValue('abc123');
    component.fGroup.controls['dni'].markAsTouched();
    fixture.detectChanges();

    errorMessage = fixture.nativeElement.querySelector('.show-errors');
    expect(errorMessage).toBeTruthy();
    expect(errorMessage.textContent).toContain('Introduce un DNI válido');
  });

  // 2. Envio de formulario exitoso
  it('debería llamar al servicio de recuperación de contraseña cuando se envía el formulario', () => {
    const recoverPasswordSpy = spyOn(securityService, 'recoverPassword').and.returnValue(of({}));
    const validDni = '12345678';
    component.fGroup.controls['dni'].setValue(validDni);

    component.onSubmit();
    fixture.detectChanges();

    expect(recoverPasswordSpy).toHaveBeenCalled();
    expect(recoverPasswordSpy).toHaveBeenCalledWith(validDni);
  });

  // 3. Redirección al cambiar la contraseña
  it('debería redirigir al usuario a la página de cambio de contraseña', () => {
    const routerSpy = spyOn(component['router'], 'navigate');

    const modal = M.Modal.getInstance(document.getElementById('modal1')!);
    modal.open();
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('.modal-close');
    button.click();
    fixture.detectChanges();
    expect(routerSpy).toHaveBeenCalledWith(['/security/signin']);
  });

  // 4. Verificar errores y excepciones
  it('debería mostrar una alerta si el formulario es inválido', () => {
    spyOn(window, 'alert');
    component.fGroup.controls['dni'].setValue('');
    fixture.detectChanges();

    component.onSubmit();
    expect(window.alert).toHaveBeenCalledWith('Introduce un DNI válido');
  });

  // 5. Prueba: Error en el servicio
  it('debería abrir el modal de error si ocurre un problema en el servicio', () => {
    const recoverPasswordSpy = spyOn(securityService, 'recoverPassword').and.returnValue(throwError(() => new Error()));
    component.fGroup.controls['dni'].setValue('12345678');
    fixture.detectChanges();

    component.onSubmit();
    expect(recoverPasswordSpy).toHaveBeenCalled();

    const modal = M.Modal.getInstance(document.getElementById('modal2')!);
    expect(modal.open).toHaveBeenCalled();
  });

  // 6. Prueba: Redirección al inicio de sesión
  it('debería redirigir al usuario a la página de inicio de sesión', () => {
    const routerSpy = spyOn(component['router'], 'navigate');

    component.redirectToLogin();
    expect(routerSpy).toHaveBeenCalledWith(['/security/signin']);
  });

});


// ng test --include src/app/modules/security/recover-password/recover-password.component.spec.ts --code-coverage
