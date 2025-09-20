// src/app/login/login.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService, LoginRequest } from '../services/auth.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  standalone: false,
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  errorMessage: string = '';
  isLoading: boolean = false;
  returnUrl: string = '/home';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.loginForm = this.fb.group({
      userName: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit(): void {
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/home';
  }

  async onSubmit(): Promise<void> {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      
      const loginData: LoginRequest = this.loginForm.value;
      
      try {
        // OPTION 1: Use loginAndLoadUserData (with navigation added)
        await this.authService.loginAndLoadUserData(loginData);
        // Navigation happens inside authService now
        
        // OPTION 2: Or use regular login method
        // await firstValueFrom(this.authService.login(loginData));
        // Navigation also happens inside authService
        
      } catch (error: any) {
        this.errorMessage = error.error?.message || 'Login failed. Please try again.';
        console.error('Login error:', error);
      } finally {
        this.isLoading = false;
      }
    }
  }
}