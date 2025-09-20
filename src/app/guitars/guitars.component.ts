
import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { Router } from '@angular/router';  
import { AuthService } from '../services/auth.service';
import { CartService } from '../services/cart.service';
import { Product, CartItem } from '../services/shared-type';

interface ProductImage {
  id: number;
  url: string;
}

// Create an interface to extend Product with selectedSize
interface ProductWithSize extends Product {
  selectedSize?: number;
}

@Component({
  selector: 'app-guitars',
  standalone: false,
  templateUrl: './guitars.component.html',
  styleUrl: './guitars.component.css'
})
export class GuitarsComponent implements OnInit {
  products: ProductWithSize[] = [];
  filteredProducts: ProductWithSize[] = [];
  selectedProduct: ProductWithSize | null = null;
  isLoading = true;
  error: string | null = null;
  searchTerm = '';
  viewMode: 'list' | 'detail' = 'list';
  placeholderImage = 'assets/placeholder-image.jpg';
  cartItemCount = 0;
  detailQuantity = 1;
  showFilters: boolean = false;
  showCardDetail = false;
  flipUp = false;
  
  priceRange: number = 1000;
  inStockOnly = false;
  sortBy = 'name';
  sortOrder = 'asc';

  categories = [
    { id: 1, name: 'T-Shirts' },
    { id: 2, name: 'Hoodies' },
    { id: 3, name: 'Long Sleeve' }
  ];
  
  sizeOptions = [
   
    {value:8,name:'No Size'}
  ];
  
  selectedCategory: number | null = null;

  // Map to track selected sizes for each product
  productSelectedSizes: Map<number, number> = new Map();

