// src/app/register/register.component.ts
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, RegisterRequest } from '../services/auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
  standalone: false,
})
export class RegisterComponent {
  registerForm: FormGroup;
  errorMessage: string = '';
  isLoading: boolean = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      userName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      city: ['', Validators.required],
      number: ['', [Validators.required, Validators.pattern(/^[0-9]+$/)]],
      address: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]],
      userTypeId: [1],
      isActive: [true]
    });
  }

  onSubmit(): void {
  if (this.registerForm.valid) {
    this.isLoading = true;
    this.errorMessage = '';
    
    const registerData: RegisterRequest = this.registerForm.value;
    
    this.authService.register(registerData).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.status && response.data === true) {
          // Registration was successful, now try to auto-login
          const loginData = {
            userName: registerData.userName,
            password: registerData.password
          };
          
          this.authService.login(loginData).subscribe({
            next: () => {
              this.router.navigate(['/user-profile']);
            },
            error: (loginError) => {
              // Registration succeeded but login failed
              this.errorMessage = 'Registration successful! Please log in with your credentials.';
              this.router.navigate(['/login'], { 
                queryParams: { registered: true } 
              });
            }
          });
        } else {
          this.errorMessage = 'Registration failed. Please try again.';
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'Registration failed. Please try again.';
      }
    });
  }
}
}