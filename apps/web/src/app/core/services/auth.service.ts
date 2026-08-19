import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError } from 'rxjs';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AuthResponse {
  success: boolean;
  data: {
    user: User;
    token: string;
  };
}

interface MeResponse {
  success: boolean;
  data: {
    user: User;
  };
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'workflow_token';
  private readonly API_URL = '/api/auth';

  private currentUserSignal = signal<User | null>(null);
  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly isAuthenticated = computed(() => !!this.currentUserSignal());

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {}

  get token(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/login`, { email, password }).pipe(
      tap((res) => {
        localStorage.setItem(this.TOKEN_KEY, res.data.token);
        this.currentUserSignal.set(res.data.user);
      }),
    );
  }

  register(name: string, email: string, password: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.API_URL}/register`, { name, email, password })
      .pipe(
        tap((res) => {
          localStorage.setItem(this.TOKEN_KEY, res.data.token);
          this.currentUserSignal.set(res.data.user);
        }),
      );
  }

  logout(): void {
    this.http.post(`${this.API_URL}/logout`, {}).subscribe();
    localStorage.removeItem(this.TOKEN_KEY);
    this.currentUserSignal.set(null);
    this.router.navigate(['/login']);
  }

  loadCurrentUser(): Observable<MeResponse> {
    return this.http.get<MeResponse>(`${this.API_URL}/me`).pipe(
      tap((res) => this.currentUserSignal.set(res.data.user)),
      catchError((err) => {
        localStorage.removeItem(this.TOKEN_KEY);
        this.currentUserSignal.set(null);
        return throwError(() => err);
      }),
    );
  }

  hasToken(): boolean {
    return !!localStorage.getItem(this.TOKEN_KEY);
  }
}
