import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-header">
          <mat-icon class="auth-logo">hub</mat-icon>
          <h1>WorkFlow</h1>
          <p>Create your account</p>
        </div>

        <form (ngSubmit)="onSubmit()" class="auth-form">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Full Name</mat-label>
            <input matInput [(ngModel)]="name" name="name" required />
            <mat-icon matPrefix>person</mat-icon>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Email</mat-label>
            <input matInput type="email" [(ngModel)]="email" name="email" required />
            <mat-icon matPrefix>email</mat-icon>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Password</mat-label>
            <input
              matInput
              [type]="hidePassword() ? 'password' : 'text'"
              [(ngModel)]="password"
              name="password"
              required
              minlength="6"
            />
            <mat-icon matPrefix>lock</mat-icon>
            <button mat-icon-button matSuffix type="button" (click)="hidePassword.set(!hidePassword())">
              <mat-icon>{{ hidePassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
            </button>
            <mat-hint>At least 6 characters</mat-hint>
          </mat-form-field>

          @if (errorMessage()) {
            <div class="error-message">{{ errorMessage() }}</div>
          }

          <button
            mat-raised-button
            color="primary"
            type="submit"
            class="full-width submit-btn"
            [disabled]="loading()"
          >
            @if (loading()) {
              <mat-spinner diameter="20"></mat-spinner>
            } @else {
              Create Account
            }
          </button>
        </form>

        <div class="auth-footer">
          <span>Already have an account?</span>
          <a routerLink="/login">Sign in</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-container {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 24px;
    }

    .auth-card {
      background: white;
      border-radius: 16px;
      padding: 40px;
      width: 100%;
      max-width: 420px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
    }

    .auth-header {
      text-align: center;
      margin-bottom: 32px;
      .auth-logo { font-size: 48px; width: 48px; height: 48px; color: #3f51b5; margin-bottom: 12px; }
      h1 { font-size: 28px; font-weight: 700; color: #1a1a2e; margin-bottom: 4px; }
      p { color: #757575; font-size: 14px; }
    }

    .auth-form { display: flex; flex-direction: column; gap: 4px; }
    .full-width { width: 100%; }
    .submit-btn { height: 48px; font-size: 16px; font-weight: 600; margin-top: 8px; }

    .error-message {
      color: #d32f2f; font-size: 13px; text-align: center;
      padding: 8px; background: #fde8e8; border-radius: 8px;
    }

    .auth-footer {
      text-align: center; margin-top: 24px; font-size: 14px; color: #757575;
      a { color: #3f51b5; font-weight: 500; margin-left: 4px; &:hover { text-decoration: underline; } }
    }
  `],
})
export class RegisterComponent {
  name = '';
  email = '';
  password = '';
  hidePassword = signal(true);
  loading = signal(false);
  errorMessage = signal('');

  constructor(
    private authService: AuthService,
    private router: Router,
    private notification: NotificationService,
  ) {}

  onSubmit(): void {
    if (!this.name || !this.email || !this.password) {
      this.errorMessage.set('Please fill in all fields');
      return;
    }
    if (this.password.length < 6) {
      this.errorMessage.set('Password must be at least 6 characters');
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    this.authService.register(this.name, this.email, this.password).subscribe({
      next: () => {
        this.notification.success('Account created successfully!');
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading.set(false);
        const message = err.error?.error?.message || 'Registration failed. Please try again.';
        this.errorMessage.set(message);
      },
    });
  }
}
