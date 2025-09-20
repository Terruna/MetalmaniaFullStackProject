// src/app/services/user.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map, catchError, throwError } from 'rxjs';

export interface User {
  id: number;
  userName: string;
  email: string;
  city: string;
  number: string;
  address: string;
  userTypeId: number;
  isActive: boolean;
  createdAt?: Date;
}

export interface ChangePasswordRequest {
  Id: number;
  email: string;
  password: string; 
  
}

export interface ApiResponse<T> {
  status: boolean;
  statusCode: number;
  data: T;
  errors: any[];
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = 'https://localhost:7015/api/User';

  constructor(private http: HttpClient) {}

  // Get current user info
  getCurrentUser(): Observable<User> {
    return this.http.get<ApiResponse<User>>(`${this.apiUrl}/Me`).pipe(
      map(response => {
        if (response.status && response.data) {
          return response.data;
        } else {
          throw new Error(response.errors?.[0] || 'Failed to fetch current user data');
        }
      }),
      catchError(error => {
        return throwError(() => new Error('Failed to fetch current user data'));
      })
    );
  }

  // Get user by username
  getUserByUsername(userName: string): Observable<User> {
    return this.http.get<ApiResponse<User>>(`${this.apiUrl}/${userName}`).pipe(
      map(response => {
        if (response.status && response.data) {
          return response.data;
        } else {
          throw new Error(response.errors?.[0] || 'Failed to fetch user data');
        }
      }),
      catchError(error => {
        return throwError(() => new Error('Failed to fetch user data'));
      })
    );
  }

  // Update user info (no password)
  updateUser(userData: any): Observable<User> {
    const requestBody = {
      id: userData.id,
      userName: userData.userName,
      email: userData.email,
      city: userData.city,
      number: userData.number,
      address: userData.address,
      userTypeId: userData.userTypeId || 1,
      isActive: userData.isActive !== undefined ? userData.isActive : true
    };

    return this.http.put<ApiResponse<User>>(`${this.apiUrl}/Update`, requestBody).pipe(
      map(response => {
        if (response.status && response.data) {
          return response.data;
        } else {
          throw new Error(response.errors?.[0]  || 'Update failed');
        }
      }),
      catchError(error => {
        return throwError(() => new Error(error.error?.message || 'Update failed. Please try again.'));
      })
    );
  }

  // ✅ Change password
  changePassword(changePasswordData: ChangePasswordRequest): Observable<ApiResponse<any>> {
    const url = `${this.apiUrl}/ChangePassword`;
    return this.http.put<ApiResponse<any>>(url, changePasswordData, {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' })
    });
  }

  createUser(userData: any): Observable<User> {
    return this.http.post<ApiResponse<User>>(this.apiUrl, userData).pipe(
      map(response => {
        if (response.status && response.data) {
          return response.data;
        } else {
          throw new Error('Failed to create user');
        }
      })
    );
  }

  deleteUser(userName: string): Observable<any> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/${userName}`).pipe(
      map(response => {
        if (response.status) {
          return response;
        } else {
          throw new Error('Failed to delete user');
        }
      })
    );
  }
}
