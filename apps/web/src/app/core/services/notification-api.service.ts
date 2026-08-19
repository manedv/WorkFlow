import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AppNotification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  issueId: string | null;
  isRead: boolean;
  createdAt: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

@Injectable({ providedIn: 'root' })
export class NotificationApiService {
  constructor(private http: HttpClient) {}

  getAll(unreadOnly = false): Observable<ApiResponse<AppNotification[]>> {
    const params = unreadOnly ? '?unread=true' : '';
    return this.http.get<ApiResponse<AppNotification[]>>(`/api/notifications${params}`);
  }

  getUnreadCount(): Observable<ApiResponse<{ count: number }>> {
    return this.http.get<ApiResponse<{ count: number }>>('/api/notifications/count');
  }

  markAsRead(id: string): Observable<ApiResponse<{ message: string }>> {
    return this.http.patch<ApiResponse<{ message: string }>>(`/api/notifications/${id}/read`, {});
  }

  markAllAsRead(): Observable<ApiResponse<{ message: string }>> {
    return this.http.patch<ApiResponse<{ message: string }>>('/api/notifications/read-all', {});
  }
}
