import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
interface User {
  id: string;
  userName: string;
  email: string;
  role: string;
  isActive: boolean;
  city?: string;
  number?: string;
  address?: string;
  userTypeId?: number;
}
enum OrderStatus {
  Pending = 0,
  Paid = 1,
  Shipped = 2,
  Delivered = 3
}

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  description?: string;
  category?: string;
  imageUrl?: string;
}

interface Order {
  id: string;
  customerName: string;
  orderDate: Date;
  status: OrderStatus; // Use the enum type
  totalAmount: number;
  items: any[];
  userId?: string;
  shippingAddress?: string;
}
interface Message {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  date: Date;
  read: boolean;
}
interface Review {
  id: string;
  productName: string;
  userName: string;
  rating: number;
  comment: string;
  date: Date;
  approved: boolean;
  productId?: string;
  userId?: string;
}

@Component({
  selector: 'app-admin',
  standalone: false,
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css']
})
export class AdminComponent implements OnInit {
 activeTab = 'users';
  tabs = [
    { id: 'users', name: 'Users' },
    { id: 'products', name: 'Products' },
    { id: 'orders', name: 'Orders' },
    { id: 'messages', name: 'Messages' },
    { id: 'reviews', name: 'Reviews' }
  ];
  // User management
  users: User[] = [];
  filteredUsers: User[] = [];
  userSearchTerm = '';
  editingUser: User | null = null;

  // Product management
  products: Product[] = [];
  filteredProducts: Product[] = [];
  showAddProductForm = false;
  editingProduct: Product | null = null;
  productForm: FormGroup;

  // Order management
   orders: Order[] = [];
  filteredOrders: Order[] = [];
  orderStatusFilter: string = 'all'; // Keep as string for the filter
  selectedOrder: Order | null = null;

  // Message management
messages: Message[] = [];
  filteredMessages: Message[] = [];
  unreadMessageCount = 0;
  selectedMessage: Message | null = null;

  // Review management
    reviews: Review[] = [];
  filteredReviews: Review[] = [];
  selectedReview: Review | null = null;

  private baseUrl = 'https://localhost:7015/api';

  constructor(private http: HttpClient, private fb: FormBuilder) {
    this.productForm = this.fb.group({
      name: ['', Validators.required],
      price: [0, [Validators.required, Validators.min(0)]],
      stock: [0, [Validators.required, Validators.min(0)]],
      description: [''],
      category: [''],
      imageUrl: ['']
    });
  }

  ngOnInit(): void {
    this.loadUsers();
    this.loadProducts();
    this.loadOrders();
    this.loadMessages();
    this.loadReviews();
    this.getUnreadMessageCount();
  }

  // User management methods
  loadUsers(): void {
    this.http.get<{status: boolean, data: User[]}>(`${this.baseUrl}/User/All`).subscribe({
      next: (response) => {
        if (response.status && response.data) {
          this.users = response.data;
          this.filteredUsers = response.data;
        }
      },
      error: (error) => console.error('Error loading users:', error)
    });
  }

    getStatusText(status: OrderStatus): string {
    switch(status) {
      case OrderStatus.Pending: return 'Pending';
      case OrderStatus.Paid: return 'Paid';
      case OrderStatus.Shipped: return 'Shipped';
      case OrderStatus.Delivered: return 'Delivered';
      default: return 'Unknown';
    }
  }
  searchUsers(): void {
    if (!this.userSearchTerm) {
      this.filteredUsers = this.users;
      return;
    }
    
    const term = this.userSearchTerm.toLowerCase();
    this.filteredUsers = this.users.filter(user => 
      user.userName.toLowerCase().includes(term) || 
      user.email.toLowerCase().includes(term)
    );
  }

  editUser(user: User): void {
    this.editingUser = {...user};
  }

  saveUser(): void {
    if (this.editingUser) {
      this.http.put(`${this.baseUrl}/User/Update`, this.editingUser).subscribe({
        next: () => {
          alert('User updated successfully!');
          this.editingUser = null;
          this.loadUsers();
        },
        error: (error) => {
          console.error('Error updating user:', error);
          alert('Error updating user');
        }
      });
    }
  }

  cancelEditUser(): void {
    this.editingUser = null;
  }

  deleteUser(userId: string): void {
    if (confirm('Are you sure you want to delete this user?')) {
      this.http.delete(`${this.baseUrl}/User/Delete/${userId}`).subscribe({
        next: () => {
          this.users = this.users.filter(u => u.id !== userId);
          this.filteredUsers = this.filteredUsers.filter(u => u.id !== userId);
          alert('User deleted successfully!');
        },
        error: (error) => console.error('Error deleting user:', error)
      });
    }
  }

