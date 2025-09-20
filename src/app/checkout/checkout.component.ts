import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CartService } from '../services/cart.service';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { log } from 'console';

interface OrderItem {
  productId: number;
  quantity: number;
  size: number;
}

interface OrderRequest {
  userId: number;
  shippingAddress: string;
  paymentMethod: string;
  items: OrderItem[];
}

interface UserProfile {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  shippingAddress: string;
  Number?: string;
}

@Component({
  selector: 'app-checkout',
  standalone: false,
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css']
})
export class CheckoutComponent implements OnInit {
  orderRequest: OrderRequest = {
    userId: 0,
    shippingAddress: '',
    paymentMethod: 'Credit Card',
    items: []
  };

  userProfile: any = null;
  isLoading = false;
  isSubmitting = false;
  response: any = null;
  error: string = '';
  cartItems: any[] = [];
  currentStep: number = 1;

  userDataLoaded = false;
  userLoadError = false;

  // Edit mode properties
  isEditing = false;
  editedAddress: string = '';
  editedPhoneNumber: string = '';

  constructor(
    private http: HttpClient,
    private cartService: CartService,
    protected router: Router,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.loadUserData();
    this.loadCartItems();
    console.log(this.userProfile.number);
    
  }

  private loadUserData(): void {
    this.authService.userData$.subscribe({
      next: (user: any) => {
        console.log('User data received:', user);
        this.userProfile = user;
        this.userDataLoaded = true;
        this.userLoadError = false;
        
        if (user && (user.id || user.userId)) {
          this.orderRequest.userId = user.id || user.userId;
          console.log('User ID set to:', this.orderRequest.userId);
        } else {
          console.warn('User ID is missing from user data');
          this.error = 'User information is incomplete. Please log in again.';
        }
        
        if (user && (user.shippingAddress || user.address)) {
          this.orderRequest.shippingAddress = user.shippingAddress || user.address;
          this.editedAddress = this.orderRequest.shippingAddress;
          console.log('Shipping address set to:', this.orderRequest.shippingAddress);
        } else {
          console.warn('Shipping address is missing from user data');
        }

        if (user && user.Number) {
          this.editedPhoneNumber = user.Number;
        }
      },
      error: (err: any) => {
        console.error('Error loading user profile:', err);
        this.error = 'Failed to load user information';
        this.userLoadError = true;
        this.userDataLoaded = true;
      }
    });
  }

