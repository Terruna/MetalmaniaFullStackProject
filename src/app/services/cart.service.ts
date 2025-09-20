import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { CartItem } from '../services/shared-type';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private apiUrl = 'https://localhost:7015/api/Cart';
  private cartItemsSubject = new BehaviorSubject<CartItem[]>([]);
  public cart$ = this.cartItemsSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadCartFromAPI();
  }

  // Make this public so components can call it
  loadCartFromAPI(): void {
    this.http.get<any>(`${this.apiUrl}/GetMyCart`).subscribe({
      next: (response) => {
        if (response.status && response.data) {
          this.cartItemsSubject.next(response.data.items || []);
        }
      },
      error: (err) => {
        console.error('Error loading cart from API:', err);
      }
    });
  }

  // Add item to cart with API synchronization (with size support)
  addToCart(item: { productId: number, quantity: number, size: number }): Observable<any> {
  // Ensure all values are numbers and match the exact API structure
  const payload = {
    id: 0, // Must be number 0
    productId: Number(item.productId), // Convert to number
    size: Number(item.size), // Convert to number
    quantity: Number(item.quantity) // Convert to number
  };
  
  console.log('Sending to API:', payload);
  
  return this.http.post<any>(`${this.apiUrl}/AddToCartAsync`, payload).pipe(
    tap(response => {
      console.log('API response:', response);
      if (response.status) {
        // Update local state after successful API call
        const currentItems = this.cartItemsSubject.value;
        const existingIndex = currentItems.findIndex(i => 
          i.productId === item.productId && i.size === item.size
        );
        
        if (existingIndex > -1) {
          // Update existing item
          const updatedItems = [...currentItems];
          updatedItems[existingIndex] = {
            ...updatedItems[existingIndex],
            quantity: item.quantity,
            id: response.data.id
          };
          this.cartItemsSubject.next(updatedItems);
        } else {
          // Add new item
          this.cartItemsSubject.next([...currentItems, {
            id: response.data.id,
            productId: item.productId,
            quantity: item.quantity,
            size: item.size
          }]);
        }
      }
    }),
    catchError(error => {
      console.error('Error adding to cart:', error);
      console.error('Error details:', error.error);
      return of({ status: false, message: 'Failed to add item to cart' });
    })
  );
}
private verifyPayload(payload: any): boolean {
  const expectedKeys = ['id', 'productId', 'size', 'quantity'];
  const actualKeys = Object.keys(payload);
  
  // Check if all required keys are present
  const hasAllKeys = expectedKeys.every(key => actualKeys.includes(key));
  if (!hasAllKeys) {
    console.error('Missing keys in payload. Expected:', expectedKeys, 'Got:', actualKeys);
    return false;
  }
  
  // Check if all values are numbers
  const allValuesAreNumbers = Object.values(payload).every(value => typeof value === 'number');
  if (!allValuesAreNumbers) {
    console.error('All values must be numbers. Payload:', payload);
    return false;
  }
  
  // Check if id is exactly 0
  if (payload.id !== 0) {
    console.error('id must be 0. Got:', payload.id);
    return false;
  }
  
  return true;
}
  // Remove item from cart with API synchronization (with size support)
  removeFromCart(productId: number, size: number): Observable<any> {
    // Find the cart item
    const cartItem = this.cartItemsSubject.value.find(item => 
      item.productId === productId && item.size === size
    );
    
    if (!cartItem) {
      // If item not found, just filter locally
      const updatedItems = this.cartItemsSubject.value.filter(item => 
        !(item.productId === productId && item.size === size)
      );
      this.cartItemsSubject.next(updatedItems);
      return of({ status: true, message: 'Item removed locally' });
    }
    
    // If we have an ID, use API deletion
    if (cartItem.id) {
      return this.http.delete<any>(`${this.apiUrl}/DeleteCartItem?cartItemId=${cartItem.id}`).pipe(
        tap(response => {
          if (response.status) {
            const updatedItems = this.cartItemsSubject.value.filter(item => 
              !(item.productId === productId && item.size === size)
            );
            this.cartItemsSubject.next(updatedItems);
          }
        }),
        catchError(error => {
          console.error('Error removing from cart:', error);
          // Even if API fails, remove from local state
          const updatedItems = this.cartItemsSubject.value.filter(item => 
            !(item.productId === productId && item.size === size)
          );
          this.cartItemsSubject.next(updatedItems);
          return of({ status: false, message: 'Failed to remove item from API but removed locally' });
        })
      );
    } else {
      // If no ID, just filter locally (for items that were added but not synced yet)
      const updatedItems = this.cartItemsSubject.value.filter(item => 
        !(item.productId === productId && item.size === size)
      );
      this.cartItemsSubject.next(updatedItems);
      return of({ status: true, message: 'Item removed locally' });
    }
  }

  // Clear entire cart with API synchronization
  clearCart(): Observable<any> {
    // First clear locally for immediate UI update
    this.cartItemsSubject.next([]);
    
    // Then call API to clear server-side cart
    return this.http.delete<any>(`${this.apiUrl}/clear`).pipe(
      tap(response => {
        console.log('Clear cart response:', response);
        if (response.status) {
          // Already cleared locally, so just log success
          console.log('Cart cleared successfully');
        } else {
          // If API call failed, reload cart from API to sync state
          console.warn('API clear failed, reloading cart');
          this.loadCartFromAPI();
        }
      }),
      catchError(error => {
        console.error('Error clearing cart:', error);
        // If API call failed, reload cart from API to sync state
        this.loadCartFromAPI();
        return of({ status: false, message: 'Failed to clear cart from API' });
      })
    );
  }

  // Alternative clear cart method if the above doesn't work
  clearCartAlternative(): Observable<any> {
    // First clear locally for immediate UI update
    this.cartItemsSubject.next([]);
    
    // Try different API endpoints
    const endpoints = [
      `${this.apiUrl}/ClearCart`,
      `${this.apiUrl}/Clear`,
      `${this.apiUrl}/ClearMyCart`
    ];
    
    // Try each endpoint until one works
    return new Observable(observer => {
      let triedEndpoints = 0;
      
      const tryEndpoint = (index: number) => {
        if (index >= endpoints.length) {
          // All endpoints failed
          console.warn('All clear cart endpoints failed, reloading cart');
          this.loadCartFromAPI();
          observer.next({ status: false, message: 'All clear cart endpoints failed' });
          observer.complete();
          return;
        }
        
        this.http.delete<any>(endpoints[index]).subscribe({
          next: (response) => {
            console.log(`Clear cart response from ${endpoints[index]}:`, response);
            if (response.status) {
              observer.next(response);
              observer.complete();
            } else {
              // Try next endpoint
              tryEndpoint(index + 1);
            }
          },
          error: (error) => {
            console.error(`Error clearing cart with ${endpoints[index]}:`, error);
            // Try next endpoint
            tryEndpoint(index + 1);
          }
        });
      };
      
      // Start with first endpoint
      tryEndpoint(0);
    });
  }

  // Get current cart items
  getCartItems(): CartItem[] {
    return this.cartItemsSubject.value;
  }

  // Get count of items in cart
  getCartItemCount(): number {
    return this.cartItemsSubject.value.reduce((total, item) => total + item.quantity, 0);
  }

  // Get quantity for a specific product and size
  getCartQuantity(productId: number, size: number): number {
    const item = this.cartItemsSubject.value.find(i => 
      i.productId === productId && i.size === size
    );
    return item ? item.quantity : 0;
  }

  // Update quantity for a specific product and size