  // Product management methods
  loadProducts(): void {
    this.http.get<{status: boolean, data: Product[]}>(`${this.baseUrl}/Products`).subscribe({
      next: (response) => {
        if (response.status && response.data) {
          this.products = response.data;
          this.filteredProducts = response.data;
        }
      },
      error: (error) => console.error('Error loading products:', error)
    });
  }

  showAddProduct(): void {
    this.showAddProductForm = true;
    this.editingProduct = null;
    this.productForm.reset();
  }

  editProduct(product: Product): void {
    this.editingProduct = {...product};
    this.showAddProductForm = true;
    this.productForm.patchValue({
      name: product.name,
      price: product.price,
      stock: product.stock,
      description: product.description || '',
      category: product.category || '',
      imageUrl: product.imageUrl || ''
    });
  }

  saveProduct(): void {
    if (this.productForm.valid) {
      const productData = this.productForm.value;
      
      if (this.editingProduct) {
        // Update existing product
        const updateData = {...this.editingProduct, ...productData};
        this.http.put(`${this.baseUrl}/Products/update`, updateData).subscribe({
          next: () => {
            alert('Product updated successfully!');
            this.cancelProductEdit();
            this.loadProducts();
          },
          error: (error) => {
            console.error('Error updating product:', error);
            alert('Error updating product');
          }
        });
      } else {
        // Create new product
        this.http.post(`${this.baseUrl}/Products/create`, productData).subscribe({
          next: () => {
            alert('Product created successfully!');
            this.cancelProductEdit();
            this.loadProducts();
          },
          error: (error) => {
            console.error('Error creating product:', error);
            alert('Error creating product');
          }
        });
      }
    }
  }

  cancelProductEdit(): void {
    this.showAddProductForm = false;
    this.editingProduct = null;
    this.productForm.reset();
  }

  deleteProduct(productId: string): void {
    if (confirm('Are you sure you want to delete this product?')) {
      this.http.delete(`${this.baseUrl}/Products/${productId}`).subscribe({
        next: () => {
          this.products = this.products.filter(p => p.id !== productId);
          this.filteredProducts = this.filteredProducts.filter(p => p.id !== productId);
          alert('Product deleted successfully!');
        },
        error: (error) => console.error('Error deleting product:', error)
      });
    }
  }

  // Order management methods
 loadOrders(): void {
    this.http.get<{status: boolean, data: Order[]}>(`${this.baseUrl}/Order/All`).subscribe({
      next: (response) => {
        if (response.status && response.data) {
          this.orders = response.data;
          this.filteredOrders = response.data;
        }
      },
      error: (error) => console.error('Error loading orders:', error)
    });
  }

 filterOrders(): void {
    if (this.orderStatusFilter === 'all') {
      this.filteredOrders = this.orders;
    } else {
      // Convert the string filter to a number for comparison
      const statusNum = parseInt(this.orderStatusFilter, 10);
      this.filteredOrders = this.orders.filter(order => order.status === statusNum);
    }
  }
  viewOrderDetails(order: Order): void {
    this.selectedOrder = order;
  }

  closeOrderDetails(): void {
    this.selectedOrder = null;
  }

updateOrderStatus(order: Order, newStatus: string): void {
    // Convert the string status to a number
    const statusNumber = parseInt(newStatus, 10);
    
    this.http.put(`${this.baseUrl}/Order/${order.id}/status`, { status: statusNumber }).subscribe({
      next: () => {
        // Update the order status with the numeric value
        order.status = statusNumber;
        console.log('Order status updated successfully');
      },
      error: (error) => console.error('Error updating order status:', error)
    });
  }
  
  deleteOrder(orderId: string): void {
    if (confirm('Are you sure you want to delete this order?')) {
      this.http.delete(`${this.baseUrl}/Order/${orderId}`).subscribe({
        next: () => {
          this.orders = this.orders.filter(o => o.id !== orderId);
          this.filteredOrders = this.filteredOrders.filter(o => o.id !== orderId);
          alert('Order deleted successfully!');
        },
        error: (error) => console.error('Error deleting order:', error)
      });
    }
  }

