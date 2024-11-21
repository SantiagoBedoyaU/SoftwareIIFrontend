import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SecurityService } from '../../../services/security.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-password-reset',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CommonModule
  ],
  templateUrl: './password-reset.component.html',
  styleUrl: './password-reset.component.css'
})
export class PasswordResetComponent implements AfterViewInit, OnInit {

  isPasswordVisible = false;
  isPasswordVisible2 = false;
  token = '';
  passwordMismatch = false;

  fGroup: FormGroup = new FormGroup({});

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private securityService: SecurityService,
    private router: Router
  ) { }

  // Initialize the form
  ngOnInit() {
    this.BuildForm();
    this.route.queryParams.subscribe(params => {
      this.token = params['at'];
    });
  }

  // Initialize MaterializeCSS modal
  ngAfterViewInit() {
    const elems = document.querySelectorAll('.modal');
    M.Modal.init(elems);
  }

  // Build the form
  BuildForm() {
    this.fGroup = this.fb.group({
      password: ['', [Validators.required]],
      confirmPassword: ['', [Validators.required]]
    });
  }

  // Handle password reset logic
  ResetPassword() {
    if (this.fGroup.invalid) {
      alert('Introduce una contraseña válida');
      return;
    }

    const password = this.fGroup.get('password')?.value;
    const confirmPassword = this.fGroup.get('confirmPassword')?.value;

    if (password !== confirmPassword) {
      const modal = M.Modal.getInstance(document.getElementById('warningModal')!);
      modal.open();
      return;
    }

    // send the request to the backend
    this.securityService.resetPassword(this.token, password).subscribe({
      next: () => {
        const modal = M.Modal.getInstance(document.getElementById('modal1')!);
        modal.open();
      },
      error: () => {
        const modal = M.Modal.getInstance(document.getElementById('modal2')!);
        modal.open();
      }
    })
  }

  // Redirect to login
  redirectToLogin() {
    this.router.navigate(['/security/signin']);
  }

  // Toggle password visibility
  togglePasswordVisibility() {
    const passwordInput = document.getElementById('password') as HTMLInputElement;
    const icon = document.querySelector('.toggle-password') as HTMLElement;

    if (this.isPasswordVisible) {
      passwordInput.type = 'password';
      icon.textContent = 'visibility_off';
    } else {
      passwordInput.type = 'text';
      icon.textContent = 'visibility';
    }

    this.isPasswordVisible = !this.isPasswordVisible;
  }

  // Toggle password visibility
  togglePasswordVisibility2() {
    const passwordInput = document.getElementById('confirmPassword') as HTMLInputElement;
    const icon = document.querySelector('[toggle="#confirmPassword"]') as HTMLElement;

    if (this.isPasswordVisible2) {
      passwordInput.type = 'password';
      icon.textContent = 'visibility_off';
    } else {
      passwordInput.type = 'text';
      icon.textContent = 'visibility';
    }

    this.isPasswordVisible2 = !this.isPasswordVisible2;
  }



  // Get the form group
  get GetFormGroup() {
    return this.fGroup.controls;
  }

}