updateQuantity(productId: number, size: number, quantity: number): Observable<any> {
  const item = this.cartItemsSubject.value.find(i => 
    i.productId === productId && i.size === size
  );
  
  if (item && item.id) {
    // If we have a cart item ID, update via API
      return this.http.put<any>(`${this.apiUrl}/items/${item.id}/quantity`, quantity).pipe(
      tap(response => {
        if (response.status) {
          // Update local state
          const updatedItems = this.cartItemsSubject.value.map(i => {
            if (i.productId === productId && i.size === size) {
              return { ...i, quantity: quantity };
            }
            return i;
          });
          this.cartItemsSubject.next(updatedItems);
        }
      }),
      catchError(error => {
        console.error('Error updating quantity:', error);
        return of({ status: false, message: 'Failed to update quantity' });
      })
    );
  } else {
    // If no ID, create a new cart item with the correct payload
    const payload = {
      id: 0,
      productId: Number(productId),
      size: Number(size),
      quantity: Number(quantity)
    };
    
    // Verify the payload before sending
    if (!this.verifyPayload(payload)) {
      console.error('Invalid payload, not sending to API');
      return of({ status: false, message: 'Invalid payload format' });
    }
    
    return this.http.post<any>(`${this.apiUrl}/AddToCartAsync`, payload).pipe(
      tap(response => {
        if (response.status) {
          // Update local state
          const updatedItems = this.cartItemsSubject.value.filter(i => 
            !(i.productId === productId && i.size === size)
          );
          updatedItems.push({
            id: response.data.id,
            productId: productId,
            quantity: quantity,
            size: size
          });
          this.cartItemsSubject.next(updatedItems);
        }
      }),
      catchError(error => {
        console.error('Error adding to cart:', error);
        return of({ status: false, message: 'Failed to add item to cart' });
      })
    );
  }
}
}