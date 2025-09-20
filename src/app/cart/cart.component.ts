import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CartService } from '../services/cart.service';
import { Router } from '@angular/router';
import { Product, CartItem, ApiResponse } from '../services/shared-type';

interface ProductImage {
  id: number;
  url: string;
}

interface CartResponse {
  id: number;
  userId: number;
  createdAt: string;
  items: CartItem[];
}

@Component({
  selector: 'app-cart',
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.css'],
  standalone: false
})
export class CartComponent implements OnInit {
  // API URLs
  private updateQuantityUrl = 'https://localhost:7015/api/Cart/items';
  private productsUrl = 'https://localhost:7015/api/Products';

  cartItems: CartItem[] = [];
  products: Product[] = [];
  subtotal: number = 0;
  shipping: number = 0;
  total: number = 0;
  isLoading: boolean = true;
  errorMessage: string = '';

  constructor(
    private http: HttpClient, 
    private cartService: CartService,
    private router: Router
  ) { }

  ngOnInit(): void {
   this.cartService.cart$.subscribe(items => {
    this.cartItems = items;
    this.preloadSizeNames(); 
    this.enrichCartItemsWithProducts();
    this.calculateTotals();
  });
    
    this.loadProducts();
  }

  preloadSizeNames(): void {
  this.cartItems.forEach(item => {
    item.sizeName = this.getSizeName(item.size);
  });
}
  loadProducts(): void {
    this.http.get<ApiResponse>(this.productsUrl).subscribe({
      next: (response) => {
        if (response.status && response.data) {
          this.products = response.data;
          this.enrichCartItemsWithProducts();
          this.calculateTotals();
        } else {
          this.errorMessage = 'Failed to load products';
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = 'Failed to load products';
        this.isLoading = false;
        console.error('Error loading products:', error);
      }
    });
  }

enrichCartItemsWithProducts(): void {
  this.cartItems.forEach(item => {
    const product = this.products.find(p => p.id === item.productId);
    if (product) {
      item.product = product;
    }
    
    // Add size name to the item for immediate display
    item.sizeName = this.getSizeName(item.size);
  });
}

  calculateTotals(): void {
    this.subtotal = this.cartItems.reduce((sum, item) => {
      return sum + (item.product?.price || 0) * item.quantity;
    }, 0);
    
    this.shipping = this.subtotal > 0 ? 6 : 0;
    this.total = this.subtotal + this.shipping;
  }

  getProductImageUrl(item: CartItem): string {
    if (!item.product || !item.product.images || item.product.images.length === 0) {
      return 'assets/placeholder-image.jpg';
    }
    
    return `assets/productImage/${item.product.images[0].url}`;
  }

getSizeName(sizeValue: number): string {
  const sizeOptions = [
    { value: 0, name: 'Small' },
    { value: 1, name: 'Medium' },
    { value: 2, name: 'Large' },
    { value: 3, name: 'XL' },
    { value: 4, name: '2XL' },
    { value: 5, name: '3XL' },
    { value: 6, name: '4XL' },
    { value: 7, name: '5XL' }
  ];
  
  // Ensure we're comparing numbers
  const sizeValueNumber = Number(sizeValue);
  const size = sizeOptions.find(s => s.value === sizeValueNumber);
  return size ? size.name : 'Loading...'; // Show "Loading..." instead of "Unknown"
}

updateQuantity(item: CartItem, newQuantity: number): void {
  if (newQuantity < 1) {
    this.removeItem(item);
    return;
  }

  // Find the product to check stock
  if (item.product && newQuantity > item.product.stock) {
    newQuantity = item.product.stock;
  }

  // If we have a cart item ID, use the API
  if (item.id) {
    const url = `${this.updateQuantityUrl}/${item.id}/quantity`;
    this.http.put(url, newQuantity).subscribe({
      next: () => {
        // After successful API update, reload the cart from server
        this.cartService.loadCartFromAPI();
      },
      error: (error) => {
        this.errorMessage = 'Failed to update quantity';
        console.error('Error updating quantity:', error);
        // Reload cart to sync with server
        this.cartService.loadCartFromAPI();
      }
    });
  } else {
    // If no ID, update through the service with proper payload
    this.cartService.addToCart({ 
      productId: item.productId, 
      quantity: newQuantity,
      size: item.size
    }).subscribe({
      error: (error) => {
        this.errorMessage = 'Failed to update quantity';
        console.error('Error updating quantity:', error);
      }
    });
  }
}
  checkout(): void {
    // Navigate to checkout page
    this.router.navigate(['/checkout']);
  }

  increaseQuantity(item: CartItem): void {
    this.updateQuantity(item, item.quantity + 1);
  }

  decreaseQuantity(item: CartItem): void {
    this.updateQuantity(item, item.quantity - 1);
  }

  removeItem(item: CartItem): void {
    // Use the removeFromCart method that accepts both productId and size
    // Add a null check for item.size with a default value
    const size = item.size ?? 0; // Use 0 as default if size is undefined
    
    this.cartService.removeFromCart(item.productId, size).subscribe({
      next: () => {
        // Cart will be updated automatically via the cart$ subscription
      },
      error: (error) => {
        this.errorMessage = 'Failed to remove item';
        console.error('Error removing item:', error);
        // Reload cart to sync with server in case of error
        this.cartService.loadCartFromAPI();
      }
    });
  }

  clearCart(): void {
    this.cartService.clearCart().subscribe({
      next: (response) => {
        if (response.status) {
          console.log('Cart cleared successfully');
          // Optional: Show success message
        } else {
          console.warn('Cart clear had issues:', response.message);
          // Optional: Show warning message
        }
      },
      error: (error) => {
        console.error('Error clearing cart:', error);
        // Optional: Show error message
      }
    });
  }

  // Alternative if the main clearCart doesn't work
  clearCartAlternative(): void {
    this.cartService.clearCartAlternative().subscribe({
      next: (response) => {
        if (response.status) {
          console.log('Cart cleared successfully using alternative method');
        } else {
          console.warn('Failed to clear cart with all endpoints');
        }
      },
      error: (error) => {
        console.error('Error clearing cart with alternative method:', error);
      }
    });
  }
}