  private loadCartItems(): void {
    this.cartService.cart$.subscribe({
      next: (cartItems) => {
        console.log('Cart items loaded:', cartItems);
        this.cartItems = cartItems;
        
        this.orderRequest.items = cartItems
          .filter(item => item.productId && item.quantity > 0 && item.size !== undefined)
          .map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            size: item.size
          }));
          
        console.log('Order items prepared:', this.orderRequest.items);
      },
      error: (err) => {
        console.error('Error loading cart items:', err);
        this.error = 'Failed to load cart items';
      }
    });
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
    
    const sizeValueNumber = Number(sizeValue);
    const size = sizeOptions.find(s => s.value === sizeValueNumber);
    return size ? size.name : 'Unknown';
  }

  get subtotal(): number {
    return this.cartItems.reduce((sum, item) => {
      return sum + (item.product?.price || 0) * item.quantity;
    }, 0);
  }

  get shipping(): number {
    return this.subtotal > 0 ? 5.99 : 0;
  }

  get total(): number {
    return this.subtotal + this.shipping;
  }

  getProductImageUrl(item: any): string {
    if (!item.product || !item.product.images || item.product.images.length === 0) {
      return 'assets/placeholder-image.jpg';
    }
    
    const imageUrl = item.product.images[0].url;
    if (imageUrl.startsWith('http') || imageUrl.startsWith('data:')) {
      return imageUrl;
    }
    
    return `assets/productImage/${imageUrl}`;
  }

  getUserDisplayName(): string {
    if (!this.userProfile) return 'Guest User';
    
    if (this.userProfile.firstName && this.userProfile.lastName) {
      return `${this.userProfile.firstName} ${this.userProfile.lastName}`;
    }
    
    if (this.userProfile.userName) {
      return this.userProfile.userName;
    }
    
    return 'User';
  }

  // Edit mode methods
  startEditing(): void {
    this.isEditing = true;
    this.editedAddress = this.orderRequest.shippingAddress;
    this.editedPhoneNumber = this.userProfile?.Number || '';
  }

  cancelEditing(): void {
    this.isEditing = false;
    this.error = '';
  }

  saveEditing(): void {
    // Basic validation
    if (!this.editedAddress || this.editedAddress.trim() === '') {
      this.error = 'Shipping address is required';
      return;
    }

    if (!this.editedPhoneNumber || this.editedPhoneNumber.trim() === '') {
      this.error = 'Phone number is required';
      return;
    }

    // Basic phone number validation
    const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/;
    if (!phoneRegex.test(this.editedPhoneNumber)) {
      this.error = 'Please enter a valid phone number';
      return;
    }

    this.isEditing = false;
    this.orderRequest.shippingAddress = this.editedAddress;
    
    if (this.userProfile) {
      this.userProfile.Number = this.editedPhoneNumber;
    }
    
    this.saveUserChanges();
    this.error = '';
  }

  private saveUserChanges(): void {
    // Implement API call to save user address and phone number
    console.log('Saving user changes:', {
      address: this.editedAddress,
      phoneNumber: this.editedPhoneNumber
    });
  }

  onSubmit() {
    if (!this.validateOrderRequest()) {
      return;
    }
    
    this.isSubmitting = true;
    this.response = null;
    this.error = '';

    console.log('Submitting order:', this.orderRequest);

    const headers = new HttpHeaders({
      'Accept': 'text/plain',
      'Content-Type': 'application/json'
    });

    this.http.post('https://localhost:7015/api/Order/CreateOrder', 
      this.orderRequest, 
      { headers, responseType: 'text' }
    ).subscribe({
     next: (data) => {
    this.isSubmitting = false;
    this.response = data;
    this.currentStep = 2; // move to "Confirmation"
    
    // Clear cart
    this.cartService.clearCartAlternative().subscribe();
    
    // Hide checkout form and order summary
    this.userDataLoaded = false; // optional
},
      error: (err) => {
        this.isSubmitting = false;
        console.error('Error creating order:', err);
        
        if (err.status === 400) {
          this.error = 'Invalid order data. Please check your information.';
          if (err.error) {
            try {
              const errorObj = typeof err.error === 'string' ? JSON.parse(err.error) : err.error;
              this.error += ` Details: ${errorObj.message || JSON.stringify(errorObj)}`;
            } catch (e) {
              this.error += ` Details: ${err.error}`;
            }
          }
        } else if (err.status === 0) {
          this.error = 'Cannot connect to the server. Please check your connection.';
        } else {
          this.error = err.message || 'An error occurred while creating the order';
        }
      }
    });
  }

  private validateOrderRequest(): boolean {
    if (!this.orderRequest.userId || this.orderRequest.userId <= 0) {
      this.error = 'Invalid user ID. Please make sure you are logged in.';
      return false;
    }
    
    if (!this.orderRequest.shippingAddress || this.orderRequest.shippingAddress.trim() === '') {
      this.error = 'Shipping address is required.';
      return false;
    }
    
    if (!this.orderRequest.paymentMethod || this.orderRequest.paymentMethod.trim() === '') {
      this.error = 'Payment method is required.';
      return false;
    }
    
    if (!this.orderRequest.items || this.orderRequest.items.length === 0) {
      this.error = 'Your cart is empty. Please add items before checking out.';
      return false;
    }
    
    for (const item of this.orderRequest.items) {
      if (!item.productId || item.productId <= 0) {
        this.error = 'Invalid product in cart. Please refresh your cart.';
        return false;
      }
      
      if (!item.quantity || item.quantity <= 0) {
        this.error = 'Invalid quantity for a product. Please update your cart.';
        return false;
      }
      
      if (item.size === undefined || item.size === null) {
        this.error = 'Size is missing for one or more products. Please check your cart.';
        return false;
      }
      
      if (item.size < 0 || item.size > 7) {
        this.error = 'Invalid size for one or more products. Please check your cart.';
        return false;
      }
    }
    
    return true;
  }

  goBackToCart() {
    this.router.navigate(['/cart']);
  }
}