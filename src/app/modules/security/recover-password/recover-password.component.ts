import { AfterViewInit, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SecurityService } from '../../../services/security.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-recover-password',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CommonModule
  ],
  templateUrl: './recover-password.component.html',
  styleUrl: './recover-password.component.css'
})
export class RecoverPasswordComponent implements AfterViewInit, OnInit{

  fGroup: FormGroup = new FormGroup({});

  constructor(
    private fb: FormBuilder,
    private securityService: SecurityService,
    private router: Router
  ) { }

  ngOnInit() {
    this.BuildForm();
  }

  // Initialize MaterializeCSS modal
  ngAfterViewInit() {
    const elems = document.querySelectorAll('.modal');
    M.Modal.init(elems);
  }

  // Build the form
  BuildForm() {
    this.fGroup = this.fb.group({
      dni: ['', [Validators.required, Validators.pattern("^[0-9]*$")]],
    });
  }

  // Submit the form
  onSubmit() {
    if (this.fGroup.invalid) {
      alert('Introduce un DNI válido');
      return;
    }

    const dni = this.GetFormGroup['dni'].value;

    this.securityService.recoverPassword(dni).subscribe({
      next: () => {
        const modal = M.Modal.getInstance(document.getElementById('modal1')!);
        modal.open();
      },
      error: () => {
        const modal = M.Modal.getInstance(document.getElementById('modal2')!);
        modal.open();
      }
    });
  }

  redirectToLogin() {
    this.router.navigate(['/security/signin']);
  }

  // Get the form group
  get GetFormGroup() {
    return this.fGroup.controls;
  }

}
