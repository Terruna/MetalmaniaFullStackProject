// card-detailed.component.ts
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CartService } from '../services/cart.service';

interface ProductImage {
  id: number;
  url: string;
}

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  stock: number;
  images: ProductImage[];
  categoryId: number;
  sku?: string;
  brand?: string;
  createdAt?: string;
}

@Component({
  selector: 'app-card-detailed',
  templateUrl: './card-detailed.component.html',
  styleUrls: ['./card-detailed.component.css'],
  standalone:false
})
export class CardDetailedComponent implements OnInit {
  @ViewChild('zoomImg') zoomImg!: ElementRef<HTMLImageElement>;
  product: Product | null = null;
  productId!: number;
  quantity: number = 1;
  selectedImage!: ProductImage;
  placeholderImage = 'assets/placeholder-image.jpg';
  selectedSize: number | null = null;
  isLoading: boolean = true;
  errorMessage: string = '';
  showSuccessToast: boolean = false;
  toastMessage: string = '';
  sizeOptions = [
    { value: 0, name: 'Small' },
    { value: 1, name: 'Medium' },
    { value: 2, name: 'Large' },
    { value: 3, name: 'XL' },
    { value: 4, name: '2XL' },
    { value: 5, name: '3XL' },
    { value: 6, name: '4XL' },
    { value: 7, name: '5XL' },
    {value:8,name: 'No Size'}
  ];

  categories = [
    { id: 1, name: 'T-Shirts' },
    { id: 2, name: 'Hoodies' },
    { id: 3, name: 'Long Sleeve' },
    { id: 4, name:  'Guitars'},
    { id: 5, name: 'Accessories' }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private cartService: CartService
  ) {}

 ngOnInit(): void {
  this.route.params.subscribe(params => {
    this.productId = +params['id'];
    if (this.productId && !isNaN(this.productId)) {
      this.fetchProductDetail(this.productId);
    } else {
      this.errorMessage = 'Invalid product ID';
      this.isLoading = false;
    }
  });
}
zoomMove(event: MouseEvent) {
  if (!this.zoomImg) return;

  const rect = (event.target as HTMLElement).getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * 100;
  const y = ((event.clientY - rect.top) / rect.height) * 100;

  this.zoomImg.nativeElement.style.transformOrigin = `${x}% ${y}%`;
  this.zoomImg.nativeElement.style.transform = 'scale(2)';
}

resetZoom() {
  if (!this.zoomImg) return;
  this.zoomImg.nativeElement.style.transform = 'scale(1)';
  this.zoomImg.nativeElement.style.transformOrigin = 'center center';
}
fetchProductDetail(id: number): void {
  this.isLoading = true;
  this.errorMessage = '';

  this.http.get<any>(`https://localhost:7015/api/Products/id/${id}`)
    .subscribe({
      next: (response) => {
        console.log('API Response:', response); // Debug log
        
        // Depending on your API response structure
        this.product = response.data || response;
        console.log('Product data:', this.product); // Debug log
        
        if (this.product) {
          console.log('Product images:', this.product.images); // Debug log
          this.setupProduct();
        } else {
          this.errorMessage = 'Product data is empty';
          this.isLoading = false;
        }
      },
      error: (err) => {
        console.error('Error fetching product details:', err);
        this.errorMessage = 'Failed to load product details';
        this.isLoading = false;
      }
    });
}
  tryApiUrls(urls: string[], index: number): void {
    if (index >= urls.length) {
      this.isLoading = false;
      this.errorMessage = 'Product not found. Please check the API endpoint.';
      console.error('All API endpoints failed');
      return;
    }
    
    const url = urls[index];
    console.log(`Trying API endpoint: ${url}`);
    
    this.http.get<any>(url).subscribe({
      next: (response) => {
        this.isLoading = false;
        console.log('API response:', response);
        
        if (response.data) {
          this.product = response.data;
        } else if (response.id) {
          this.product = response;
        } else {
          // Try the next URL if this one doesn't work
          this.tryApiUrls(urls, index + 1);
          return;
        }
        
        if (this.product?.images && this.product.images.length > 0) {
          this.selectedImage = this.product.images[0];
        } else {
          this.selectedImage = { id: 0, url: this.placeholderImage };
        }
      },
      error: (err) => {
        console.error(`Error with endpoint ${url}:`, err);
        // Try the next URL
        this.tryApiUrls(urls, index + 1);
      }
    });
  }

