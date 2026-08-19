import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface UserSummary {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  isActive: boolean;
  createdAt: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly API_URL = '/api/users';

  constructor(private http: HttpClient) {}

  getAll(): Observable<ApiResponse<UserSummary[]>> {
    return this.http.get<ApiResponse<UserSummary[]>>(this.API_URL);
  }
}
