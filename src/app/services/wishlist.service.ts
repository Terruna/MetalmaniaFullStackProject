// services/wishlist.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class WishlistService {
  private apiUrl = 'https://localhost:7015/api/Wishlist';

  constructor(private http: HttpClient) { }

  // Get user's wishlist - handle 404 when no wishlist exists
  getWishlist(): Observable<any[]> {
    return this.http.get<any>(`${this.apiUrl}/my`).pipe(
      map(response => {
        // Handle the API response structure
        if (response && response.status && Array.isArray(response.data)) {
          return response.data;
        }
        return [];
      }),
      catchError(error => {
        if (error.status === 404) {
          // Return empty array if no wishlist exists (404 response)
          return of([]);
        }
        throw error;
      })
    );
  }

  // Add item to wishlist with correct payload structure
  addToWishlist(productId: number): Observable<any> {
    const payload = {
      productId: productId
    };
    
    return this.http.post(`${this.apiUrl}/my/items`, payload).pipe(
      map(response => {
        // Handle API response structure
        return response;
      }),
      catchError(error => {
        console.error('Error adding to wishlist:', error);
        throw error;
      })
    );
  }

  // Remove item from wishlist
  removeFromWishlist(productId: number): Observable<any> {
    return this.http.request('DELETE', `${this.apiUrl}/DeleteWishlistItem`, {
      body: { productId: productId }
    }).pipe(
      map(response => {
        return response;
      }),
      catchError(error => {
        console.error('Error removing from wishlist:', error);
        throw error;
      })
    );
  }

  // Clear entire wishlist
  clearWishlist(): Observable<any> {
    return this.http.delete(`${this.apiUrl}/my`).pipe(
      map(response => {
        return response;
      }),
      catchError(error => {
        console.error('Error clearing wishlist:', error);
        throw error;
      })
    );
  }
}