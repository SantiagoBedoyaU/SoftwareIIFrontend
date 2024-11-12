import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SecurityService } from '../../../services/security.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-signin',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CommonModule
  ],
  templateUrl: './signin.component.html',
  styleUrls: ['./signin.component.css']
})
export class SigninComponent implements AfterViewInit, OnInit {

  fGroup: FormGroup = new FormGroup({});
  userId = '';
  selectedType = '';
  isPasswordVisible = false;

  constructor(
    private fb: FormBuilder,
    private securityService: SecurityService,
    private router: Router
  ) { }

  ngOnInit() {
    this.BuildForm();
  }

  // Build the form
  BuildForm() {
    this.fGroup = this.fb.group({
      document_type: ['', [Validators.required]],
      document_number: ['', [Validators.required, Validators.pattern("^[0-9]*$")]],
      password: ['', [Validators.required]],
    });
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

  // Initialize the dropdown
  ngAfterViewInit() {
    const elems = document.querySelectorAll('.dropdown-trigger');
    if (elems.length) {
      M.Dropdown.init(elems, {
        coverTrigger: false
      });
    }

    const elemsModal = document.querySelectorAll('.modal');
    M.Modal.init(elemsModal);
  }

  // Select the document type
  selectDocumentType(event: Event, type: string) {
    event.preventDefault();
    this.selectedType = type;
    this.fGroup.get('document_type')?.setValue(type);
  }

  // Submit the form
  SignIn() {
    if (this.fGroup.invalid) {
      const modal = M.Modal.getInstance(document.getElementById('warningModal')!);
      modal.open();
    } else {
      const document_number = this.GetFormGroup['document_number'].value;
      const password = this.GetFormGroup['password'].value;
  
      this.securityService.SignIn(document_number, password).subscribe({
        next: (data: { access_token: string }) => {
          this.securityService.StoreToken(data.access_token);
          this.securityService.UpdateUserBehavior({
            user: undefined, 
            token: data.access_token
          });
          this.router.navigate(['/home']);
        },
        error: (error) => {
          console.log(error);
          const modal = M.Modal.getInstance(document.getElementById('errorModal')!);
          modal.open();
        }
      });
    }
  }
  

  // Get the form group
  get GetFormGroup() {
    return this.fGroup.controls;
  }
}
