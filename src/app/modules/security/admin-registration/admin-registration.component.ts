import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common'; // Importa CommonModule
import { SecurityService } from '../../../services/security.service';
import { Router } from '@angular/router';
import M from 'materialize-css';

@Component({
  selector: 'app-admin-registration',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './admin-registration.component.html',
  styleUrls: ['./admin-registration.component.css'],
  providers: [SecurityService]
})
export class AdminRegistrationComponent {
  fGroup: FormGroup = new FormGroup({});

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
      email: ['', [Validators.required, Validators.email]]
    });
  }

  ClearForm() {
    this.fGroup.reset();
    this.fGroup.patchValue({
      typeDNI: ''
    });
  }

  onSubmit(): void {
    if (this.fGroup.valid) {
      const dni = this.fGroup.get('dni')?.value;
      const email = this.fGroup.get('email')?.value;
      // Verificar si el usuario ya existe
      this.securityService.getUserByDNI(dni).subscribe({
        next: (user) => {
          if (user) {
            // Si el usuario existe
            this.showModal('userExistsModal', 'El usuario ya existe.');
            this.ClearForm(); 
          } else {
            // Registrar administrador si no existe
            const userData = {
              first_name: this.fGroup.get('name')?.value,
              last_name: this.fGroup.get('lastName')?.value,
              email: email,
              dni: dni,
              role: 0, 
              type_dni: Number(this.fGroup.get('typeDNI')?.value)
            };
  
            this.securityService.registerUser(userData).subscribe({
              next: response => {
                console.log('Administrador registrado:', response);
                this.showModal('userRegisteredModal', 'Administrador registrado correctamente.');
                this.ClearForm(); 
              },
              error: (error: any) => {
                console.error('Error al registrar administrador:', error);
                this.showModal('validationErrorModal', 'Error al registrar el administrador.');
              }
            });
          }
        },
        error: (error: any) => {
          console.error('Error al verificar si el usuario existe:', error);
          this.showModal('validationErrorModal', 'Error al verificar si el usuario existe.');
        }
      });
    } else {
      this.showModal('validationErrorModal', 'Por favor, complete todos los campos correctamente.');
    }
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
}
