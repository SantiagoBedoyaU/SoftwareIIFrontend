import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { SecurityService } from '../../../services/security.service';
import { Router } from '@angular/router';
import M from 'materialize-css';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-assign-role',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './assign-role.component.html',
  styleUrls: ['./assign-role.component.css'],
  providers: [SecurityService]
})
export class AssignRoleComponent implements OnInit {
  fGroup: FormGroup = new FormGroup({});
  foundUser: any = null;

  constructor(
    private fb: FormBuilder,
    private securityService: SecurityService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.buildForm();
    M.Modal.init(document.querySelectorAll('.modal'));
  }

  buildForm() {
    this.fGroup = this.fb.group({
      dni: ['', [Validators.required, Validators.pattern('^[0-9]*$')]],
      newRole: ['', Validators.required]
    });
  }

  // Buscar usuario por DNI
  onSearchUser(): void {
    if (this.fGroup.get('dni')?.valid) {
      const dni = this.fGroup.get('dni')?.value;
      this.securityService.getUserByDNI(dni).subscribe({
        next: (user) => {
          if (user) {
            this.foundUser = user;
            this.fGroup.patchValue({ newRole: '' });
          } else {
            this.showModal('userNotFoundModal');
            this.foundUser = null;
            this.fGroup.patchValue({ newRole: '' });
          }
        },
        error: (error: any) => {
          if (error.status === 404) {
            this.showModal('userNotFoundModal');
          } else {
            console.error('Error finding user:', error);
            this.showModal('validationErrorModal', 'Error al encontrar al usuario.');
          }
        }
      });
    } else {
      this.showModal('validationErrorModal', 'Introduzca un número de identificación válido.');
    }
  }

  // Asignar rol al usuario
  onAssignRole(): void {
    if (this.fGroup.get('newRole')?.value && this.foundUser) {
      const newRole = parseInt(this.fGroup.get('newRole')?.value, 10);
      const dni = this.foundUser.dni;


      this.showModal('loadingModal', 'Asignando rol... Por favor, espere.');

      this.securityService.updateUserRole(dni, newRole).subscribe({
        next: () => {
          const loadingModalInstance = M.Modal.getInstance(document.getElementById('loadingModal')!);
          if (loadingModalInstance) {
            loadingModalInstance.close();
          }

          const roleAssignedModalElement = document.getElementById('roleAssignedModal');
          if (roleAssignedModalElement) {
            const roleAssignedModalInstance = M.Modal.init(roleAssignedModalElement);
            roleAssignedModalInstance.open();
          }

          this.clearForm();
        },
        error: (error: any) => {
          console.error('Error al asignar el rol:', error);

          const loadingModalInstance = M.Modal.getInstance(document.getElementById('loadingModal')!);
          if (loadingModalInstance) {
            loadingModalInstance.close();
          }

          this.showModal('validationErrorModal', 'Error al asignar el rol.');
        }
      });
    } else {
      this.showModal('validationErrorModal', 'Seleccione una rol.');
    }
  }

  clearForm() {
    this.fGroup.reset();
    this.foundUser = null;
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

  getRoleName(role: number): string {
    switch (role) {
      case 0:
        return 'Administrador';
      case 1:
        return 'Doctor';
      case 2:
        return 'Paciente';
      default:
        return 'Unknown';
    }
  }
}
