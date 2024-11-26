import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserService } from '../../../services/user.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-patch-personal-data',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './patch-personal-data.component.html',
  styleUrl: './patch-personal-data.component.css'
})
export class PatchPersonalDataComponent implements AfterViewInit, OnInit {
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

  // Initialize MaterializeCSS modal
  ngAfterViewInit() {
    const elems = document.querySelectorAll('.modal');
    M.Modal.init(elems);
  }

 // Build the form
  BuildForm() {
    this.fGroup = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      dni: ['', [Validators.required, Validators.pattern('^[0-9]*$')]], 
      address: ['', Validators.required],
      phone: ['', [Validators.required, Validators.pattern('^[0-9]*$')]],
    });
  }

  // upload user data
  LoadUserData() {
    this.userService.GetUserData().subscribe({
      next: (userData) => {
        if (userData) {
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

  // update personal data
  UpdatePersonalData() {
    if (this.fGroup.valid) {
      const updatedData = {
        first_name: this.fGroup.get('firstName')?.value,
        last_name: this.fGroup.get('lastName')?.value,
        email: this.fGroup.get('email')?.value,
        address: this.fGroup.get('address')?.value,
        phone: this.fGroup.get('phone')?.value,
      };

      this.userService.UpdateUserData(updatedData).subscribe({
        next: () => {
          const modal = M.Modal.getInstance(document.getElementById('modal1')!);
          modal.open();
        },
        error: () => {
          const modal = M.Modal.getInstance(document.getElementById('modal2')!);
          modal.open();
        }
      });
    } else {
      const modal = M.Modal.getInstance(document.getElementById('warningModal')!);
      modal.open();
    }
  }

  // redirect to get data
  redirectToGetData() {
    this.router.navigate(['/user/get-personal-data']);
  }

  // Get the form group
  get GetFormGroup() {
    return this.fGroup.controls;
  }
}
