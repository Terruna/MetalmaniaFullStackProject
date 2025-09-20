// src/app/services/auth.service.ts
import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, map, firstValueFrom } from 'rxjs';
import { Router } from '@angular/router';
import { UserService, User } from './user.service';

export interface LoginRequest {
  userName: string;
  password: string;
}

export interface RegisterRequest {
  userName: string;
  email: string;
  password: string;
  city: string;
  number: string;
  address: string;
  userTypeId: number;
  isActive: boolean;
}

export interface AuthResponse {
  token: string;
  expiration: Date;
  email: string;
  userName: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private loginApiUrl = 'https://localhost:7015/api/Login';
  private registerApiUrl = 'https://localhost:7015/api/User/Create';
  private tokenKey = 'authToken';
  private userInfoKey = 'userInfo';
  private userDataKey = 'userFullData';
  private isAuthenticatedSubject: BehaviorSubject<boolean>;
  private isBrowser: boolean;
  token$: any;

 constructor(
  private http: HttpClient, 
  private router: Router,
  private userService: UserService,
  @Inject(PLATFORM_ID) platformId: Object
) {
  this.isBrowser = isPlatformBrowser(platformId);
  this.isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasToken());
  
  // Initialize userDataSubject with existing data
const existingData = this.getUserFullData();
  this.userDataSubject.next(existingData);
  this.userData$ = this.userDataSubject.asObservable();
}

  // Cookie methods
  private setCookie(name: string, value: string, days: number = 7): void {
    if (!this.isBrowser) return;
    
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = `expires=${date.toUTCString()}`;
    document.cookie = `${name}=${encodeURIComponent(value)};${expires};path=/`;
  }

  private getCookie(name: string): string | null {
    if (!this.isBrowser) return null;
    
    const nameEQ = name + '=';
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return decodeURIComponent(c.substring(nameEQ.length, c.length));
    }
    return null;
  }

  private deleteCookie(name: string): void {
    if (!this.isBrowser) return;
    this.setCookie(name, '', -1);
  }

  async loginAndLoadUserData(loginData: LoginRequest): Promise<AuthResponse> {
    try {
      const authResponse = await firstValueFrom(
        this.http.post<any>(this.loginApiUrl, loginData).pipe(
          map(response => {
            if (response.status !== undefined && response.data) {
              return response.data;
            } else {
              return response;
            }
          })
        )
      );

     
      this.storeBasicAuthData(authResponse);
      this.isAuthenticatedSubject.next(true);

      // Use the new endpoint to get current user data
      const userData = await firstValueFrom(
        this.userService.getCurrentUser()
      );

     
      this.storeUserData(userData);
      
      this.router.navigate(['/home']);
      
      return authResponse;

    } catch (error) {
     
      throw error;
    }
  }

  login(loginData: LoginRequest): Observable<AuthResponse> {
    return this.http.post<any>(this.loginApiUrl, loginData).pipe(
      map(response => {
        if (response.status !== undefined && response.data) {
          return response.data;
        } else {
          return response;
        }
      }),
      tap(authResponse => {
       
        this.storeBasicAuthData(authResponse);
        this.isAuthenticatedSubject.next(true);
        
        // Use the new endpoint to get current user data
        this.userService.getCurrentUser().subscribe({
          next: (userData) => {
           
            this.storeUserData(userData);
            this.router.navigate(['/home']);
          },
          error: (error) => {
            console.error('Error fetching user data:', error);
          }
        });
      })
    );
  }

register(registerData: RegisterRequest): Observable<any> {
  return this.http.post<any>(this.registerApiUrl, registerData).pipe(
    tap(response => {
     
      
      // After successful registration, automatically log the user in
      if (response.status && response.data === true) {
        const loginData: LoginRequest = {
          userName: registerData.userName,
          password: registerData.password
        };
        
        // Login with the same credentials
        this.login(loginData).subscribe({
          next: (authResponse) => {
          
          },
          error: (error) => {
            console.error('Auto-login after registration failed:', error);
            // Even if auto-login fails, registration was successful
            // You might want to navigate to login page instead
            this.router.navigate(['/login'], { 
              queryParams: { registered: true } 
            });
          }
        });
      }
    })
  );
}
  logout(): void {
    if (this.isBrowser) {
      this.deleteCookie(this.tokenKey);
      this.deleteCookie(this.userInfoKey);
      this.deleteCookie(this.userDataKey);
    }
    this.isAuthenticatedSubject.next(false);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return this.getCookie(this.tokenKey);
  }

  isAuthenticated(): Observable<boolean> {
    return this.isAuthenticatedSubject.asObservable();
  }

  getUserInfo(): any {
    const userInfo = this.getCookie(this.userInfoKey);
    return userInfo ? JSON.parse(userInfo) : null;
  }

  getUserFullData(): User | null {
    const userData = this.getCookie(this.userDataKey);
    return userData ? JSON.parse(userData) : null;
  }

  updateUserData(userData: any): Observable<User> {
    return this.userService.updateUser(userData).pipe(
      tap(updatedUser => {
        this.storeUserData(updatedUser);
      })
    );
  }

  refreshUserData(): Observable<User> {
    return this.userService.getCurrentUser().pipe(
      tap(userData => {
        this.storeUserData(userData);
      })
    );
  }

private userDataSubject = new BehaviorSubject<User | null>(null);
public userData$ = this.userDataSubject.asObservable();


storeUserData(userData: User): void {
  this.setCookie(this.userDataKey, JSON.stringify(userData), 7);
  this.userDataSubject.next(userData);
 
}

  private storeBasicAuthData(authResponse: AuthResponse): void {
    this.setCookie(this.tokenKey, authResponse.token, 7);
    this.setCookie(this.userInfoKey, JSON.stringify({
      email: authResponse.email,
      userName: authResponse.userName
    }), 7);
   
  }

  private hasToken(): boolean {
    return this.getCookie(this.tokenKey) !== null;
  }

  isAdmin(): boolean {
  const userData = this.getUserFullData();
  if (!userData) return false;

  // If you use userTypeId to identify admin
  return userData.userTypeId === 3; 
}
}