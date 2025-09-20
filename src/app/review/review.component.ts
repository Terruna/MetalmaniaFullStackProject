import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';

interface Review {
  id: number;
  userId: number;
  productId: number;
  rating: number;
  comment: string;
}

interface PendingReview {
  id: number; // orderId
  productId: number;
  name: string;
}

@Component({
  selector: 'app-review',
  templateUrl: './review.component.html',
  styleUrls: ['./review.component.css'],
  standalone:false
})
export class ReviewComponent implements OnInit {

  @Input() productId!: number; // Pass productId to show reviews for a product
  reviews: Review[] = [];
  pendingReviews: PendingReview[] = [];
  reviewForm!: FormGroup;
  apiUrl = 'https://localhost:7015/api/Reviews';
  token = localStorage.getItem('token'); // assuming JWT token is stored in localStorage

  constructor(private http: HttpClient, private fb: FormBuilder) {}

  ngOnInit(): void {
    this.initForm();
    this.getProductReviews();
    this.getPendingReviews();
  }

  initForm() {
    this.reviewForm = this.fb.group({
      rating: [5, [Validators.required, Validators.min(1), Validators.max(5)]],
      comment: ['', [Validators.required, Validators.maxLength(1000)]]
    });
  }

  getAuthHeaders() {
    return {
      headers: new HttpHeaders({
        Authorization: `Bearer ${this.token}`
      })
    };
  }

  // =========================
  // Get Reviews for Product
  // =========================
  getProductReviews() {
    this.http.get<any>(`${this.apiUrl}/products/${this.productId}`, this.getAuthHeaders())
      .subscribe(res => {
        if (res.status) this.reviews = res.data;
      });
  }

  // =========================
  // Get Pending Reviews
  // =========================
  getPendingReviews() {
    this.http.get<any>(`${this.apiUrl}/pending`, this.getAuthHeaders())
      .subscribe(res => {
        if (res.status) this.pendingReviews = res.data;
      });
  }

  // =========================
  // Submit Review
  // =========================
  submitReview(orderId: number, productId: number) {
    if (this.reviewForm.invalid) return;

    const reviewData = {
      id: 0,
      userId: 0, // backend fills this from JWT
      productId: productId,
      rating: this.reviewForm.value.rating,
      comment: this.reviewForm.value.comment
    };

    this.http.post<any>(`${this.apiUrl}/orders/${orderId}`, reviewData, this.getAuthHeaders())
      .subscribe(res => {
        if (res.status) {
          alert('Review submitted successfully!');
          this.reviewForm.reset({ rating: 5, comment: '' });
          this.getProductReviews();
          this.getPendingReviews();
        } else {
          alert('Failed to submit review');
        }
      });
  }

}
