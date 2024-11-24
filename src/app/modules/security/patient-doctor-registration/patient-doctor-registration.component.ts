import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SecurityService } from '../../../services/security.service';
import { Router } from '@angular/router';
import M from 'materialize-css';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-patient-doctor-registration',
  templateUrl: './patient-doctor-registration.component.html',
  styleUrls: ['./patient-doctor-registration.component.css']
})
export class PatientDoctorRegistrationComponent implements OnInit {
  fGroup: FormGroup = new FormGroup({});
  selectedFile: File | null = null;

  constructor(
    private fb: FormBuilder,
    private securityService: SecurityService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.BuildForm();
    M.Modal.init(document.querySelectorAll('.modal'));
  }

  BuildForm() {
    this.fGroup = this.fb.group({
      name: ['', Validators.required],
      lastName: ['', Validators.required],
      typeDNI: ['', Validators.required],
      dni: ['', [Validators.required, Validators.pattern('^[0-9]*$')]],
      email: ['', [Validators.required, Validators.email]],
      role: ['', Validators.required]
    });
  }

  ClearForm() {
    this.fGroup.reset();
    this.fGroup.patchValue({
      typeDNI: '',
      role: ''
    });
    this.selectedFile = null;
  }

  onSubmit(): void {
    if (this.fGroup.valid) {
      const dni = this.fGroup.get('dni')?.value;
      const email = this.fGroup.get('email')?.value;
      // Verifica si el usuario ya existe usando el DNI o el correo electrónico
      this.securityService.getUserByDNI(dni).subscribe({
        next: (user) => {
          if (user) {
            // Si el usuario existe, muestra el modal con el mensaje de error
            this.showModal('userExistsModal');
          } else {
            // Registra un usuario si no existe
            const userData = {
              first_name: this.fGroup.get('name')?.value,
              last_name: this.fGroup.get('lastName')?.value,
              email: email,
              dni: dni,
              role: Number(this.fGroup.get('role')?.value),
              type_dni: Number(this.fGroup.get('typeDNI')?.value)
            };
  
            this.securityService.registerUser(userData).subscribe({
              next: response => {
                console.log('Usuario registrado:', response);
                this.showModal('userRegisteredModal');
                this.ClearForm();
              },
              error: (error: HttpErrorResponse) => {
                console.error('Error al registrar usuario:', error);
                this.showModal('validationErrorModal', 'Error al registrar el usuario.');
              }
            });
          }
        },
        error: (error: HttpErrorResponse) => {
          console.error('Error al verificar si el usuario existe:', error);
          this.showModal('validationErrorModal', 'Error al verificar si el usuario existe.');
        }
      });
    } else {
      this.showModal('validationErrorModal');
    }
  }
  
  registerUser() {
    const userData = {
      first_name: this.fGroup.get('name')?.value,
      last_name: this.fGroup.get('lastName')?.value,
      email: this.fGroup.get('email')?.value,
      dni: this.fGroup.get('dni')?.value,
      role: Number(this.fGroup.get('role')?.value),
      type_dni: Number(this.fGroup.get('typeDNI')?.value)
    };

    this.securityService.registerUser(userData).subscribe({
      next: () => {
        this.showModal('userRegisteredModal');
        this.ClearForm();
        this.router.navigate(['/security/patientDoctorRegistration']);
      },
      error: (error: HttpErrorResponse) => {
        console.error('Error al registrar usuario:', error);
        this.showModal('validationErrorModal', 'Error al registrar el usuario.');
      }
    });
  }

  onFileSelected(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    if (inputElement?.files?.length) {
      this.selectedFile = inputElement.files[0];
      this.fGroup.markAsDirty();
    }
  }


  async onUploadCSV(): Promise<void> {
    if (!this.selectedFile) {
      alert('Por favor, selecciona un archivo CSV.');
      return;
    }
    const formData = new FormData();
    formData.append('file', this.selectedFile);
  
    try {
      await firstValueFrom(this.securityService.uploadUsersFromCSV(formData));
      this.showModal('csvUploadSuccessModal');
      this.selectedFile = null;
    } catch (error: unknown) {
      console.error('Error al cargar usuarios desde CSV:', error);
      if (this.isErrorWithDetail(error)) {
        console.error('Detalles del error:', error.error);
      }
      this.showModal('validationErrorModal', 'Error al cargar usuarios desde CSV.');
    }
  }


// Definir un guardia de tipo que verifica si el error tiene la propiedad 'error'
isErrorWithDetail(error: unknown): error is { error: string } {
  return typeof error === 'object' && error !== null && 'error' in error;
}
  
  showModal(modalId: string, message?: string): void {
    const modalElement = document.getElementById(modalId);
    if (modalElement) {
      const modalInstance = M.Modal.getInstance(modalElement);
      if (message) {
        modalElement.querySelector('.modal-content p')!.textContent = message;
      }
      modalInstance.open();
    }
  }

  get GetFormGroup() {
    return this.fGroup.controls;
  }
}