import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { AdminRegistrationComponent } from './admin-registration.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { SecurityService } from '../../../services/security.service';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

describe('AdminRegistrationComponent', () => {
  let component: AdminRegistrationComponent;
  let fixture: ComponentFixture<AdminRegistrationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, HttpClientTestingModule, AdminRegistrationComponent],
      providers: [SecurityService],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminRegistrationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  // Verifica que no ocurra ningún error si el modal no existe
  it('should not do anything if the modal element does not exist', () => {
    spyOn(document, 'getElementById').and.returnValue(null); // Simula que el modal no existe
    spyOn(M.Modal, 'getInstance'); // Espía pero no espera ser llamado

    component.showModal('nonExistentModal');

    expect(M.Modal.getInstance).not.toHaveBeenCalled();
  });

  // Verifica que el modal se abre sin configurar el mensaje si no se proporciona uno
  it('should open the modal without setting the message if no message is provided', () => {
    const mockModalElement = document.createElement('div');
    spyOn(document, 'getElementById').and.returnValue(mockModalElement);
    const mockModalInstance = {
      open: jasmine.createSpy('open'),
    } as unknown as M.Modal;
    spyOn(M.Modal, 'getInstance').and.returnValue(mockModalInstance);

    component.showModal('mockModalId');

    expect(M.Modal.getInstance).toHaveBeenCalledWith(mockModalElement);
    expect(mockModalInstance.open).toHaveBeenCalled();
  });

  // Verifica que se establece el mensaje y se abre el modal si se proporciona un mensaje
  it('should set the message and open the modal if message is provided', () => {
    const mockModalElement = document.createElement('div');
    const mockContentElement = document.createElement('p');
    mockModalElement.querySelector = jasmine.createSpy('querySelector').and.returnValue(mockContentElement);

    spyOn(document, 'getElementById').and.returnValue(mockModalElement);
    const mockModalInstance = {
      open: jasmine.createSpy('open'),
    } as unknown as M.Modal;
    spyOn(M.Modal, 'getInstance').and.returnValue(mockModalInstance);

    component.showModal('mockModalId', 'Test Message');

    expect(mockModalElement.querySelector).toHaveBeenCalledWith('.modal-content p');
    expect(mockContentElement.textContent).toBe('Test Message');
    expect(mockModalInstance.open).toHaveBeenCalled();
  });
  

  // Verifica que se muestre el modal de error de validación cuando el formulario es inválido
  it('should show validationErrorModal when form is invalid', () => {
    spyOn(component, 'showModal');
    component.onSubmit();
    expect(component.showModal).toHaveBeenCalledWith(
      'validationErrorModal',
      'Por favor, complete todos los campos correctamente.'
    );
  });

  // Verifica que se muestre el modal de error de usuario existente si el usuario ya existe
  it('should show userExistsModal if user already exists', () => {
    spyOn(component['securityService'], 'getUserByDNI').and.returnValue(of({ dni: '12345678' }));
    spyOn(component, 'showModal');
    component.fGroup.setValue({
      name: 'John',
      lastName: 'Doe',
      typeDNI: '1',
      dni: '12345678',
      email: 'john@example.com',
    });
    component.onSubmit();
    expect(component.showModal).toHaveBeenCalledWith('userExistsModal', 'El usuario ya existe.');
  });

  // Verifica que se registre un nuevo administrador correctamente
  it('should register a new administrator successfully', () => {
    spyOn(component['securityService'], 'getUserByDNI').and.returnValue(of(null));
    spyOn(component['securityService'], 'registerUser').and.returnValue(of({}));
    spyOn(component, 'showModal');

    component.fGroup.setValue({
      name: 'John',
      lastName: 'Doe',
      typeDNI: '1',
      dni: '12345678',
      email: 'john@example.com',
    });
    component.onSubmit();
    expect(component.showModal).toHaveBeenCalledWith(
      'userRegisteredModal',
      'Administrador registrado correctamente.'
    );
  });

  // Verifica que se muestre el modal de error de validación si ocurre un error al registrar un administrador
  it('should show validationErrorModal if registering administrator fails', () => {
    spyOn(component['securityService'], 'getUserByDNI').and.returnValue(of(null));
    spyOn(component['securityService'], 'registerUser').and.returnValue(
      throwError(() => new HttpErrorResponse({ status: 500 }))
    );
    spyOn(component, 'showModal');

    component.fGroup.setValue({
      name: 'John',
      lastName: 'Doe',
      typeDNI: '1',
      dni: '12345678',
      email: 'john@example.com',
    });
    component.onSubmit();
    expect(component.showModal).toHaveBeenCalledWith(
      'validationErrorModal',
      'Error al registrar el administrador.'
    );
  });

  // Verifica que se muestre el modal de error de validación si ocurre un error al verificar la existencia del usuario
  it('should show validationErrorModal if error occurs while checking user existence', () => {
    spyOn(component['securityService'], 'getUserByDNI').and.returnValue(
      throwError(() => new HttpErrorResponse({ status: 500 }))
    );
    spyOn(component, 'showModal');

    component.fGroup.setValue({
      name: 'John',
      lastName: 'Doe',
      typeDNI: '1',
      dni: '12345678',
      email: 'john@example.com',
    });
    component.onSubmit();
    expect(component.showModal).toHaveBeenCalledWith(
      'validationErrorModal',
      'Error al verificar si el usuario existe.'
    );
  });
});

// ng test --include src/app/modules/security/admin-registration/admin-registration.component.spec.ts       