  // Alternative approach - check if your API uses a different structure
  fetchProductDetailAlternative(id: number): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    // First check if the API base is working
    this.http.get<any>('https://localhost:7015/api/Product')
      .subscribe({
        next: (response) => {
          console.log('API base response:', response);
          
          // If the API returns an array, find the product by ID
          if (Array.isArray(response)) {
            this.product = response.find((p: any) => p.id === id);
            if (this.product) {
              this.setupProduct();
            } else {
              this.handleProductNotFound();
            }
          } 
          // If the API returns an object with data property
          else if (response.data && Array.isArray(response.data)) {
            this.product = response.data.find((p: any) => p.id === id);
            if (this.product) {
              this.setupProduct();
            } else {
              this.handleProductNotFound();
            }
          } else {
            this.handleProductNotFound();
          }
        },
        error: (err) => {
          console.error('Error accessing API base:', err);
          this.isLoading = false;
          this.errorMessage = `Cannot connect to API. Please check: 
          1. The server is running on https://localhost:7015
          2. The API endpoint is correct
          3. CORS is configured properly`;
        }
      });
  }


  private handleProductNotFound(): void {
    this.isLoading = false;
    this.errorMessage = 'Product not found. It may have been removed or the ID is incorrect.';
  }

  // ... rest of the methods remain the same as in the previous solution
  goBack(): void {
    this.router.navigate(['/product']);
  }

selectImage(image: ProductImage): void {
  this.selectedImage = image; // Update main image
}

   getImageUrl(images: ProductImage[]): string {
  if (!images || images.length === 0) return this.placeholderImage;
  const imageUrl = images[0].url;
  if (imageUrl.startsWith('assets/') || imageUrl.startsWith('http')) {
    return imageUrl;
  }
  return `assets/productImage/${imageUrl}`;
}

  handleImageError(event: any): void {
    event.target.src = this.placeholderImage;
  }

  increaseQuantity(): void {
    if (this.product && this.quantity < this.product.stock) {
      this.quantity++;
    }
  }

  decreaseQuantity(): void {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }

  validateQuantity(): void {
    if (this.product) {
      if (this.quantity < 1) {
        this.quantity = 1;
      } else if (this.quantity > this.product.stock) {
        this.quantity = this.product.stock;
      }
    }
  }
addToCart(): void {
  if (!this.product) return;

  if (this.selectedSize === null) {
    this.showToast('Please select a size before adding to cart');
    return;
  }

  this.cartService.addToCart({ 
    productId: this.product.id, 
    quantity: this.quantity,
    size: this.selectedSize
  }).subscribe({
    next: () => {
      this.showToast('Product added to cart successfully!');
    },
    error: (err) => {
      console.error('Error adding to cart:', err);
      this.showToast('Failed to add product to cart. Please try again.');
    }
  });
}
showToast(message: string): void {
  this.toastMessage = message;
  this.showSuccessToast = true;

  // Optional: auto-hide after 3 seconds
  setTimeout(() => {
    this.showSuccessToast = false;
  }, 3000);
}
  getCategoryName(categoryId: number): string {
    const category = this.categories.find(c => c.id === categoryId);
    return category ? category.name : 'Unknown Category';
  }

  calculateDiscount(price: number, originalPrice: number): number {
    return Math.round(((originalPrice - price) / originalPrice) * 100);
  }
  
private setupProduct(): void {
  this.isLoading = false;

  // Setup selected image
  if (this.product?.images && this.product.images.length > 0) {
    this.selectedImage = this.product.images[0];
  } else {
    this.selectedImage = { id: 0, url: this.placeholderImage };
  }

  // Auto-select size for certain categories
  const allowedCategoriesForManualSize = [1, 2, 3]; // T-Shirts, Hoodies, Long Sleeve
  if (!allowedCategoriesForManualSize.includes(this.product?.categoryId || 0)) {
    this.selectedSize = 8; // Auto set size to 8 for all other categories
  } else {
    this.selectedSize = null; // Keep null for categories that require manual selection
  }
}

}