import { Component, Input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { HttpClient } from '@angular/common/http';

interface Activity {
  id: string;
  issueId: string;
  userId: string;
  action: string;
  field: string | null;
  oldValue: string | null;
  newValue: string | null;
  createdAt: string;
  user: { id: string; name: string; email: string; avatar: string | null };
}

@Component({
  selector: 'app-issue-activity',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="activity-section">
      <h3>Activity</h3>
      <div class="activity-list">
        @for (activity of activities(); track activity.id) {
          <div class="activity-item">
            <div class="activity-icon">
              <mat-icon>{{ getActionIcon(activity.action) }}</mat-icon>
            </div>
            <div class="activity-content">
              <span class="activity-user">{{ activity.user.name }}</span>
              <span class="activity-text">{{ getActionText(activity) }}</span>
              <span class="activity-date">{{ activity.createdAt | date:'medium' }}</span>
            </div>
          </div>
        }
        @if (activities().length === 0) {
          <div class="empty-activity">No activity yet</div>
        }
      </div>
    </div>
  `,
  styles: [`
    .activity-section { margin-top: 32px; }
    .activity-section h3 { font-size: 14px; font-weight: 600; color: #757575; margin-bottom: 16px; }
    .activity-list { display: flex; flex-direction: column; gap: 12px; }
    .activity-item { display: flex; gap: 12px; align-items: flex-start; }
    .activity-icon {
      width: 28px; height: 28px; border-radius: 50%; background: #f5f5f5;
      display: flex; align-items: center; justify-content: center;
      mat-icon { font-size: 14px; width: 14px; height: 14px; color: #757575; }
    }
    .activity-content { display: flex; flex-direction: column; gap: 2px; }
    .activity-user { font-size: 13px; font-weight: 600; color: #1a1a2e; }
    .activity-text { font-size: 13px; color: #616161; }
    .activity-date { font-size: 11px; color: #9e9e9e; }
    .empty-activity { text-align: center; color: #9e9e9e; padding: 24px; font-size: 13px; }
  `],
})
export class IssueActivityComponent implements OnInit {
  @Input() issueId!: string;
  activities = signal<Activity[]>([]);

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.http.get<{ success: boolean; data: Activity[] }>(`/api/issues/${this.issueId}/activity`).subscribe({
      next: (res) => this.activities.set(res.data),
    });
  }

  getActionIcon(action: string): string {
    const map: Record<string, string> = {
      CREATED: 'add_circle', UPDATED: 'edit', STATUS_CHANGED: 'swap_horiz',
      ASSIGNEE_CHANGED: 'person', PRIORITY_CHANGED: 'flag', COMMENTED: 'chat',
      ATTACHMENT_ADDED: 'attach_file',
    };
    return map[action] || 'history';
  }

  getActionText(activity: Activity): string {
    switch (activity.action) {
      case 'CREATED': return 'created this issue';
      case 'COMMENTED': return 'added a comment';
      case 'ATTACHMENT_ADDED': return `attached ${activity.newValue || 'a file'}`;
      case 'STATUS_CHANGED': return `changed status`;
      case 'ASSIGNEE_CHANGED': return `changed assignee`;
      case 'PRIORITY_CHANGED': return `changed priority to ${activity.newValue || 'unknown'}`;
      case 'UPDATED': return `updated ${activity.field || 'issue'}`;
      default: return activity.action.toLowerCase().replace(/_/g, ' ');
    }
  }
}
