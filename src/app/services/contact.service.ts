import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ContactService {
  // Use your actual ASP.NET Core API URL
  private apiUrl = 'https://localhost:7015/api/ContactMessage';

  constructor(private http: HttpClient) { }

  private handleError(error: HttpErrorResponse) {
    console.error('API Error:', error);
    let errorMessage = 'Unknown error occurred';
    
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
      if (error.error) {
        errorMessage += `\nDetails: ${JSON.stringify(error.error)}`;
      }
    }
    return throwError(errorMessage);
  }

  // Send message (POST /api/ContactMessage)
  sendMessage(contactData: any): Observable<any> {
    console.log('Sending to:', this.apiUrl, 'Data:', contactData);
    return this.http.post(this.apiUrl, contactData)
      .pipe(
        catchError(this.handleError)
      );
  }

  // Get all messages (GET /api/ContactMessage/All) - Admin only
  getAllMessages(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/All`);
  }

  // Get message by ID (GET /api/ContactMessage/{id}) - Admin only
  getMessageById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  // Get unread messages (GET /api/ContactMessage/unread) - Admin only
  getUnreadMessages(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/unread`);
  }

  // Get unread messages count (GET /api/ContactMessage/unread/count) - Admin only
  getUnreadMessagesCount(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/unread/count`);
  }

  // Mark message as read (PUT /api/ContactMessage/{id}/mark-as-read) - Admin only
  markAsRead(id: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/mark-as-read`, {});
  }

  // Mark all messages as read (PUT /api/ContactMessage/mark-all-as-read) - Admin only
  markAllAsRead(): Observable<any> {
    return this.http.put(`${this.apiUrl}/mark-all-as-read`, {});
  }

  // Get messages by email (GET /api/ContactMessage/by-email/{email}) - Admin only
  getMessagesByEmail(email: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/by-email/${encodeURIComponent(email)}`);
  }

  // Delete message (DELETE /api/ContactMessage/{id}) - Admin only
  deleteMessage(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}