  // Message management methods
  loadMessages(): void {
    this.http.get<{status: boolean, data: Message[]}>(`${this.baseUrl}/ContactMessage/All`).subscribe({
      next: (response) => {
        if (response.status && response.data) {
          this.messages = response.data;
          this.filteredMessages = response.data;
        }
      },
      error: (error) => console.error('Error loading messages:', error)
    });
  }

  loadUnreadMessages(): void {
    this.http.get<{status: boolean, data: Message[]}>(`${this.baseUrl}/ContactMessage/unread`).subscribe({
      next: (response) => {
        if (response.status && response.data) {
          this.messages = response.data;
          this.filteredMessages = response.data;
        }
      },
      error: (error) => console.error('Error loading unread messages:', error)
    });
  }

  getUnreadMessageCount(): void {
    this.http.get<{status: boolean, data: number}>(`${this.baseUrl}/ContactMessage/unread/count`).subscribe({
      next: (response) => {
        if (response.status && response.data !== undefined) {
          this.unreadMessageCount = response.data;
        }
      },
      error: (error) => console.error('Error loading unread message count:', error)
    });
  }

  viewMessage(message: Message): void {
    this.selectedMessage = message;
    if (!message.read) {
      this.markAsRead(message.id);
    }
  }

  closeMessage(): void {
    this.selectedMessage = null;
  }

  markAsRead(messageId: string): void {
    this.http.put(`${this.baseUrl}/ContactMessage/${messageId}/mark-as-read`, {}).subscribe({
      next: () => {
        const message = this.messages.find(m => m.id === messageId);
        if (message) {
          message.read = true;
        }
        this.getUnreadMessageCount();
      },
      error: (error) => console.error('Error marking message as read:', error)
    });
  }

  markAllAsRead(): void {
    this.http.put(`${this.baseUrl}/ContactMessage/mark-all-as-read`, {}).subscribe({
      next: () => {
        this.messages.forEach(message => message.read = true);
        this.filteredMessages.forEach(message => message.read = true);
        this.unreadMessageCount = 0;
        alert('All messages marked as read!');
      },
      error: (error) => console.error('Error marking all messages as read:', error)
    });
  }

  deleteMessage(messageId: string): void {
    if (confirm('Are you sure you want to delete this message?')) {
      this.http.delete(`${this.baseUrl}/ContactMessage/${messageId}`).subscribe({
        next: () => {
          this.messages = this.messages.filter(m => m.id !== messageId);
          this.filteredMessages = this.filteredMessages.filter(m => m.id !== messageId);
          this.getUnreadMessageCount();
          alert('Message deleted successfully!');
        },
        error: (error) => console.error('Error deleting message:', error)
      });
    }
  }

  // Review management methods
  loadReviews(): void {
    this.http.get<{status: boolean, data: Review[]}>(`${this.baseUrl}/Reviews`).subscribe({
      next: (response) => {
        if (response.status && response.data) {
          this.reviews = response.data;
          this.filteredReviews = response.data;
        }
      },
      error: (error) => console.error('Error loading reviews:', error)
    });
  }

  loadPendingReviews(): void {
    this.http.get<{status: boolean, data: Review[]}>(`${this.baseUrl}/Reviews/pending`).subscribe({
      next: (response) => {
        if (response.status && response.data) {
          this.reviews = response.data;
          this.filteredReviews = response.data;
        }
      },
      error: (error) => console.error('Error loading pending reviews:', error)
    });
  }

  viewReview(review: Review): void {
    this.selectedReview = review;
  }

  closeReview(): void {
    this.selectedReview = null;
  }

  approveReview(reviewId: string): void {
    this.http.put(`${this.baseUrl}/Reviews/${reviewId}`, { approved: true }).subscribe({
      next: () => {
        alert('Review approved successfully!');
        this.loadReviews();
      },
      error: (error) => {
        console.error('Error approving review:', error);
        alert('Error approving review');
      }
    });
  }

  deleteReview(reviewId: string): void {
    if (confirm('Are you sure you want to delete this review?')) {
      this.http.delete(`${this.baseUrl}/Reviews/${reviewId}`).subscribe({
        next: () => {
          this.reviews = this.reviews.filter(r => r.id !== reviewId);
          this.filteredReviews = this.filteredReviews.filter(r => r.id !== reviewId);
          alert('Review deleted successfully!');
        },
        error: (error) => console.error('Error deleting review:', error)
      });
    }
  }

  // Utility methods
  refreshAllData(): void {
    this.loadUsers();
    this.loadProducts();
    this.loadOrders();
    this.loadMessages();
    this.loadReviews();
    this.getUnreadMessageCount();
  }
}