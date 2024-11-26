import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { UserService } from '../../../services/user.service';
import { catchError, of } from 'rxjs';

@Component({
  selector: 'app-get-personal-data',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CommonModule,
    RouterLink
  ],
  templateUrl: './get-personal-data.component.html',
  styleUrl: './get-personal-data.component.css'
})
export class GetPersonalDataComponent implements OnInit {
  fGroup: FormGroup = new FormGroup({});

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private router: Router
  ) { }

  ngOnInit() {
    this.BuildForm();
    this.LoadUserData();
  }

  // Build the form
  BuildForm() {
    this.fGroup = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      dni: ['', [Validators.required, Validators.pattern("^[0-9]*$")]],
      address: ['', Validators.required],
      phone: ['', [Validators.required, Validators.pattern("^[0-9]*$")]],
    });
  }

  /**
   * Method to load the user data
   */
  LoadUserData() {
    this.userService.GetUserData().pipe(
      catchError((error) => {
        console.error('Error al cargar los datos del usuario:', error);
        // Retorna un objeto vacío con las propiedades necesarias (o valores por defecto)
        return of(null);  // Asegúrate de que el objeto sea compatible con la estructura esperada por el formulario
      })
    ).subscribe({
      next: (userData) => {
        if (userData) {
          // Si los datos fueron obtenidos correctamente (aunque estén vacíos)
          this.fGroup.patchValue({
            firstName: userData.first_name,
            lastName: userData.last_name,
            email: userData.email,
            dni: userData.dni,
            address: userData.address,
            phone: userData.phone
          });
        }
      },
      complete: () => console.log('Datos del usuario cargados correctamente.')
    });
  }

  // Get the form group
  get GetFormGroup() {
    return this.fGroup.controls;
  }
}
