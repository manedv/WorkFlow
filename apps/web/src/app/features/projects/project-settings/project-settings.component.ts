import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ProjectService, Project, ProjectMember } from '../../../core/services/project.service';
import { UserService, UserSummary } from '../../../core/services/user.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ConfirmDialogComponent } from '../../../shared/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-project-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatDialogModule,
  ],
  template: `
    @if (loading()) {
      <div class="loading-state">
        <mat-spinner diameter="40"></mat-spinner>
      </div>
    } @else if (project()) {
      <div class="settings-page">
        <div class="page-header">
          <h1>Project Settings</h1>
        </div>

        <mat-card class="settings-section">
          <mat-card-content>
            <h2>General</h2>
            <form class="settings-form">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Project Name</mat-label>
                <input matInput [(ngModel)]="name" name="name" />
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Project Key</mat-label>
                <input
                  matInput
                  [(ngModel)]="key"
                  name="key"
                  (input)="key = key.toUpperCase()"
                  maxlength="10"
                />
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Description</mat-label>
                <textarea matInput [(ngModel)]="description" name="description" rows="3"></textarea>
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Project Lead</mat-label>
                <mat-select [(ngModel)]="leadId" name="leadId">
                  @for (user of users(); track user.id) {
                    <mat-option [value]="user.id">{{ user.name }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>

              <div class="form-actions">
                <button mat-raised-button color="primary" (click)="saveSettings()" [disabled]="saving()">
                  @if (saving()) { <mat-spinner diameter="18"></mat-spinner> }
                  @else { Save Changes }
                </button>
              </div>
            </form>
          </mat-card-content>
        </mat-card>

        <mat-card class="settings-section">
          <mat-card-content>
            <div class="section-header-row">
              <h2>Members</h2>
              <button mat-button color="primary" (click)="showAddMember = !showAddMember">
                <mat-icon>person_add</mat-icon>
                Add Member
              </button>
            </div>

            @if (showAddMember) {
              <div class="add-member-row">
                <mat-form-field appearance="outline">
                  <mat-label>Select User</mat-label>
                  <mat-select [(ngModel)]="newMemberId">
                    @for (user of availableUsers(); track user.id) {
                      <mat-option [value]="user.id">{{ user.name }} ({{ user.email }})</mat-option>
                    }
                  </mat-select>
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Role</mat-label>
                  <mat-select [(ngModel)]="newMemberRole">
                    <mat-option value="PROJECT_ADMIN">Admin</mat-option>
                    <mat-option value="MEMBER">Member</mat-option>
                    <mat-option value="VIEWER">Viewer</mat-option>
                  </mat-select>
                </mat-form-field>
                <button mat-raised-button color="primary" (click)="addMember()">Add</button>
              </div>
            }

            <div class="members-list">
              @for (member of project()!.members; track member.id) {
                <div class="member-row">
                  <div class="member-avatar">
                    {{ member.user.name.charAt(0).toUpperCase() }}
                  </div>
                  <div class="member-info">
                    <span class="member-name">{{ member.user.name }}</span>
                    <span class="member-email">{{ member.user.email }}</span>
                  </div>
                  <span class="role-badge">{{ member.role }}</span>
                  <button
                    mat-icon-button
                    color="warn"
                    (click)="removeMember(member)"
                    [disabled]="project()!.members.length <= 1"
                  >
                    <mat-icon>close</mat-icon>
                  </button>
                </div>
              }
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    }
  `,
  styles: [`
    .loading-state { display: flex; justify-content: center; padding: 64px; }

    .settings-page { padding: 24px; max-width: 800px; margin: 0 auto; }

    .settings-section { margin-bottom: 24px; h2 { font-size: 18px; font-weight: 600; margin-bottom: 16px; } }

    .settings-form { display: flex; flex-direction: column; gap: 4px; }
    .full-width { width: 100%; }
    .form-actions { display: flex; justify-content: flex-end; margin-top: 8px; }

    .section-header-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }

    .add-member-row { display: flex; gap: 12px; align-items: flex-start; margin-bottom: 16px; flex-wrap: wrap; }

    .members-list { display: flex; flex-direction: column; gap: 8px; }

    .member-row {
      display: flex; align-items: center; gap: 12px;
      padding: 8px; border-radius: 8px;
      &:hover { background: #fafafa; }
    }

    .member-avatar {
      width: 36px; height: 36px; border-radius: 50%;
      background: #e8eaf6; color: #3f51b5;
      display: flex; align-items: center; justify-content: center;
      font-size: 14px; font-weight: 600;
    }

    .member-info {
      flex: 1; display: flex; flex-direction: column;
      .member-name { font-size: 14px; font-weight: 500; }
      .member-email { font-size: 12px; color: #9e9e9e; }
    }

    .role-badge {
      font-size: 11px; font-weight: 500; padding: 2px 8px;
      border-radius: 4px; background: #f5f5f5; color: #757575;
    }
  `],
})
export class ProjectSettingsComponent implements OnInit {
  project = signal<Project | null>(null);
  users = signal<UserSummary[]>([]);
  loading = signal(true);
  saving = signal(false);

  name = '';
  key = '';
  description = '';
  leadId = '';

  showAddMember = false;
  newMemberId = '';
  newMemberRole = 'MEMBER';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private projectService: ProjectService,
    private userService: UserService,
    private notification: NotificationService,
    private dialog: MatDialog,
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;

    this.projectService.getById(id).subscribe({
      next: (res) => {
        this.project.set(res.data);
        this.name = res.data.name;
        this.key = res.data.key;
        this.description = res.data.description || '';
        this.leadId = res.data.leadId || '';
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });

    this.userService.getAll().subscribe({
      next: (res) => this.users.set(res.data),
    });
  }

  availableUsers(): UserSummary[] {
    const memberIds = new Set(this.project()?.members.map((m) => m.userId) || []);
    return this.users().filter((u) => !memberIds.has(u.id));
  }

  saveSettings(): void {
    const p = this.project();
    if (!p) return;

    this.saving.set(true);
    this.projectService
      .update(p.id, {
        name: this.name,
        key: this.key,
        description: this.description,
        leadId: this.leadId,
      })
      .subscribe({
        next: (res) => {
          this.project.set(res.data);
          this.saving.set(false);
          this.notification.success('Project settings saved');
        },
        error: (err) => {
          this.saving.set(false);
          this.notification.error(err.error?.error?.message || 'Failed to save');
        },
      });
  }

  addMember(): void {
    const p = this.project();
    if (!p || !this.newMemberId) return;

    this.projectService.addMember(p.id, this.newMemberId, this.newMemberRole).subscribe({
      next: (res) => {
        this.project.set(res.data);
        this.newMemberId = '';
        this.showAddMember = false;
        this.notification.success('Member added');
      },
      error: (err) => this.notification.error(err.error?.error?.message || 'Failed to add member'),
    });
  }

  removeMember(member: ProjectMember): void {
    const p = this.project();
    if (!p) return;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Remove Member',
        message: `Remove ${member.user.name} from this project?`,
        confirmText: 'Remove',
        confirmColor: 'warn',
      },
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.projectService.removeMember(p.id, member.userId).subscribe({
          next: (res) => {
            this.project.set(res.data);
            this.notification.success('Member removed');
          },
          error: () => this.notification.error('Failed to remove member'),
        });
      }
    });
  }
}
