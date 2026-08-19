import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
  ],
  template: `
    <div class="settings-page">
      <div class="page-header">
        <h1>Settings</h1>
      </div>

      <mat-card class="settings-section">
        <mat-card-content>
          <h2>User Profile</h2>
          <div class="profile-header">
            <div class="profile-avatar">
              {{ authService.currentUser()?.name?.charAt(0)?.toUpperCase() }}
            </div>
            <div>
              <h3>{{ authService.currentUser()?.name }}</h3>
              <p>{{ authService.currentUser()?.email }}</p>
            </div>
          </div>

          <div class="detail-list">
            <div class="detail-row">
              <span class="detail-label">Name</span>
              <span class="detail-value">{{ authService.currentUser()?.name }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Email</span>
              <span class="detail-value">{{ authService.currentUser()?.email }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Status</span>
              <span class="detail-value">{{ authService.currentUser()?.isActive ? 'Active' : 'Inactive' }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Member since</span>
              <span class="detail-value">{{ authService.currentUser()?.createdAt | date:'mediumDate' }}</span>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <mat-card class="settings-section">
        <mat-card-content>
          <h2>Account</h2>
          <p class="section-desc">Profile editing and password change will be available in a future update.</p>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .settings-page { padding: 24px; max-width: 800px; margin: 0 auto; }
    .settings-section { margin-bottom: 24px; h2 { font-size: 18px; font-weight: 600; margin-bottom: 16px; } }
    .section-desc { color: #757575; font-size: 14px; }

    .profile-header {
      display: flex; align-items: center; gap: 16px; margin-bottom: 24px;
      h3 { font-size: 18px; font-weight: 600; }
      p { font-size: 14px; color: #757575; }
    }

    .profile-avatar {
      width: 64px; height: 64px; border-radius: 50%;
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white; font-size: 24px; font-weight: 700;
      display: flex; align-items: center; justify-content: center;
    }

    .detail-list { display: flex; flex-direction: column; gap: 12px; }
    .detail-row {
      display: flex; flex-direction: column; gap: 2px;
      .detail-label { font-size: 12px; color: #9e9e9e; font-weight: 500; text-transform: uppercase; }
      .detail-value { font-size: 14px; color: #424242; }
    }
  `],
})
export class SettingsComponent {
  constructor(public authService: AuthService) {}
}
