// src/app/services/order.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface OrderItem {
  id: number;
  productId: number;
  quantity: number;
  price: number;
}

export interface Order {
  id: number;
  userId: number;
  status: number;
  totalAmount: number;
  shippingAddress: string;
  paymentMethod: string;
  createdAt: string;
  items: OrderItem[];
}

export interface OrdersResponse {
  status: boolean;
  statusCode: number;
  data: Order[];
}

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private apiUrl = 'https://localhost:7015/api/Order';

  constructor(private http: HttpClient) { }

  getUserOrders(): Observable<OrdersResponse> {
    const headers = new HttpHeaders({
      'accept': 'text/plain'
    });

    return this.http.get<OrdersResponse>(`${this.apiUrl}/my`, { headers });
  }

  getOrderById(orderId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${orderId}`);
  }
}