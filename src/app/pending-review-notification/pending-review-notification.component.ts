import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../services/auth.service';
import { Router, NavigationEnd } from '@angular/router';
import { filter, Subscription } from 'rxjs';

@Component({
  selector: 'app-pending-review-notification',
  templateUrl: './pending-review-notification.component.html',
  styleUrls: ['./pending-review-notification.component.css'],
  standalone: false
})
export class PendingReviewNotificationComponent implements OnInit, OnDestroy {

  pendingOrders: any[] = [];
  showPopup = false;
  errorMessage: string | null = null;
  private routerSubscription: Subscription | undefined;

  constructor(
    private http: HttpClient, 
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadPendingOrders();
    
    // Reload when navigation ends (route changes)
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.loadPendingOrders();
      });
  }

  ngOnDestroy(): void {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  loadPendingOrders(): void {
    const token = this.authService.getToken();
    if (!token) return;

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http.get<any>('https://localhost:7015/api/Reviews/pending', { headers })
      .subscribe({
        next: res => {
          if (res?.data?.length > 0) {
            this.pendingOrders = res.data.map((o: any) => ({
              id: o.id,
              totalAmount: o.totalAmount,
              createdAt: o.createdAt,
              rating: 5,
              comment: '',
              error: null
            }));
            this.showPopup = true;
          }
        },
        error: err => {
          console.error('Error fetching pending orders', err);
          this.errorMessage = 'Failed to load pending orders. Please try again later.';
        }
      });
  }
  closePopup(): void {
    this.showPopup = false;
    this.errorMessage = null;
  }

  submitReview(order: any): void {
    this.errorMessage = null;

    if (!order.rating || !order.comment.trim()) {
      order.error = 'Please provide a rating and comment.';
      return;
    }

    const token = this.authService.getToken();
    if (!token) return;

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    const body = {
      rating: order.rating,
      comment: order.comment
    };

    this.http.post<any>(`https://localhost:7015/api/Reviews/orders/${order.id}`, body, { headers })
      .subscribe({
        next: () => {
          // remove the reviewed order
          this.pendingOrders = this.pendingOrders.filter(o => o.id !== order.id);
          if (this.pendingOrders.length === 0) this.showPopup = false;
        },
        error: err => {
          console.error('Failed to submit review', err);

          if (err.error?.errors?.length > 0) {
            // display backend errors
            order.error = err.error.errors.join('; ');
          } else if (err.error?.title) {
            order.error = err.error.title;
          } else {
            order.error = 'Failed to submit review. Make sure the order is delivered and not already reviewed.';
          }
        }
      });
  }
}
