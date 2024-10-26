import { CommonModule } from '@angular/common';
import { AfterViewInit, Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { SecurityService } from '../../../services/security.service';

declare var M: any;

@Component({
  selector: 'app-password-change',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CommonModule
  ],
  templateUrl: './password-change.component.html',
  styleUrl: './password-change.component.css'
})
export class PasswordChangeComponent implements AfterViewInit{


  isPasswordVisible: boolean = false;
  isPasswordVisible2: boolean = false;
  isPasswordVisible3: boolean = false;

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

  BuildForm() {
    this.fGroup = this.fb.group({
      oldPassword: ['', Validators.required],
      newPassword: ['', Validators.required],
      confirmPassword: ['', Validators.required]
    });
  }

  // Toggle password visibility for old password
  togglePasswordVisibility() {
    this.toggleVisibility('lastPassword', 'toggle-last-password', this.isPasswordVisible);
    this.isPasswordVisible = !this.isPasswordVisible;
  }

  // Toggle password visibility for new password
  togglePasswordVisibility2() {
    this.toggleVisibility('password', 'toggle-password', this.isPasswordVisible2);
    this.isPasswordVisible2 = !this.isPasswordVisible2;
  }

  // Toggle password visibility for confirm password
  togglePasswordVisibility3() {
    this.toggleVisibility('confirmPassword', 'toggle-password-confirm', this.isPasswordVisible3);
    this.isPasswordVisible3 = !this.isPasswordVisible3;
  }

  // Reusable function to toggle password visibility
  private toggleVisibility(inputId: string, iconClass: string, isVisible: boolean) {
    const passwordInput = document.getElementById(inputId) as HTMLInputElement;
    const icon = document.querySelector(`.${iconClass}`) as HTMLElement;

    if (isVisible) {
      passwordInput.type = 'password';
      icon.textContent = 'visibility_off';
    } else {
      passwordInput.type = 'text';
      icon.textContent = 'visibility';
    }
  }

  // Function to handle password change
  ChangePassword() {
    if (this.fGroup.valid) {
      const { newPassword, confirmPassword } = this.fGroup.value;

      if (newPassword !== confirmPassword) {
        const modal = M.Modal.getInstance(document.getElementById('warningModal')!);
        modal.open();
        return;
      }

      this.securityService.changePassword(newPassword).subscribe({
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
      const modal = M.Modal.getInstance(document.getElementById('warningModal2')!);
      modal.open();
    }
  }

  // Redirect to login
  redirectToLogin() {
    this.router.navigate(['/security/password-change']);
  }

  // Getter for form controls
  get GetFormGroup() {
    return this.fGroup.controls;
  }
}