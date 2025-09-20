import { Component, HostListener, OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';  
import { HttpClient } from '@angular/common/http';
import { Product, ProductImage } from '../services/shared-type';
import { CartService } from '../services/cart.service'; 

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
  standalone:false 
})
export class NavbarComponent implements OnInit {
  searchQuery: string = '';
  searchResults: Product[] = [];
  showSearchResults: boolean = false;
  allProducts: Product[] = [];
  placeholderImage = 'assets/placeholder-image.jpg';
  menuOpen = false;

  cartCount = 0; 

  constructor(
    private authService: AuthService,
    private router: Router,
    private http: HttpClient,
    private cartService: CartService 
  ) {}

  ngOnInit(): void {
    this.fetchAllProducts();

    // ✅ Subscribe to cart updates
    this.cartService.cart$.subscribe(items => {
      this.cartCount = items.reduce((total, item) => total + item.quantity, 0);
    });
  }

  fetchAllProducts(): void {
    this.http.get<any>('https://localhost:7015/api/Products')
      .subscribe({
        next: (response) => {
          if (response.status && response.data) {
            this.allProducts = response.data;
          } else if (Array.isArray(response)) {
            this.allProducts = response;
          }
        },
        error: (err) => {
          console.error('Error fetching products for search:', err);
        }
      });
  }

  onSearchInput(): void {
    if (this.searchQuery.length > 2) {
      this.performSearch(this.searchQuery);
      this.showSearchResults = true;
    } else {
      this.searchResults = [];
      this.showSearchResults = false;
    }
  }
  
  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  performSearch(searchTerm: string): void {
    this.searchResults = this.allProducts.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }

  onSearch(): void {
    if (this.searchQuery.trim()) {
      this.showSearchResults = false;
      this.router.navigate(['/product'], { 
        queryParams: { search: this.searchQuery } 
      });
    }
  }

  goToProductDetails(product: Product): void {
    this.showSearchResults = false;
    this.searchQuery = '';
    this.router.navigate(['/product', product.id]);
  }

  getImageUrl(images: ProductImage[]): string {
    if (!images || images.length === 0) {
      return this.placeholderImage;
    }
    const imageUrl = images[0].url;
    if (imageUrl.startsWith('assets/') || imageUrl.startsWith('http')) {
      return imageUrl;
    }
    return `assets/productImage/${imageUrl}`;
  }

  handleImageError(event: any): void {
    event.target.src = this.placeholderImage;
  }

  goToUser(): void {
    const token = this.authService.getToken();
    if (token) {
      this.router.navigate(['/user-profile']);
    } else {
      this.router.navigate(['/login']);
    }
  }

  goToCart(): void {
    const token = this.authService.getToken();
    if (token) {
      this.router.navigate(['/cart']);
    } else {
      this.router.navigate(['/login'], { 
        queryParams: { returnUrl: '/cart' } 
      });
    }
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.search-container')) {
      this.showSearchResults = false;
    }
  }
}
