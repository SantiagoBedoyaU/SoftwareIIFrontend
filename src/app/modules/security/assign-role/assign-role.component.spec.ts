import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { AssignRoleComponent } from './assign-role.component';
import { HttpClientModule, HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';

describe('AssignRoleComponent', () => {
  let component: AssignRoleComponent;
  let fixture: ComponentFixture<AssignRoleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HttpClientModule, ReactiveFormsModule, AssignRoleComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(AssignRoleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should use empty string as default when dni is null or undefined', () => {
    component.foundUser = { dni: undefined, first_name: 'John', last_name: 'Doe', email: 'john@example.com', role: 1 }; // dni es undefined
    component.fGroup.get('newRole')?.setValue('2'); // Rol válido

    spyOn(component['securityService'], 'updateUserRole').and.returnValue(of({}));
    spyOn(component, 'showModal');

    component.onAssignRole();

    // Verifica que se llama con '' como valor de dni
    expect(component['securityService'].updateUserRole).toHaveBeenCalledWith('', 2);
  });


  it('should close the loading modal when an error occurs during role assignment', () => {
    const mockModalInstance = {
      open: jasmine.createSpy('open'),
      close: jasmine.createSpy('close'),
      isOpen: false,
      destroy: jasmine.createSpy('destroy'),
      el: document.createElement('div')
    } as unknown as M.Modal;

    spyOn(M.Modal, 'getInstance').and.returnValue(mockModalInstance);

    spyOn(component['securityService'], 'updateUserRole').and.returnValue(
      throwError(() => new HttpErrorResponse({ status: 500 }))
    );

    component.foundUser = { dni: '12345678', first_name: 'John', last_name: 'Doe', email: 'john@example.com', role: 1 };
    component.fGroup.get('newRole')?.setValue('2');

    component.onAssignRole();

    expect(mockModalInstance.close).toHaveBeenCalled();
  });

  // Prueba para el campo DNI vacío
  it('should show an error message when the DNI field is empty', () => {
    const dniControl = component.fGroup.get('dni');
    dniControl?.setValue(''); // Deja el campo DNI vacío
    dniControl?.markAsTouched(); // Marca el campo como tocado para activar la validación
    fixture.detectChanges(); // Actualiza la vista

    const errorElement: HTMLElement = fixture.nativeElement.querySelector('.error-message');
    expect(errorElement).toBeTruthy();
    expect(errorElement.textContent).toContain('Introduzca un número de identificación válido.');
  });

  it('should show userNotFoundModal when a 404 error occurs while searching for a user', () => {
    spyOn(component['securityService'], 'getUserByDNI').and.returnValue(
      throwError(() => new HttpErrorResponse({ status: 404 }))
    );
    spyOn(component, 'showModal');

    component.fGroup.get('dni')?.setValue('12345678');
    component.onSearchUser();

    expect(component.showModal).toHaveBeenCalledWith('userNotFoundModal');
  });

  it('should show validationErrorModal when an error occurs while searching for a user', () => {
    spyOn(component['securityService'], 'getUserByDNI').and.returnValue(
      throwError(() => new HttpErrorResponse({ status: 500 }))
    );
    spyOn(component, 'showModal');

    component.fGroup.get('dni')?.setValue('12345678');
    component.onSearchUser();

    expect(component.showModal).toHaveBeenCalledWith('validationErrorModal', 'Error al encontrar al usuario.');
  });

  it('should show validationErrorModal when DNI is invalid', () => {
    spyOn(component, 'showModal');

    component.fGroup.get('dni')?.setValue('');
    component.onSearchUser();

    expect(component.showModal).toHaveBeenCalledWith('validationErrorModal', 'Introduzca un número de identificación válido.');
  });


  // Prueba para el campo DNI con caracteres no numéricos
  it('should show an error message when the DNI field contains non-numeric characters', () => {
    const dniControl = component.fGroup.get('dni');
    dniControl?.setValue('abc123'); // Establece un valor no numérico
    dniControl?.markAsTouched();
    fixture.detectChanges();

    const errorElement: HTMLElement = fixture.nativeElement.querySelector('.error-message');
    expect(errorElement).toBeTruthy();
    expect(errorElement.textContent).toContain('Introduzca un número de identificación válido.');
  });

  // Prueba para el campo newRole no seleccionado
  it('should show an error message when the newRole field is not selected', () => {
    component.foundUser = { dni: '12345678', first_name: 'John', last_name: 'Doe', email: 'john@example.com', role: 1 };
    component.fGroup.get('newRole')?.setValue(''); // No se selecciona ningún rol
    component.fGroup.get('newRole')?.markAsTouched();
    fixture.detectChanges();

    const errorElement: HTMLElement = fixture.nativeElement.querySelector('.error-message');
    expect(errorElement).toBeTruthy();
    expect(errorElement.textContent).toContain('Seleccione una rol.');
  });

  // Prueba para usuario existente
  it('should display user data when a valid DNI is entered and user exists', () => {
    const user = { dni: '12345678', first_name: 'John', last_name: 'Doe', email: 'john@example.com', role: 1 };
    spyOn(component['securityService'], 'getUserByDNI').and.returnValue(of(user));

    component.fGroup.get('dni')?.setValue('12345678');
    component.onSearchUser();

    expect(component.foundUser).toEqual(user);
  });

  // Prueba para usuario no encontrado
  it('should show userNotFoundModal when user is not found', () => {
    spyOn(component['securityService'], 'getUserByDNI').and.returnValue(of(null));
    spyOn(component, 'showModal');

    component.fGroup.get('dni')?.setValue('87654321');
    component.onSearchUser();

    expect(component.showModal).toHaveBeenCalledWith('userNotFoundModal');
    expect(component.foundUser).toBeNull();
  });

  // verifica rol actual del usuario encontrado
  it('should display the current role of the found user', () => {
    // Simula un usuario encontrado con el rol "Doctor"
    const user = { dni: '12345678', first_name: 'John', last_name: 'Doe', email: 'john@example.com', role: 1 };
    spyOn(component['securityService'], 'getUserByDNI').and.returnValue(of(user));

    // Establece el DNI y llama a la función de búsqueda
    component.fGroup.get('dni')?.setValue('12345678');
    component.onSearchUser();

    // Actualiza el DOM después de cambiar el estado del componente
    fixture.detectChanges();

    // Busca el elemento `<p>` que contiene `Rol actual:`
    const roleElement = Array.from(fixture.nativeElement.querySelectorAll('p'))
      .find((p) => (p as HTMLElement).textContent?.includes('Rol actual:')) as HTMLElement | null;

    // Si `find` devuelve `undefined`, `roleElement` será `null`
    expect(roleElement).not.toBeNull(); // Verifica que el elemento fue encontrado
    expect(roleElement?.textContent).toContain('Rol actual: Doctor'); // Verifica el contenido

  });

  it('should show validationErrorModal when an error occurs and loadingModalInstance is null', () => {
    // Simula que no hay instancia del modal devolviendo null y forzando el tipo
    spyOn(M.Modal, 'getInstance').and.returnValue(null as unknown as M.Modal);

    spyOn(component['securityService'], 'updateUserRole').and.returnValue(
      throwError(() => new HttpErrorResponse({ status: 500 }))
    );
    spyOn(component, 'showModal');

    component.foundUser = { dni: '12345678', first_name: 'John', last_name: 'Doe', email: 'john@example.com', role: 1 };
    component.fGroup.get('newRole')?.setValue('2');

    component.onAssignRole();

    expect(component.showModal).toHaveBeenCalledWith('validationErrorModal', 'Error al asignar el rol.');
  });


  it('should show validationErrorModal when newRole is not selected or user is not found', () => {
    spyOn(component, 'showModal');

    component.fGroup.get('newRole')?.setValue(''); // No se selecciona ningún rol
    component.foundUser = null; // Usuario no encontrado

    component.onAssignRole();

    expect(component.showModal).toHaveBeenCalledWith('validationErrorModal', 'Seleccione una rol.');
  });


  it('should set foundUser when a user is found', () => {
    const user = { dni: '12345678', first_name: 'John', last_name: 'Doe', email: 'john@example.com', role: 1 };
    spyOn(component['securityService'], 'getUserByDNI').and.returnValue(of(user));

    component.fGroup.get('dni')?.setValue('12345678');
    component.onSearchUser();

    expect(component.foundUser).toEqual(user);
  });

  // Prueba para seleccionar un nuevo rol del desplegable
  it('should allow selecting a new role from the dropdown', () => {
    component.foundUser = { dni: '12345678', first_name: 'John', last_name: 'Doe', email: 'john@example.com', role: 1 };
    component.fGroup.get('newRole')?.setValue('2'); // Selecciona un nuevo rol
    fixture.detectChanges();

    expect(component.fGroup.get('newRole')?.valid).toBeTrue();
  });

  // Prueba para asignar un nuevo rol sin seleccion
  it('should not allow role assignment if newRole is not selected', () => {
    component.foundUser = { dni: '12345678', first_name: 'John', last_name: 'Doe', email: 'john@example.com', role: 1 };
    component.fGroup.get('newRole')?.setValue('');
    spyOn(component, 'showModal');

    component.onAssignRole();

    expect(component.showModal).toHaveBeenCalledWith('validationErrorModal', 'Seleccione una rol.');
  });


  // Prueba para asignacion de rol correcto
  it('should close the loading modal after assigning the role successfully', () => {
    // Mock completo para M.Modal.getInstance
    spyOn(M.Modal, 'getInstance').and.returnValue({
      open: jasmine.createSpy('open'),
      close: jasmine.createSpy('close'),
      isOpen: false,
      destroy: jasmine.createSpy('destroy'),
      el: document.createElement('div'),
      id: 'mock-modal-id'
    } as unknown as M.Modal); // Usa un cast explícito para forzar el tipo

    spyOn(component['securityService'], 'updateUserRole').and.returnValue(of({}));

    component.foundUser = { dni: '12345678', first_name: 'John', last_name: 'Doe', email: 'john@example.com', role: 1 };
    component.fGroup.get('newRole')?.setValue('2');

    component.onAssignRole();

    const loadingModalInstance = M.Modal.getInstance(document.getElementById('loadingModal')!);
    expect(loadingModalInstance.close).toHaveBeenCalled();
  });

  it('should close the loading modal and show validationErrorModal when an error occurs', () => {
    const mockModalInstance = {
      close: jasmine.createSpy('close'),
    } as unknown as M.Modal;

    spyOn(M.Modal, 'getInstance').and.returnValue(mockModalInstance);
    spyOn(component['securityService'], 'updateUserRole').and.returnValue(
      throwError(() => new HttpErrorResponse({ status: 500 }))
    );
    spyOn(component, 'showModal');

    component.foundUser = { dni: '12345678', first_name: 'John', last_name: 'Doe', email: 'john@example.com', role: 1 };
    component.fGroup.get('newRole')?.setValue('2');

    component.onAssignRole();

    expect(mockModalInstance.close).toHaveBeenCalled();
    expect(component.showModal).toHaveBeenCalledWith('validationErrorModal', 'Error al asignar el rol.');
  });



  //Asignación de rol - Error de servidor: Simula un error del servidor:
  it('should show a validationErrorModal when there is a server error', () => {
    component.foundUser = { dni: '12345678', first_name: 'John', last_name: 'Doe', email: 'john@example.com', role: 1 };
    component.fGroup.get('newRole')?.setValue('2');
    spyOn(component['securityService'], 'updateUserRole').and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
    spyOn(component, 'showModal');

    component.onAssignRole();

    expect(component.showModal).toHaveBeenCalledWith('validationErrorModal', 'Error al asignar el rol.');
  });

  it('should return the correct role name for a given role', () => {
    expect(component.getRoleName(1)).toBe('Doctor');
    expect(component.getRoleName(2)).toBe('Paciente');
    expect(component.getRoleName(0)).toBe('Administrador');
    expect(component.getRoleName(99)).toBe('Unknown');
  });



  it('should show loading modal while assigning role and close it afterwards', () => {
    const mockModalInstance = {
      open: jasmine.createSpy('open'), // Agrega el método `open`
      close: jasmine.createSpy('close'), // Método existente
      isOpen: false,
      destroy: jasmine.createSpy('destroy'),
      el: document.createElement('div')
    } as unknown as M.Modal;

    spyOn(M.Modal, 'getInstance').and.returnValue(mockModalInstance);

    spyOn(component['securityService'], 'updateUserRole').and.returnValue(of({}));

    component.foundUser = { dni: '12345678', first_name: 'John', last_name: 'Doe', email: 'john@example.com', role: 1 };
    component.fGroup.get('newRole')?.setValue('2');

    component.onAssignRole();

    expect(mockModalInstance.open).toHaveBeenCalled();
    expect(mockModalInstance.close).toHaveBeenCalled();
  });

});

// ng test --include src/app/modules/security/assign-role/assign-role.component.spec.ts
