// src/app/orders/orders.component.ts
import { Component, OnInit } from '@angular/core';
import { OrderService, Order } from '../services/order.service';

@Component({
  selector: 'app-orders',
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.css'],
  standalone: false
})
export class OrdersComponent implements OnInit {
  orders: Order[] = [];
  isLoading = true;
  errorMessage = '';

  constructor(private orderService: OrderService) { }

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.orderService.getUserOrders().subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.status && response.data) {
          this.orders = response.data;
          // Sort orders by date (newest first)
          this.orders.sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = 'Failed to load orders. Please try again.';
        console.error('Error loading orders:', err);
      }
    });
  }

  getOrderStatusText(status: number): string {
    switch(status) {
      case 0: return 'Pending';
      case 1: return 'Processing';
      case 2: return 'Shipped';
      case 3: return 'Delivered';
      case 4: return 'Cancelled';
      default: return 'Unknown';
    }
  }

  getOrderTotalItems(order: Order): number {
    return order.items.reduce((total, item) => total + item.quantity, 0);
  }
}