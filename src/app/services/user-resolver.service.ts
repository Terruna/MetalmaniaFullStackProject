// src/app/services/user-resolver.service.ts
import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable, of, catchError } from 'rxjs';
import { UserService } from './user.service';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class UserResolver implements Resolve<any> {
  constructor(
    private userService: UserService,
    private authService: AuthService
  ) {}

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<any> {
    const userInfo = this.authService.getUserInfo();
    
    console.log('UserResolver - userInfo:', userInfo);
    
    if (!userInfo?.userName) {
      console.log('No user info available in resolver');
      return of(null);
    }

    const storedData = this.authService.getUserFullData();
    if (storedData) {
      console.log('Returning stored user data');
      return of(storedData);
    }

    console.log('Fetching user data from API');
    
    return this.userService.getUserByUsername(userInfo.userName).pipe(
      catchError(error => {
        console.error('Resolver error:', error);
        return of(null);
      })
    );
  }
}