import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PatchPersonalDataComponent } from './patch-personal-data.component';
import { HttpClientModule } from '@angular/common/http';
import { UserService } from '../../../services/user.service';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

interface MaterializeMock {
  M: {
    Modal: {
      init: jasmine.Spy;
      getInstance: jasmine.Spy;
    };
    Datepicker: {
      init: jasmine.Spy;
    };
  };
}

describe('PatchPersonalDataComponent', () => {
  let component: PatchPersonalDataComponent;
  let fixture: ComponentFixture<PatchPersonalDataComponent>;
  let userService: jasmine.SpyObj<UserService>;
  let router: Router;

  beforeEach(async () => {
    // Mock del Router para evitar navegación real
    const mockRouter = {
      navigate: jasmine.createSpy('navigate')
    };

    // Mock del UserService
    const mockUserService = {
      GetUserData: jasmine.createSpy('GetUserData').and.returnValue(
        of({
          first_name: 'John',
          last_name: 'Doe',
          email: 'john.doe@example.com',
          dni: '123456789',
          address: '123 Main St',
          phone: '9876543210'
        })
      ),
      UpdateUserData: jasmine.createSpy('UpdateUserData').and.returnValue(of({}))
    };

    await TestBed.configureTestingModule({
      imports: [PatchPersonalDataComponent, HttpClientModule],
      providers: [
        { provide: UserService, useValue: mockUserService }, // Usar el mock
        { provide: Router, useValue: mockRouter }
      ]
    }).compileComponents();

    // Mock de Materialize.js para evitar errores
    // Mock de Materialize para evitar errores durante las pruebas
    (window as unknown as MaterializeMock).M = {
      Modal: {
        init: jasmine.createSpy('init'),
        getInstance: jasmine.createSpy('getInstance').and.returnValue({
          open: jasmine.createSpy('open'),
          close: jasmine.createSpy('close')
        })
      },
      Datepicker: {
        init: jasmine.createSpy('init')
      }
    };

    fixture = TestBed.createComponent(PatchPersonalDataComponent);
    component = fixture.componentInstance;

    // Inyectar el mock directamente
    userService = TestBed.inject(UserService) as jasmine.SpyObj<UserService>;
    router = TestBed.inject(Router);

    fixture.detectChanges();
  });

  // 1. Prueba: Inicialización del componente
  it('debe inicializar el formulario con valores por defecto', () => {
    spyOn(component, 'LoadUserData').and.callFake(() => {
      // Función vacía intencionada para evitar la ejecución real
    });
    component.ngOnInit();
    expect(component.fGroup.value).toEqual({
      firstName: '',
      lastName: '',
      email: '',
      dni: '',
      address: '',
      phone: ''
    });
  });

  // 2. Prueba: Verificar que LoadUserData llama al servicio y actualiza el formulario
  it('debe llamar a LoadUserData y rellenar el formulario', () => {
    component.LoadUserData();
    expect(userService.GetUserData).toHaveBeenCalled();
    expect(component.fGroup.value).toEqual({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      dni: '123456789',
      address: '123 Main St',
      phone: '9876543210'
    });
  });

  // 3. Prueba: Verificar que redirectToGetData navega a /user/get-personal-data
  it('debe navegar a /user/get-personal-data cuando se llama a redirectToGetData', () => {
    component.redirectToGetData();
    expect(router.navigate).toHaveBeenCalledWith(['/user/get-personal-data']);
  });

  // 4. Prueba: Verificar que UpdatePersonalData actualiza los datos del usuario
  it('debe llamar a UpdateUserData y abrir el modal de éxito cuando el formulario es válido', () => {
    component.fGroup.setValue({
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane.doe@example.com',
      dni: '987654321',
      address: '456 Another St',
      phone: '1234567890',
    });

    const successModal = {
      open: jasmine.createSpy('open'),
    };
    (window as unknown as MaterializeMock).M.Modal.getInstance.and.returnValue(successModal);

    component.UpdatePersonalData();

    expect(userService.UpdateUserData).toHaveBeenCalledWith({
      first_name: 'Jane',
      last_name: 'Doe',
      email: 'jane.doe@example.com',
      address: '456 Another St',
      phone: '1234567890',
    });
    expect(successModal.open).toHaveBeenCalled();
  });

  // 5. Prueba: Verificar que UpdatePersonalData no actualiza los datos del usuario si el formulario no es válido
  it('debería abrir un modal de advertencia cuando el formulario no es válido', () => {
    // Dejar el formulario inválido (vacío)
    component.fGroup.setValue({
      firstName: '',
      lastName: '',
      email: '',
      dni: '',
      address: '',
      phone: '',
    });

    const warningModal = {
      open: jasmine.createSpy('open'),
    };
    (window as unknown as MaterializeMock).M.Modal.getInstance.and.returnValue(warningModal);

    component.UpdatePersonalData();

    expect(userService.UpdateUserData).not.toHaveBeenCalled();
    expect(warningModal.open).toHaveBeenCalled();
  });

  // 6. Prueba: Verificar que UpdatePersonalData abre el modal de error cuando UpdateUserData falla
  it('debe abrir el modal de error cuando UpdateUserData falla', () => {
    // Mock valores del formulario
    component.fGroup.setValue({
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane.doe@example.com',
      dni: '987654321',
      address: '456 Another St',
      phone: '1234567890',
    });

    userService.UpdateUserData.and.returnValue(throwError(() => new Error('Update failed')));

    const errorModal = {
      open: jasmine.createSpy('open'),
    };
    (window as unknown as MaterializeMock).M.Modal.getInstance.and.returnValue(errorModal);

    component.UpdatePersonalData();

    expect(userService.UpdateUserData).toHaveBeenCalled();
    expect(errorModal.open).toHaveBeenCalled();
  });

  // 7. Prueba: Verificar que el getter GetFormGroup devuelve los controles del formulario
  it('debe devolver los controles de formulario del getter GetFormGroup', () => {
    const formControls = component.GetFormGroup;
    expect(formControls).toBe(component.fGroup.controls);
    expect(Object.keys(formControls)).toEqual(['firstName', 'lastName', 'email', 'dni', 'address', 'phone']);
  });
});

// ng test --include src/app/modules/user/patch-personal-data/patch-personal-data.component.spec.ts --code-coverage