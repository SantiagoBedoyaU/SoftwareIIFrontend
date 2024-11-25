import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { PatientDoctorRegistrationComponent } from './patient-doctor-registration.component';
import { HttpClientModule, HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';

describe('PatientDoctorRegistrationComponent', () => {
  let component: PatientDoctorRegistrationComponent;
  let fixture: ComponentFixture<PatientDoctorRegistrationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PatientDoctorRegistrationComponent],
      imports: [HttpClientModule, ReactiveFormsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(PatientDoctorRegistrationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // Verifica que se muestre el modal de error de validación (validationErrorModal) si falla la llamada al servicio getUserByDNI
  it('should show validationErrorModal if getUserByDNI fails', () => {
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
      role: '2',
    });

    component.onSubmit();

    expect(component.showModal).toHaveBeenCalledWith(
      'validationErrorModal',
      'Error al verificar si el usuario existe.'
    );
  });

  // Verifica que se registren en la consola los detalles del error y que se muestre el modal de error de validación (validationErrorModal) 
  //cuando isErrorWithDetail sea verdadero en onUploadCSV
  it('should log error details if isErrorWithDetail is true in onUploadCSV', async () => {
    const mockError = { error: 'Detalle del error' };
    spyOn(component['securityService'], 'uploadUsersFromCSV').and.returnValue(
      throwError(() => mockError)
    );
    spyOn(component, 'showModal');
    spyOn(console, 'error');

    const mockFile = new File([''], 'users.csv', { type: 'text/csv' });
    component.selectedFile = mockFile;

    await component.onUploadCSV();

    expect(console.error).toHaveBeenCalledWith('Detalles del error:', 'Detalle del error');
    expect(component.showModal).toHaveBeenCalledWith(
      'validationErrorModal',
      'Error al cargar usuarios desde CSV.'
    );
  });


  // Verifica que la función `showModal` no arroje un error incluso si el elemento del modal no existe en el DOM
  it('should not throw an error if modal element does not exist', () => {
    spyOn(document, 'getElementById').and.returnValue(null); // Simula que el modal no existe

    expect(() => component.showModal('nonExistentModal')).not.toThrow();
  });


  // Verifica que se muestre el modal `userExistsModal` si el usuario ya existe en el sistema
  it('should show userExistsModal if the user already exists', () => {
    spyOn(component['securityService'], 'getUserByDNI').and.returnValue(of({ dni: '12345678' })); // Simula que el usuario existe
    spyOn(component, 'showModal');

    component.fGroup.setValue({
      name: 'John',
      lastName: 'Doe',
      typeDNI: '1',
      dni: '12345678',
      email: 'john@example.com',
      role: '2',
    });

    component.onSubmit();

    expect(component.showModal).toHaveBeenCalledWith('userExistsModal'); // Asegúrate de que el modal se abra
  });


  // Verifica que el modal se abra correctamente y muestre el mensaje proporcionado
  it('should open the modal with the correct message', () => {
    // Crear un elemento simulado para el modal
    const mockModalElement = document.createElement('div');
    mockModalElement.id = 'mockModalId';

    // Crear un `p` dentro de `.modal-content` en el modal
    const mockContentDiv = document.createElement('div');
    mockContentDiv.className = 'modal-content';
    const mockParagraph = document.createElement('p');
    mockContentDiv.appendChild(mockParagraph);
    mockModalElement.appendChild(mockContentDiv);

    // Agregar el modal al DOM simulado
    document.body.appendChild(mockModalElement);

    // Mockear Materialize Modal
    spyOn(M.Modal, 'getInstance').and.returnValue({
      open: jasmine.createSpy('open'),
      close: jasmine.createSpy('close'),
      isOpen: false,
      destroy: jasmine.createSpy('destroy'),
      el: mockModalElement,
    } as unknown as M.Modal);

    // Llamar a `showModal` con el mensaje
    component.showModal('mockModalId', 'Test Message');

    // Verificar que el mensaje se haya establecido correctamente
    expect(mockParagraph.textContent).toBe('Test Message');
    // Verificar que el modal se haya abierto
    expect(M.Modal.getInstance(mockModalElement)?.open).toHaveBeenCalled();

    // Limpiar el DOM
    document.body.removeChild(mockModalElement);
  });

  // Verifica que el usuario se registre correctamente y se abra el modal de confirmación
  it('should register a user successfully and open userRegisteredModal', () => {
    spyOn(component['securityService'], 'registerUser').and.returnValue(of({}));
    spyOn(component, 'showModal');
    spyOn(component, 'ClearForm');

    component.registerUser();

    expect(component['securityService'].registerUser).toHaveBeenCalled();
    expect(component.showModal).toHaveBeenCalledWith('userRegisteredModal');
    expect(component.ClearForm).toHaveBeenCalled();
  });

  // Verifica que se muestre el modal de error de validación cuando falla el registro de usuario
  it('should show validationErrorModal when user registration fails', () => {
    spyOn(component['securityService'], 'registerUser').and.returnValue(
      throwError(() => new HttpErrorResponse({ status: 500 }))
    );
    spyOn(component, 'showModal');

    component.registerUser();

    expect(component['securityService'].registerUser).toHaveBeenCalled();
    expect(component.showModal).toHaveBeenCalledWith('validationErrorModal', 'Error al registrar el usuario.');
  });

  // Verifica que se muestre el modal de éxito al cargar un archivo CSV correctamente
  it('should show csvUploadSuccessModal on successful CSV upload', async () => {
    spyOn(component['securityService'], 'uploadUsersFromCSV').and.returnValue(of({}));
    spyOn(component, 'showModal');

    const mockFile = new File([''], 'users.csv', { type: 'text/csv' });
    component.selectedFile = mockFile;

    await component.onUploadCSV();

    expect(component.showModal).toHaveBeenCalledWith('csvUploadSuccessModal');
    expect(component.selectedFile).toBeNull();
  });

  // Verifica que se muestre el modal de error al fallar la carga de un archivo CSV
  it('should show validationErrorModal if CSV upload fails', async () => {
    const mockFile = new File([''], 'users.csv', { type: 'text/csv' });
    component.selectedFile = mockFile;

    spyOn(component['securityService'], 'uploadUsersFromCSV').and.returnValue(
      throwError(() => new Error('CSV upload error'))
    );
    spyOn(component, 'showModal');

    await component.onUploadCSV();

    expect(component.showModal).toHaveBeenCalledWith('validationErrorModal', 'Error al cargar usuarios desde CSV.');
  });


  // Verifica que el formulario y el archivo seleccionado se reinicien al llamar a ClearForm
  it('should reset the form and clear selected file on ClearForm', () => {
    component.selectedFile = new File([''], 'test.csv', { type: 'text/csv' });
    component.fGroup.setValue({
      name: 'John',
      lastName: 'Doe',
      typeDNI: '1',
      dni: '12345678',
      email: 'john.doe@example.com',
      role: '2'
    });

    component.ClearForm();

    expect(component.fGroup.value).toEqual({
      name: null,
      lastName: null,
      typeDNI: '',
      dni: null,
      email: null,
      role: ''
    });
    expect(component.selectedFile).toBeNull();
  });


  //Validación de campos vacíos
  it('should show validation error modal when fields are empty', () => {
    spyOn(component, 'showModal');
    component.fGroup.get('name')?.setValue('');
    component.fGroup.get('lastName')?.setValue('');
    component.fGroup.get('typeDNI')?.setValue('');
    component.fGroup.get('dni')?.setValue('');
    component.fGroup.get('email')?.setValue('');
    component.fGroup.get('role')?.setValue('');
    component.onSubmit();
    expect(component.showModal).toHaveBeenCalledWith('validationErrorModal');
  });

  //Formato de DNI incorrecto
  it('should show validation error for invalid DNI format', () => {
    component.fGroup.get('dni')?.setValue('abc123'); // Formato no numérico
    component.fGroup.get('dni')?.markAsTouched();
    fixture.detectChanges();
    const errorElement = fixture.nativeElement.querySelector('.error-message');
    expect(errorElement).toBeTruthy();
    // Actualizar el mensaje esperado en la prueba
    expect(errorElement.textContent).toContain('El número de documento debe ser numérico.');

  });

  //Formato de email incorrecto
  it('should show validation error for invalid DNI format', () => {
    const dniControl = component.fGroup.get('dni');
    dniControl?.setValue('abc123'); // Valor no numérico
    dniControl?.markAsTouched();
    fixture.detectChanges();

    const errorElement: HTMLElement = fixture.nativeElement.querySelector('.error-message');
    expect(errorElement).toBeTruthy();
    expect(errorElement.textContent).toContain('El número de documento debe ser numérico.');
  });

  // Verifica que se muestre un mensaje de error si el formato del correo electrónico es inválido
  it('should show validation error for invalid email format', () => {
    const emailControl = component.fGroup.get('email');
    emailControl?.setValue('invalid-email'); // Email inválido
    emailControl?.markAsTouched();
    fixture.detectChanges();

    const errorElement: HTMLElement = fixture.nativeElement.querySelector('.error-message');
    expect(errorElement).toBeTruthy();
    expect(errorElement.textContent).toContain('Ingrese un correo electrónico válido.');
  });

  // Verifica que el formulario se marque como sucio al seleccionar un archivo
  it('should mark the form as dirty when a file is selected', () => {
    const mockFile = new File([''], 'users.csv', { type: 'text/csv' });
    const mockEvent = { target: { files: [mockFile] } } as unknown as Event;

    component.onFileSelected(mockEvent);

    expect(component.selectedFile).toBe(mockFile);
    expect(component.fGroup.dirty).toBeTrue();
  });


  // Registro de nuevo usuario
  it('should show userRegisteredModal when a new user is registered successfully', () => {
    spyOn(component['securityService'], 'getUserByDNI').and.returnValue(of(null)); // Usuario no existe
    spyOn(component['securityService'], 'registerUser').and.returnValue(of({}));
    spyOn(component, 'showModal');
    component.fGroup.setValue({
      name: 'John',
      lastName: 'Doe',
      typeDNI: '1',
      dni: '12345678',
      email: 'john.doe@example.com',
      role: '2'
    });
    component.onSubmit();
    expect(component.showModal).toHaveBeenCalledWith('userRegisteredModal');
  });

  // Verifica que se muestre el modal de error de validación si ocurre un error al verificar si el usuario existe
  it('should show validationErrorModal when an error occurs checking if user exists', () => {
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
      role: '2',
    });

    component.onSubmit();

    expect(component.showModal).toHaveBeenCalledWith('validationErrorModal', 'Error al verificar si el usuario existe.');
  });


  // Error en el registro de usuario
  it('should show validationErrorModal when there is an error registering the user', () => {
    spyOn(component['securityService'], 'getUserByDNI').and.returnValue(of(null)); // Usuario no existe
    spyOn(component['securityService'], 'registerUser').and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
    spyOn(component, 'showModal');
    component.fGroup.setValue({
      name: 'John',
      lastName: 'Doe',
      typeDNI: '1',
      dni: '12345678',
      email: 'john.doe@example.com',
      role: '2'
    });
    component.onSubmit();
    expect(component.showModal).toHaveBeenCalledWith('validationErrorModal', 'Error al registrar el usuario.');
  });

  // Carga de archivo CSV - No se seleccionó archivo
  it('should alert if no CSV file is selected', () => {
    spyOn(window, 'alert');
    component.selectedFile = null;
    component.onUploadCSV();
    expect(window.alert).toHaveBeenCalledWith('Por favor, selecciona un archivo CSV.');
  });

  it('should show csvUploadSuccessModal on successful CSV upload', async () => {
    spyOn(component['securityService'], 'uploadUsersFromCSV').and.returnValue(of({}));
    spyOn(component, 'showModal');

    const mockFile = new File([''], 'users.csv', { type: 'text/csv' });
    component.selectedFile = mockFile;

    await component.onUploadCSV();

    expect(component.showModal).toHaveBeenCalledWith('csvUploadSuccessModal');
  });

  // Verifica que se muestre el modal de error de validación si la carga del archivo CSV falla
  it('should show validationErrorModal if CSV upload fails', async () => {
    spyOn(component['securityService'], 'uploadUsersFromCSV').and.returnValue(
      throwError(() => new Error('CSV upload error'))
    );
    spyOn(component, 'showModal');

    const mockFile = new File([''], 'users.csv', { type: 'text/csv' });
    component.selectedFile = mockFile;

    await component.onUploadCSV();

    expect(component.showModal).toHaveBeenCalledWith('validationErrorModal', 'Error al cargar usuarios desde CSV.');
  });

  //Carga exitosa de usuarios desde CSV
  it('should show csvUploadSuccessModal when users are successfully uploaded from CSV', async () => {
    spyOn(component['securityService'], 'uploadUsersFromCSV').and.returnValue(of({}));
    spyOn(component, 'showModal');
    const mockFile = new File([''], 'users.csv', { type: 'text/csv' });
    component.selectedFile = mockFile;
    await component.onUploadCSV();
    expect(component.showModal).toHaveBeenCalledWith('csvUploadSuccessModal');
  });

  //Error al cargar usuarios desde CSV
  it('should show validationErrorModal when there is an error uploading users from CSV', async () => {
    spyOn(component['securityService'], 'uploadUsersFromCSV').and.returnValue(throwError(() => new Error('CSV upload error')));
    spyOn(component, 'showModal');
    const mockFile = new File([''], 'users.csv', { type: 'text/csv' });
    component.selectedFile = mockFile;
    await component.onUploadCSV();
    expect(component.showModal).toHaveBeenCalledWith('validationErrorModal', 'Error al cargar usuarios desde CSV.');
  });
});


//ng test --include src/app/modules/security/patient-doctor-registration/patient-doctor-registration.component.spec.ts
