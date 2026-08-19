import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { NotificationApiService, AppNotification } from '../../core/services/notification-api.service';

@Component({
  selector: 'app-notifications-panel',
  standalone: true,
  imports: [
    CommonModule, RouterModule, MatIconModule, MatButtonModule,
    MatBadgeModule, MatMenuModule, MatDividerModule,
  ],
  template: `
    <button mat-icon-button [matMenuTriggerFor]="notifMenu"
      [matBadge]="unreadCount() > 0 ? unreadCount() : null" matBadgeColor="warn" matBadgeSize="small">
      <mat-icon>notifications</mat-icon>
    </button>
    <mat-menu #notifMenu="matMenu" class="notifications-menu">
      <div class="notif-header" (click)="$event.stopPropagation()">
        <span>Notifications</span>
        @if (unreadCount() > 0) {
          <button mat-button (click)="markAllRead()">Mark all read</button>
        }
      </div>
      <mat-divider></mat-divider>
      @if (notifications().length === 0) {
        <div class="notif-empty" (click)="$event.stopPropagation()">No notifications</div>
      }
      @for (notif of notifications(); track notif.id) {
        <div class="notif-item" [class.unread]="!notif.isRead" (click)="markRead(notif)">
          <mat-icon class="notif-icon">{{ getIcon(notif.type) }}</mat-icon>
          <div class="notif-content">
            <span class="notif-title">{{ notif.title }}</span>
            <span class="notif-message">{{ notif.message }}</span>
            <span class="notif-time">{{ notif.createdAt | date:'short' }}</span>
          </div>
        </div>
      }
    </mat-menu>
  `,
  styles: [`
    .notif-header { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; font-weight: 600; }
    .notif-empty { padding: 24px; text-align: center; color: #9e9e9e; }
    .notif-item {
      display: flex; gap: 12px; padding: 12px 16px; cursor: pointer; min-width: 320px;
      transition: background 0.15s;
    }
    .notif-item:hover { background: #f5f5f5; }
    .notif-item.unread { background: #e8eaf6; }
    .notif-icon { color: #5c6bc0; font-size: 20px; width: 20px; height: 20px; margin-top: 2px; }
    .notif-content { display: flex; flex-direction: column; gap: 2px; }
    .notif-title { font-size: 13px; font-weight: 600; color: #1a1a2e; }
    .notif-message { font-size: 12px; color: #616161; }
    .notif-time { font-size: 11px; color: #9e9e9e; }
  `],
})
export class NotificationsPanelComponent implements OnInit {
  notifications = signal<AppNotification[]>([]);
  unreadCount = signal(0);

  constructor(private notifService: NotificationApiService) {}

  ngOnInit(): void {
    this.loadNotifications();
    setInterval(() => this.loadUnreadCount(), 30000);
  }

  private loadNotifications(): void {
    this.notifService.getAll().subscribe({
      next: (res) => this.notifications.set(res.data),
    });
    this.loadUnreadCount();
  }

  private loadUnreadCount(): void {
    this.notifService.getUnreadCount().subscribe({
      next: (res) => this.unreadCount.set(res.data.count),
    });
  }

  markRead(notif: AppNotification): void {
    if (!notif.isRead) {
      this.notifService.markAsRead(notif.id).subscribe({
        next: () => {
          this.notifications.set(
            this.notifications().map((n) => n.id === notif.id ? { ...n, isRead: true } : n),
          );
          this.unreadCount.set(Math.max(0, this.unreadCount() - 1));
        },
      });
    }
  }

  markAllRead(): void {
    this.notifService.markAllAsRead().subscribe({
      next: () => {
        this.notifications.set(this.notifications().map((n) => ({ ...n, isRead: true })));
        this.unreadCount.set(0);
      },
    });
  }

  getIcon(type: string): string {
    const map: Record<string, string> = {
      COMMENT: 'chat', ASSIGNED: 'person_add', STATUS_CHANGE: 'swap_horiz',
      MENTION: 'alternate_email',
    };
    return map[type] || 'notifications';
  }
}