  // Subject for debouncing search input
  private searchSubject = new Subject<string>();

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private authService: AuthService,
    private router: Router,
    private cartService: CartService
  ) { }

  ngOnInit(): void {
    this.fetchProducts();

    this.route.queryParams.subscribe(params => {
      if (params['search']) {
        this.searchTerm = params['search'];
        this.applyFilters();
      }
    });
  
    // Check if there's a product ID in the route
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.fetchProductDetail(params['id']);
      }
    });
    
    this.cartService.cart$.subscribe(items => {
      this.cartItemCount = this.cartService.getCartItemCount();
    });
    
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(searchTerm => {
      this.performSearch(searchTerm);
    });
  }

  getAvailableSizes() {
    return this.sizeOptions;
  }

  performSearch(searchTerm: string): void {
    this.searchTerm = searchTerm;
    this.applyFilters();
  }

  // Apply all filters
  applyFilters(): void {
    let filtered = this.products;

    // Apply search filter
    if (this.searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }

    // Apply category filter
    if (this.selectedCategory) {
      filtered = filtered.filter(product => product.categoryId === this.selectedCategory);
    }

    // Apply price filter
    filtered = filtered.filter(product => product.price <= this.priceRange);

    // Apply stock filter
    if (this.inStockOnly) {
      filtered = filtered.filter(product => product.stock > 0);
    }
    
    // Apply sorting
    filtered = this.sortProducts(filtered);

    this.filteredProducts = filtered;
  }

  // Only update the price range value, don't apply filters yet
  onPriceRangeChange(): void {
    // This method only updates the value, doesn't apply filters
    // Filters will be applied when user clicks "Apply Filters"
  }

  resetFilters() {
    this.priceRange = 1000;
    this.inStockOnly = false;
    this.selectedCategory = null;
    this.applyFilters();
    
    // Close filter drawer on mobile after resetting
    if (window.innerWidth <= 600) {
      this.showFilters = false;
    }
  }

  // Sort products based on selected criteria
  sortProducts(products: ProductWithSize[]): ProductWithSize[] {
    return products.sort((a, b) => {
      let valueA, valueB;
      
      switch (this.sortBy) {
        case 'price':
          valueA = a.price;
          valueB = b.price;
          break;
        case 'name':
          valueA = a.name.toLowerCase();
          valueB = b.name.toLowerCase();
          break;
        case 'stock':
          valueA = a.stock;
          valueB = b.stock;
          break;
        default:
          valueA = a.name.toLowerCase();
          valueB = b.name.toLowerCase();
      }

      if (valueA < valueB) {
        return this.sortOrder === 'asc' ? -1 : 1;
      }
      if (valueA > valueB) {
        return this.sortOrder === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }

  // Filter change handlers
  onCategoryChange(categoryId: number | null): void {
    this.selectedCategory = categoryId;
  }

  onStockFilterChange(inStock: boolean): void {
    this.inStockOnly = inStock;
  }

  onSortChange(sortBy: string): void {
    this.sortBy = sortBy;
  }

  onSortOrderChange(order: string): void {
    this.sortOrder = order;
  }

  // Clear all filters
  clearAllFilters(): void {
    this.searchTerm = '';
    this.selectedCategory = null;
    this.priceRange = 1000;
    this.inStockOnly = false;
    this.sortBy = 'name';
    this.sortOrder = 'asc';
    this.applyFilters();
  }

  getImageUrl(images: ProductImage[]): string {
    if (!images || images.length === 0) {
      return this.placeholderImage;
    }
    
    // Check if the image URL already contains the assets path
    const imageUrl = images[0].url;
    if (imageUrl.startsWith('assets/') || imageUrl.startsWith('http')) {
      return imageUrl;
    }
    
    // Prepend the assets path if it's not already there
    return `assets/productImage/${imageUrl}`;
  }

  // Helper method for single images (for thumbnails)
  getSingleImageUrl(image: ProductImage): string {
    if (!image) {
      return this.placeholderImage;
    }
    
    // Check if the image URL already contains the assets path
    const imageUrl = image.url;
    if (imageUrl.startsWith('assets/') || imageUrl.startsWith('http')) {
      return imageUrl;
    }
    
    // Prepend the assets path if it's not already there
    return `assets/productImage/${imageUrl}`;
  }

  // Handle image loading errors
  handleImageError(event: any): void {
    event.target.src = this.placeholderImage;
  }

  fetchProducts(): void {
    this.isLoading = true;
    this.http.get<any>('https://localhost:7015/api/Products')
      .subscribe({
        next: (response) => {
          if (response.status && response.data) {
            // ✅ Keep only Accessories category (replace 4 with actual categoryId for accessories)
            this.products = response.data.filter((p: ProductWithSize) =>
              p.categoryId === 4
            );
            this.filteredProducts = this.products;
          }
          this.isLoading = false;
        },
        error: (err) => {
          this.error = 'Failed to load products. Please try again later.';
          this.isLoading = false;
          console.error('Error fetching products:', err);
        }
      });
  }

  // Called when search input changes
  onSearchInputChange(): void {
    this.searchSubject.next(this.searchTerm);
  }

  fetchProductDetail(id: number): void {
    this.isLoading = true;
    
    // First try to get product from our already loaded list
    const productFromList = this.products.find(p => p.id === id);
    if (productFromList) {
      this.selectedProduct = {...productFromList};
      this.viewMode = 'detail';
      this.isLoading = false;
      return;
    }
    
    // If not found in list, fetch from API
    this.http.get<any>(`https://localhost:7015/api/Products/id/${id}`)
      .subscribe({
        next: (response) => {
          if (response.status && response.data) {
            this.selectedProduct = response.data;
            this.viewMode = 'detail';
          }
          this.isLoading = false;
        },
        error: (err) => {
          this.error = 'Failed to load product details. Please try again later.';
          this.isLoading = false;
          console.error('Error fetching product details:', err);
        }
      });
  }

  getCategoryName(categoryId: number): string {
    const category = this.categories.find(c => c.id === categoryId);
    return category ? category.name : 'Unknown Category';
  }

  // navigate to detail page
  showProductDetail(productId: number): void {
    this.router.navigate(['/product', productId]);
  }
  
  closeCardDetail(): void {
    this.showCardDetail = false;
    this.selectedProduct = null;
  }

  onAddToCartFromCardDetail(event: {productId: number, quantity: number, size: number}): void {
    this.cartService.addToCart({ 
      productId: event.productId, 
      quantity: event.quantity,
      size: event.size
    }).subscribe({
      error: (err) => {
        console.error('Error adding to cart:', err);
      }
    });
    this.closeCardDetail();
  }

  backToList(): void {
    this.viewMode = 'list';
    this.selectedProduct = null;
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.filteredProducts = this.products;
  }

  // Helper method to truncate text
  truncateText(text: string, maxLength: number = 100): string {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength) + '...';
  }

  addToCart(product: ProductWithSize): void {
    const selectedSize = this.getSelectedSize(product.id);
    if (!selectedSize) {
      alert('Please select a size before adding to cart');
      return;
    }
    
    const existingItem = this.cartService.getCartItems().find(i => 
      i.productId === product.id && i.size === selectedSize
    );
    
    const quantity = existingItem ? existingItem.quantity + 1 : 1;
    
    if (quantity <= product.stock) {
      this.cartService.addToCart({ 
        productId: product.id, 
        quantity: quantity,
        size: selectedSize
      }).subscribe({
        error: (err) => {
          console.error('Error adding to cart:', err);
        }
      });
    }
  }

  increaseQuantity(product: ProductWithSize): void {
    const selectedSize = this.getSelectedSize(product.id);
    if (!selectedSize) {
      alert('Please select a size first');
      return;
    }
    
    const existingItem = this.cartService.getCartItems().find(i => 
      i.productId === product.id && i.size === selectedSize
    );
    
    if (existingItem && existingItem.quantity < product.stock) {
      this.cartService.addToCart({
        productId: product.id, 
        quantity: existingItem.quantity + 1,
        size: selectedSize
      }).subscribe({
        error: (err) => {
          console.error('Error updating cart:', err);
        }
      });
    }
  }

  decreaseQuantity(product: ProductWithSize): void {
    const selectedSize = this.getSelectedSize(product.id);
    if (!selectedSize) {
      alert('Please select a size first');
      return;
    }
    
    const existingItem = this.cartService.getCartItems().find(i => 
      i.productId === product.id && i.size === selectedSize
    );
    
    if (existingItem) {
      if (existingItem.quantity <= 1) {
        this.cartService.removeFromCart(product.id, selectedSize).subscribe({
          error: (err) => {
            console.error('Error removing from cart:', err);
          }
        });
      } else {
        this.cartService.addToCart({ 
          productId: product.id, 
          quantity: existingItem.quantity - 1,
          size: selectedSize
        }).subscribe({
          error: (err) => {
            console.error('Error updating cart:', err);
          }
        });
      }
    }
  }

  getCartQuantity(productId: number): number {
    const selectedSize = this.getSelectedSize(productId);
    if (!selectedSize) return 0;
    
    const item = this.cartService.getCartItems().find(i => 
      i.productId === productId && i.size === selectedSize
    );
    
    return item ? item.quantity : 0;
  }

  addToCartFromDetail(): void {
    if (this.selectedProduct) {
      const selectedSize = this.getSelectedSize(this.selectedProduct.id);
      if (!selectedSize) {
        alert('Please select a size before adding to cart');
        return;
      }
      
      const quantityToAdd = this.detailQuantity;
      const existingItem = this.cartService.getCartItems().find(item => 
        item.productId === this.selectedProduct!.id && item.size === selectedSize
      );
      
      let finalQuantity = quantityToAdd;
      if (existingItem) {
        finalQuantity = existingItem.quantity + quantityToAdd;
      }
      
      if (finalQuantity <= this.selectedProduct.stock) {
        this.cartService.addToCart({ 
          productId: this.selectedProduct.id, 
          quantity: finalQuantity,
          size: selectedSize
        }).subscribe({
          complete: () => {
            this.detailQuantity = 1;
          },
          error: (err) => {
            console.error('Error adding to cart:', err);
          }
        });
      }
    }
  }

  // Detail view quantity controls
  increaseDetailQuantity(): void {
    if (this.selectedProduct && this.detailQuantity < this.selectedProduct.stock) {
      this.detailQuantity++;
    }
  }

  decreaseDetailQuantity(): void {
    if (this.detailQuantity > 1) {
      this.detailQuantity--;
    }
  }

  addToCartAPI(productId: number, quantity: number, size: number): void {
    const cartData = {
      productId: productId,
      quantity: quantity,
      size: size
    };
    
    this.http.post<any>('https://localhost:7015/api/Cart/AddToCartAsync', cartData)
      .subscribe({
        next: (response) => {
          console.log('Added to cart via API:', response);
        },
        error: (err) => {
          console.error('Error adding to cart via API:', err);
        }
      });
  }

  viewCart(): void {
    const token = this.authService.getToken();
    if (token) {
      this.router.navigate(['/cart']);
    } else {
      // Option 1: Redirect to login first
      this.router.navigate(['/login'], { 
        queryParams: { returnUrl: '/cart' } 
      });
    }
  }

  toggleFilters() {
    this.showFilters = !this.showFilters;
  }
  
  toggleDropdown(dropdownRef: HTMLElement) {
    const rect = dropdownRef.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const dropdownHeight = 200; // same as CSS max-height

    this.flipUp = spaceBelow < dropdownHeight;
    dropdownRef.classList.toggle('open');
  }

  // Get selected size for a product (returns undefined if none selected)
getSelectedSize(productId: number): number {
  return this.productSelectedSizes.get(productId) ?? 8;
}
  // Set selected size for a product
  setSelectedSize(productId: number, size: number): void {
    this.productSelectedSizes.set(productId, size);
  }

  // Called when user changes size via <select>
  onSizeChange(product: ProductWithSize, sizeValue: string | number): void {
    const size = Number(sizeValue);
    if (!isNaN(size)) {
      this.setSelectedSize(product.id, size);
      console.log('Size selected for product', product.id, ':', size);
    } else {
      this.productSelectedSizes.delete(product.id); // reset if invalid
    }
  }

  // Returns the size name safely
  getSizeName(productId: number): string {
    const selectedIndex = this.getSelectedSize(productId);
    if (selectedIndex !== undefined) {
      const size = this.sizeOptions.find(s => s.value === selectedIndex);
      if (size) return size.name;
    }
    return 'Select Size';
  }
}